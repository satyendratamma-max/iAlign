import { Request, Response, NextFunction } from 'express';
import sequelize from '../config/database';
import logger from '../config/logger';
import seedDatabase from '../scripts/seed-comprehensive';

export const resetAllData = async (_req: Request, res: Response, next: NextFunction) => {
  const transaction = await sequelize.transaction();

  try {
    logger.warn('Database reset initiated by admin');

    // Delete data in correct reverse dependency order
    // 1. Delete junction/association tables first
    await sequelize.query('DELETE FROM ResourceAllocations', { transaction });
    await sequelize.query('DELETE FROM ProjectPipelines', { transaction });
    await sequelize.query('DELETE FROM ProjectDomainImpacts', { transaction });
    await sequelize.query('DELETE FROM ProjectDependencies', { transaction });

    // 2. Delete dependent entities
    await sequelize.query('DELETE FROM Milestones', { transaction });
    await sequelize.query('DELETE FROM ProjectRequirements', { transaction });
    await sequelize.query('DELETE FROM ResourceCapabilities', { transaction });

    // 3. Delete main entities that reference others
    await sequelize.query('DELETE FROM Projects', { transaction });
    await sequelize.query('DELETE FROM Resources', { transaction });
    await sequelize.query('DELETE FROM Pipelines', { transaction });

    // 4. Delete Scenarios (before deleting SegmentFunctions which it may reference)
    await sequelize.query('DELETE FROM Scenarios', { transaction });

    // 5. Delete SegmentFunctions (references Domains)
    await sequelize.query('DELETE FROM SegmentFunctions', { transaction });

    // 6. Delete Domains
    await sequelize.query('DELETE FROM Domains', { transaction });

    // 7. Delete hierarchy tables (Roles -> Technologies -> Apps)
    await sequelize.query('DELETE FROM Roles', { transaction });
    await sequelize.query('DELETE FROM Technologies', { transaction });
    await sequelize.query('DELETE FROM Apps', { transaction });

    // Delete notifications (keep only for admin user)
    await sequelize.query(
      "DELETE FROM Notifications WHERE user_id != 1",
      { transaction }
    );

    // Delete capacity related data if exists
    await sequelize.query('DELETE FROM CapacityScenarios', { transaction }).catch(() => {});
    await sequelize.query('DELETE FROM CapacityModels', { transaction }).catch(() => {});

    // Delete other non-admin users
    await sequelize.query(
      "DELETE FROM Users WHERE email != 'admin@ialign.com'",
      { transaction }
    );

    // Reset auto-increment sequences (database-specific)
    const dbDialect = sequelize.getDialect();
    if (dbDialect === 'sqlite') {
      await sequelize.query("DELETE FROM sqlite_sequence WHERE name != 'Users'", { transaction });
    } else if (dbDialect === 'mssql') {
      // For MSSQL, we'll reset identity columns after the transaction commits
      // This is done outside transaction as DBCC commands don't work well in transactions
    }

    await transaction.commit();

    // Reset identity columns for MSSQL (must be done outside transaction)
    if (dbDialect === 'mssql') {
      const tablesToReset = [
        'Domains', 'SegmentFunctions', 'Resources', 'Projects', 'Milestones',
        'Pipelines', 'Apps', 'Technologies', 'Roles', 'ResourceCapabilities',
        'ProjectRequirements', 'Scenarios', 'Notifications', 'CapacityModels',
        'CapacityScenarios', 'ResourceAllocations', 'ProjectPipelines',
        'ProjectDomainImpacts', 'ProjectDependencies'
      ];

      for (const table of tablesToReset) {
        try {
          await sequelize.query(`DBCC CHECKIDENT ('${table}', RESEED, 0)`);
        } catch (err) {
          // Table might not exist or have no identity column, ignore error
        }
      }
    }

    logger.info('Database reset completed successfully');

    res.json({
      success: true,
      message: 'All data has been reset successfully. Admin user preserved.',
    });
  } catch (error) {
    await transaction.rollback();
    logger.error('Error resetting database:', error);
    next(error);
  }
};

// Helper function to send SSE progress update
const sendProgress = (res: Response, step: number, total: number, message: string) => {
  const progress = Math.round((step / total) * 100);
  res.write(`data: ${JSON.stringify({ step, total, progress, message })}\n\n`);
};

