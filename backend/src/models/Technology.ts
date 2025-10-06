import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

export interface TechnologyAttributes {
  id?: number;
  appId?: number;
  name: string;
  code: string;
  category: string;
  version?: string;
  stackType?: 'Frontend' | 'Backend' | 'Database' | 'Infrastructure' | 'Tool';
  description?: string;
  vendor?: string;
  isActive?: boolean;
  createdDate?: Date;
  modifiedDate?: Date;
}

class Technology extends Model<TechnologyAttributes> implements TechnologyAttributes {
  declare id: number;
  declare appId?: number;
  declare name: string;
  declare code: string;
  declare category: string;
  declare version?: string;
  declare stackType?: 'Frontend' | 'Backend' | 'Database' | 'Infrastructure' | 'Tool';
  declare description?: string;
  declare vendor?: string;
  declare isActive: boolean;
  declare createdDate: Date;
  declare modifiedDate: Date;
}

Technology.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    appId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'FK to Apps - NULL means global technology (available for all apps)',
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
    category: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Language, Framework, Database, Tool, Platform, etc.',
    },
    version: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Version or release',
    },
    stackType: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        isIn: [['Frontend', 'Backend', 'Database', 'Infrastructure', 'Tool']],
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    vendor: {
      type: DataTypes.STRING(200),
      allowNull: true,
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
    tableName: 'Technologies',
    timestamps: false,
    indexes: [
      {
        name: 'idx_technology_app_id',
        fields: ['appId'],
      },
    ],
    hooks: {
      beforeUpdate: (technology: Technology) => {
        technology.modifiedDate = new Date();
      },
    },
  }
);

export default Technology;
