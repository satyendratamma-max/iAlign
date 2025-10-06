import { Request, Response, NextFunction } from 'express';
import ProjectRequirement from '../models/ProjectRequirement';
import Project from '../models/Project';
import App from '../models/App';
import Technology from '../models/Technology';
import Role from '../models/Role';
import { ValidationError } from '../middleware/errorHandler';
import logger from '../config/logger';

export const getAllProjectRequirements = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.query;

    const whereClause: any = { isActive: true };
    if (projectId) {
      whereClause.projectId = parseInt(projectId as string);
    }

    const requirements = await ProjectRequirement.findAll({
      where: whereClause,
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'status'],
        },
        {
          model: App,
          as: 'app',
          attributes: ['id', 'name', 'code'],
        },
        {
          model: Technology,
          as: 'technology',
          attributes: ['id', 'name', 'code'],
        },
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'code', 'level'],
        },
      ],
      order: [
        ['priority', 'ASC'],
        ['isFulfilled', 'ASC'],
        ['createdDate', 'DESC'],
      ],
    });

    res.json({
      success: true,
      data: requirements,
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectRequirementById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const requirement = await ProjectRequirement.findByPk(id, {
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'status'],
        },
        {
          model: App,
          as: 'app',
          attributes: ['id', 'name', 'code'],
        },
        {
          model: Technology,
          as: 'technology',
          attributes: ['id', 'name', 'code'],
        },
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'code', 'level'],
        },
      ],
    });

    if (!requirement) {
      throw new ValidationError('Project requirement not found');
    }

    res.json({
      success: true,
      data: requirement,
    });
  } catch (error) {
    next(error);
  }
};

export const createProjectRequirement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requirementData = req.body;

    // Validate that project exists
    const project = await Project.findByPk(requirementData.projectId);
    if (!project) {
      throw new ValidationError('Project not found');
    }

    // Validate that app, technology, and role exist
    const [app, technology, role] = await Promise.all([
      App.findByPk(requirementData.appId),
      Technology.findByPk(requirementData.technologyId),
      Role.findByPk(requirementData.roleId),
    ]);

    if (!app) {
      throw new ValidationError('App not found');
    }
    if (!technology) {
      throw new ValidationError('Technology not found');
    }
    if (!role) {
      throw new ValidationError('Role not found');
    }

    // Validate cascade relationships
    if (technology.appId && technology.appId !== requirementData.appId) {
      throw new ValidationError(
        `Technology "${technology.name}" is specific to app ID ${technology.appId}, but you selected app ID ${requirementData.appId}`
      );
    }

    if (role.appId && role.appId !== requirementData.appId) {
      throw new ValidationError(
        `Role "${role.name}" is specific to app ID ${role.appId}, but you selected app ID ${requirementData.appId}`
      );
    }

    if (role.technologyId && role.technologyId !== requirementData.technologyId) {
      throw new ValidationError(
        `Role "${role.name}" is specific to technology ID ${role.technologyId}, but you selected technology ID ${requirementData.technologyId}`
      );
    }

    const requirement = await ProjectRequirement.create({
      ...requirementData,
      fulfilledCount: 0,
      isFulfilled: false,
      isActive: true,
    });

    logger.info(`Project requirement created: Project ${requirement.projectId} - ${app.name}/${technology.name}/${role.name}`);

    res.status(201).json({
      success: true,
      message: 'Project requirement created successfully',
      data: requirement,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProjectRequirement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const requirement = await ProjectRequirement.findByPk(id);

    if (!requirement) {
      throw new ValidationError('Project requirement not found');
    }

    // If changing app/tech/role, validate cascade
    if (updateData.appId || updateData.technologyId || updateData.roleId) {
      const appId = updateData.appId || requirement.appId;
      const technologyId = updateData.technologyId || requirement.technologyId;
      const roleId = updateData.roleId || requirement.roleId;

      const [technology, role] = await Promise.all([
        Technology.findByPk(technologyId),
        Role.findByPk(roleId),
      ]);

      if (technology && technology.appId && technology.appId !== appId) {
        throw new ValidationError('Technology does not belong to the selected app');
      }

      if (role && role.appId && role.appId !== appId) {
        throw new ValidationError('Role does not belong to the selected app');
      }

      if (role && role.technologyId && role.technologyId !== technologyId) {
        throw new ValidationError('Role does not belong to the selected technology');
      }
    }

    await requirement.update(updateData);

    logger.info(`Project requirement updated: ID ${requirement.id}`);

    res.json({
      success: true,
      message: 'Project requirement updated successfully',
      data: requirement,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProjectRequirement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const requirement = await ProjectRequirement.findByPk(id);

    if (!requirement) {
      throw new ValidationError('Project requirement not found');
    }

    await requirement.update({ isActive: false });

    logger.info(`Project requirement deleted: ID ${requirement.id}`);

    res.json({
      success: true,
      message: 'Project requirement deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectRequirementsByProjectId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.params;

    const requirements = await ProjectRequirement.findAll({
      where: {
        projectId: parseInt(projectId),
        isActive: true,
      },
      include: [
        {
          model: App,
          as: 'app',
          attributes: ['id', 'name', 'code'],
        },
        {
          model: Technology,
          as: 'technology',
          attributes: ['id', 'name', 'code'],
        },
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'code', 'level'],
        },
      ],
      order: [
        ['priority', 'ASC'],
        ['isFulfilled', 'ASC'],
      ],
    });

    res.json({
      success: true,
      data: requirements,
    });
  } catch (error) {
    next(error);
  }
};
