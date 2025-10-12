import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import Scenario from '../models/Scenario';
import Project from '../models/Project';
import Resource from '../models/Resource';
import Milestone from '../models/Milestone';
import ProjectDependency from '../models/ProjectDependency';
import ResourceAllocation from '../models/ResourceAllocation';
import User from '../models/User';
import { ValidationError, ForbiddenError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import logger from '../config/logger';
import sequelize from '../config/database';

// Get all scenarios based on user role
export const getAllScenarios = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      throw new ValidationError('User not authenticated');
    }

    let scenarios;

    // Admin and Domain Manager can see all scenarios
    if (user.role === 'Administrator' || user.role === 'Domain Manager') {
      scenarios = await Scenario.findAll({
        where: { isActive: true },
        order: [['createdDate', 'DESC']],
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName', 'email'],
          },
          {
            model: User,
            as: 'publisher',
            attributes: ['id', 'firstName', 'lastName', 'email'],
          },
        ],
      });
    } else {
      // Regular users see all published scenarios + their own planned scenarios
      scenarios = await Scenario.findAll({
        where: {
          isActive: true,
          [Op.or]: [
            { status: 'published' },
            { createdBy: user.id, status: 'planned' },
          ],
        },
        order: [['createdDate', 'DESC']],
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName', 'email'],
          },
          {
            model: User,
            as: 'publisher',
            attributes: ['id', 'firstName', 'lastName', 'email'],
          },
        ],
      });
    }

    res.json({
      success: true,
      data: scenarios,
    });
  } catch (error) {
    next(error);
  }
};

// Get scenario by ID with permission check
export const getScenarioById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      throw new ValidationError('User not authenticated');
    }

    const { id } = req.params;

    const scenario = await Scenario.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
        {
          model: User,
          as: 'publisher',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    if (!scenario) {
      throw new ValidationError('Scenario not found');
    }

    // Check permission
    const canAccess =
      scenario.status === 'published' ||
      scenario.createdBy === user.id ||
      user.role === 'Administrator' ||
      user.role === 'Domain Manager';

    if (!canAccess) {
      throw new ForbiddenError('You do not have permission to access this scenario');
    }

    res.json({
      success: true,
      data: scenario,
    });
  } catch (error) {
    next(error);
  }
};

// Create new scenario
export const createScenario = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      throw new ValidationError('User not authenticated');
    }

    const { name, description, segmentFunctionId, metadata } = req.body;

    // Check if user has reached the limit of 2 planned scenarios
    const userPlannedScenarios = await Scenario.count({
      where: {
        createdBy: user.id,
        status: 'planned',
        isActive: true,
      },
    });

    if (userPlannedScenarios >= 2) {
      throw new ValidationError(
        'You have reached the maximum limit of 2 planned scenarios. Please delete or publish an existing scenario before creating a new one.'
      );
    }

    const scenario = await Scenario.create({
      name,
      description,
      status: 'planned',
      createdBy: user.id,
      segmentFunctionId,
      metadata,
      isActive: true,
    });

    logger.info(`Scenario created: ${scenario.name} by user ${user.id}`);

    res.status(201).json({
      success: true,
      message: 'Scenario created successfully',
      data: scenario,
    });
  } catch (error) {
    next(error);
  }
};

