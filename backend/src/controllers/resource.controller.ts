import { Request, Response, NextFunction } from 'express';
import { QueryTypes, Op } from 'sequelize';
import sequelize from '../config/database';
import Resource from '../models/Resource';
import Domain from '../models/Domain';
import SegmentFunction from '../models/SegmentFunction';
import ResourceCapability from '../models/ResourceCapability';
import App from '../models/App';
import Technology from '../models/Technology';
import Role from '../models/Role';
import { ValidationError } from '../middleware/errorHandler';
import logger from '../config/logger';

export const getAllResources = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // PAGINATION SUPPORT - CRITICAL for 10K+ resources
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100); // Max 100 per page
    const offset = (page - 1) * limit;

    // Resources are shared across all scenarios, so we don't filter by scenarioId
    const where: any = { isActive: true };

    // Add filtering support with LIKE for partial matches
    if (req.query.employeeId) {
      where.employeeId = { [Op.like]: `%${req.query.employeeId}%` };
    }
    if (req.query.role) {
      where.role = req.query.role;
    }
    if (req.query.location) {
      where.location = { [Op.like]: `%${req.query.location}%` };
    }
    if (req.query.domainId) {
      where.domainId = req.query.domainId;
    }
    if (req.query.segmentFunctionId) {
      where.segmentFunctionId = req.query.segmentFunctionId;
    }

    // Name filtering requires OR condition on firstName and lastName
    let nameFilter: any = undefined;
    if (req.query.name) {
      const nameParts = (req.query.name as string).trim().split(/\s+/);
      if (nameParts.length === 1) {
        // Single word - search in both first and last name
        nameFilter = {
          [Op.or]: [
            { firstName: { [Op.like]: `%${nameParts[0]}%` } },
            { lastName: { [Op.like]: `%${nameParts[0]}%` } },
          ],
        };
      } else {
        // Multiple words - assume first and last name
        nameFilter = {
          [Op.and]: [
            { firstName: { [Op.like]: `%${nameParts[0]}%` } },
            { lastName: { [Op.like]: `%${nameParts[nameParts.length - 1]}%` } },
          ],
        };
      }
    }

    // Combine where conditions
    const finalWhere = nameFilter ? { [Op.and]: [where, nameFilter] } : where;

    const { count, rows: resources } = await Resource.findAndCountAll({
      where: finalWhere,
      limit,
      offset,
      order: [['employeeId', 'ASC']], // Better default sort for resources
      include: [
        {
          model: Domain,
          as: 'domain',
          attributes: ['id', 'name'],
        },
        {
          model: SegmentFunction,
          as: 'segmentFunction',
          attributes: ['id', 'name'],
        },
        // IMPORTANT: Don't include capabilities in list view - only in detail view
        // This prevents loading 50,000 capability records at once
      ],
    });

    res.json({
      success: true,
      data: resources,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
        hasMore: page * limit < count,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getResourceById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const resource = await Resource.findByPk(id, {
      include: [
        {
          model: Domain,
          as: 'domain',
          attributes: ['id', 'name'],
        },
        {
          model: SegmentFunction,
          as: 'segmentFunction',
          attributes: ['id', 'name'],
        },
        {
          model: ResourceCapability,
          as: 'capabilities',
          where: { isActive: true },
          required: false,
          include: [
            {
              model: App,
              as: 'app',
              attributes: ['id', 'name', 'code'],
            },
            {
              model: Technology,
              as: 'technology',
              attributes: ['id', 'name', 'code'],
            },
            {
              model: Role,
              as: 'role',
              attributes: ['id', 'name', 'code', 'level'],
            },
          ],
        },
      ],
    });

    if (!resource) {
      throw new ValidationError('Resource not found');
    }

    res.json({
      success: true,
      data: resource,
    });
  } catch (error) {
    next(error);
  }
};

export const createResource = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const resourceData = req.body;

    const resource = await Resource.create({
      ...resourceData,
      isActive: true,
    });

    logger.info(`Resource created: ${resource.firstName} ${resource.lastName}`);

    res.status(201).json({
      success: true,
      message: 'Resource created successfully',
      data: resource,
    });
  } catch (error) {
    next(error);
  }
};

export const updateResource = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const resource = await Resource.findByPk(id);

    if (!resource) {
      throw new ValidationError('Resource not found');
    }

    await resource.update(updateData);

    logger.info(`Resource updated: ${resource.firstName} ${resource.lastName}`);

    res.json({
      success: true,
      message: 'Resource updated successfully',
      data: resource,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteResource = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const resource = await Resource.findByPk(id);

    if (!resource) {
      throw new ValidationError('Resource not found');
    }

    await resource.update({ isActive: false });

    logger.info(`Resource deleted: ${resource.firstName} ${resource.lastName}`);

    res.json({
      success: true,
      message: 'Resource deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// MEMORY OPTIMIZATION: Server-side aggregation for dashboard metrics
export const getDashboardMetrics = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // Use raw SQL query for SQL Server aggregations
    const [results] = await sequelize.query(`
      SELECT
        COUNT(*) AS totalResources,
        SUM(COALESCE(totalCapacityHours, 0)) AS totalCapacityHours,
        AVG(COALESCE(utilizationRate, 0)) AS averageUtilization,
        SUM(COALESCE(monthlyCost, 0)) AS totalMonthlyCost,
        COUNT(CASE WHEN isRemote = 1 THEN 1 END) AS remoteResources,
        COUNT(CASE WHEN isRemote = 0 THEN 1 END) AS onsiteResources
      FROM Resources
      WHERE isActive = 1
    `, { type: QueryTypes.SELECT });

    const stats = results as any;

    res.json({
      success: true,
      data: {
        totalResources: parseInt(stats.totalResources || 0),
        totalCapacityHours: parseInt(stats.totalCapacityHours || 0),
        averageUtilization: parseFloat(stats.averageUtilization || 0),
        totalMonthlyCost: parseFloat(stats.totalMonthlyCost || 0),
        remoteResources: parseInt(stats.remoteResources || 0),
        onsiteResources: parseInt(stats.onsiteResources || 0),
      },
    });
  } catch (error: any) {
    logger.error('Error in getDashboardMetrics:', error);
    next(error);
  }
};
