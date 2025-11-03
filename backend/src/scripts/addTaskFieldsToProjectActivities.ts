import sequelize from '../config/database';

/**
 * Migration script to add task-related fields to ProjectActivities table
 */
async function addTaskFields() {
  try {
    console.log('📝 Adding task fields to ProjectActivities table...');

    // Add task-related columns
    await sequelize.query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ProjectActivities]') AND name = 'assigneeId')
      BEGIN
        ALTER TABLE [ProjectActivities] ADD [assigneeId] INT NULL;
        ALTER TABLE [ProjectActivities] ADD CONSTRAINT FK_ProjectActivities_assigneeId
          FOREIGN KEY ([assigneeId]) REFERENCES [Users]([id]);
      END
    `);

    await sequelize.query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ProjectActivities]') AND name = 'taskStatus')
      BEGIN
        ALTER TABLE [ProjectActivities] ADD [taskStatus] NVARCHAR(20) NULL;
      END
    `);

    await sequelize.query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ProjectActivities]') AND name = 'taskPriority')
      BEGIN
        ALTER TABLE [ProjectActivities] ADD [taskPriority] NVARCHAR(20) NULL;
      END
    `);

    await sequelize.query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ProjectActivities]') AND name = 'dueDate')
      BEGIN
        ALTER TABLE [ProjectActivities] ADD [dueDate] DATETIME2 NULL;
      END
    `);

    await sequelize.query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ProjectActivities]') AND name = 'completedDate')
      BEGIN
        ALTER TABLE [ProjectActivities] ADD [completedDate] DATETIME2 NULL;
      END
    `);

    // Add indexes
    await sequelize.query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_projectactivities_assignee_status')
      BEGIN
        CREATE INDEX idx_projectactivities_assignee_status ON [ProjectActivities] ([assigneeId], [taskStatus]);
      END
    `);

    await sequelize.query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_projectactivities_task_status_duedate')
      BEGIN
        CREATE INDEX idx_projectactivities_task_status_duedate ON [ProjectActivities] ([taskStatus], [dueDate]);
      END
    `);

    console.log('✅ Task fields added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding task fields:', error);
    process.exit(1);
  }
}

addTaskFields();
