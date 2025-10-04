import { Request, Response, NextFunction } from 'express';
import Portfolio from '../models/Portfolio';
import { ValidationError } from '../middleware/errorHandler';
import logger from '../config/logger';

export const getAllPortfolios = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const portfolios = await Portfolio.findAll({
      where: { isActive: true },
      order: [['createdDate', 'DESC']],
    });

    res.json({
      success: true,
      data: portfolios,
    });
  } catch (error) {
    next(error);
  }
};

export const getPortfolioById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const portfolio = await Portfolio.findByPk(id);

    if (!portfolio) {
      throw new ValidationError('Portfolio not found');
    }

    res.json({
      success: true,
      data: portfolio,
    });
  } catch (error) {
    next(error);
  }
};

export const createPortfolio = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const portfolioData = req.body;

    const portfolio = await Portfolio.create({
      ...portfolioData,
      isActive: true,
    });

    logger.info(`Portfolio created: ${portfolio.name}`);

    res.status(201).json({
      success: true,
      message: 'Portfolio created successfully',
      data: portfolio,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePortfolio = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const portfolio = await Portfolio.findByPk(id);

    if (!portfolio) {
      throw new ValidationError('Portfolio not found');
    }

    await portfolio.update(updateData);

    logger.info(`Portfolio updated: ${portfolio.name}`);

    res.json({
      success: true,
      message: 'Portfolio updated successfully',
      data: portfolio,
    });
  } catch (error) {
    next(error);
  }
};

export const deletePortfolio = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const portfolio = await Portfolio.findByPk(id);

    if (!portfolio) {
      throw new ValidationError('Portfolio not found');
    }

    // Soft delete
    await portfolio.update({ isActive: false });

    logger.info(`Portfolio deleted: ${portfolio.name}`);

    res.json({
      success: true,
      message: 'Portfolio deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getPortfolioStats = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const portfolios = await Portfolio.findAll({
      where: { isActive: true },
    });

    const totalValue = portfolios.reduce((sum, p) => sum + (Number(p.totalValue) || 0), 0);
    const avgROI = portfolios.reduce((sum, p) => sum + (Number(p.roiIndex) || 0), 0) / portfolios.length || 0;
    const avgRisk = portfolios.reduce((sum, p) => sum + (Number(p.riskScore) || 0), 0) / portfolios.length || 0;

    res.json({
      success: true,
      data: {
        totalPortfolios: portfolios.length,
        totalValue,
        averageROI: avgROI,
        averageRisk: avgRisk,
      },
    });
  } catch (error) {
    next(error);
  }
};
