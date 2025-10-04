import { Request, Response, NextFunction } from 'express';
import sequelize from '../config/database';
import logger from '../config/logger';

export const resetAllData = async (_req: Request, res: Response, next: NextFunction) => {
  const transaction = await sequelize.transaction();

  try {
    logger.warn('Database reset initiated by admin');

    // Delete data in reverse dependency order
    await sequelize.query('DELETE FROM Allocations', { transaction });
    await sequelize.query('DELETE FROM Milestones', { transaction });
    await sequelize.query('DELETE FROM Resources', { transaction });
    await sequelize.query('DELETE FROM Projects', { transaction });
    await sequelize.query('DELETE FROM Teams', { transaction });
    await sequelize.query('DELETE FROM Portfolios', { transaction });
    await sequelize.query('DELETE FROM Domains', { transaction });

    // Delete pipeline related data if exists
    await sequelize.query('DELETE FROM PipelineProjects WHERE 1=1', { transaction }).catch(() => {});
    await sequelize.query('DELETE FROM Pipelines WHERE 1=1', { transaction }).catch(() => {});

    // Delete capacity related data if exists
    await sequelize.query('DELETE FROM CapacityRequests WHERE 1=1', { transaction }).catch(() => {});
    await sequelize.query('DELETE FROM CapacityPlans WHERE 1=1', { transaction }).catch(() => {});
    await sequelize.query('DELETE FROM Reservations WHERE 1=1', { transaction }).catch(() => {});

    // Delete other data but keep admin user
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
