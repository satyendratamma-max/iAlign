import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// Database configuration based on environment variable
const DB_TYPE = (process.env.DB_TYPE || 'sqlite').toLowerCase();

let sequelize: Sequelize;

if (DB_TYPE === 'mssql') {
  // MS SQL Server configuration for production/Windows deployment
  sequelize = new Sequelize({
    dialect: 'mssql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '1433'),
    database: process.env.DB_NAME || 'iAlign',
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    dialectOptions: {
      options: {
        encrypt: process.env.DB_ENCRYPT === 'true', // Use encryption for Azure SQL
        trustServerCertificate: process.env.DB_TRUST_CERT === 'true', // For local SQL Server
      },
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });
} else {
  // SQLite configuration for local development (default - no setup required!)
  // Works on both macOS and Windows
  const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database.sqlite');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
  });
}

export const testConnection = async (): Promise<boolean> => {
  try {
    await sequelize.authenticate();
    if (DB_TYPE === 'mssql') {
      console.log('✅ MS SQL Server database connection established successfully.');
      console.log(`📊 Database: ${process.env.DB_NAME || 'iAlign'} on ${process.env.DB_HOST || 'localhost'}`);
    } else {
      console.log('✅ SQLite database connection established successfully.');
      console.log('📁 Database file: database.sqlite');
    }
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
