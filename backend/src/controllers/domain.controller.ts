import { Request, Response, NextFunction } from 'express';
import Domain from '../models/Domain';
import { ValidationError } from '../middleware/errorHandler';
import logger from '../config/logger';

export const getAllDomains = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const domains = await Domain.findAll({
      where: { isActive: true },
      order: [['createdDate', 'DESC']],
    });

    res.json({
      success: true,
      data: domains,
    });
  } catch (error) {
    next(error);
  }
};

export const getDomainById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const domain = await Domain.findByPk(id);

    if (!domain) {
      throw new ValidationError('Domain not found');
    }

    res.json({
      success: true,
      data: domain,
    });
  } catch (error) {
    next(error);
  }
};

export const createDomain = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const domainData = req.body;

    const domain = await Domain.create({
      ...domainData,
      isActive: true,
    });

    logger.info(`Domain created: ${domain.name}`);

    res.status(201).json({
      success: true,
      message: 'Domain created successfully',
      data: domain,
    });
  } catch (error) {
    next(error);
  }
};

export const updateDomain = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const domain = await Domain.findByPk(id);

    if (!domain) {
      throw new ValidationError('Domain not found');
    }

    await domain.update(updateData);

    logger.info(`Domain updated: ${domain.name}`);

    res.json({
      success: true,
      message: 'Domain updated successfully',
      data: domain,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDomain = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const domain = await Domain.findByPk(id);

    if (!domain) {
      throw new ValidationError('Domain not found');
    }

    await domain.update({ isActive: false });

    logger.info(`Domain deleted: ${domain.name}`);

    res.json({
      success: true,
      message: 'Domain deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
