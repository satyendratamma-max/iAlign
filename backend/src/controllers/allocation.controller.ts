import { Request, Response } from 'express';
import ResourceAllocation from '../models/ResourceAllocation';
import Resource from '../models/Resource';
import Project from '../models/Project';
import Milestone from '../models/Milestone';
import ResourceCapability from '../models/ResourceCapability';
import ProjectRequirement from '../models/ProjectRequirement';
import App from '../models/App';
import Technology from '../models/Technology';
import Role from '../models/Role';
import Domain from '../models/Domain';
import { calculateMatchScore } from '../utils/resourceMatcher';

export const getAllAllocations = async (req: Request, res: Response) => {
  try {
    const { projectId, resourceId, domainId, fiscalYear, scenarioId } = req.query;

    const where: any = { isActive: true };

    if (projectId) where.projectId = projectId;
    if (resourceId) where.resourceId = resourceId;
    if (scenarioId) where.scenarioId = scenarioId;

    // Build Resource include - Resources are shared across scenarios, no scenarioId filter needed
    const resourceInclude: any = {
      model: Resource,
      as: 'resource',
      attributes: ['id', 'employeeId', 'firstName', 'lastName', 'email', 'primarySkill', 'domainId'],
      include: [
        {
          model: Domain,
          as: 'domain',
          attributes: ['id', 'name'],
        },
      ],
    };

    // Build Project include - Projects are scenario-specific, filter by scenarioId
    const projectInclude: any = {
      model: Project,
      as: 'project',
      attributes: ['id', 'name', 'status', 'fiscalYear', 'domainId', 'businessDecision'],
      include: [
        {
          model: Domain,
          as: 'domain',
          attributes: ['id', 'name'],
        },
      ],
    };

    // Add scenarioId filter to Project where clause if provided
    if (scenarioId) {
      projectInclude.where = { scenarioId: parseInt(scenarioId as string) };
    }

    const include: any[] = [
      resourceInclude,
      projectInclude,
      {
        model: ResourceCapability,
        as: 'resourceCapability',
        required: false,
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
      },
      {
        model: ProjectRequirement,
        as: 'projectRequirement',
        required: false,
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
          model: ResourceCapability,
          as: 'resourceCapability',
          required: false,
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
        },
        {
          model: ProjectRequirement,
          as: 'projectRequirement',
          required: false,
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
    const allocationData = req.body;

    // If resourceCapabilityId and projectRequirementId are provided, calculate match score
    if (allocationData.resourceCapabilityId && allocationData.projectRequirementId) {
      const capability = await ResourceCapability.findByPk(allocationData.resourceCapabilityId);
      const requirement = await ProjectRequirement.findByPk(allocationData.projectRequirementId);

      if (capability && requirement) {
        allocationData.matchScore = calculateMatchScore(capability, requirement);
      }
    }

    const allocation = await ResourceAllocation.create(allocationData);

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
          model: ResourceCapability,
          as: 'resourceCapability',
          required: false,
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
        },
        {
          model: ProjectRequirement,
          as: 'projectRequirement',
          required: false,
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
          model: ResourceCapability,
          as: 'resourceCapability',
          required: false,
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
        },
        {
          model: ProjectRequirement,
          as: 'projectRequirement',
          required: false,
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
          model: ResourceCapability,
          as: 'resourceCapability',
          required: false,
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
        },
        {
          model: ProjectRequirement,
          as: 'projectRequirement',
          required: false,
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
          model: ResourceCapability,
          as: 'resourceCapability',
          required: false,
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
        },
        {
          model: ProjectRequirement,
          as: 'projectRequirement',
          required: false,
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
