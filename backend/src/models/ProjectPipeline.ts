import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

export interface ProjectPipelineAttributes {
  id?: number;
  projectId: number;
  pipelineId: number;
  integrationType?: string;
  setupRequired: boolean;
  status: string;
  notes?: string;
  createdDate?: Date;
  isActive?: boolean;
}

class ProjectPipeline extends Model<ProjectPipelineAttributes> implements ProjectPipelineAttributes {
  declare id: number;
  declare projectId: number;
  declare pipelineId: number;
  declare integrationType?: string;
  declare setupRequired: boolean;
  declare status: string;
  declare notes?: string;
  declare createdDate: Date;
  declare isActive: boolean;
}

ProjectPipeline.init(
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
    pipelineId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    integrationType: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    setupRequired: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'Planned',
    },
    notes: {
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
    tableName: 'ProjectPipelines',
    timestamps: false,
  }
);

export default ProjectPipeline;
