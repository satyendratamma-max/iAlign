import sequelize from '../config/database';

const createNotificationsTable = async () => {
  try {
    console.log('Creating Notifications table...');

    await sequelize.query(`
      IF OBJECT_ID('Notifications', 'U') IS NOT NULL DROP TABLE Notifications;

      CREATE TABLE Notifications (
        id INTEGER IDENTITY(1,1) PRIMARY KEY,
        user_id INTEGER NOT NULL,
        type NVARCHAR(50) NOT NULL DEFAULT 'info',
        title NVARCHAR(200) NOT NULL,
        message NVARCHAR(MAX) NOT NULL,
        is_read BIT NOT NULL DEFAULT 0,
        created_date DATETIMEOFFSET NOT NULL DEFAULT GETDATE(),
        updated_date DATETIMEOFFSET NOT NULL DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
      );
    `);

    console.log('✅ Notifications table created successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to create Notifications table:', error);
    process.exit(1);
  }
};

createNotificationsTable();
