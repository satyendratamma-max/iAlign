import { Request, Response, NextFunction } from 'express';
import ProjectActivity from '../models/ProjectActivity';
import User from '../models/User';
import Notification from '../models/notification.model';
import Project from '../models/Project';
import { ValidationError } from '../middleware/errorHandler';

/**
 * Get all activities for a project
 * Supports filtering by activity type and pagination
 */
export const getProjectActivities = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.params;
    const { type, limit = '50', offset = '0', includePinned = 'true' } = req.query;

    const where: any = {
      projectId: parseInt(projectId),
      isActive: true,
    };

    // Filter by activity type if specified
    if (type && type !== 'all') {
      where.activityType = type;
    }

    const limitNum = Math.min(parseInt(limit as string), 100); // Max 100
    const offsetNum = parseInt(offset as string);

    // Get pinned activities separately if requested
    const pinnedActivities = includePinned === 'true'
      ? await ProjectActivity.findAll({
          where: {
            projectId: parseInt(projectId),
            isPinned: true,
            isActive: true,
          },
          include: [
            {
              model: User,
              as: 'author',
              attributes: ['id', 'firstName', 'lastName', 'email'],
            },
          ],
          order: [['createdDate', 'DESC']],
        })
      : [];

    // Helper to recursively build reply associations
    const buildReplyIncludes = (depth: number = 3): any[] => {
      if (depth === 0) return [];

      return [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
        {
          model: ProjectActivity,
          as: 'replies',
          where: { isActive: true },
          required: false,
          separate: true, // Use separate query for proper ordering
          order: [['createdDate', 'ASC']], // Chronological order for replies
          include: buildReplyIncludes(depth - 1),
        },
      ];
    };

    // Get regular activities (only top-level, not replies)
    const { count, rows: activities } = await ProjectActivity.findAndCountAll({
      where: {
        ...where,
        isPinned: false, // Exclude pinned from regular list
        parentActivityId: null, // Only top-level activities
      },
      include: buildReplyIncludes(),
      limit: limitNum,
      offset: offsetNum,
      order: [['createdDate', 'DESC']], // Newest first for top-level
    });

    res.json({
      success: true,
      data: {
        pinned: pinnedActivities,
        activities,
        pagination: {
          total: count,
          limit: limitNum,
          offset: offsetNum,
          hasMore: offsetNum + limitNum < count,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Extract mentions from content (format: @[User Name](userId))
 */
const extractMentions = (content: string): number[] => {
  const mentionRegex = /@\[([^\]]+)\]\((\d+)\)/g;
  const mentions: number[] = [];
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    const userId = parseInt(match[2]);
    if (!mentions.includes(userId)) {
      mentions.push(userId);
    }
  }

  return mentions;
};

/**
 * Create notifications for mentioned users
 */
const createMentionNotifications = async (
  mentionedUserIds: number[],
  authorId: number,
  projectId: number,
  content: string
) => {
  try {
    // Get author and project info
    const [author, project] = await Promise.all([
      User.findByPk(authorId, { attributes: ['firstName', 'lastName'] }),
      Project.findByPk(projectId, { attributes: ['name'] }),
    ]);

    if (!author || !project) return;

    // Filter out the author (don't notify if they mentioned themselves)
    const recipientIds = mentionedUserIds.filter(id => id !== authorId);

    // Create notifications for each mentioned user
    const notifications = recipientIds.map(userId => ({
      userId,
      type: 'mention',
      title: `${author.firstName} ${author.lastName} mentioned you`,
      message: `You were mentioned in a comment on project "${project.name}": ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`,
      isRead: false,
    }));

    if (notifications.length > 0) {
      await Notification.bulkCreate(notifications);
    }
  } catch (error) {
    console.error('Error creating mention notifications:', error);
    // Don't throw - notifications are not critical
  }
};

/**
 * Helper function to calculate reply depth
 */
const getReplyDepth = async (activityId: number, currentDepth: number = 0): Promise<number> => {
  if (currentDepth > 10) return currentDepth; // Safety check to prevent infinite recursion

  const activity = await ProjectActivity.findByPk(activityId, {
    attributes: ['parentActivityId'],
  });

  if (!activity || !activity.parentActivityId) {
    return currentDepth;
  }

  return getReplyDepth(activity.parentActivityId, currentDepth + 1);
};

/**
 * Create a new activity (comment, status update, etc.)
 */
export const createActivity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.params;
    const userId = (req as any).user?.id; // From auth middleware

    const {
      activityType,
      content,
      changes,
      relatedEntityType,
      relatedEntityId,
      parentActivityId,
      metadata,
    } = req.body;

    // Validate required fields based on activity type
    if (activityType === 'comment' && !content) {
      throw new ValidationError('Content is required for comments');
    }

    // Validate reply depth (max 3 levels)
    if (parentActivityId) {
      const parentDepth = await getReplyDepth(parentActivityId);
      if (parentDepth >= 3) {
        throw new ValidationError('Maximum reply depth of 3 levels reached. Cannot create deeper nested replies.');
      }
    }

    // Extract mentions from content
    let mentions: number[] = [];
    if (activityType === 'comment' && content) {
      mentions = extractMentions(content);
    }

    // Create activity with mentions in metadata
    const activityMetadata = {
      ...metadata,
      mentions: mentions.length > 0 ? mentions : undefined,
    };

    const activity = await ProjectActivity.create({
      projectId: parseInt(projectId),
      userId,
      activityType,
      content,
      changes,
      relatedEntityType,
      relatedEntityId,
      parentActivityId,
      metadata: activityMetadata,
      isPinned: false,
      isEdited: false,
      isActive: true,
    });

    // Create notifications for mentioned users (async, don't wait)
    if (mentions.length > 0 && userId) {
      createMentionNotifications(mentions, userId, parseInt(projectId), content);
    }

    // Fetch the created activity with associations
    const createdActivity = await ProjectActivity.findByPk(activity.id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    res.status(201).json({
      success: true,
      data: createdActivity,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an activity (edit comment, etc.)
 */
export const updateActivity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    const activity = await ProjectActivity.findByPk(id);

    if (!activity) {
      throw new ValidationError('Activity not found');
    }

    // Only the author can edit (or admin if you want)
    if (activity.userId !== userId) {
      throw new ValidationError('You can only edit your own activities');
    }

    const { content, metadata } = req.body;

    await activity.update({
      content,
      metadata,
      isEdited: true,
      editedDate: new Date(),
      modifiedDate: new Date(),
    });

    // Fetch updated activity with associations
    const updatedActivity = await ProjectActivity.findByPk(id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    res.json({
      success: true,
      data: updatedActivity,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete/deactivate an activity
 */
export const deleteActivity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    const activity = await ProjectActivity.findByPk(id);

    if (!activity) {
      throw new ValidationError('Activity not found');
    }

    // Only the author can delete (or admin if you want)
    if (activity.userId !== userId) {
      throw new ValidationError('You can only delete your own activities');
    }

    // Soft delete
    await activity.update({
      isActive: false,
      modifiedDate: new Date(),
    });

    res.json({
      success: true,
      message: 'Activity deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Pin/unpin an activity
 */
export const togglePinActivity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const activity = await ProjectActivity.findByPk(id);

    if (!activity) {
      throw new ValidationError('Activity not found');
    }

    await activity.update({
      isPinned: !activity.isPinned,
      modifiedDate: new Date(),
    });

    // Fetch updated activity with associations
    const updatedActivity = await ProjectActivity.findByPk(id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    res.json({
      success: true,
      data: updatedActivity,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a system-generated activity (for auto-tracking)
 * Used by other controllers to log changes
 */
export const createSystemActivity = async (
  projectId: number,
  activityType: string,
  changes: object,
  metadata?: object,
  userId?: number
) => {
  try {
    const activity = await ProjectActivity.create({
      projectId,
      userId: userId || undefined, // Undefined for pure system events
      activityType: activityType as any,
      content: undefined,
      changes,
      metadata,
      isPinned: false,
      isEdited: false,
      isActive: true,
    });

    return activity;
  } catch (error) {
    console.error('Error creating system activity:', error);
    // Don't throw - system activities shouldn't break main operations
    return null;
  }
};

/**
 * Create a new task
 */
export const createTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.params;
    const userId = (req as any).user?.id;

    const {
      content,
      assigneeId,
      taskPriority = 'medium',
      dueDate,
      metadata,
    } = req.body;

    if (!content) {
      throw new ValidationError('Task content is required');
    }

    const task = await ProjectActivity.create({
      projectId: parseInt(projectId),
      userId,
      activityType: 'task',
      content,
      assigneeId: assigneeId || userId, // Default to creator if no assignee
      taskStatus: 'open',
      taskPriority,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      metadata,
      isPinned: false,
      isEdited: false,
      isActive: true,
    });

    // Fetch with associations
    const createdTask = await ProjectActivity.findByPk(task.id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    // Create notification for assignee if different from creator
    if (assigneeId && assigneeId !== userId) {
      const [author, project] = await Promise.all([
        User.findByPk(userId, { attributes: ['firstName', 'lastName'] }),
        Project.findByPk(parseInt(projectId), { attributes: ['name'] }),
      ]);

      if (author && project) {
        await Notification.create({
          userId: assigneeId,
          type: 'info',
          title: `New task assigned by ${author.firstName} ${author.lastName}`,
          message: `You have been assigned a task on project "${project.name}": ${content}`,
          isRead: false,
        });
      }
    }

    res.status(201).json({
      success: true,
      data: createdTask,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update task status
 */
export const updateTaskStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { taskStatus } = req.body;

    if (!taskStatus || !['open', 'in_progress', 'completed', 'cancelled'].includes(taskStatus)) {
      throw new ValidationError('Valid task status is required (open, in_progress, completed, cancelled)');
    }

    const task = await ProjectActivity.findByPk(id);

    if (!task) {
      throw new ValidationError('Task not found');
    }

    if (!['task', 'action_item'].includes(task.activityType)) {
      throw new ValidationError('Activity is not a task');
    }

    const updateData: any = {
      taskStatus,
      modifiedDate: new Date(),
    };

    // Set completedDate when marking as completed
    if (taskStatus === 'completed') {
      updateData.completedDate = new Date();
    }

    await task.update(updateData);

    // Fetch updated task with associations
    const updatedTask = await ProjectActivity.findByPk(id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    res.json({
      success: true,
      data: updatedTask,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Assign task to a user
 */
export const assignTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { assigneeId } = req.body;
    const userId = (req as any).user?.id;

    if (!assigneeId) {
      throw new ValidationError('Assignee ID is required');
    }

    const task = await ProjectActivity.findByPk(id);

    if (!task) {
      throw new ValidationError('Task not found');
    }

    if (!['task', 'action_item'].includes(task.activityType)) {
      throw new ValidationError('Activity is not a task');
    }

    const oldAssigneeId = task.assigneeId;

    await task.update({
      assigneeId,
      modifiedDate: new Date(),
    });

    // Create notification for new assignee
    if (assigneeId !== oldAssigneeId) {
      const [author, project] = await Promise.all([
        User.findByPk(userId, { attributes: ['firstName', 'lastName'] }),
        Project.findByPk(task.projectId, { attributes: ['name'] }),
      ]);

      if (author && project) {
        await Notification.create({
          userId: assigneeId,
          type: 'info',
          title: `Task assigned by ${author.firstName} ${author.lastName}`,
          message: `You have been assigned a task on project "${project.name}": ${task.content}`,
          isRead: false,
        });
      }
    }

    // Fetch updated task with associations
    const updatedTask = await ProjectActivity.findByPk(id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    res.json({
      success: true,
      data: updatedTask,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Convert a comment/mention to a task
 */
export const convertToTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { assigneeId, taskPriority = 'medium', dueDate } = req.body;

    const activity = await ProjectActivity.findByPk(id);

    if (!activity) {
      throw new ValidationError('Activity not found');
    }

    if (activity.activityType !== 'comment') {
      throw new ValidationError('Only comments can be converted to tasks');
    }

    await activity.update({
      activityType: 'action_item',
      assigneeId: assigneeId || activity.userId,
      taskStatus: 'open',
      taskPriority,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      modifiedDate: new Date(),
    });

    // Fetch updated task with associations
    const updatedTask = await ProjectActivity.findByPk(id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    // Create notification for assignee
    if (assigneeId && assigneeId !== activity.userId) {
      const [author, project] = await Promise.all([
        User.findByPk(activity.userId, { attributes: ['firstName', 'lastName'] }),
        Project.findByPk(activity.projectId, { attributes: ['name'] }),
      ]);

      if (author && project) {
        await Notification.create({
          userId: assigneeId,
          type: 'info',
          title: `Action item created by ${author.firstName} ${author.lastName}`,
          message: `An action item has been created for you on project "${project.name}": ${activity.content}`,
          isRead: false,
        });
      }
    }

    res.json({
      success: true,
      data: updatedTask,
    });
  } catch (error) {
    next(error);
  }
};
