import { Request, Response, NextFunction } from 'express';
import ProjectDependency from '../models/ProjectDependency';
import Project from '../models/Project';
import Milestone from '../models/Milestone';
import logger from '../config/logger';

export const getAllDependencies = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const dependencies = await ProjectDependency.findAll({
      where: { isActive: true },
      order: [['createdDate', 'DESC']],
    });

    return res.json({
      success: true,
      data: dependencies,
    });
  } catch (error) {
    logger.error('Error fetching project dependencies:', error);
    return next(error);
  }
};

export const getDependencyById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const dependency = await ProjectDependency.findByPk(id);

    if (!dependency) {
      return res.status(404).json({
        success: false,
        message: 'Dependency not found',
      });
    }

    return res.json({
      success: true,
      data: dependency,
    });
  } catch (error) {
    logger.error('Error fetching dependency:', error);
    return next(error);
  }
};

export const createDependency = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      predecessorType,
      predecessorId,
      predecessorPoint,
      successorType,
      successorId,
      successorPoint,
      dependencyType,
      lagDays,
    } = req.body;

    // Validation: Check if predecessor and successor exist
    if (predecessorType === 'project') {
      const project = await Project.findByPk(predecessorId);
      if (!project) {
        return res.status(400).json({
          success: false,
          message: 'Predecessor project not found',
        });
      }
    } else if (predecessorType === 'milestone') {
      const milestone = await Milestone.findByPk(predecessorId);
      if (!milestone) {
        return res.status(400).json({
          success: false,
          message: 'Predecessor milestone not found',
        });
      }
    }

    if (successorType === 'project') {
      const project = await Project.findByPk(successorId);
      if (!project) {
        return res.status(400).json({
          success: false,
          message: 'Successor project not found',
        });
      }
    } else if (successorType === 'milestone') {
      const milestone = await Milestone.findByPk(successorId);
      if (!milestone) {
        return res.status(400).json({
          success: false,
          message: 'Successor milestone not found',
        });
      }
    }

    // Validation: Prevent self-dependency
    if (predecessorType === successorType && predecessorId === successorId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create a dependency from an entity to itself',
      });
    }

    // Check for duplicate dependency
    const existing = await ProjectDependency.findOne({
      where: {
        predecessorType,
        predecessorId,
        successorType,
        successorId,
        isActive: true,
      },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'This dependency already exists',
      });
    }

    const dependency = await ProjectDependency.create({
      predecessorType,
      predecessorId,
      predecessorPoint: predecessorPoint || 'end',
      successorType,
      successorId,
      successorPoint: successorPoint || 'start',
      dependencyType: dependencyType || 'FS',
      lagDays: lagDays || 0,
    });

    logger.info(`Created dependency: ${dependency.id}`);

    return res.status(201).json({
      success: true,
      data: dependency,
    });
  } catch (error) {
    logger.error('Error creating dependency:', error);
    return next(error);
  }
};

export const updateDependency = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const {
      predecessorPoint,
      successorPoint,
      dependencyType,
      lagDays,
    } = req.body;

    const dependency = await ProjectDependency.findByPk(id);

    if (!dependency) {
      return res.status(404).json({
        success: false,
        message: 'Dependency not found',
      });
    }

    await dependency.update({
      predecessorPoint: predecessorPoint !== undefined ? predecessorPoint : dependency.predecessorPoint,
      successorPoint: successorPoint !== undefined ? successorPoint : dependency.successorPoint,
      dependencyType: dependencyType || dependency.dependencyType,
      lagDays: lagDays !== undefined ? lagDays : dependency.lagDays,
    });

    logger.info(`Updated dependency: ${id}`);

    return res.json({
      success: true,
      data: dependency,
    });
  } catch (error) {
    logger.error('Error updating dependency:', error);
    return next(error);
  }
};

export const deleteDependency = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const dependency = await ProjectDependency.findByPk(id);

    if (!dependency) {
      return res.status(404).json({
        success: false,
        message: 'Dependency not found',
      });
    }

    await dependency.update({ isActive: false });

    logger.info(`Deleted dependency: ${id}`);

    return res.json({
      success: true,
      message: 'Dependency deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting dependency:', error);
    return next(error);
  }
};
