import { Request, Response, NextFunction } from 'express';
import { literal, Op } from 'sequelize';
import Project from '../models/Project';
import Domain from '../models/Domain';
import SegmentFunction from '../models/SegmentFunction';
import Milestone from '../models/Milestone';
import ProjectRequirement from '../models/ProjectRequirement';
import Role from '../models/Role';
import ResourceAllocation from '../models/ResourceAllocation';
import Resource from '../models/Resource';
import { ValidationError } from '../middleware/errorHandler';
import logger from '../config/logger';
import { notifyProjectCreated, notifyProjectStatusChanged } from '../services/notification.service';
import { createSystemActivity } from './projectActivity.controller';
import { getCurrentFiscalYear } from '../utils/fiscalYear';

// Get all projects with filtering and pagination
export const getAllProjects = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // PAGINATION SUPPORT - CRITICAL for 2K+ projects
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 2000); // Max 2000 per page (allows single-request fetching for domain views)
    const offset = (page - 1) * limit;

    const where: any = { isActive: true };

    // Scenario filter (required)
    if (req.query.scenarioId) {
      where.scenarioId = req.query.scenarioId;
    }

    // Single-value filters
    if (req.query.segmentFunctionId) {
      where.segmentFunctionId = req.query.segmentFunctionId;
    }

    if (req.query.priority) {
      where.priority = req.query.priority;
    }

    // Multiple-value filters (support arrays)
    if (req.query.domainId) {
      const domainIds = Array.isArray(req.query.domainId)
        ? req.query.domainId
        : [req.query.domainId];
      where.domainId = { [Op.in]: domainIds };
    }

    if (req.query.status) {
      const statuses = Array.isArray(req.query.status)
        ? req.query.status
        : [req.query.status];
      where.status = { [Op.in]: statuses };
    }

    if (req.query.fiscalYear) {
      const fiscalYears = Array.isArray(req.query.fiscalYear)
        ? req.query.fiscalYear
        : [req.query.fiscalYear];
      where.fiscalYear = { [Op.in]: fiscalYears };
    }

    // Partial text match filters
    if (req.query.projectNumber) {
      where.projectNumber = { [Op.like]: `%${req.query.projectNumber}%` };
    }

    if (req.query.name) {
      where.name = { [Op.like]: `%${req.query.name}%` };
    }

    if (req.query.type) {
      where.type = { [Op.like]: `%${req.query.type}%` };
    }

    if (req.query.currentPhase) {
      where.currentPhase = { [Op.like]: `%${req.query.currentPhase}%` };
    }

    // Multiple-value array filters
    if (req.query.targetRelease) {
      const targetReleases = Array.isArray(req.query.targetRelease)
        ? req.query.targetRelease
        : [req.query.targetRelease];
      where.targetRelease = { [Op.in]: targetReleases };
    }

    if (req.query.targetSprint) {
      const targetSprints = Array.isArray(req.query.targetSprint)
        ? req.query.targetSprint
        : [req.query.targetSprint];
      where.targetSprint = { [Op.in]: targetSprints };
    }

    if (req.query.healthStatus) {
      const healthStatuses = Array.isArray(req.query.healthStatus)
        ? req.query.healthStatus
        : [req.query.healthStatus];
      where.healthStatus = { [Op.in]: healthStatuses };
    }

    if (req.query.businessDecision) {
      const businessDecisions = Array.isArray(req.query.businessDecision)
        ? req.query.businessDecision
        : [req.query.businessDecision];
      where.businessDecision = { [Op.in]: businessDecisions };
    }

    // Segment function filter (by name) - requires include filter
    let segmentFunctionFilter: any = undefined;
    if (req.query.segmentFunction) {
      const segmentFunctionNames = Array.isArray(req.query.segmentFunction)
        ? req.query.segmentFunction
        : [req.query.segmentFunction];
      segmentFunctionFilter = { name: { [Op.in]: segmentFunctionNames } };
    }

    // Impacted domain filter (by domain name) - use subquery instead of nested include
    if (req.query.impactedDomain) {
      const impactedDomainNames = Array.isArray(req.query.impactedDomain)
        ? req.query.impactedDomain
        : [req.query.impactedDomain];

      // Use subquery to filter projects by impacted domains (avoids nested include issues with MSSQL)
      const domainNamesEscaped = impactedDomainNames
        .map((name: any) => {
          const nameStr = String(name);
          return `N'${nameStr.replace(/'/g, "''")}'`;
        })
        .join(',');

      if (!where[Op.and]) {
        where[Op.and] = [];
      }
      (where[Op.and] as any[]).push(
        literal(`EXISTS (
          SELECT 1 FROM ProjectDomainImpacts pdi
          INNER JOIN Domains d ON pdi.domainId = d.id
          WHERE pdi.projectId = Project.id
          AND pdi.isActive = 1
          AND d.name IN (${domainNamesEscaped})
        )`)
      );
    }

    // Build include array
    const includeArray: any[] = [
      {
        model: Domain,
        as: 'domain',
        attributes: ['id', 'name'],
      },
      {
        model: SegmentFunction,
        as: 'segmentFunctionData',
        attributes: ['id', 'name'],
        ...(segmentFunctionFilter && { where: segmentFunctionFilter, required: true }),
      },
      {
        model: ProjectRequirement,
        as: 'requirements',
        attributes: ['id', 'roleId'],
        required: false,
        where: { isActive: true },
        include: [
          {
            model: Role,
            as: 'role',
            attributes: ['id', 'name'],
            required: false,
          },
          {
            model: ResourceAllocation,
            as: 'allocations',
            attributes: ['id', 'resourceId'],
            required: false,
            where: { isActive: true },
            include: [
              {
                model: Resource,
                as: 'resource',
                attributes: ['id', 'firstName', 'lastName', 'employeeId'],
                required: false,
              },
            ],
          },
        ],
      },
    ];

    const { count, rows: projects } = await Project.findAndCountAll({
      where,
      limit,
      offset,
      order: [[literal('COALESCE(sortOrder, 999999)'), 'ASC'], ['createdDate', 'DESC']],
      include: includeArray,
      distinct: true, // Ensure accurate count with joins
    });

    // Transform projects to include manager information extracted from requirements and allocations
    const projectsWithManagers = projects.map((project: any) => {
      const projectData = project.toJSON();

      // Extract allocated resource names for manager roles
      let projectManager = null;
      let portfolioManager = null;

      if (projectData.requirements && Array.isArray(projectData.requirements)) {
        for (const req of projectData.requirements) {
          const roleName = req.role?.name?.toLowerCase() || '';

          // Check for Project Manager role and get allocated resource
          if (!projectManager && roleName.includes('project manager')) {
            if (req.allocations && Array.isArray(req.allocations) && req.allocations.length > 0) {
              // Get the first allocated resource for this requirement
              const allocation = req.allocations[0];
              if (allocation.resource) {
                const firstName = allocation.resource.firstName || '';
                const lastName = allocation.resource.lastName || '';
                projectManager = `${firstName} ${lastName}`.trim() || allocation.resource.employeeId;
              }
            }
          }

          // Check for Portfolio Manager role and get allocated resource
          if (!portfolioManager && roleName.includes('portfolio manager')) {
            if (req.allocations && Array.isArray(req.allocations) && req.allocations.length > 0) {
              // Get the first allocated resource for this requirement
              const allocation = req.allocations[0];
              if (allocation.resource) {
                const firstName = allocation.resource.firstName || '';
                const lastName = allocation.resource.lastName || '';
                portfolioManager = `${firstName} ${lastName}`.trim() || allocation.resource.employeeId;
              }
            }
          }

          // Stop if we found both
          if (projectManager && portfolioManager) break;
        }
      }

      return {
        ...projectData,
        projectManager,
        portfolioManager,
      };
    });

    res.json({
      success: true,
      data: projectsWithManagers,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
        hasMore: page * limit < count,
      },
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

    // Set default fiscal year if not provided
    if (!projectData.fiscalYear) {
      projectData.fiscalYear = getCurrentFiscalYear();
    }

    const project = await Project.create({
      ...projectData,
      isActive: true,
    });

    logger.info(`Project created: ${project.name}`);

    // Notify stakeholders about the new project
    try {
      const userId = (req as any).user?.id; // Get the user ID from the request
      await notifyProjectCreated(project, userId);
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

    // Capture old values for activity logging
    const oldValues: any = {};
    const trackedFields = ['status', 'priority', 'healthStatus', 'targetRelease', 'targetSprint',
                           'businessDecision', 'startDate', 'endDate', 'actualStartDate',
                           'actualEndDate', 'budget', 'actualCost', 'progress', 'currentPhase'];

    trackedFields.forEach(field => {
      if (updateData[field] !== undefined && project[field as keyof typeof project] !== updateData[field]) {
        oldValues[field] = project[field as keyof typeof project];
      }
    });

    await project.update(updateData);

    logger.info(`Project updated: ${project.name}`);

    // Log field changes as activities
    const userId = (req as any).user?.id;
    if (Object.keys(oldValues).length > 0) {
      try {
        // Log status changes specially
        if (oldValues.status) {
          await createSystemActivity(
            project.id,
            'status_change',
            {
              field: 'status',
              oldValue: oldValues.status,
              newValue: updateData.status,
            },
            {
              projectName: project.name,
              projectNumber: project.projectNumber,
            },
            userId
          );
        }

        // Log other field changes
        const otherChanges = Object.keys(oldValues).filter(f => f !== 'status');
        if (otherChanges.length > 0) {
          const changes = otherChanges.map(field => ({
            field,
            oldValue: oldValues[field],
            newValue: updateData[field],
          }));

          await createSystemActivity(
            project.id,
            'field_update',
            { changes },
            {
              projectName: project.name,
              projectNumber: project.projectNumber,
            },
            userId
          );
        }
      } catch (activityError) {
        logger.error('Failed to create project activity log:', activityError);
      }
    }

    // Notify stakeholders about project status changes
    try {
      if (updateData.status && updateData.status !== oldStatus) {
        await notifyProjectStatusChanged(project, oldStatus, updateData.status, userId);
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

// MEMORY OPTIMIZATION: Use SQL aggregations instead of loading all projects into memory
export const getDashboardMetrics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { scenarioId } = req.query;
    const where: any = { isActive: true };

    if (scenarioId) {
      where.scenarioId = scenarioId;
    }

    // Use SQL aggregations - NO records loaded into memory
    const [projectStats] = await Project.findAll({
      where,
      attributes: [
        [literal('COUNT(*)'), 'totalProjects'],
        [literal("SUM(CASE WHEN status IN ('In Progress', 'Planning') THEN 1 ELSE 0 END)"), 'activeProjects'],
        [literal('SUM(COALESCE(budget, 0))'), 'totalBudget'],
        [literal('SUM(COALESCE(actualCost, 0))'), 'totalActualCost'],
        [literal('AVG(COALESCE(progress, 0))'), 'avgProgress'],
        // Status breakdown
        [literal("SUM(CASE WHEN status = 'Planning' THEN 1 ELSE 0 END)"), 'statusPlanning'],
        [literal("SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END)"), 'statusInProgress'],
        [literal("SUM(CASE WHEN status = 'On Hold' THEN 1 ELSE 0 END)"), 'statusOnHold'],
        [literal("SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END)"), 'statusCompleted'],
        [literal("SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END)"), 'statusCancelled'],
        // Health breakdown
        [literal("SUM(CASE WHEN healthStatus = 'On Track' THEN 1 ELSE 0 END)"), 'healthOnTrack'],
        [literal("SUM(CASE WHEN healthStatus = 'At Risk' THEN 1 ELSE 0 END)"), 'healthAtRisk'],
        [literal("SUM(CASE WHEN healthStatus = 'Off Track' THEN 1 ELSE 0 END)"), 'healthOffTrack'],
        // Priority breakdown
        [literal("SUM(CASE WHEN priority = 'High' THEN 1 ELSE 0 END)"), 'priorityHigh'],
        [literal("SUM(CASE WHEN priority = 'Medium' THEN 1 ELSE 0 END)"), 'priorityMedium'],
        [literal("SUM(CASE WHEN priority = 'Low' THEN 1 ELSE 0 END)"), 'priorityLow'],
      ],
      raw: true,
    }) as any[];

    const stats = projectStats as any;
    const totalBudget = parseFloat(stats.totalBudget || 0);
    const totalActual = parseFloat(stats.totalActualCost || 0);

    const statusBreakdown: any = {};
    if (stats.statusPlanning > 0) statusBreakdown['Planning'] = parseInt(stats.statusPlanning);
    if (stats.statusInProgress > 0) statusBreakdown['In Progress'] = parseInt(stats.statusInProgress);
    if (stats.statusOnHold > 0) statusBreakdown['On Hold'] = parseInt(stats.statusOnHold);
    if (stats.statusCompleted > 0) statusBreakdown['Completed'] = parseInt(stats.statusCompleted);
    if (stats.statusCancelled > 0) statusBreakdown['Cancelled'] = parseInt(stats.statusCancelled);

    const healthBreakdown: any = {};
    if (stats.healthOnTrack > 0) healthBreakdown['On Track'] = parseInt(stats.healthOnTrack);
    if (stats.healthAtRisk > 0) healthBreakdown['At Risk'] = parseInt(stats.healthAtRisk);
    if (stats.healthOffTrack > 0) healthBreakdown['Off Track'] = parseInt(stats.healthOffTrack);

    const priorityBreakdown: any = {};
    if (stats.priorityHigh > 0) priorityBreakdown['High'] = parseInt(stats.priorityHigh);
    if (stats.priorityMedium > 0) priorityBreakdown['Medium'] = parseInt(stats.priorityMedium);
    if (stats.priorityLow > 0) priorityBreakdown['Low'] = parseInt(stats.priorityLow);

    res.json({
      success: true,
      data: {
        totalProjects: parseInt(stats.totalProjects || 0),
        activeProjects: parseInt(stats.activeProjects || 0),
        totalBudget,
        totalActualCost: totalActual,
        budgetVariance: totalBudget - totalActual,
        averageProgress: Math.round(parseFloat(stats.avgProgress || 0)),
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

// MEMORY OPTIMIZATION: Return only top 8 projects by budget (not all 2K+ projects)
export const getTopProjectsByBudget = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { scenarioId, limit = 8 } = req.query;
    const where: any = { isActive: true };

    if (scenarioId) {
      where.scenarioId = scenarioId;
    }

    const topProjects = await Project.findAll({
      where,
      order: [['budget', 'DESC']],
      limit: parseInt(limit as string),
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
      data: topProjects,
    });
  } catch (error) {
    next(error);
  }
};

// MEMORY OPTIMIZATION: Return only at-risk projects (not all projects)
export const getAtRiskProjects = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { scenarioId, limit = 8 } = req.query;
    const where: any = {
      isActive: true,
      healthStatus: ['Red', 'Yellow'], // Red or Yellow health status
    };

    if (scenarioId) {
      where.scenarioId = scenarioId;
    }

    const atRiskProjects = await Project.findAll({
      where,
      order: [['progress', 'ASC']], // Lowest progress first (highest risk)
      limit: parseInt(limit as string),
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
      data: atRiskProjects,
    });
  } catch (error) {
    next(error);
  }
};

// MEMORY OPTIMIZATION: Return domain performance stats using SQL aggregation
export const getDomainPerformance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { scenarioId } = req.query;
    const where: any = { isActive: true };

    if (scenarioId) {
      where.scenarioId = scenarioId;
    }

    // Get all domains
    const domains = await Domain.findAll({
      where: { isActive: true },
      attributes: ['id', 'name'],
    });

    // For each domain, calculate aggregated stats
    const domainPerformance = await Promise.all(
      domains.map(async (domain) => {
        const [stats] = await Project.findAll({
          where: { ...where, domainId: domain.id },
          attributes: [
            [literal('COUNT(*)'), 'projectCount'],
            [literal('SUM(COALESCE(budget, 0))'), 'totalBudget'],
            [literal('AVG(COALESCE(progress, 0))'), 'avgProgress'],
            [literal("SUM(CASE WHEN healthStatus = 'Green' THEN 1 ELSE 0 END)"), 'healthyProjects'],
          ],
          raw: true,
        }) as any[];

        const projectCount = parseInt(stats.projectCount || 0);
        const healthScore = projectCount > 0
          ? Math.round((parseInt(stats.healthyProjects || 0) / projectCount) * 100)
          : 0;

        return {
          domainId: domain.id,
          domainName: domain.name,
          projectCount,
          totalBudget: parseFloat(stats.totalBudget || 0),
          avgProgress: Math.round(parseFloat(stats.avgProgress || 0)),
          healthScore,
        };
      })
    );

    // Filter out domains with no projects
    const filteredPerformance = domainPerformance.filter(d => d.projectCount > 0);

    res.json({
      success: true,
      data: filteredPerformance,
    });
  } catch (error) {
    next(error);
  }
};
 
 
