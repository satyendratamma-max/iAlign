import bcrypt from 'bcryptjs';
import sequelize from '../config/database';
import User from '../models/User';

const createAdminUser = async () => {
  try {
    await sequelize.sync();

    // Check if admin exists
    const existing = await User.findOne({ where: { email: 'admin@ialign.com' } });
    if (existing) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash('Admin@123', 10);

    await User.create({
      username: 'admin',
      email: 'admin@ialign.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'Administrator',
      isActive: true,
    });

    console.log('✅ Admin user created successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to create admin user:', error);
    process.exit(1);
  }
};

createAdminUser();
