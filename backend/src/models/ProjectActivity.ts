import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

export interface ProjectActivityAttributes {
  id?: number;
  projectId: number;
  userId?: number;
  activityType: 'comment' | 'status_change' | 'field_update' | 'milestone' | 'allocation' | 'requirement' | 'dependency' | 'system_event' | 'task' | 'action_item';
  content?: string;
  changes?: object; // { field: string, oldValue: any, newValue: any }
  relatedEntityType?: string; // 'milestone', 'allocation', 'requirement', etc.
  relatedEntityId?: number;
  parentActivityId?: number; // For threading/replies
  metadata?: object; // Flexible JSON for additional data
  isPinned?: boolean;
  isEdited?: boolean;
  editedDate?: Date;
  // Task-specific fields
  assigneeId?: number; // User assigned to task
  taskStatus?: 'open' | 'in_progress' | 'completed' | 'cancelled';
  taskPriority?: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  completedDate?: Date;
  createdDate?: Date;
  modifiedDate?: Date;
  isActive?: boolean;
}

class ProjectActivity extends Model<ProjectActivityAttributes> implements ProjectActivityAttributes {
  declare id: number;
  declare projectId: number;
  declare userId?: number;
  declare activityType: 'comment' | 'status_change' | 'field_update' | 'milestone' | 'allocation' | 'requirement' | 'dependency' | 'system_event' | 'task' | 'action_item';
  declare content?: string;
  declare changes?: object;
  declare relatedEntityType?: string;
  declare relatedEntityId?: number;
  declare parentActivityId?: number;
  declare metadata?: object;
  declare isPinned: boolean;
  declare isEdited: boolean;
  declare editedDate?: Date;
  // Task-specific fields
  declare assigneeId?: number;
  declare taskStatus?: 'open' | 'in_progress' | 'completed' | 'cancelled';
  declare taskPriority?: 'low' | 'medium' | 'high' | 'urgent';
  declare dueDate?: Date;
  declare completedDate?: Date;
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
        isIn: [['comment', 'status_change', 'field_update', 'milestone', 'allocation', 'requirement', 'dependency', 'system_event', 'task', 'action_item']],
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
    // Task-specific fields
    assigneeId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id',
      },
      comment: 'User assigned to task',
    },
    taskStatus: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        isIn: [['open', 'in_progress', 'completed', 'cancelled']],
      },
      comment: 'Task status',
    },
    taskPriority: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        isIn: [['low', 'medium', 'high', 'urgent']],
      },
      comment: 'Task priority level',
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Task due date',
    },
    completedDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Date when task was completed',
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
