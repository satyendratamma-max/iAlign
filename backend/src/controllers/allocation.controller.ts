import { Request, Response } from 'express';
import { Op, literal } from 'sequelize';
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
import { notifyResourceAllocated, notifyResourceDeallocated, notifyResourceOverallocated } from '../services/notification.service';
import logger from '../config/logger';

// Helper function to check for resource over-allocation
const checkResourceOverAllocation = async (resourceId: number, allocationId?: number) => {
  try {
    // Get all active allocations for this resource
    const allocations = await ResourceAllocation.findAll({
      where: {
        resourceId,
        isActive: true,
        ...(allocationId && { id: { [Op.ne]: allocationId } }), // Exclude current allocation if updating
      },
      include: [
        {
          model: Resource,
          as: 'resource',
          attributes: ['firstName', 'lastName', 'employeeId', 'userId'],
        },
        {
          model: Project,
          as: 'project',
          attributes: ['name'],
        },
      ],
    });

    // Group allocations by date range and calculate total percentage
    const dateRanges: Map<string, { total: number; allocations: any[] }> = new Map();

    allocations.forEach((allocation: any) => {
      const start = allocation.startDate ? new Date(allocation.startDate) : null;
      const end = allocation.endDate ? new Date(allocation.endDate) : null;

      if (start && end) {
        const key = `${start.toISOString()}-${end.toISOString()}`;
        const existing = dateRanges.get(key) || { total: 0, allocations: [] };
        existing.total += allocation.allocationPercentage || 0;
        existing.allocations.push(allocation);
        dateRanges.set(key, existing);
      }
    });

    // Check if any date range exceeds 100%
    const overAllocations: any[] = [];
    dateRanges.forEach((data, _key) => {
      if (data.total > 100) {
        overAllocations.push(data);
      }
    });

    // If over-allocated, notify using new notification service
    if (overAllocations.length > 0 && allocations.length > 0) {
      const allocation: any = allocations[0];
      const resource = allocation.resource;
      const maxAllocation = Math.max(...overAllocations.map((o) => o.total));

      await notifyResourceOverallocated(resource, maxAllocation);
    }
  } catch (error) {
    logger.error('Failed to check resource over-allocation:', error);
  }
};

