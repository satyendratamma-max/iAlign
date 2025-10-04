import { Request, Response } from 'express';
import ResourceAllocation from '../models/ResourceAllocation';
import Resource from '../models/Resource';
import Project from '../models/Project';
import Team from '../models/Team';
import Milestone from '../models/Milestone';

export const getAllAllocations = async (req: Request, res: Response) => {
  try {
    const { projectId, resourceId, domainId, fiscalYear } = req.query;

    const where: any = { isActive: true };

    if (projectId) where.projectId = projectId;
    if (resourceId) where.resourceId = resourceId;

    const include: any[] = [
      {
        model: Resource,
        as: 'resource',
        attributes: ['id', 'employeeId', 'firstName', 'lastName', 'primarySkill'],
      },
      {
        model: Project,
        as: 'project',
        attributes: ['id', 'name', 'status', 'fiscalYear', 'domainId'],
      },
      {
        model: Team,
        as: 'domainTeam',
        attributes: ['id', 'name', 'skillType'],
      },
    ];

    let allocations = await ResourceAllocation.findAll({
      where,
      include,
      order: [['startDate', 'DESC']],
    });

    // Filter by domainId or fiscalYear if provided
    if (domainId) {
      allocations = allocations.filter((a: any) => a.project?.domainId === parseInt(domainId as string));
    }

    if (fiscalYear) {
      allocations = allocations.filter((a: any) => a.project?.fiscalYear === fiscalYear);
    }

    res.json({
      success: true,
      data: allocations,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching allocations',
      error: error.message,
    });
  }
};

export const getAllocationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const allocation = await ResourceAllocation.findOne({
      where: { id, isActive: true },
      include: [
        {
          model: Resource,
          as: 'resource',
        },
        {
          model: Project,
          as: 'project',
        },
        {
          model: Team,
          as: 'domainTeam',
        },
        {
          model: Milestone,
          as: 'milestone',
        },
      ],
    });

    if (!allocation) {
      return res.status(404).json({
        success: false,
        message: 'Allocation not found',
      });
    }

    return res.json({
      success: true,
      data: allocation,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching allocation',
      error: error.message,
    });
  }
};

export const createAllocation = async (req: Request, res: Response) => {
  try {
    const allocation = await ResourceAllocation.create(req.body);

    const fullAllocation = await ResourceAllocation.findOne({
      where: { id: allocation.id },
      include: [
        {
          model: Resource,
          as: 'resource',
        },
        {
          model: Project,
          as: 'project',
        },
        {
          model: Team,
          as: 'domainTeam',
        },
      ],
    });

    res.status(201).json({
      success: true,
      data: fullAllocation,
      message: 'Allocation created successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: 'Error creating allocation',
      error: error.message,
    });
  }
};

export const updateAllocation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const allocation = await ResourceAllocation.findOne({
      where: { id, isActive: true },
    });

    if (!allocation) {
      return res.status(404).json({
        success: false,
        message: 'Allocation not found',
      });
    }

    await allocation.update(req.body);

    const updatedAllocation = await ResourceAllocation.findOne({
      where: { id },
      include: [
        {
          model: Resource,
          as: 'resource',
        },
        {
          model: Project,
          as: 'project',
        },
        {
          model: Team,
          as: 'domainTeam',
        },
      ],
    });

    return res.json({
      success: true,
      data: updatedAllocation,
      message: 'Allocation updated successfully',
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: 'Error updating allocation',
      error: error.message,
    });
  }
};

export const deleteAllocation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const allocation = await ResourceAllocation.findOne({
      where: { id, isActive: true },
    });

    if (!allocation) {
      return res.status(404).json({
        success: false,
        message: 'Allocation not found',
      });
    }

    // Soft delete
    await allocation.update({ isActive: false });

    return res.json({
      success: true,
      message: 'Allocation deleted successfully',
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Error deleting allocation',
      error: error.message,
    });
  }
};

export const getResourceAllocations = async (req: Request, res: Response) => {
  try {
    const { resourceId } = req.params;

    const allocations = await ResourceAllocation.findAll({
      where: { resourceId, isActive: true },
      include: [
        {
          model: Project,
          as: 'project',
        },
        {
          model: Team,
          as: 'domainTeam',
        },
      ],
      order: [['startDate', 'DESC']],
    });

    res.json({
      success: true,
      data: allocations,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching resource allocations',
      error: error.message,
    });
  }
};

export const getProjectAllocations = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const allocations = await ResourceAllocation.findAll({
      where: { projectId, isActive: true },
      include: [
        {
          model: Resource,
          as: 'resource',
        },
        {
          model: Team,
          as: 'domainTeam',
        },
      ],
      order: [['startDate', 'ASC']],
    });

    res.json({
      success: true,
      data: allocations,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching project allocations',
      error: error.message,
    });
  }
};
