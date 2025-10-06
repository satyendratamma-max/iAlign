import { Request, Response, NextFunction } from 'express';
import Technology from '../models/Technology';
import App from '../models/App';
import { ValidationError } from '../middleware/errorHandler';
import logger from '../config/logger';

export const getAllTechnologies = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { appId } = req.query;

    // Build where clause based on cascade filtering
    const whereClause: any = { isActive: true };

    if (appId) {
      // Filter by app-specific technologies OR global technologies (appId = null)
      whereClause.appId = [parseInt(appId as string), null];
    }

    const technologies = await Technology.findAll({
      where: whereClause,
      include: [
        {
          model: App,
          as: 'app',
          attributes: ['id', 'name', 'code'],
          required: false,
        },
      ],
      order: [['name', 'ASC']],
    });

    res.json({
      success: true,
      data: technologies,
    });
  } catch (error) {
    next(error);
  }
};

export const getTechnologyById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const technology = await Technology.findByPk(id, {
      include: [
        {
          model: App,
          as: 'app',
          attributes: ['id', 'name', 'code'],
          required: false,
        },
      ],
    });

    if (!technology) {
      throw new ValidationError('Technology not found');
    }

    res.json({
      success: true,
      data: technology,
    });
  } catch (error) {
    next(error);
  }
};

export const createTechnology = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const technologyData = req.body;

    const technology = await Technology.create({
      ...technologyData,
      isActive: true,
    });

    logger.info(`Technology created: ${technology.name} (${technology.code})`);

    res.status(201).json({
      success: true,
      message: 'Technology created successfully',
      data: technology,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTechnology = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const technology = await Technology.findByPk(id);

    if (!technology) {
      throw new ValidationError('Technology not found');
    }

    await technology.update(updateData);

    logger.info(`Technology updated: ${technology.name} (${technology.code})`);

    res.json({
      success: true,
      message: 'Technology updated successfully',
      data: technology,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTechnology = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const technology = await Technology.findByPk(id);

    if (!technology) {
      throw new ValidationError('Technology not found');
    }

    await technology.update({ isActive: false });

    logger.info(`Technology deleted: ${technology.name} (${technology.code})`);

    res.json({
      success: true,
      message: 'Technology deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
