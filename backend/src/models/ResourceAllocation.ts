import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

export interface ResourceAllocationAttributes {
  id?: number;
  scenarioId?: number;
  projectId: number;
  resourceId: number;
  milestoneId?: number;
  resourceCapabilityId?: number;
  projectRequirementId?: number;
  allocationType: string;
  allocationPercentage: number;
  allocatedHours?: number;
  matchScore?: number;
  startDate?: Date;
  endDate?: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  billableRate?: number;
  cost?: number;
  roleOnProject?: string;
  createdDate?: Date;
  modifiedDate?: Date;
  isActive?: boolean;
}

class ResourceAllocation extends Model<ResourceAllocationAttributes> implements ResourceAllocationAttributes {
  declare id: number;
  declare scenarioId?: number;
  declare projectId: number;
  declare resourceId: number;
  declare milestoneId?: number;
  declare resourceCapabilityId?: number;
  declare projectRequirementId?: number;
  declare allocationType: string;
  declare allocationPercentage: number;
  declare allocatedHours?: number;
  declare matchScore?: number;
  declare startDate?: Date;
  declare endDate?: Date;
  declare actualStartDate?: Date;
  declare actualEndDate?: Date;
  declare billableRate?: number;
  declare cost?: number;
  declare roleOnProject?: string;
  declare createdDate: Date;
  declare modifiedDate: Date;
  declare isActive: boolean;
}

ResourceAllocation.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    scenarioId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    resourceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    milestoneId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    resourceCapabilityId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    projectRequirementId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    allocationType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'Shared',
    },
    allocationPercentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100,
      },
    },
    allocatedHours: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    matchScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 100,
      },
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    actualStartDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    actualEndDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    billableRate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    cost: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    roleOnProject: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    createdDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    modifiedDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'ResourceAllocations',
    timestamps: false,
    hooks: {
      beforeUpdate: (allocation) => {
        (allocation as any).modifiedDate = new Date();
      },
    },
    // Removed unique constraint to allow multiple allocations of same resource to same project
    // This enables scenarios like:
    // - Allocating 50% for React requirement + 50% for Node.js requirement
    // - Allocating to multiple requirements on the same project
    // - Different time periods for the same project
    indexes: [],
  }
);

export default ResourceAllocation;
