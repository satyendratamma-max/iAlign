import { Request, Response, NextFunction } from 'express';
import ProjectActivity from '../models/ProjectActivity';
import User from '../models/User';
import Project from '../models/Project';
import { Op } from 'sequelize';
import sequelize from '../config/database';

/**
 * Get all tasks assigned to a user
 * Supports filtering by status and pagination
 */
export const getUserTasks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { status, limit = '50', offset = '0' } = req.query;

    const where: any = {
      assigneeId: parseInt(userId),
      activityType: {
        [Op.in]: ['task', 'action_item'],
      },
      isActive: true,
    };

    // Filter by task status if specified
    if (status && status !== 'all') {
      where.taskStatus = status;
    }

    const limitNum = Math.min(parseInt(limit as string), 100);
    const offsetNum = parseInt(offset as string);

    const { count, rows: tasks } = await ProjectActivity.findAndCountAll({
      where,
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
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'status', 'priority'],
        },
      ],
      limit: limitNum,
      offset: offsetNum,
      order: [
        ['taskStatus', 'ASC'], // open first, then in_progress, completed, cancelled
        ['dueDate', 'ASC'],
        ['createdDate', 'DESC'],
      ],
    });

    // Group tasks by status for quick overview
    const statusCounts = {
      open: tasks.filter(t => t.taskStatus === 'open').length,
      in_progress: tasks.filter(t => t.taskStatus === 'in_progress').length,
      completed: tasks.filter(t => t.taskStatus === 'completed').length,
      cancelled: tasks.filter(t => t.taskStatus === 'cancelled').length,
    };

    res.json({
      success: true,
      data: {
        tasks,
        statusCounts,
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
 * Get all mentions for a user
 * Returns activities where the user was mentioned
 */
export const getUserMentions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { limit = '50', offset = '0' } = req.query;

    const limitNum = Math.min(parseInt(limit as string), 100);
    const offsetNum = parseInt(offset as string);

    // Find all activities where user was mentioned in metadata
    const { count, rows: mentions } = await ProjectActivity.findAndCountAll({
      where: {
        activityType: 'comment',
        isActive: true,
        [Op.and]: [
          sequelize.literal(`CAST(metadata AS NVARCHAR(MAX)) LIKE '%"mentions"%${userId}%'`),
        ],
      },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'status', 'priority'],
        },
      ],
      limit: limitNum,
      offset: offsetNum,
      order: [['createdDate', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        mentions,
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
 * Get user's combined activity feed (tasks + mentions)
 * Useful for a unified user dashboard view
 */
export const getUserActivityFeed = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { limit = '50', offset = '0' } = req.query;

    const limitNum = Math.min(parseInt(limit as string), 100);
    const offsetNum = parseInt(offset as string);

    // Get both tasks and mentions in one query
    const { count, rows: activities } = await ProjectActivity.findAndCountAll({
      where: {
        [Op.or]: [
          {
            // Tasks assigned to user
            assigneeId: parseInt(userId),
            activityType: {
              [Op.in]: ['task', 'action_item'],
            },
          },
          {
            // Mentions
            activityType: 'comment',
            [Op.and]: [
              sequelize.literal(`CAST(metadata AS NVARCHAR(MAX)) LIKE '%"mentions"%${userId}%'`),
            ],
          },
        ],
        isActive: true,
      },
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
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'status', 'priority'],
        },
      ],
      limit: limitNum,
      offset: offsetNum,
      order: [['createdDate', 'DESC']],
    });

    res.json({
      success: true,
      data: {
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
