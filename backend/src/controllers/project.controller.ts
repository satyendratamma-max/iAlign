import { Request, Response, NextFunction } from 'express';
import Project from '../models/Project';
import Domain from '../models/Domain';
import SegmentFunction from '../models/SegmentFunction';
import { ValidationError } from '../middleware/errorHandler';
import logger from '../config/logger';

export const getAllProjects = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { segmentFunctionId, status } = req.query;
    const where: any = { isActive: true };

    if (segmentFunctionId) {
      where.segmentFunctionId = segmentFunctionId;
    }

    if (status) {
      where.status = status;
    }

    const projects = await Project.findAll({
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
          as: 'segmentFunctionData',
          attributes: ['id', 'name'],
        },
      ],
    });

    res.json({
      success: true,
      data: projects,
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const project = await Project.findByPk(id, {
      include: [
        {
          model: Domain,
          as: 'domain',
          attributes: ['id', 'name'],
        },
        {
          model: SegmentFunction,
          as: 'segmentFunctionData',
          attributes: ['id', 'name'],
        },
      ],
    });

    if (!project) {
      throw new ValidationError('Project not found');
    }

    res.json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

export const createProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectData = req.body;

    const project = await Project.create({
      ...projectData,
      isActive: true,
    });

    logger.info(`Project created: ${project.name}`);

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const project = await Project.findByPk(id);

    if (!project) {
      throw new ValidationError('Project not found');
    }

    await project.update(updateData);

    logger.info(`Project updated: ${project.name}`);

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const project = await Project.findByPk(id);

    if (!project) {
      throw new ValidationError('Project not found');
    }

    // Soft delete
    await project.update({ isActive: false });

    logger.info(`Project deleted: ${project.name}`);

    res.json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectStats = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const projects = await Project.findAll({
      where: { isActive: true },
    });

    const totalBudget = projects.reduce((sum, p) => sum + (Number(p.budget) || 0), 0);
    const totalActual = projects.reduce((sum, p) => sum + (Number(p.actualCost) || 0), 0);
    const avgProgress = projects.reduce((sum, p) => sum + (Number(p.progress) || 0), 0) / projects.length || 0;

    const statusBreakdown = projects.reduce((acc: any, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {});

    const healthBreakdown = projects.reduce((acc: any, p) => {
      const health = p.healthStatus || 'Unknown';
      acc[health] = (acc[health] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        totalProjects: projects.length,
        totalBudget,
        totalActualCost: totalActual,
        averageProgress: avgProgress,
        statusBreakdown,
        healthBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboardMetrics = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const projects = await Project.findAll({ where: { isActive: true } });

    const activeProjects = projects.filter(p =>
      p.status === 'In Progress' || p.status === 'Planning'
    );

    const totalBudget = projects.reduce((sum, p) => sum + (Number(p.budget) || 0), 0);
    const totalActual = projects.reduce((sum, p) => sum + (Number(p.actualCost) || 0), 0);
    const avgProgress = projects.reduce((sum, p) => sum + (Number(p.progress) || 0), 0) / projects.length || 0;

    const statusBreakdown = projects.reduce((acc: any, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {});

    const healthBreakdown = projects.reduce((acc: any, p) => {
      const health = p.healthStatus || 'Unknown';
      acc[health] = (acc[health] || 0) + 1;
      return acc;
    }, {});

    const priorityBreakdown = projects.reduce((acc: any, p) => {
      acc[p.priority] = (acc[p.priority] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        totalProjects: projects.length,
        activeProjects: activeProjects.length,
        totalBudget,
        totalActualCost: totalActual,
        budgetVariance: totalBudget - totalActual,
        averageProgress: Math.round(avgProgress),
        statusBreakdown,
        healthBreakdown,
        priorityBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const bulkUpdateProjectRanks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { projects } = req.body;

    if (!Array.isArray(projects)) {
      throw new ValidationError('projects must be an array');
    }

    // Update each project's rank
    await Promise.all(
      projects.map((project: { id: number; rank: number }) =>
        Project.update(
          { rank: project.rank },
          { where: { id: project.id } }
        )
      )
    );

    res.json({
      success: true,
      message: 'Project ranks updated successfully',
    });
  } catch (error) {
    next(error);
  }
};