// Clone scenario from existing scenario
export const cloneScenario = async (req: Request, res: Response, next: NextFunction) => {
  const transaction = await sequelize.transaction();

  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      throw new ValidationError('User not authenticated');
    }

    const { id } = req.params;
    const { name, description } = req.body;

    // Check if user has reached the limit of 2 planned scenarios
    const userPlannedScenarios = await Scenario.count({
      where: {
        createdBy: user.id,
        status: 'planned',
        isActive: true,
      },
    });

    if (userPlannedScenarios >= 2) {
      throw new ValidationError(
        'You have reached the maximum limit of 2 planned scenarios. Please delete or publish an existing scenario before creating a new one.'
      );
    }

    // Get source scenario
    const sourceScenario = await Scenario.findByPk(id);
    if (!sourceScenario) {
      throw new ValidationError('Source scenario not found');
    }

    // Check permission to access source scenario
    const canAccess =
      sourceScenario.status === 'published' ||
      sourceScenario.createdBy === user.id ||
      user.role === 'Administrator' ||
      user.role === 'Domain Manager';

    if (!canAccess) {
      throw new ForbiddenError('You do not have permission to clone this scenario');
    }

    // Create new scenario
    const newScenario = await Scenario.create(
      {
        name: name || `${sourceScenario.name} (Copy)`,
        description: description || sourceScenario.description,
        status: 'planned',
        createdBy: user.id,
        parentScenarioId: sourceScenario.id,
        segmentFunctionId: sourceScenario.segmentFunctionId,
        metadata: sourceScenario.metadata,
        isActive: true,
      },
      { transaction }
    );

    // Clone all projects from source scenario
    const sourceProjects = await Project.findAll({
      where: { scenarioId: sourceScenario.id, isActive: true },
    });

    const projectIdMap = new Map<number, number>();

    // Get the highest project number to generate unique numbers for cloned projects
    const maxProjectNumber = await Project.max('projectNumber', {
      where: { scenarioId: newScenario.id },
    });
    let projectCounter = maxProjectNumber ? parseInt(maxProjectNumber.toString().replace(/\D/g, '')) || 0 : 0;

    for (const sourceProject of sourceProjects) {
      const projectData = sourceProject.toJSON();
      delete projectData.id;
      delete projectData.createdDate;
      delete projectData.modifiedDate;

      // Generate new unique project number for the cloned project
      projectCounter++;
      const newProjectNumber = `PROJ-${String(projectCounter).padStart(3, '0')}`;

      const newProject = await Project.create(
        {
          ...projectData,
          scenarioId: newScenario.id,
          projectNumber: newProjectNumber,
        },
        { transaction }
      );

      projectIdMap.set(sourceProject.id, newProject.id);
    }

    // Clone all resources from source scenario
    const sourceResources = await Resource.findAll({
      where: { scenarioId: sourceScenario.id, isActive: true },
    });

    for (const sourceResource of sourceResources) {
      const resourceData = sourceResource.toJSON() as any;
      delete resourceData.id;
      delete resourceData.createdDate;

      await Resource.create(
        {
          ...resourceData,
          scenarioId: newScenario.id,
        },
        { transaction }
      );
    }

    // Clone all milestones from source scenario
    const sourceMilestones = await Milestone.findAll({
      where: { scenarioId: sourceScenario.id, isActive: true },
    });

    const milestoneIdMap = new Map<number, number>();

    for (const sourceMilestone of sourceMilestones) {
      const milestoneData = sourceMilestone.toJSON();
      delete milestoneData.id;
      delete milestoneData.createdDate;
      delete milestoneData.modifiedDate;

      // Map old project ID to new project ID
      const newProjectId = projectIdMap.get(sourceMilestone.projectId);

      const newMilestone = await Milestone.create(
        {
          ...milestoneData,
          scenarioId: newScenario.id,
          projectId: newProjectId || milestoneData.projectId,
        },
        { transaction }
      );

      milestoneIdMap.set(sourceMilestone.id, newMilestone.id);
    }

    // Clone all project dependencies from source scenario
    const sourceDependencies = await ProjectDependency.findAll({
      where: { scenarioId: sourceScenario.id, isActive: true },
    });

    for (const sourceDependency of sourceDependencies) {
      const depData = sourceDependency.toJSON();
      delete depData.id;
      delete depData.createdDate;

      // Map old IDs to new IDs
      let newPredecessorId = depData.predecessorId;
      let newSuccessorId = depData.successorId;

      if (depData.predecessorType === 'project') {
        newPredecessorId = projectIdMap.get(depData.predecessorId) || depData.predecessorId;
      } else if (depData.predecessorType === 'milestone') {
        newPredecessorId = milestoneIdMap.get(depData.predecessorId) || depData.predecessorId;
      }

      if (depData.successorType === 'project') {
        newSuccessorId = projectIdMap.get(depData.successorId) || depData.successorId;
      } else if (depData.successorType === 'milestone') {
        newSuccessorId = milestoneIdMap.get(depData.successorId) || depData.successorId;
      }

      await ProjectDependency.create(
        {
          ...depData,
          scenarioId: newScenario.id,
          predecessorId: newPredecessorId,
          successorId: newSuccessorId,
        },
        { transaction }
      );
    }

    // Clone all resource allocations from source scenario
    const sourceAllocations = await ResourceAllocation.findAll({
      where: { scenarioId: sourceScenario.id, isActive: true },
    });

    for (const sourceAllocation of sourceAllocations) {
      const allocationData = sourceAllocation.toJSON() as any;
      delete allocationData.id;
      delete allocationData.createdDate;
      delete allocationData.modifiedDate;

      // Map old project ID to new project ID
      const newProjectId = projectIdMap.get(sourceAllocation.projectId);

      // Map old milestone ID to new milestone ID if present
      const newMilestoneId = sourceAllocation.milestoneId
        ? milestoneIdMap.get(sourceAllocation.milestoneId)
        : undefined;

      await ResourceAllocation.create(
        {
          ...allocationData,
          scenarioId: newScenario.id,
          projectId: newProjectId || allocationData.projectId,
          milestoneId: newMilestoneId || allocationData.milestoneId,
        },
        { transaction }
      );
    }

    await transaction.commit();

    logger.info(
      `Scenario cloned: ${newScenario.name} from ${sourceScenario.name} by user ${user.id}`
    );

    res.status(201).json({
      success: true,
      message: 'Scenario cloned successfully',
      data: newScenario,
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

// Update scenario
export const updateScenario = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      throw new ValidationError('User not authenticated');
    }

    const { id } = req.params;
    const { name, description, metadata } = req.body;

    const scenario = await Scenario.findByPk(id);

    if (!scenario) {
      throw new ValidationError('Scenario not found');
    }

    // Check permission to update
    const canUpdate =
      scenario.createdBy === user.id ||
      user.role === 'Administrator' ||
      user.role === 'Domain Manager';

    if (!canUpdate) {
      throw new ForbiddenError('You do not have permission to update this scenario');
    }

    // Cannot update published scenarios
    if (scenario.status === 'published') {
      throw new ValidationError('Cannot update a published scenario');
    }

    await scenario.update({
      name: name || scenario.name,
      description: description !== undefined ? description : scenario.description,
      metadata: metadata !== undefined ? metadata : scenario.metadata,
    });

    logger.info(`Scenario updated: ${scenario.name} by user ${user.id}`);

    res.json({
      success: true,
      message: 'Scenario updated successfully',
      data: scenario,
    });
  } catch (error) {
    next(error);
  }
};