export const resetAndReseedData = async (_req: Request, res: Response, next: NextFunction) => {
  const transaction = await sequelize.transaction();

  try {
    logger.warn('Database reset and reseed initiated by admin');

    // Step 1: Delete all existing data in correct order (respecting FK constraints)
    await sequelize.query('DELETE FROM ResourceAllocations', { transaction });
    await sequelize.query('DELETE FROM ProjectPipelines', { transaction });
    await sequelize.query('DELETE FROM ProjectDomainImpacts', { transaction });
    await sequelize.query('DELETE FROM ProjectDependencies', { transaction });
    await sequelize.query('DELETE FROM Milestones', { transaction });
    await sequelize.query('DELETE FROM ProjectRequirements', { transaction });
    await sequelize.query('DELETE FROM ResourceCapabilities', { transaction });
    await sequelize.query('DELETE FROM Projects', { transaction });
    await sequelize.query('DELETE FROM Resources', { transaction });
    await sequelize.query('DELETE FROM Pipelines', { transaction });
    await sequelize.query('DELETE FROM Scenarios', { transaction });
    await sequelize.query('DELETE FROM SegmentFunctions', { transaction });
    await sequelize.query('DELETE FROM Domains', { transaction });
    await sequelize.query('DELETE FROM Roles', { transaction });
    await sequelize.query('DELETE FROM Technologies', { transaction });
    await sequelize.query('DELETE FROM Apps', { transaction });
    await sequelize.query('DELETE FROM Notifications', { transaction }).catch(() => {});
    await sequelize.query('DELETE FROM CapacityScenarios', { transaction }).catch(() => {});
    await sequelize.query('DELETE FROM CapacityModels', { transaction }).catch(() => {});
    await sequelize.query('DELETE FROM Users', { transaction });

    // Step 2: Reset identity columns
    const dbDialect = sequelize.getDialect();

    await transaction.commit();

    if (dbDialect === 'mssql') {
      const tablesToReset = [
        'Users', 'Domains', 'SegmentFunctions', 'Resources', 'Projects', 'Milestones',
        'Pipelines', 'Apps', 'Technologies', 'Roles', 'ResourceCapabilities',
        'ProjectRequirements', 'Scenarios', 'Notifications', 'CapacityModels',
        'CapacityScenarios', 'ResourceAllocations', 'ProjectPipelines',
        'ProjectDomainImpacts', 'ProjectDependencies'
      ];

      for (const table of tablesToReset) {
        try {
          await sequelize.query(`DBCC CHECKIDENT ('${table}', RESEED, 0)`);
        } catch (err) {
          // Table might not exist or have no identity column, ignore error
        }
      }
    } else if (dbDialect === 'sqlite') {
      await sequelize.query("DELETE FROM sqlite_sequence");
    }

    logger.info('Data cleared, starting reseed...');

    // Step 3: Reseed without dropping tables
    await seedDatabase(false);

    logger.info('Database reset and reseed completed successfully');

    res.json({
      success: true,
      message: 'Database has been reset and reseeded with sample data successfully.',
    });
  } catch (error: any) {
    await transaction.rollback();
    logger.error('Error resetting and reseeding database:', error);
    next(error);
  }
};

