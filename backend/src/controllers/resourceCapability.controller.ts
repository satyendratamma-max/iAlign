import { Request, Response, NextFunction } from 'express';
import ResourceCapability from '../models/ResourceCapability';
import Resource from '../models/Resource';
import App from '../models/App';
import Technology from '../models/Technology';
import Role from '../models/Role';
import { ValidationError } from '../middleware/errorHandler';
import logger from '../config/logger';

export const getAllResourceCapabilities = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { resourceId } = req.query;

    const whereClause: any = { isActive: true };

    if (resourceId) {
      whereClause.resourceId = parseInt(resourceId as string);
    }

    const capabilities = await ResourceCapability.findAll({
      where: whereClause,
      include: [
        {
          model: Resource,
          as: 'resource',
          attributes: ['id', 'name', 'employeeId'],
          required: false,
        },
        {
          model: App,
          as: 'app',
          attributes: ['id', 'name', 'code'],
          required: false,
        },
        {
          model: Technology,
          as: 'technology',
          attributes: ['id', 'name', 'code'],
          required: false,
        },
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'code', 'level'],
          required: false,
        },
      ],
      order: [['isPrimary', 'DESC'], ['createdDate', 'DESC']],
    });

    res.json({
      success: true,
      data: capabilities,
    });
  } catch (error) {
    next(error);
  }
};

export const getResourceCapabilityById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const capability = await ResourceCapability.findByPk(id, {
      include: [
        {
          model: Resource,
          as: 'resource',
          attributes: ['id', 'name', 'employeeId'],
          required: false,
        },
        {
          model: App,
          as: 'app',
          attributes: ['id', 'name', 'code'],
          required: false,
        },
        {
          model: Technology,
          as: 'technology',
          attributes: ['id', 'name', 'code'],
          required: false,
        },
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'code', 'level'],
          required: false,
        },
      ],
    });

    if (!capability) {
      throw new ValidationError('Resource capability not found');
    }

    res.json({
      success: true,
      data: capability,
    });
  } catch (error) {
    next(error);
  }
};

export const createResourceCapability = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const capabilityData = req.body;

    // The cascade validation happens in the model's beforeValidate hook
    const capability = await ResourceCapability.create({
      ...capabilityData,
      isActive: true,
    });

    logger.info(`Resource capability created: Resource ${capability.resourceId} - App ${capability.appId}`);

    res.status(201).json({
      success: true,
      message: 'Resource capability created successfully',
      data: capability,
    });
  } catch (error) {
    next(error);
  }
};

export const updateResourceCapability = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const capability = await ResourceCapability.findByPk(id);

    if (!capability) {
      throw new ValidationError('Resource capability not found');
    }

    // The cascade validation happens in the model's beforeValidate hook
    await capability.update(updateData);

    logger.info(`Resource capability updated: ID ${capability.id}`);

    res.json({
      success: true,
      message: 'Resource capability updated successfully',
      data: capability,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteResourceCapability = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const capability = await ResourceCapability.findByPk(id);

    if (!capability) {
      throw new ValidationError('Resource capability not found');
    }

    await capability.update({ isActive: false });

    logger.info(`Resource capability deleted: ID ${capability.id}`);

    res.json({
      success: true,
      message: 'Resource capability deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
