import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

export interface PipelineAttributes {
  id?: number;
  name: string;
  type: string;
  vendor?: string;
  platform?: string;
  environment?: string;
  description?: string;
  createdDate?: Date;
  isActive?: boolean;
}

class Pipeline extends Model<PipelineAttributes> implements PipelineAttributes {
  declare id: number;
  declare name: string;
  declare type: string;
  declare vendor?: string;
  declare platform?: string;
  declare environment?: string;
  declare description?: string;
  declare createdDate: Date;
  declare isActive: boolean;
}

Pipeline.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    vendor: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    platform: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    environment: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdDate: {
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
    tableName: 'Pipelines',
    timestamps: false,
  }
);

export default Pipeline;
