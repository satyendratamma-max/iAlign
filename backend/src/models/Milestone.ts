import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

export interface MilestoneAttributes {
  id?: number;
  projectId: number;
  ownerId?: number;
  phase: string;
  name: string;
  description?: string;
  plannedStartDate?: Date;
  plannedEndDate?: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  status: string;
  progress: number;
  dependencies?: string;
  deliverables?: string;
  healthStatus?: string;
  createdDate?: Date;
  modifiedDate?: Date;
  isActive?: boolean;
}

class Milestone extends Model<MilestoneAttributes> implements MilestoneAttributes {
  declare id: number;
  declare projectId: number;
  declare ownerId?: number;
  declare phase: string;
  declare name: string;
  declare description?: string;
  declare plannedStartDate?: Date;
  declare plannedEndDate?: Date;
  declare actualStartDate?: Date;
  declare actualEndDate?: Date;
  declare status: string;
  declare progress: number;
  declare dependencies?: string;
  declare deliverables?: string;
  declare healthStatus?: string;
  declare createdDate: Date;
  declare modifiedDate: Date;
  declare isActive: boolean;
}

Milestone.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    ownerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    phase: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    plannedStartDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    plannedEndDate: {
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
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'Not Started',
    },
    progress: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100,
      },
    },
    dependencies: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    deliverables: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    healthStatus: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: 'Green',
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
    tableName: 'Milestones',
    timestamps: false,
    hooks: {
      beforeUpdate: (milestone) => {
        (milestone as any).modifiedDate = new Date();
      },
    },
  }
);

export default Milestone;
