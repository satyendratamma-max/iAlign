import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// SQLite configuration for local development (no Docker needed!)
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite', // Creates database.sqlite file
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
});

export const testConnection = async (): Promise<boolean> => {
  try {
    await sequelize.authenticate();
    console.log('✅ SQLite database connection established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    return false;
  }
};

export const syncDatabase = async (force = false): Promise<void> => {
  try {
    await sequelize.sync({ force });
    console.log('✅ Database synced successfully.');
  } catch (error) {
    console.error('❌ Error syncing database:', error);
    throw error;
  }
};

export default sequelize;
