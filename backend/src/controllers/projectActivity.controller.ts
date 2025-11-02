import { Request, Response, NextFunction } from 'express';
import ProjectActivity from '../models/ProjectActivity';
import User from '../models/User';
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

    // Get regular activities
    const { count, rows: activities } = await ProjectActivity.findAndCountAll({
      where: {
        ...where,
        isPinned: false, // Exclude pinned from regular list
      },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
        {
          model: ProjectActivity,
          as: 'replies',
          include: [
            {
              model: User,
              as: 'author',
              attributes: ['id', 'firstName', 'lastName', 'email'],
            },
          ],
        },
      ],
      limit: limitNum,
      offset: offsetNum,
      order: [['createdDate', 'DESC']],
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

    const activity = await ProjectActivity.create({
      projectId: parseInt(projectId),
      userId,
      activityType,
      content,
      changes,
      relatedEntityType,
      relatedEntityId,
      parentActivityId,
      metadata,
      isPinned: false,
      isEdited: false,
      isActive: true,
    });

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