// Publish scenario (Admin and Domain Manager only)
export const publishScenario = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      throw new ValidationError('User not authenticated');
    }

    // Only Admin and Domain Manager can publish
    if (user.role !== 'Administrator' && user.role !== 'Domain Manager') {
      throw new ForbiddenError('Only administrators and domain managers can publish scenarios');
    }

    const { id } = req.params;

    const scenario = await Scenario.findByPk(id);

    if (!scenario) {
      throw new ValidationError('Scenario not found');
    }

    if (scenario.status === 'published') {
      throw new ValidationError('Scenario is already published');
    }

    await scenario.update({
      status: 'published',
      publishedBy: user.id,
      publishedDate: new Date(),
    });

    logger.info(`Scenario published: ${scenario.name} by user ${user.id}`);

    res.json({
      success: true,
      message: 'Scenario published successfully',
      data: scenario,
    });
  } catch (error) {
    next(error);
  }
};

// Delete scenario (soft delete, only planned scenarios)
export const deleteScenario = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      throw new ValidationError('User not authenticated');
    }

    const { id } = req.params;

    const scenario = await Scenario.findByPk(id);

    if (!scenario) {
      throw new ValidationError('Scenario not found');
    }

    // Check permission to delete
    const canDelete =
      scenario.createdBy === user.id ||
      user.role === 'Administrator' ||
      user.role === 'Domain Manager';

    if (!canDelete) {
      throw new ForbiddenError('You do not have permission to delete this scenario');
    }

    // Can only delete planned scenarios
    if (scenario.status === 'published') {
      throw new ValidationError('Cannot delete a published scenario');
    }

    await scenario.update({ isActive: false });

    logger.info(`Scenario deleted: ${scenario.name} by user ${user.id}`);

    res.json({
      success: true,
      message: 'Scenario deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Get scenario statistics
export const getScenarioStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      throw new ValidationError('User not authenticated');
    }

    const { id } = req.params;

    const scenario = await Scenario.findByPk(id);

    if (!scenario) {
      throw new ValidationError('Scenario not found');
    }

    // Check permission
    const canAccess =
      scenario.status === 'published' ||
      scenario.createdBy === user.id ||
      user.role === 'Administrator' ||
      user.role === 'Domain Manager';

    if (!canAccess) {
      throw new ForbiddenError('You do not have permission to access this scenario');
    }

    const projectCount = await Project.count({
      where: { scenarioId: scenario.id, isActive: true },
    });

    const resourceCount = await Resource.count({
      where: { scenarioId: scenario.id, isActive: true },
    });

    const milestoneCount = await Milestone.count({
      where: { scenarioId: scenario.id, isActive: true },
    });

    const dependencyCount = await ProjectDependency.count({
      where: { scenarioId: scenario.id, isActive: true },
    });

    res.json({
      success: true,
      data: {
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        status: scenario.status,
        projectCount,
        resourceCount,
        milestoneCount,
        dependencyCount,
      },
    });
  } catch (error) {
    next(error);
  }
};
