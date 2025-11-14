import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

export interface DefaultRequirementAttributes {
  id?: number;
  appId: number;
  technologyId: number;
  roleId: number;
  requiredCount: number;
  proficiencyLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  minYearsExp?: number;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  description?: string;
  displayOrder: number;
  isActive?: boolean;
  createdDate?: Date;
  modifiedDate?: Date;
}

class DefaultRequirement extends Model<DefaultRequirementAttributes> implements DefaultRequirementAttributes {
  declare id: number;
  declare appId: number;
  declare technologyId: number;
  declare roleId: number;
  declare requiredCount: number;
  declare proficiencyLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  declare minYearsExp?: number;
  declare priority: 'Critical' | 'High' | 'Medium' | 'Low';
  declare description?: string;
  declare displayOrder: number;
  declare isActive: boolean;
  declare createdDate: Date;
  declare modifiedDate: Date;
}

DefaultRequirement.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
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
      comment: 'Default number of resources needed with this capability',
    },
    proficiencyLevel: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'Intermediate',
      validate: {
        isIn: [['Beginner', 'Intermediate', 'Advanced', 'Expert']],
      },
      comment: 'Default minimum required proficiency level',
    },
    minYearsExp: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Default minimum years of experience required',
    },
    priority: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'Medium',
      validate: {
        isIn: [['Critical', 'High', 'Medium', 'Low']],
      },
      comment: 'Default priority of this requirement',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Default description for this requirement',
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Order in which to display/apply this default requirement',
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
    tableName: 'DefaultRequirements',
    timestamps: false,
    indexes: [
      {
        name: 'idx_default_req_display_order',
        fields: ['displayOrder'],
      },
      {
        name: 'idx_default_req_active',
        fields: ['isActive'],
      },
    ],
    hooks: {
      beforeUpdate: (requirement: DefaultRequirement) => {
        requirement.modifiedDate = new Date();
      },
    },
  }
);

export default DefaultRequirement;
