import { Request, Response, NextFunction } from 'express';
import DefaultRequirement from '../models/DefaultRequirement';
import App from '../models/App';
import Technology from '../models/Technology';
import Role from '../models/Role';
import { ValidationError } from '../middleware/errorHandler';
import logger from '../config/logger';

export const getAllDefaultRequirements = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const requirements = await DefaultRequirement.findAll({
      where: { isActive: true },
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
      order: [['displayOrder', 'ASC']],
    });

    res.json({
      success: true,
      data: requirements,
    });
  } catch (error) {
    next(error);
  }
};

export const getDefaultRequirementById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const requirement = await DefaultRequirement.findByPk(id, {
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
    });

    if (!requirement) {
      throw new ValidationError('Default requirement not found');
    }

    res.json({
      success: true,
      data: requirement,
    });
  } catch (error) {
    next(error);
  }
};

export const createDefaultRequirement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requirementData = req.body;

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

    // Set display order to max + 1 if not provided
    if (!requirementData.displayOrder && requirementData.displayOrder !== 0) {
      const maxOrder = await DefaultRequirement.max('displayOrder', {
        where: { isActive: true },
      }) as number | null;
      requirementData.displayOrder = (maxOrder || 0) + 1;
    }

    const requirement = await DefaultRequirement.create({
      ...requirementData,
      isActive: true,
    });

    logger.info(`Default requirement created: ${app.name}/${technology.name}/${role.name}`);

    res.status(201).json({
      success: true,
      message: 'Default requirement created successfully',
      data: requirement,
    });
  } catch (error) {
    next(error);
  }
};

export const updateDefaultRequirement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const requirement = await DefaultRequirement.findByPk(id);

    if (!requirement) {
      throw new ValidationError('Default requirement not found');
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

    logger.info(`Default requirement updated: ID ${requirement.id}`);

    res.json({
      success: true,
      message: 'Default requirement updated successfully',
      data: requirement,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDefaultRequirement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const requirement = await DefaultRequirement.findByPk(id);

    if (!requirement) {
      throw new ValidationError('Default requirement not found');
    }

    await requirement.update({ isActive: false });

    logger.info(`Default requirement deleted: ID ${requirement.id}`);

    res.json({
      success: true,
      message: 'Default requirement deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const reorderDefaultRequirements = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { requirements } = req.body; // Array of { id, displayOrder }

    if (!Array.isArray(requirements)) {
      throw new ValidationError('Requirements must be an array');
    }

    // Update all requirements in a transaction-like manner
    await Promise.all(
      requirements.map(async (item: { id: number; displayOrder: number }) => {
        const requirement = await DefaultRequirement.findByPk(item.id);
        if (requirement) {
          await requirement.update({ displayOrder: item.displayOrder });
        }
      })
    );

    logger.info(`Default requirements reordered: ${requirements.length} items`);

    res.json({
      success: true,
      message: 'Default requirements reordered successfully',
    });
  } catch (error) {
    next(error);
  }
};
