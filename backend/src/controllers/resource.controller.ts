import { Request, Response, NextFunction } from 'express';
import { literal } from 'sequelize';
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

    // Add filtering support
    if (req.query.role) {
      where.role = req.query.role;
    }
    if (req.query.location) {
      where.location = req.query.location;
    }
    if (req.query.domainId) {
      where.domainId = req.query.domainId;
    }

    const { count, rows: resources } = await Resource.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdDate', 'DESC']],
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
    const where: any = { isActive: true };

    // Get counts and aggregations
    const [resourceCount, resourceStats] = await Promise.all([
      Resource.count({ where }),
      Resource.findAll({
        where,
        attributes: [
          [literal('COUNT(*)'), 'totalResources'],
          [literal("SUM(CASE WHEN status = 'Available' THEN 1 ELSE 0 END)"), 'availableResources'],
          [literal("SUM(CASE WHEN status = 'Allocated' THEN 1 ELSE 0 END)"), 'allocatedResources'],
          [literal('SUM(COALESCE(fte, 0))'), 'totalFte'],
          [literal('AVG(COALESCE(fte, 0))'), 'averageFte'],
        ],
        raw: true,
      }),
    ]);

    const stats = resourceStats[0] as any;

    res.json({
      success: true,
      data: {
        totalResources: resourceCount,
        availableResources: parseInt(stats.availableResources || 0),
        allocatedResources: parseInt(stats.allocatedResources || 0),
        totalFte: parseFloat(stats.totalFte || 0),
        averageFte: parseFloat(stats.averageFte || 0),
      },
    });
  } catch (error) {
    next(error);
  }
};
