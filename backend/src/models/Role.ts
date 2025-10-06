import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

export interface RoleAttributes {
  id?: number;
  appId?: number;
  technologyId?: number;
  name: string;
  code: string;
  level?: 'Junior' | 'Mid' | 'Senior' | 'Lead' | 'Principal' | 'Architect';
  parentRoleId?: number;
  category: string;
  description?: string;
  minYearsExp?: number;
  maxYearsExp?: number;
  isActive?: boolean;
  createdDate?: Date;
  modifiedDate?: Date;
}

class Role extends Model<RoleAttributes> implements RoleAttributes {
  declare id: number;
  declare appId?: number;
  declare technologyId?: number;
  declare name: string;
  declare code: string;
  declare level?: 'Junior' | 'Mid' | 'Senior' | 'Lead' | 'Principal' | 'Architect';
  declare parentRoleId?: number;
  declare category: string;
  declare description?: string;
  declare minYearsExp?: number;
  declare maxYearsExp?: number;
  declare isActive: boolean;
  declare createdDate: Date;
  declare modifiedDate: Date;
}

Role.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    appId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'FK to Apps - NULL means global role (available for all apps)',
    },
    technologyId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'FK to Technologies - NULL means not technology-specific',
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    level: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        isIn: [['Junior', 'Mid', 'Senior', 'Lead', 'Principal', 'Architect']],
      },
    },
    parentRoleId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'FK to Roles - for hierarchical roles',
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Development, QA, Architecture, Operations, Consulting, Support, etc.',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    minYearsExp: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Minimum years of experience required',
    },
    maxYearsExp: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Maximum years of experience expected',
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
    tableName: 'Roles',
    timestamps: false,
    indexes: [
      {
        name: 'idx_role_app_id',
        fields: ['appId'],
      },
      {
        name: 'idx_role_technology_id',
        fields: ['technologyId'],
      },
      {
        name: 'idx_role_parent_id',
        fields: ['parentRoleId'],
      },
    ],
    hooks: {
      beforeUpdate: (role: Role) => {
        role.modifiedDate = new Date();
      },
    },
  }
);

export default Role;