// SSE endpoint for reset and reseed with progress
export const resetAndReseedWithProgress = async (_req: Request, res: Response) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const totalSteps = 13;
  let currentStep = 0;

  try {
    sendProgress(res, ++currentStep, totalSteps, 'Starting database reset...');

    const transaction = await sequelize.transaction();

    try {
      logger.warn('Database reset and reseed initiated by admin');

      sendProgress(res, ++currentStep, totalSteps, 'Deleting existing data...');

      // Delete all existing data
      await sequelize.query('DELETE FROM ResourceAllocations', { transaction });
      await sequelize.query('DELETE FROM ProjectPipelines', { transaction });
      await sequelize.query('DELETE FROM ProjectDomainImpacts', { transaction });
      await sequelize.query('DELETE FROM ProjectDependencies', { transaction });
      await sequelize.query('DELETE FROM Milestones', { transaction });
      await sequelize.query('DELETE FROM ProjectRequirements', { transaction });
      await sequelize.query('DELETE FROM ResourceCapabilities', { transaction });
      await sequelize.query('DELETE FROM Projects', { transaction });
      await sequelize.query('DELETE FROM Resources', { transaction });
      await sequelize.query('DELETE FROM Pipelines', { transaction });
      await sequelize.query('DELETE FROM Scenarios', { transaction });
      await sequelize.query('DELETE FROM SegmentFunctions', { transaction });
      await sequelize.query('DELETE FROM Domains', { transaction });
      await sequelize.query('DELETE FROM Roles', { transaction });
      await sequelize.query('DELETE FROM Technologies', { transaction });
      await sequelize.query('DELETE FROM Apps', { transaction });
      await sequelize.query('DELETE FROM Notifications', { transaction }).catch(() => {});
      await sequelize.query('DELETE FROM CapacityScenarios', { transaction }).catch(() => {});
      await sequelize.query('DELETE FROM CapacityModels', { transaction }).catch(() => {});
      await sequelize.query('DELETE FROM Users', { transaction });

      sendProgress(res, ++currentStep, totalSteps, 'Resetting identity columns...');

      const dbDialect = sequelize.getDialect();
      await transaction.commit();

      if (dbDialect === 'mssql') {
        const tablesToReset = [
          'Users', 'Domains', 'SegmentFunctions', 'Resources', 'Projects', 'Milestones',
          'Pipelines', 'Apps', 'Technologies', 'Roles', 'ResourceCapabilities',
          'ProjectRequirements', 'Scenarios', 'Notifications', 'CapacityModels',
          'CapacityScenarios', 'ResourceAllocations', 'ProjectPipelines',
          'ProjectDomainImpacts', 'ProjectDependencies'
        ];

        for (const table of tablesToReset) {
          try {
            await sequelize.query(`DBCC CHECKIDENT ('${table}', RESEED, 0)`);
          } catch (err) {
            // Table might not exist or have no identity column, ignore error
          }
        }
      } else if (dbDialect === 'sqlite') {
        await sequelize.query("DELETE FROM sqlite_sequence");
      }

      logger.info('Data cleared, starting reseed...');

      // More granular progress updates during seeding
      sendProgress(res, ++currentStep, totalSteps, 'Creating users and scenarios...');
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to ensure message is sent

      sendProgress(res, ++currentStep, totalSteps, 'Creating domains and segment functions...');
      await new Promise(resolve => setTimeout(resolve, 100));

      sendProgress(res, ++currentStep, totalSteps, 'Creating enterprise apps and technologies...');
      await new Promise(resolve => setTimeout(resolve, 100));

      sendProgress(res, ++currentStep, totalSteps, 'Creating projects (2000+ records)...');
      await new Promise(resolve => setTimeout(resolve, 100));

      sendProgress(res, ++currentStep, totalSteps, 'Creating resources (200+ records)...');
      await new Promise(resolve => setTimeout(resolve, 100));

      sendProgress(res, ++currentStep, totalSteps, 'Creating resource capabilities...');
      await new Promise(resolve => setTimeout(resolve, 100));

      sendProgress(res, ++currentStep, totalSteps, 'Creating resource allocations (40,000+ records)...');
      await new Promise(resolve => setTimeout(resolve, 100));

      // Run the actual seed operation
      await seedDatabase(false);

      sendProgress(res, ++currentStep, totalSteps, 'Creating milestones and dependencies...');
      await new Promise(resolve => setTimeout(resolve, 100));

      sendProgress(res, ++currentStep, totalSteps, 'Creating capacity models...');
      await new Promise(resolve => setTimeout(resolve, 100));

      sendProgress(res, ++currentStep, totalSteps, 'Finalizing database setup...');

      logger.info('Database reset and reseed completed successfully');
      sendProgress(res, ++currentStep, totalSteps, 'Completed successfully!');

      res.write(`data: ${JSON.stringify({ success: true, message: 'Database has been reset and reseeded with sample data successfully.' })}\n\n`);
      res.end();
    } catch (error: any) {
      await transaction.rollback();
      logger.error('Error resetting and reseeding database:', error);
      res.write(`data: ${JSON.stringify({ error: true, message: error.message })}\n\n`);
      res.end();
    }
  } catch (error: any) {
    logger.error('Error in reset and reseed:', error);
    res.write(`data: ${JSON.stringify({ error: true, message: error.message })}\n\n`);
    res.end();
  }
};
