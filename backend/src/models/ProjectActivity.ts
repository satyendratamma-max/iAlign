import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

export interface ProjectActivityAttributes {
  id?: number;
  projectId: number;
  userId?: number;
  activityType: 'comment' | 'status_change' | 'field_update' | 'milestone' | 'allocation' | 'requirement' | 'dependency' | 'system_event';
  content?: string;
  changes?: object; // { field: string, oldValue: any, newValue: any }
  relatedEntityType?: string; // 'milestone', 'allocation', 'requirement', etc.
  relatedEntityId?: number;
  parentActivityId?: number; // For threading/replies
  metadata?: object; // Flexible JSON for additional data
  isPinned?: boolean;
  isEdited?: boolean;
  editedDate?: Date;
  createdDate?: Date;
  modifiedDate?: Date;
  isActive?: boolean;
}

class ProjectActivity extends Model<ProjectActivityAttributes> implements ProjectActivityAttributes {
  declare id: number;
  declare projectId: number;
  declare userId?: number;
  declare activityType: 'comment' | 'status_change' | 'field_update' | 'milestone' | 'allocation' | 'requirement' | 'dependency' | 'system_event';
  declare content?: string;
  declare changes?: object;
  declare relatedEntityType?: string;
  declare relatedEntityId?: number;
  declare parentActivityId?: number;
  declare metadata?: object;
  declare isPinned: boolean;
  declare isEdited: boolean;
  declare editedDate?: Date;
  declare createdDate: Date;
  declare modifiedDate: Date;
  declare isActive: boolean;
}

ProjectActivity.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Projects',
        key: 'id',
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true, // Nullable for system-generated events
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    activityType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [['comment', 'status_change', 'field_update', 'milestone', 'allocation', 'requirement', 'dependency', 'system_event']],
      },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    changes: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Stores before/after values for field updates',
    },
    relatedEntityType: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Type of related entity (milestone, allocation, etc.)',
    },
    relatedEntityId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID of related entity',
    },
    parentActivityId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'ProjectActivities',
        key: 'id',
      },
      comment: 'For threaded replies',
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Flexible JSON field for additional context',
    },
    isPinned: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isEdited: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    editedDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    createdDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    modifiedDate: {
      type: DataTypes.DATE,
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
    tableName: 'ProjectActivities',
    timestamps: false,
    indexes: [
      {
        fields: ['projectId', 'createdDate'],
      },
      {
        fields: ['userId'],
      },
      {
        fields: ['activityType'],
      },
      {
        fields: ['isPinned', 'createdDate'],
      },
    ],
  }
);

export default ProjectActivity;
