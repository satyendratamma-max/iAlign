import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

export interface ScenarioAttributes {
  id?: number;
  name: string;
  description?: string;
  status: 'planned' | 'published';
  createdBy: number;
  createdDate?: Date;
  publishedBy?: number;
  publishedDate?: Date;
  parentScenarioId?: number;
  segmentFunctionId?: number;
  metadata?: object;
  isActive?: boolean;
  modifiedDate?: Date;
}

class Scenario extends Model<ScenarioAttributes> implements ScenarioAttributes {
  declare id: number;
  declare name: string;
  declare description?: string;
  declare status: 'planned' | 'published';
  declare createdBy: number;
  declare createdDate: Date;
  declare publishedBy?: number;
  declare publishedDate?: Date;
  declare parentScenarioId?: number;
  declare segmentFunctionId?: number;
  declare metadata?: object;
  declare isActive: boolean;
  declare modifiedDate: Date;
}

Scenario.init(
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
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'planned',
      validate: {
        isIn: [['planned', 'published']],
      },
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    createdDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    publishedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    publishedDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    parentScenarioId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    segmentFunctionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    modifiedDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'Scenarios',
    timestamps: false,
    hooks: {
      beforeUpdate: (scenario) => {
        (scenario as any).modifiedDate = new Date();
      },
    },
  }
);

export default Scenario;
