import bcrypt from 'bcryptjs';
import sequelize from '../config/database';
import User from '../models/User';
import logger from '../config/logger';

const resetAdminPassword = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connected successfully');

    // Find the admin user
    let adminUser = await User.findOne({ where: { email: 'admin@ialign.com' } });

    if (!adminUser) {
      // If admin user doesn't exist, create it
      logger.warn('Admin user not found, creating new admin user...');
      const hashedPassword = await bcrypt.hash('Admin@123', 10);

      adminUser = await User.create({
        id: 1,
        username: 'admin',
        email: 'admin@ialign.com',
        passwordHash: hashedPassword,
        role: 'Administrator',
        firstName: 'Admin',
        lastName: 'User',
        isActive: true,
      });

      logger.info('Admin user created successfully');
    } else {
      // Reset existing admin password
      logger.info('Admin user found, resetting password...');
      const hashedPassword = await bcrypt.hash('Admin@123', 10);

      await adminUser.update({
        passwordHash: hashedPassword,
        role: 'Administrator',
        isActive: true,
      });

      logger.info('Admin password reset successfully');
    }

    logger.info('✓ Admin user is ready');
    logger.info('  Email: admin@ialign.com');
    logger.info('  Password: Admin@123');

    process.exit(0);
  } catch (error) {
    logger.error('Error resetting admin password:', error);
    process.exit(1);
  }
};

resetAdminPassword();
