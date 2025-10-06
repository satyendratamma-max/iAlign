import { Request, Response, NextFunction } from 'express';
import Role from '../models/Role';
import App from '../models/App';
import Technology from '../models/Technology';
import { ValidationError } from '../middleware/errorHandler';
import logger from '../config/logger';
import { Op } from 'sequelize';

export const getAllRoles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { appId, technologyId } = req.query;

    // Build where clause based on cascade filtering
    const whereClause: any = { isActive: true };

    if (appId && technologyId) {
      // Filter by: (app+tech specific) OR (app-specific only) OR (global)
      whereClause[Op.or] = [
        { appId: parseInt(appId as string), technologyId: parseInt(technologyId as string) },
        { appId: parseInt(appId as string), technologyId: null },
        { appId: null, technologyId: null },
      ];
    } else if (appId) {
      // Filter by: (app-specific with any tech) OR (app-specific without tech) OR (global)
      whereClause[Op.or] = [
        { appId: parseInt(appId as string) },
        { appId: null, technologyId: null },
      ];
    } else if (technologyId) {
      // Filter by: (tech-specific with any app) OR (global)
      whereClause[Op.or] = [
        { technologyId: parseInt(technologyId as string) },
        { appId: null, technologyId: null },
      ];
    }

    const roles = await Role.findAll({
      where: whereClause,
      include: [
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
      ],
      order: [['name', 'ASC']],
    });

    res.json({
      success: true,
      data: roles,
    });
  } catch (error) {
    next(error);
  }
};

export const getRoleById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const role = await Role.findByPk(id, {
      include: [
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
      ],
    });

    if (!role) {
      throw new ValidationError('Role not found');
    }

    res.json({
      success: true,
      data: role,
    });
  } catch (error) {
    next(error);
  }
};

export const createRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const roleData = req.body;

    const role = await Role.create({
      ...roleData,
      isActive: true,
    });

    logger.info(`Role created: ${role.name} (${role.code})`);

    res.status(201).json({
      success: true,
      message: 'Role created successfully',
      data: role,
    });
  } catch (error) {
    next(error);
  }
};

export const updateRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const role = await Role.findByPk(id);

    if (!role) {
      throw new ValidationError('Role not found');
    }

    await role.update(updateData);

    logger.info(`Role updated: ${role.name} (${role.code})`);

    res.json({
      success: true,
      message: 'Role updated successfully',
      data: role,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const role = await Role.findByPk(id);

    if (!role) {
      throw new ValidationError('Role not found');
    }

    await role.update({ isActive: false });

    logger.info(`Role deleted: ${role.name} (${role.code})`);

    res.json({
      success: true,
      message: 'Role deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
