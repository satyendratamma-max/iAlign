import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import Notification from '../models/notification.model';
import logger from '../config/logger';
import { AuthRequest } from '../middleware/auth';

// Get all notifications for the authenticated user with pagination and filtering
export const getUserNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const userId = user.id;

    // Pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    // Filter parameters
    const type = req.query.type as string;
    const isRead = req.query.isRead as string;

    // Build where clause
    const whereClause: any = { userId };

    if (type) {
      whereClause.type = type;
    }

    if (isRead !== undefined) {
      whereClause.isRead = isRead === 'true';
    }

    const { count, rows: notifications } = await Notification.findAndCountAll({
      where: whereClause,
      order: [['createdDate', 'DESC']],
      limit,
      offset,
    });

    res.json({
      success: true,
      data: notifications,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    logger.error('Error fetching notifications:', error);
    next(error);
  }
};

// Mark a notification as read
export const markNotificationAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = (req as AuthRequest).user;

    if (!user) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const userId = user.id;

    const notification = await Notification.findOne({
      where: { id, userId },
    });

    if (!notification) {
      res.status(404).json({ success: false, message: 'Notification not found' });
      return;
    }

    notification.isRead = true;
    notification.updatedDate = new Date();
    await notification.save();

    res.json({ success: true, data: notification });
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    next(error);
  }
};

// Mark all notifications as read for the authenticated user
export const markAllNotificationsAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as AuthRequest).user;

    if (!user) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const userId = user.id;

    await Notification.update(
      { isRead: true, updatedDate: new Date() },
      { where: { userId, isRead: false } }
    );

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    logger.error('Error marking all notifications as read:', error);
    next(error);
  }
};

// Create a new notification (typically called internally by other controllers)
export const createNotification = async (
  userId: number,
  type: string,
  title: string,
  message: string
) => {
  try {
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      isRead: false,
    });
    return notification;
  } catch (error) {
    logger.error('Error creating notification:', error);
    throw error;
  }
};

// Delete a single notification
export const deleteNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = (req as AuthRequest).user;

    if (!user) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const userId = user.id;

    const notification = await Notification.findOne({
      where: { id, userId },
    });

    if (!notification) {
      res.status(404).json({ success: false, message: 'Notification not found' });
      return;
    }

    await notification.destroy();

    res.json({ success: true, message: 'Notification deleted successfully' });
  } catch (error) {
    logger.error('Error deleting notification:', error);
    next(error);
  }
};

// Delete old read notifications (cleanup utility)
export const deleteOldNotifications = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // Delete read notifications older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const deletedCount = await Notification.destroy({
      where: {
        isRead: true,
        createdDate: {
          [Op.lt]: thirtyDaysAgo,
        },
      },
    });

    res.json({
      success: true,
      message: `Deleted ${deletedCount} old notifications`,
      count: deletedCount,
    });
  } catch (error) {
    logger.error('Error deleting old notifications:', error);
    next(error);
  }
};
