import { Request, Response, NextFunction } from 'express';
import ProjectDomainImpact from '../models/ProjectDomainImpact';
import Project from '../models/Project';
import Domain from '../models/Domain';
import { ValidationError } from '../middleware/errorHandler';
import logger from '../config/logger';

export const getAllProjectDomainImpacts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId, domainId } = req.query;

    const whereClause: any = { isActive: true };

    if (projectId) {
      whereClause.projectId = parseInt(projectId as string);
    }

    if (domainId) {
      whereClause.domainId = parseInt(domainId as string);
    }

    const impacts = await ProjectDomainImpact.findAll({
      where: whereClause,
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'projectNumber', 'status'],
        },
        {
          model: Domain,
          as: 'domain',
          attributes: ['id', 'name'],
        },
      ],
      order: [
        ['projectId', 'ASC'],
        ['impactType', 'ASC'],
      ],
    });

    res.json({
      success: true,
      data: impacts,
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectDomainImpactById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const impact = await ProjectDomainImpact.findByPk(id, {
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'projectNumber', 'status'],
        },
        {
          model: Domain,
          as: 'domain',
          attributes: ['id', 'name'],
        },
      ],
    });

    if (!impact) {
      throw new ValidationError('Project domain impact not found');
    }

    res.json({
      success: true,
      data: impact,
    });
  } catch (error) {
    next(error);
  }
};

export const createProjectDomainImpact = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const impactData = req.body;

    const impact = await ProjectDomainImpact.create({
      ...impactData,
      isActive: true,
    });

    logger.info(`Project domain impact created: Project ${impact.projectId} impacts Domain ${impact.domainId}`);

    res.status(201).json({
      success: true,
      message: 'Project domain impact created successfully',
      data: impact,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProjectDomainImpact = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const impact = await ProjectDomainImpact.findByPk(id);

    if (!impact) {
      throw new ValidationError('Project domain impact not found');
    }

    await impact.update(updateData);

    logger.info(`Project domain impact updated: ID ${impact.id}`);

    res.json({
      success: true,
      message: 'Project domain impact updated successfully',
      data: impact,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProjectDomainImpact = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const impact = await ProjectDomainImpact.findByPk(id);

    if (!impact) {
      throw new ValidationError('Project domain impact not found');
    }

    await impact.update({ isActive: false });

    logger.info(`Project domain impact deleted: ID ${impact.id}`);

    res.json({
      success: true,
      message: 'Project domain impact deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const bulkUpsertDomainImpacts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId, impacts } = req.body;

    if (!projectId || !Array.isArray(impacts)) {
      throw new ValidationError('projectId and impacts array are required');
    }

    // Validate for duplicate domain IDs in the request
    const domainIds = impacts.map((impact: any) => impact.domainId);
    const uniqueDomainIds = new Set(domainIds);
    if (domainIds.length !== uniqueDomainIds.size) {
      throw new ValidationError('Duplicate domains detected. Each domain can only be added once per project.');
    }

    // Delete existing impacts for this project (hard delete to avoid unique constraint issues)
    await ProjectDomainImpact.destroy({
      where: { projectId }
    });

    // Create new impacts
    const createdImpacts = await Promise.all(
      impacts.map((impact: any) =>
        ProjectDomainImpact.create({
          projectId,
          domainId: impact.domainId,
          impactType: impact.impactType || 'Secondary',
          impactLevel: impact.impactLevel || 'Medium',
          description: impact.description,
          isActive: true,
        })
      )
    );

    logger.info(`Bulk upserted ${createdImpacts.length} domain impacts for project ${projectId}`);

    res.json({
      success: true,
      message: 'Project domain impacts updated successfully',
      data: createdImpacts,
    });
  } catch (error: any) {
    // Handle SQLite constraint errors
    if (error.name === 'SequelizeUniqueConstraintError' || error.message?.includes('UNIQUE constraint')) {
      next(new ValidationError('Duplicate domains detected. Each domain can only be added once per project.'));
    } else {
      next(error);
    }
  }
};
