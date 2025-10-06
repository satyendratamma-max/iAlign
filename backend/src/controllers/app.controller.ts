import { Request, Response, NextFunction } from 'express';
import App from '../models/App';
import { ValidationError } from '../middleware/errorHandler';
import logger from '../config/logger';

export const getAllApps = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const apps = await App.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']],
    });

    res.json({
      success: true,
      data: apps,
    });
  } catch (error) {
    next(error);
  }
};

export const getAppById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const app = await App.findByPk(id);

    if (!app) {
      throw new ValidationError('App not found');
    }

    res.json({
      success: true,
      data: app,
    });
  } catch (error) {
    next(error);
  }
};

export const createApp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appData = req.body;

    const app = await App.create({
      ...appData,
      isActive: true,
    });

    logger.info(`App created: ${app.name} (${app.code})`);

    res.status(201).json({
      success: true,
      message: 'App created successfully',
      data: app,
    });
  } catch (error) {
    next(error);
  }
};

export const updateApp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const app = await App.findByPk(id);

    if (!app) {
      throw new ValidationError('App not found');
    }

    await app.update(updateData);

    logger.info(`App updated: ${app.name} (${app.code})`);

    res.json({
      success: true,
      message: 'App updated successfully',
      data: app,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteApp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const app = await App.findByPk(id);

    if (!app) {
      throw new ValidationError('App not found');
    }

    await app.update({ isActive: false });

    logger.info(`App deleted: ${app.name} (${app.code})`);

    res.json({
      success: true,
      message: 'App deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
