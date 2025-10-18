import { Request, Response, NextFunction } from 'express';
import { literal } from 'sequelize';
import Project from '../models/Project';
import Domain from '../models/Domain';
import SegmentFunction from '../models/SegmentFunction';
import Milestone from '../models/Milestone';
import User from '../models/User';
import { ValidationError } from '../middleware/errorHandler';
import logger from '../config/logger';
import { createNotification } from './notification.controller';

export const getAllProjects = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { segmentFunctionId, status, scenarioId } = req.query;
    const where: any = { isActive: true };

    if (segmentFunctionId) {
      where.segmentFunctionId = segmentFunctionId;
    }

    if (status) {
      where.status = status;
    }

    if (scenarioId) {
      where.scenarioId = scenarioId;
    }

    const projects = await Project.findAll({
      where,
      order: [[literal('COALESCE(sortOrder, 999999)'), 'ASC'], ['createdDate', 'DESC']],
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

    // Notify all admin users about the new project
    try {
      const adminUsers = await User.findAll({
        where: { role: 'Administrator', isActive: true },
      });

      await Promise.all(
        adminUsers.map((admin) =>
          createNotification(
            admin.id,
            'info',
            'New Project Created',
            `Project "${project.name}" has been created with priority ${project.priority || 'Not Set'}.`
          )
        )
      );
    } catch (notifError) {
      // Log but don't fail the request if notification fails
      logger.error('Failed to send project creation notifications:', notifError);
    }

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

    // Validation 1: If marking project as "Completed", check if all milestones are completed
    if (updateData.status === 'Completed' && project.status !== 'Completed') {
      const incompleteMilestones = await Milestone.findAll({
        where: {
          projectId: id,
          isActive: true,
        },
      });

      const hasIncompleteMilestones = incompleteMilestones.some(
        milestone => milestone.status !== 'Completed'
      );

      if (hasIncompleteMilestones) {
        throw new ValidationError(
          'Cannot mark project as Completed. All milestones must be completed first.'
        );
      }
    }

    // Validation 2: Prevent schedule changes for completed projects unless reopening
    const isCompletedProject = project.status === 'Completed';
    const isReopeningProject = updateData.status && updateData.status !== 'Completed';
    const scheduleFields = ['startDate', 'endDate', 'actualStartDate', 'actualEndDate'];

    // Helper to normalize dates for comparison (convert to ISO string without time)
    const normalizeDate = (date: any) => {
      if (!date) return null;
      const d = new Date(date);
      return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
    };

    const hasScheduleChanges = scheduleFields.some(field => {
      if (updateData[field] === undefined) return false;
      const oldDate = normalizeDate(project[field as keyof typeof project]);
      const newDate = normalizeDate(updateData[field]);
      return oldDate !== newDate;
    });

    if (isCompletedProject && hasScheduleChanges && !isReopeningProject) {
      throw new ValidationError(
        'Cannot modify schedule dates for a completed project. Please reopen the project first by changing its status.'
      );
    }

    const oldStatus = project.status;
    await project.update(updateData);

    logger.info(`Project updated: ${project.name}`);

    // Notify admins about project status changes
    try {
      if (updateData.status && updateData.status !== oldStatus) {
        const adminUsers = await User.findAll({
          where: { role: 'Administrator', isActive: true },
        });

        let notificationType: 'success' | 'info' | 'warning' = 'info';
        let title = '';
        let message = '';

        if (updateData.status === 'Completed') {
          notificationType = 'success';
          title = 'Project Completed';
          message = `Project "${project.name}" has been marked as completed.`;
        } else if (updateData.status === 'On Hold') {
          notificationType = 'warning';
          title = 'Project On Hold';
          message = `Project "${project.name}" has been put on hold.`;
        } else if (updateData.status === 'Cancelled') {
          notificationType = 'warning';
          title = 'Project Cancelled';
          message = `Project "${project.name}" has been cancelled.`;
        } else {
          title = 'Project Status Changed';
          message = `Project "${project.name}" status changed from ${oldStatus} to ${updateData.status}.`;
        }

        await Promise.all(
          adminUsers.map((admin) =>
            createNotification(admin.id, notificationType, title, message)
          )
        );
      }
    } catch (notifError) {
      logger.error('Failed to send project update notifications:', notifError);
    }

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

export const getProjectStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { scenarioId } = req.query;
    const where: any = { isActive: true };

    if (scenarioId) {
      where.scenarioId = scenarioId;
    }

    const projects = await Project.findAll({
      where,
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

export const getDashboardMetrics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { scenarioId } = req.query;
    const where: any = { isActive: true };

    if (scenarioId) {
      where.scenarioId = scenarioId;
    }

    const projects = await Project.findAll({ where });

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

export const bulkUpdateProjectSortOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { projects } = req.body;

    if (!Array.isArray(projects)) {
      throw new ValidationError('projects must be an array');
    }

    // Update each project's sortOrder
    await Promise.all(
      projects.map((project: { id: number; sortOrder: number }) =>
        Project.update(
          { sortOrder: project.sortOrder },
          { where: { id: project.id } }
        )
      )
    );

    logger.info(`Updated sort orders for ${projects.length} projects`);

    res.json({
      success: true,
      message: 'Project sort orders updated successfully',
    });
  } catch (error) {
    next(error);
  }
};
