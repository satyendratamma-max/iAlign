import { Request, Response, NextFunction } from 'express';
import { QueryTypes } from 'sequelize';
import sequelize from '../config/database';
import Domain from '../models/Domain';
import { ValidationError } from '../middleware/errorHandler';
import logger from '../config/logger';

export const getAllDomains = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const domains = await Domain.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']], // Sort alphabetically by name
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

// Get domain statistics with accurate project counts
export const getDomainStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { scenarioId } = req.query;

    if (!scenarioId) {
      throw new ValidationError('scenarioId is required');
    }

    // Use raw SQL query for accurate counts grouped by domain
    const stats: any[] = await sequelize.query(
      `
      SELECT
        d.id as domainId,
        d.name as domainName,
        COUNT(p.id) as totalProjects,
        SUM(CASE WHEN p.status IN ('In Progress', 'Planning') THEN 1 ELSE 0 END) as activeProjects,
        SUM(ISNULL(p.budget, 0)) as totalBudget
      FROM Domains d
      LEFT JOIN Projects p ON p.domainId = d.id
        AND p.isActive = 1
        AND p.scenarioId = :scenarioId
      WHERE d.isActive = 1
      GROUP BY d.id, d.name
      ORDER BY d.name ASC
      `,
      {
        replacements: { scenarioId: parseInt(scenarioId as string) },
        type: QueryTypes.SELECT,
      }
    );

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};
