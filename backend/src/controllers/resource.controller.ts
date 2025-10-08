import { Request, Response, NextFunction } from 'express';
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
    const { scenarioId } = req.query;
    const where: any = { isActive: true };

    if (scenarioId) {
      where.scenarioId = scenarioId;
    }

    const resources = await Resource.findAll({
      where,
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

    res.json({
      success: true,
      data: resources,
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
