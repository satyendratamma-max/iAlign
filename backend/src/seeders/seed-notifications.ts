import Notification from '../models/notification.model';
import User from '../models/User';
import sequelize from '../config/database';
import logger from '../config/logger';

async function seedNotifications() {
  try {
    await sequelize.sync();

    // Get the admin user
    const admin = await User.findOne({ where: { email: 'admin@ialign.com' } });

    if (!admin) {
      logger.error('Admin user not found. Please run user seeder first.');
      return;
    }

    // Clear existing notifications
    await Notification.destroy({ where: {} });

    // Sample notifications
    const notifications = [
      {
        userId: admin.id,
        type: 'info',
        title: 'Welcome to iAlign',
        message: 'Thank you for using iAlign Resource Planning System.',
        isRead: false,
        createdDate: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
      },
      {
        userId: admin.id,
        type: 'success',
        title: 'Project Created',
        message: 'New project "Mobile App Development" has been successfully created.',
        isRead: false,
        createdDate: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      },
      {
        userId: admin.id,
        type: 'warning',
        title: 'Resource Allocation Alert',
        message: 'Resource "John Doe" is over-allocated (125%) across multiple projects.',
        isRead: false,
        createdDate: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      },
      {
        userId: admin.id,
        type: 'info',
        title: 'Milestone Updated',
        message: 'Milestone "Phase 1 Completion" has been updated with new target date.',
        isRead: true,
        createdDate: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
      },
      {
        userId: admin.id,
        type: 'success',
        title: 'Portfolio Review Complete',
        message: 'Q4 Portfolio review has been completed successfully.',
        isRead: true,
        createdDate: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      },
      {
        userId: admin.id,
        type: 'error',
        title: 'Budget Exceeded',
        message: 'Project "Cloud Migration" has exceeded its allocated budget by 15%.',
        isRead: false,
        createdDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
      },
      {
        userId: admin.id,
        type: 'info',
        title: 'Team Member Added',
        message: 'New team member "Jane Smith" has been added to Engineering team.',
        isRead: true,
        createdDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
      },
    ];

    await Notification.bulkCreate(notifications);

    logger.info(`Successfully seeded ${notifications.length} notifications`);
  } catch (error) {
    logger.error('Error seeding notifications:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedNotifications()
    .then(() => {
      logger.info('Notification seeding complete');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Notification seeding failed:', error);
      process.exit(1);
    });
}

export default seedNotifications;
