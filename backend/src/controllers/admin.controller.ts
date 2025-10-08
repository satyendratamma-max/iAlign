import { Request, Response, NextFunction } from 'express';
import sequelize from '../config/database';
import logger from '../config/logger';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const resetAllData = async (_req: Request, res: Response, next: NextFunction) => {
  const transaction = await sequelize.transaction();

  try {
    logger.warn('Database reset initiated by admin');

    // Delete data in correct reverse dependency order
    // 1. Delete junction/association tables first
    await sequelize.query('DELETE FROM ResourceAllocations', { transaction });
    await sequelize.query('DELETE FROM ProjectPipelines', { transaction });
    await sequelize.query('DELETE FROM ProjectDomainImpacts', { transaction });

    // 2. Delete dependent entities
    await sequelize.query('DELETE FROM Milestones', { transaction });
    await sequelize.query('DELETE FROM ProjectRequirements', { transaction });
    await sequelize.query('DELETE FROM ResourceCapabilities', { transaction });

    // 3. Delete main entities that reference others
    await sequelize.query('DELETE FROM Projects', { transaction });
    await sequelize.query('DELETE FROM Resources', { transaction });
    await sequelize.query('DELETE FROM Pipelines', { transaction });

    // 4. Delete SegmentFunctions (references Domains)
    await sequelize.query('DELETE FROM SegmentFunctions', { transaction });

    // 5. Delete Domains
    await sequelize.query('DELETE FROM Domains', { transaction });

    // 6. Delete hierarchy tables (Roles -> Technologies -> Apps)
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

    // Reset auto-increment sequences
    await sequelize.query("DELETE FROM sqlite_sequence WHERE name != 'Users'", { transaction });

    await transaction.commit();

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

export const resetAndReseedData = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    logger.warn('Database reset and reseed initiated by admin');

    // Run the seed script (it will handle database sync internally)
    const { stdout, stderr } = await execAsync('npm run seed:dev');

    if (stderr) {
      logger.warn('Seed script stderr:', stderr);
    }
    if (stdout) {
      logger.info('Seed script output:', stdout);
    }

    logger.info('Database reset and reseed completed successfully');

    res.json({
      success: true,
      message: 'Database has been reset and reseeded with sample data successfully.',
    });
  } catch (error) {
    logger.error('Error resetting and reseeding database:', error);
    next(error);
  }
};