export const getAllAllocations = async (req: Request, res: Response) => {
  try {
    // PAGINATION SUPPORT - CRITICAL for 40K+ allocations
    const page = parseInt(req.query.page as string) || 1;
    // Allow up to 10000 for visualization views (timeline/kanban), default max 100 for table view
    const requestedLimit = parseInt(req.query.limit as string) || 50;
    const limit = Math.min(requestedLimit, 10000); // Max 10000 per page for visualization views
    const offset = (page - 1) * limit;

    const {
      projectId,
      resourceId,
      domainId,
      fiscalYear,
      scenarioId,
      allocationType,
      matchScore,
      resourceName,
      businessDecision,
    } = req.query;

    const where: any = { isActive: true };

    // Support multiple project IDs (comma-separated string or array)
    if (projectId) {
      const projectIds = Array.isArray(projectId)
        ? projectId.map((id: any) => parseInt(id))
        : projectId.toString().split(',').map((id: string) => parseInt(id.trim()));
      where.projectId = projectIds.length === 1 ? projectIds[0] : { [Op.in]: projectIds };
    }

    // Support multiple resource IDs (comma-separated string or array)
    if (resourceId) {
      const resourceIds = Array.isArray(resourceId)
        ? resourceId.map((id: any) => parseInt(id))
        : resourceId.toString().split(',').map((id: string) => parseInt(id.trim()));
      where.resourceId = resourceIds.length === 1 ? resourceIds[0] : { [Op.in]: resourceIds };
    }

    if (scenarioId) where.scenarioId = scenarioId;
    if (allocationType) where.allocationType = allocationType;

    // Server-side match score filtering
    if (matchScore) {
      if (matchScore === 'excellent') {
        where.matchScore = { [Op.gte]: 80 };
      } else if (matchScore === 'good') {
        where.matchScore = { [Op.between]: [60, 79] };
      } else if (matchScore === 'fair') {
        where.matchScore = { [Op.between]: [40, 59] };
      } else if (matchScore === 'poor') {
        where.matchScore = { [Op.lt]: 40 };
      }
    }

    // Build Resource include - Resources are shared across scenarios, no scenarioId filter needed
    // IMPORTANT: Removed capabilities from list view to prevent loading 200K+ capability records
    const resourceInclude: any = {
      model: Resource,
      as: 'resource',
      attributes: ['id', 'employeeId', 'firstName', 'lastName', 'email', 'primarySkill', 'domainId', 'utilizationRate'],
      where: {},
      include: [
        {
          model: Domain,
          as: 'domain',
          attributes: ['id', 'name'],
        },
        // Capabilities removed from list view - only available in detail view (getAllocationById)
        // This prevents loading ~200K records (40K allocations × 5 capabilities each)
      ],
    };

    // Server-side resource name filtering
    if (resourceName) {
      resourceInclude.where[Op.or] = [
        { firstName: { [Op.like]: `%${resourceName}%` } },
        { lastName: { [Op.like]: `%${resourceName}%` } },
        { employeeId: { [Op.like]: `%${resourceName}%` } },
      ];
    }

    // Server-side resource domain filtering removed - domain filter applies to projects only
    // This allows viewing cross-domain allocations (resources from other domains working on domain-specific projects)
    // If you want to filter by resource domain specifically, use resourceName or other resource filters

    // Build Project include - Projects are scenario-specific, filter by scenarioId
    const projectInclude: any = {
      model: Project,
      as: 'project',
      attributes: ['id', 'name', 'status', 'fiscalYear', 'domainId', 'businessDecision'],
      where: {},
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
      projectInclude.where.scenarioId = parseInt(scenarioId as string);
    }

    // Server-side project domain filtering
    if (domainId) {
      projectInclude.where.domainId = parseInt(domainId as string);
    }

    // Server-side fiscal year filtering
    if (fiscalYear) {
      projectInclude.where.fiscalYear = fiscalYear;
    }

    // Server-side business decision filtering
    if (businessDecision) {
      projectInclude.where.businessDecision = businessDecision;
    }

    const include: any[] = [
      resourceInclude,
      projectInclude,
      {
        model: ResourceCapability,
        as: 'resourceCapability',
        required: false,
        attributes: ['id'],
        // Removed nested includes for App, Technology, Role from list view
      },
      {
        model: ProjectRequirement,
        as: 'projectRequirement',
        required: false,
        attributes: ['id'],
        // Removed nested includes for App, Technology, Role from list view
      },
    ];

    const { count, rows: allocations } = await ResourceAllocation.findAndCountAll({
      where,
      include,
      limit,
      offset,
      order: [['startDate', 'DESC']],
    });

    res.json({
      success: true,
      data: allocations,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
        hasMore: page * limit < count,
      },
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
          include: [
            {
              model: Domain,
              as: 'domain',
              attributes: ['id', 'name'],
            },
            {
              model: ResourceCapability,
              as: 'capabilities',
              where: { isActive: true },
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
          ],
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

    // Validate scenarioId is provided (REQUIRED)
    if (!allocationData.scenarioId) {
      return res.status(400).json({
        success: false,
        message: 'scenarioId is required. All allocations must belong to a scenario.',
      });
    }

    // Validate resource employment dates
    if (allocationData.resourceId) {
      const resource = await Resource.findByPk(allocationData.resourceId);
      if (resource) {
        const allocationStart = allocationData.startDate ? new Date(allocationData.startDate) : null;
        const allocationEnd = allocationData.endDate ? new Date(allocationData.endDate) : null;

        // Check if allocation starts before joining date
        if (resource.joiningDate && allocationStart && allocationStart < new Date(resource.joiningDate)) {
          return res.status(400).json({
            success: false,
            message: `Cannot allocate resource before their joining date (${new Date(resource.joiningDate).toLocaleDateString()})`,
          });
        }

        // Check if allocation extends beyond end of service date
        if (resource.endOfServiceDate && allocationEnd && allocationEnd > new Date(resource.endOfServiceDate)) {
          return res.status(400).json({
            success: false,
            message: `Cannot allocate resource beyond their end of service date (${new Date(resource.endOfServiceDate).toLocaleDateString()})`,
          });
        }

        // Check if allocation starts after end of service date
        if (resource.endOfServiceDate && allocationStart && allocationStart > new Date(resource.endOfServiceDate)) {
          return res.status(400).json({
            success: false,
            message: `Cannot allocate resource after their end of service date (${new Date(resource.endOfServiceDate).toLocaleDateString()})`,
          });
        }
      }
    }

    // If resourceCapabilityId and projectRequirementId are provided, calculate match score and set roleOnProject
    if (allocationData.resourceCapabilityId && allocationData.projectRequirementId) {
      const capability = await ResourceCapability.findByPk(allocationData.resourceCapabilityId);
      const requirement = await ProjectRequirement.findByPk(allocationData.projectRequirementId, {
        include: [
          {
            model: Role,
            as: 'role',
            attributes: ['id', 'name', 'code', 'level'],
          },
        ],
      });

      if (capability && requirement) {
        allocationData.matchScore = calculateMatchScore(capability, requirement);

        // Automatically set roleOnProject from the project requirement
        if ((requirement as any).role) {
          const role = (requirement as any).role;
          const roleName = role.level ? `${role.name} (${role.level})` : role.name;
          allocationData.roleOnProject = roleName;
        }
      }
    }

    const allocation = await ResourceAllocation.create(allocationData);

    // Check for over-allocation and notify if needed
    if (allocation.resourceId) {
      await checkResourceOverAllocation(allocation.resourceId);
    }

    // Fetch full allocation details for notification
    const fullAllocation = await ResourceAllocation.findOne({
      where: { id: allocation.id },
      include: [
        {
          model: Resource,
          as: 'resource',
          include: [
            {
              model: Domain,
              as: 'domain',
              attributes: ['id', 'name'],
            },
            {
              model: ResourceCapability,
              as: 'capabilities',
              where: { isActive: true },
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
          ],
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

    // Notify stakeholders about the allocation
    try {
      if (fullAllocation) {
        const resource = (fullAllocation as any).resource;
        const project = (fullAllocation as any).project;
        if (resource && project) {
          await notifyResourceAllocated(fullAllocation, resource, project);
        }
      }
    } catch (notifError) {
      logger.error('Failed to send allocation notification:', notifError);
    }

    return res.status(201).json({
      success: true,
      data: fullAllocation,
      message: 'Allocation created successfully',
    });
  } catch (error: any) {
    return res.status(400).json({
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

    const updateData = req.body;

    // Prevent removing scenarioId (it's required)
    if (updateData.scenarioId === null || updateData.scenarioId === undefined || updateData.scenarioId === 0) {
      return res.status(400).json({
        success: false,
        message: 'scenarioId cannot be removed or set to null. All allocations must belong to a scenario.',
      });
    }

    // If projectRequirementId is being updated, automatically set roleOnProject from the requirement
    if (updateData.projectRequirementId && updateData.resourceCapabilityId) {
      const requirement = await ProjectRequirement.findByPk(updateData.projectRequirementId, {
        include: [
          {
            model: Role,
            as: 'role',
            attributes: ['id', 'name', 'code', 'level'],
          },
        ],
      });

      if (requirement && (requirement as any).role) {
        const role = (requirement as any).role;
        const roleName = role.level ? `${role.name} (${role.level})` : role.name;
        updateData.roleOnProject = roleName;

        // Recalculate match score if resourceCapabilityId is also provided
        const capability = await ResourceCapability.findByPk(updateData.resourceCapabilityId);
        if (capability) {
          updateData.matchScore = calculateMatchScore(capability, requirement);
        }
      }
    }

    // Validate resource employment dates if dates are being updated
    if (updateData.startDate || updateData.endDate || updateData.resourceId) {
      const resourceId = updateData.resourceId || allocation.resourceId;
      const resource = await Resource.findByPk(resourceId);

      if (resource) {
        const allocationStart = updateData.startDate ? new Date(updateData.startDate) :
                               (allocation.startDate ? new Date(allocation.startDate) : null);
        const allocationEnd = updateData.endDate ? new Date(updateData.endDate) :
                             (allocation.endDate ? new Date(allocation.endDate) : null);

        // Check if allocation starts before joining date
        if (resource.joiningDate && allocationStart && allocationStart < new Date(resource.joiningDate)) {
          return res.status(400).json({
            success: false,
            message: `Cannot allocate resource before their joining date (${new Date(resource.joiningDate).toLocaleDateString()})`,
          });
        }

        // Check if allocation extends beyond end of service date
        if (resource.endOfServiceDate && allocationEnd && allocationEnd > new Date(resource.endOfServiceDate)) {
          return res.status(400).json({
            success: false,
            message: `Cannot allocate resource beyond their end of service date (${new Date(resource.endOfServiceDate).toLocaleDateString()})`,
          });
        }

        // Check if allocation starts after end of service date
        if (resource.endOfServiceDate && allocationStart && allocationStart > new Date(resource.endOfServiceDate)) {
          return res.status(400).json({
            success: false,
            message: `Cannot allocate resource after their end of service date (${new Date(resource.endOfServiceDate).toLocaleDateString()})`,
          });
        }
      }
    }

    await allocation.update(updateData);

    // Check for over-allocation and notify if needed
    if (allocation.resourceId) {
      await checkResourceOverAllocation(allocation.resourceId, allocation.id);
    }

    const updatedAllocation = await ResourceAllocation.findOne({
      where: { id },
      include: [
        {
          model: Resource,
          as: 'resource',
          include: [
            {
              model: Domain,
              as: 'domain',
              attributes: ['id', 'name'],
            },
            {
              model: ResourceCapability,
              as: 'capabilities',
              where: { isActive: true },
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
          ],
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
      include: [
        {
          model: Resource,
          as: 'resource',
          attributes: ['id', 'firstName', 'lastName', 'userId'],
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'projectManagerId'],
        },
      ],
    });

    if (!allocation) {
      return res.status(404).json({
        success: false,
        message: 'Allocation not found',
      });
    }

    // Notify stakeholders about the deallocation
    try {
      const resource = (allocation as any).resource;
      const project = (allocation as any).project;
      if (resource && project) {
        await notifyResourceDeallocated(resource, project);
      }
    } catch (notifError) {
      logger.error('Failed to send deallocation notification:', notifError);
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
          attributes: ['id', 'employeeId', 'firstName', 'lastName', 'email', 'primarySkill', 'domainId', 'utilizationRate'],
          include: [
            {
              model: Domain,
              as: 'domain',
              attributes: ['id', 'name'],
            },
            {
              model: ResourceCapability,
              as: 'capabilities',
              where: { isActive: true },
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
          ],
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

// Get allocation summary/KPIs with same filters as getAllAllocations
export const getAllocationSummary = async (req: Request, res: Response) => {
  try {
    const {
      projectId,
      resourceId,
      domainId,
      fiscalYear,
      scenarioId,
      allocationType,
      matchScore,
      resourceName,
      businessDecision,
    } = req.query;

    const where: any = { isActive: true };

    // Support multiple project IDs (comma-separated string or array)
    if (projectId) {
      const projectIds = Array.isArray(projectId)
        ? projectId.map((id: any) => parseInt(id))
        : projectId.toString().split(',').map((id: string) => parseInt(id.trim()));
      where.projectId = projectIds.length === 1 ? projectIds[0] : { [Op.in]: projectIds };
    }

    // Support multiple resource IDs (comma-separated string or array)
    if (resourceId) {
      const resourceIds = Array.isArray(resourceId)
        ? resourceId.map((id: any) => parseInt(id))
        : resourceId.toString().split(',').map((id: string) => parseInt(id.trim()));
      where.resourceId = resourceIds.length === 1 ? resourceIds[0] : { [Op.in]: resourceIds };
    }

    if (scenarioId) where.scenarioId = scenarioId;
    if (allocationType) where.allocationType = allocationType;

    // Server-side match score filtering
    if (matchScore) {
      if (matchScore === 'excellent') {
        where.matchScore = { [Op.gte]: 80 };
      } else if (matchScore === 'good') {
        where.matchScore = { [Op.between]: [60, 79] };
      } else if (matchScore === 'fair') {
        where.matchScore = { [Op.between]: [40, 59] };
      } else if (matchScore === 'poor') {
        where.matchScore = { [Op.lt]: 40 };
      }
    }

    // Build Resource include with same filters as getAllAllocations
    const resourceInclude: any = {
      model: Resource,
      as: 'resource',
      attributes: ['id', 'employeeId', 'firstName', 'lastName', 'domainId'],
      where: {},
      required: true,
    };

    if (resourceName) {
      resourceInclude.where[Op.or] = [
        { firstName: { [Op.like]: `%${resourceName}%` } },
        { lastName: { [Op.like]: `%${resourceName}%` } },
        { employeeId: { [Op.like]: `%${resourceName}%` } },
      ];
    }

    if (domainId && !fiscalYear && !businessDecision) {
      resourceInclude.where.domainId = parseInt(domainId as string);
    }

    // Build Project include with same filters as getAllAllocations
    const projectInclude: any = {
      model: Project,
      as: 'project',
      attributes: ['id', 'scenarioId', 'domainId', 'fiscalYear', 'businessDecision'],
      where: {},
      required: true,
    };

    if (scenarioId) {
      projectInclude.where.scenarioId = parseInt(scenarioId as string);
    }

    if (domainId) {
      projectInclude.where.domainId = parseInt(domainId as string);
    }

    if (fiscalYear) {
      projectInclude.where.fiscalYear = fiscalYear;
    }

    if (businessDecision) {
      projectInclude.where.businessDecision = businessDecision;
    }

    const include: any[] = [resourceInclude, projectInclude];

    // Get all matching allocations (without pagination) for summary calculations
    const allAllocations = await ResourceAllocation.findAll({
      where,
      include,
      attributes: ['id', 'resourceId', 'allocationPercentage', 'matchScore', 'startDate', 'endDate'],
    });

    // Calculate KPIs
    const totalAllocations = allAllocations.length;

    // Calculate over-allocated resources (resources with total allocation > 100%)
    const resourceAllocationMap = new Map<number, number[]>();
    allAllocations.forEach((allocation: any) => {
      const resourceId = allocation.resourceId;
      if (!resourceAllocationMap.has(resourceId)) {
        resourceAllocationMap.set(resourceId, []);
      }
      resourceAllocationMap.get(resourceId)!.push({
        allocationPercentage: allocation.allocationPercentage || 0,
        startDate: allocation.startDate,
        endDate: allocation.endDate,
      } as any);
    });

    let overAllocatedCount = 0;
    resourceAllocationMap.forEach((allocations, _resourceId) => {
      // Calculate max concurrent allocation for this resource
      const maxConcurrent = calculateMaxConcurrentAllocationBackend(allocations);
      if (maxConcurrent > 100) {
        overAllocatedCount++;
      }
    });

    // Calculate poor match allocations (matchScore < 60)
    const poorMatchCount = allAllocations.filter((a: any) => a.matchScore && a.matchScore < 60).length;

    // Calculate average match score
    const allocationsWithScores = allAllocations.filter((a: any) => a.matchScore);
    const avgMatchScore = allocationsWithScores.length > 0
      ? allocationsWithScores.reduce((sum: number, a: any) => sum + a.matchScore, 0) / allocationsWithScores.length
      : 0;

    res.json({
      success: true,
      data: {
        totalAllocations,
        overAllocatedResources: overAllocatedCount,
        poorMatchAllocations: poorMatchCount,
        avgMatchScore: Math.round(avgMatchScore * 10) / 10, // Round to 1 decimal
      },
    });
  } catch (error: any) {
    logger.error('Error fetching allocation summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching allocation summary',
      error: error.message,
    });
  }
};

// Helper function to calculate max concurrent allocation
function calculateMaxConcurrentAllocationBackend(allocations: any[]): number {
  if (allocations.length === 0) return 0;

  // Group by overlapping date ranges
  const timePoints: { date: Date; delta: number }[] = [];
  allocations.forEach((allocation) => {
    if (allocation.startDate && allocation.endDate) {
      timePoints.push({ date: new Date(allocation.startDate), delta: allocation.allocationPercentage });
      timePoints.push({ date: new Date(allocation.endDate), delta: -allocation.allocationPercentage });
    }
  });

  // Sort by date
  timePoints.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Calculate max concurrent
  let current = 0;
  let max = 0;
  timePoints.forEach((point) => {
    current += point.delta;
    max = Math.max(max, current);
  });

  return max;
}

// MEMORY OPTIMIZATION: Server-side aggregation for dashboard metrics
export const getDashboardMetrics = async (req: Request, res: Response) => {
  try {
    const { scenarioId } = req.query;
    const where: any = { isActive: true };

    if (scenarioId) {
      where.scenarioId = scenarioId;
    }

    // Get counts and aggregations
    const [allocationCount, allocationStats] = await Promise.all([
      ResourceAllocation.count({ where }),
      ResourceAllocation.findAll({
        where,
        attributes: [
          [literal('COUNT(*)'), 'totalAllocations'],
          [literal('SUM(COALESCE(allocationPercentage, 0))'), 'totalAllocationPercentage'],
          [literal('AVG(COALESCE(allocationPercentage, 0))'), 'averageAllocationPercentage'],
          [literal('SUM(CASE WHEN allocationPercentage >= 80 THEN 1 ELSE 0 END)'), 'highUtilization'],
        ],
        raw: true,
      }),
    ]);

    const stats = allocationStats[0] as any;

    res.json({
      success: true,
      data: {
        totalAllocations: allocationCount,
        totalAllocationPercentage: parseFloat(stats.totalAllocationPercentage || 0),
        averageAllocationPercentage: parseFloat(stats.averageAllocationPercentage || 0),
        highUtilization: parseInt(stats.highUtilization || 0),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching allocation metrics',
      error: error.message,
    });
  }
};

