import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

export interface ProjectDependencyAttributes {
  id?: number;
  scenarioId?: number;
  predecessorType: 'project' | 'milestone';
  predecessorId: number;
  predecessorPoint: 'start' | 'end';
  successorType: 'project' | 'milestone';
  successorId: number;
  successorPoint: 'start' | 'end';
  dependencyType: 'FS' | 'SS' | 'FF' | 'SF';
  lagDays?: number;
  isActive?: boolean;
  createdDate?: Date;
}

class ProjectDependency extends Model<ProjectDependencyAttributes> implements ProjectDependencyAttributes {
  declare id: number;
  declare scenarioId?: number;
  declare predecessorType: 'project' | 'milestone';
  declare predecessorId: number;
  declare predecessorPoint: 'start' | 'end';
  declare successorType: 'project' | 'milestone';
  declare successorId: number;
  declare successorPoint: 'start' | 'end';
  declare dependencyType: 'FS' | 'SS' | 'FF' | 'SF';
  declare lagDays: number;
  declare isActive: boolean;
  declare createdDate: Date;
}

ProjectDependency.init(
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
    predecessorType: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: 'Type of predecessor entity: project or milestone',
    },
    predecessorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID of predecessor project or milestone',
    },
    predecessorPoint: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'end',
      comment: 'Which point of predecessor: start or end',
    },
    successorType: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: 'Type of successor entity: project or milestone',
    },
    successorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID of successor project or milestone',
    },
    successorPoint: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'start',
      comment: 'Which point of successor: start or end',
    },
    dependencyType: {
      type: DataTypes.STRING(5),
      allowNull: false,
      defaultValue: 'FS',
      comment: 'FS=Finish-to-Start, SS=Start-to-Start, FF=Finish-to-Finish, SF=Start-to-Finish',
    },
    lagDays: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: 'Lag time in days (positive = delay, negative = lead)',
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
  },
  {
    sequelize,
    tableName: 'ProjectDependencies',
    timestamps: false,
    indexes: [
      {
        fields: ['predecessorType', 'predecessorId'],
      },
      {
        fields: ['successorType', 'successorId'],
      },
    ],
  }
);

export default ProjectDependency;
