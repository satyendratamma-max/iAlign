import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

export interface ProjectRequirementAttributes {
  id?: number;
  projectId: number;
  appId: number;
  technologyId: number;
  roleId: number;
  requiredCount: number;
  fulfilledCount?: number;
  proficiencyLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  minYearsExp?: number;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  startDate?: Date;
  endDate?: Date;
  description?: string;
  isFulfilled: boolean;
  isActive?: boolean;
  createdDate?: Date;
  modifiedDate?: Date;
}

class ProjectRequirement extends Model<ProjectRequirementAttributes> implements ProjectRequirementAttributes {
  declare id: number;
  declare projectId: number;
  declare appId: number;
  declare technologyId: number;
  declare roleId: number;
  declare requiredCount: number;
  declare fulfilledCount: number;
  declare proficiencyLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  declare minYearsExp?: number;
  declare priority: 'Critical' | 'High' | 'Medium' | 'Low';
  declare startDate?: Date;
  declare endDate?: Date;
  declare description?: string;
  declare isFulfilled: boolean;
  declare isActive: boolean;
  declare createdDate: Date;
  declare modifiedDate: Date;
}

ProjectRequirement.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'FK to Projects',
    },
    appId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'FK to Apps - Required application skill',
    },
    technologyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'FK to Technologies - Required technology skill',
    },
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'FK to Roles - Required role',
    },
    requiredCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
      },
      comment: 'Number of resources needed with this capability',
    },
    fulfilledCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
      comment: 'Number of resources currently allocated with this capability',
    },
    proficiencyLevel: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'Intermediate',
      validate: {
        isIn: [['Beginner', 'Intermediate', 'Advanced', 'Expert']],
      },
      comment: 'Minimum required proficiency level',
    },
    minYearsExp: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Minimum years of experience required',
    },
    priority: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'Medium',
      validate: {
        isIn: [['Critical', 'High', 'Medium', 'Low']],
      },
      comment: 'Priority of this requirement',
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When this capability is needed from',
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When this capability is needed until',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Additional details about this requirement',
    },
    isFulfilled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether this requirement is fully satisfied',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
  },
  {
    sequelize,
    tableName: 'ProjectRequirements',
    timestamps: false,
    indexes: [
      {
        name: 'idx_requirement_project_id',
        fields: ['projectId'],
      },
      {
        name: 'idx_requirement_app_id',
        fields: ['appId'],
      },
      {
        name: 'idx_requirement_technology_id',
        fields: ['technologyId'],
      },
      {
        name: 'idx_requirement_role_id',
        fields: ['roleId'],
      },
      {
        name: 'idx_requirement_priority',
        fields: ['priority'],
      },
      {
        name: 'idx_requirement_fulfilled',
        fields: ['isFulfilled'],
      },
    ],
    hooks: {
      beforeUpdate: (requirement: ProjectRequirement) => {
        requirement.modifiedDate = new Date();

        // Auto-update isFulfilled based on counts
        requirement.isFulfilled = requirement.fulfilledCount >= requirement.requiredCount;
      },
    },
  }
);

export default ProjectRequirement;
