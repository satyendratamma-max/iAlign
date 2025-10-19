import Notification from '../models/notification.model';
import User from '../models/User';
import Project from '../models/Project';
import Milestone from '../models/Milestone';
import logger from '../config/logger';
import { sendEmail } from './email.service';

export interface NotificationData {
  userId: number | number[];
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  sendEmail?: boolean;
  emailSubject?: string;
}

/**
 * Create notification(s) for one or more users
 */
export const createNotification = async (data: NotificationData) => {
  try {
    const userIds = Array.isArray(data.userId) ? data.userId : [data.userId];

    const notifications = await Promise.all(
      userIds.map(userId =>
        Notification.create({
          userId,
          type: data.type,
          title: data.title,
          message: data.message,
          isRead: false,
        })
      )
    );

    // Send email if requested
    if (data.sendEmail) {
      await sendEmailNotifications(userIds, data.title, data.message, data.emailSubject);
    }

    return notifications;
  } catch (error) {
    logger.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Send email notifications to users
 */
const sendEmailNotifications = async (
  userIds: number[],
  title: string,
  message: string,
  subject?: string
) => {
  try {
    const users = await User.findAll({
      where: { id: userIds, isActive: true },
      attributes: ['id', 'email', 'firstName', 'lastName'],
    });

    await Promise.all(
      users.map(user =>
        sendEmail({
          to: user.email,
          subject: subject || title,
          html: `
            <h2>${title}</h2>
            <p>Hi ${user.firstName},</p>
            <p>${message}</p>
            <hr/>
            <p style="color: #666; font-size: 12px;">
              This is an automated notification from iAlign Resource Planning System.
              Please do not reply to this email.
            </p>
          `,
        })
      )
    );
  } catch (error) {
    logger.error('Error sending email notifications:', error);
    // Don't throw - email failures shouldn't block notification creation
  }
};

/**
 * Project-related notification triggers
 */
export const notifyProjectCreated = async (project: any, createdBy: number) => {
  try {
    const userIds = [
      project.projectManagerId,
      project.sponsorId,
      project.domainManagerId,
    ].filter(Boolean);

    if (userIds.length === 0) return;

    await createNotification({
      userId: userIds,
      type: 'info',
      title: 'New Project Created',
      message: `Project "${project.name}" has been created${createdBy ? ' by ' + (await getUserName(createdBy)) : ''}.`,
      sendEmail: true,
      emailSubject: `New Project: ${project.name}`,
    });
  } catch (error) {
    logger.error('Error in notifyProjectCreated:', error);
  }
};

export const notifyProjectStatusChanged = async (
  project: any,
  oldStatus: string,
  newStatus: string,
  changedBy: number
) => {
  try {
    const userIds = [
      project.projectManagerId,
      project.sponsorId,
      project.domainManagerId,
    ].filter(Boolean);

    if (userIds.length === 0) return;

    const type = newStatus === 'Completed' ? 'success' : newStatus === 'On Hold' ? 'warning' : 'info';

    await createNotification({
      userId: userIds,
      type,
      title: 'Project Status Updated',
      message: `Project "${project.name}" status changed from "${oldStatus}" to "${newStatus}"${changedBy ? ' by ' + (await getUserName(changedBy)) : ''}.`,
      sendEmail: ['Completed', 'On Hold', 'Cancelled'].includes(newStatus),
      emailSubject: `Project Status Change: ${project.name}`,
    });
  } catch (error) {
    logger.error('Error in notifyProjectStatusChanged:', error);
  }
};

export const notifyProjectAssigned = async (project: any, assignedUserId: number, role: string) => {
  try {
    await createNotification({
      userId: assignedUserId,
      type: 'info',
      title: 'Project Assignment',
      message: `You have been assigned as ${role} for project "${project.name}".`,
      sendEmail: true,
      emailSubject: `Project Assignment: ${project.name}`,
    });
  } catch (error) {
    logger.error('Error in notifyProjectAssigned:', error);
  }
};

export const notifyProjectDeadlineApproaching = async (project: any, daysRemaining: number) => {
  try {
    const userIds = [
      project.projectManagerId,
      project.sponsorId,
    ].filter(Boolean);

    if (userIds.length === 0) return;

    const type = daysRemaining <= 3 ? 'error' : daysRemaining <= 7 ? 'warning' : 'info';

    await createNotification({
      userId: userIds,
      type,
      title: 'Project Deadline Approaching',
      message: `Project "${project.name}" deadline is in ${daysRemaining} day(s). Deadline: ${new Date(project.deadline).toLocaleDateString()}.`,
      sendEmail: daysRemaining <= 7,
      emailSubject: `Deadline Alert: ${project.name}`,
    });
  } catch (error) {
    logger.error('Error in notifyProjectDeadlineApproaching:', error);
  }
};

/**
 * Milestone-related notification triggers
 */
export const notifyMilestoneCreated = async (milestone: any, project: any) => {
  try {
    const userIds = [milestone.ownerId, project.projectManagerId].filter(Boolean);
    if (userIds.length === 0) return;

    await createNotification({
      userId: userIds,
      type: 'info',
      title: 'New Milestone Created',
      message: `Milestone "${milestone.name}" has been created for project "${project.name}".`,
    });
  } catch (error) {
    logger.error('Error in notifyMilestoneCreated:', error);
  }
};

export const notifyMilestoneStatusChanged = async (
  milestone: any,
  project: any,
  oldStatus: string,
  newStatus: string
) => {
  try {
    const userIds = [milestone.ownerId, project.projectManagerId].filter(Boolean);
    if (userIds.length === 0) return;

    const type = newStatus === 'Completed' ? 'success' : 'info';

    await createNotification({
      userId: userIds,
      type,
      title: 'Milestone Status Updated',
      message: `Milestone "${milestone.name}" in project "${project.name}" changed from "${oldStatus}" to "${newStatus}".`,
      sendEmail: newStatus === 'Completed',
      emailSubject: `Milestone ${newStatus}: ${milestone.name}`,
    });
  } catch (error) {
    logger.error('Error in notifyMilestoneStatusChanged:', error);
  }
};

export const notifyMilestoneDeadlineApproaching = async (
  milestone: any,
  project: any,
  daysRemaining: number
) => {
  try {
    const userIds = [milestone.ownerId, project.projectManagerId].filter(Boolean);
    if (userIds.length === 0) return;

    const type = daysRemaining <= 3 ? 'error' : daysRemaining <= 7 ? 'warning' : 'info';

    await createNotification({
      userId: userIds,
      type,
      title: 'Milestone Deadline Approaching',
      message: `Milestone "${milestone.name}" in project "${project.name}" is due in ${daysRemaining} day(s).`,
      sendEmail: daysRemaining <= 3,
      emailSubject: `Milestone Deadline Alert: ${milestone.name}`,
    });
  } catch (error) {
    logger.error('Error in notifyMilestoneDeadlineApproaching:', error);
  }
};

/**
 * Resource allocation notification triggers
 */
export const notifyResourceAllocated = async (allocation: any, resource: any, project: any) => {
  try {
    const userIds = [resource.userId, project.projectManagerId].filter(Boolean);
    if (userIds.length === 0) return;

    await createNotification({
      userId: userIds,
      type: 'info',
      title: 'Resource Allocation',
      message: `${resource.firstName} ${resource.lastName} has been allocated to project "${project.name}" at ${allocation.allocationPercentage}% capacity.`,
      sendEmail: true,
      emailSubject: `Resource Allocation: ${project.name}`,
    });
  } catch (error) {
    logger.error('Error in notifyResourceAllocated:', error);
  }
};

export const notifyResourceDeallocated = async (resource: any, project: any) => {
  try {
    const userIds = [resource.userId, project.projectManagerId].filter(Boolean);
    if (userIds.length === 0) return;

    await createNotification({
      userId: userIds,
      type: 'info',
      title: 'Resource Deallocated',
      message: `${resource.firstName} ${resource.lastName} has been removed from project "${project.name}".`,
      sendEmail: true,
      emailSubject: `Resource Deallocation: ${project.name}`,
    });
  } catch (error) {
    logger.error('Error in notifyResourceDeallocated:', error);
  }
};

export const notifyResourceOverallocated = async (resource: any, totalAllocation: number) => {
  try {
    if (!resource.userId) return;

    await createNotification({
      userId: resource.userId,
      type: 'warning',
      title: 'Resource Overallocation Warning',
      message: `You are currently allocated at ${totalAllocation}% capacity across all projects. Please review your allocations.`,
      sendEmail: totalAllocation >= 120,
      emailSubject: 'Resource Overallocation Alert',
    });
  } catch (error) {
    logger.error('Error in notifyResourceOverallocated:', error);
  }
};

/**
 * Helper functions
 */
const getUserName = async (userId: number): Promise<string> => {
  try {
    const user = await User.findByPk(userId, {
      attributes: ['firstName', 'lastName'],
    });
    return user ? `${user.firstName} ${user.lastName}` : 'Unknown User';
  } catch (error) {
    return 'Unknown User';
  }
};

/**
 * Batch notification for deadline checks (to be run as cron job)
 */
export const checkUpcomingDeadlines = async () => {
  try {
    const today = new Date();
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);

    // Check project deadlines
    const projects = await Project.findAll({
      where: {
        status: ['In Progress', 'Planning'],
        deadline: {
          [require('sequelize').Op.between]: [today, sevenDaysFromNow],
        },
      },
    });

    for (const project of projects) {
      if (project.deadline) {
        const daysRemaining = Math.ceil(
          (new Date(project.deadline).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        await notifyProjectDeadlineApproaching(project, daysRemaining);
      }
    }

    // Check milestone deadlines
    const milestones = await Milestone.findAll({
      where: {
        status: ['In Progress', 'Not Started'],
        plannedEndDate: {
          [require('sequelize').Op.between]: [today, sevenDaysFromNow],
        },
      },
      include: [{ model: Project, as: 'project' }],
    });

    for (const milestone of milestones) {
      if (milestone.plannedEndDate) {
        const daysRemaining = Math.ceil(
          (new Date(milestone.plannedEndDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        await notifyMilestoneDeadlineApproaching(milestone, (milestone as any).project, daysRemaining);
      }
    }

    logger.info(`Deadline check completed: ${projects.length} projects, ${milestones.length} milestones`);
  } catch (error) {
    logger.error('Error in checkUpcomingDeadlines:', error);
  }
};
