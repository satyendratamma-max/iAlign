-- =============================================
-- Migration: Add Project Activities, Tasks, and Mentions Feature
-- Description: Creates ProjectActivities table with support for:
--   - Comments and activity tracking
--   - Threaded replies (max 3 levels)
--   - Tasks and action items
--   - User mentions
--   - Pinned activities
-- Safe to run on existing production data
-- =============================================

USE iAlign;
GO

PRINT 'Starting Project Activities Migration...';
GO

-- =============================================
-- Step 1: Create ProjectActivities table if it doesn't exist
-- =============================================
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'ProjectActivities')
BEGIN
    PRINT 'Creating ProjectActivities table...';

    CREATE TABLE ProjectActivities (
        id INT IDENTITY(1,1) PRIMARY KEY,
        projectId INT NOT NULL,
        userId INT NULL, -- Nullable for system-generated events
        activityType VARCHAR(50) NOT NULL,
        content NVARCHAR(MAX) NULL,
        changes NVARCHAR(MAX) NULL, -- JSON field for change tracking
        relatedEntityType VARCHAR(50) NULL,
        relatedEntityId INT NULL,
        parentActivityId INT NULL, -- For threaded replies
        metadata NVARCHAR(MAX) NULL, -- JSON field for flexible data
        isPinned BIT NOT NULL DEFAULT 0,
        isEdited BIT NOT NULL DEFAULT 0,
        editedDate DATETIME2 NULL,

        -- Task-specific fields
        assigneeId INT NULL,
        taskStatus VARCHAR(20) NULL,
        taskPriority VARCHAR(20) NULL,
        dueDate DATETIME2 NULL,
        completedDate DATETIME2 NULL,

        -- Audit fields
        createdDate DATETIME2 NOT NULL DEFAULT GETDATE(),
        modifiedDate DATETIME2 NOT NULL DEFAULT GETDATE(),
        isActive BIT NOT NULL DEFAULT 1,

        -- Constraints
        CONSTRAINT CHK_ActivityType CHECK (activityType IN ('comment', 'status_change', 'field_update', 'milestone', 'allocation', 'requirement', 'dependency', 'system_event', 'task', 'action_item')),
        CONSTRAINT CHK_TaskStatus CHECK (taskStatus IS NULL OR taskStatus IN ('open', 'in_progress', 'completed', 'cancelled')),
        CONSTRAINT CHK_TaskPriority CHECK (taskPriority IS NULL OR taskPriority IN ('low', 'medium', 'high', 'urgent'))
    );

    PRINT 'ProjectActivities table created successfully.';
END
ELSE
BEGIN
    PRINT 'ProjectActivities table already exists. Checking for missing columns...';

    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ProjectActivities' AND COLUMN_NAME = 'parentActivityId')
    BEGIN
        PRINT 'Adding parentActivityId column for threaded replies...';
        ALTER TABLE ProjectActivities ADD parentActivityId INT NULL;
    END

    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ProjectActivities' AND COLUMN_NAME = 'metadata')
    BEGIN
        PRINT 'Adding metadata column...';
        ALTER TABLE ProjectActivities ADD metadata NVARCHAR(MAX) NULL;
    END

    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ProjectActivities' AND COLUMN_NAME = 'assigneeId')
    BEGIN
        PRINT 'Adding task-specific columns...';
        ALTER TABLE ProjectActivities ADD assigneeId INT NULL;
        ALTER TABLE ProjectActivities ADD taskStatus VARCHAR(20) NULL;
        ALTER TABLE ProjectActivities ADD taskPriority VARCHAR(20) NULL;
        ALTER TABLE ProjectActivities ADD dueDate DATETIME2 NULL;
        ALTER TABLE ProjectActivities ADD completedDate DATETIME2 NULL;
    END

    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ProjectActivities' AND COLUMN_NAME = 'isEdited')
    BEGIN
        PRINT 'Adding isEdited and editedDate columns...';
        ALTER TABLE ProjectActivities ADD isEdited BIT NOT NULL DEFAULT 0;
        ALTER TABLE ProjectActivities ADD editedDate DATETIME2 NULL;
    END

    PRINT 'Column check completed.';
END
GO

-- =============================================
-- Step 2: Add Foreign Key Constraints
-- =============================================
PRINT 'Adding foreign key constraints...';

-- FK to Projects
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE CONSTRAINT_NAME = 'FK_ProjectActivities_Projects')
BEGIN
    PRINT 'Adding FK to Projects...';
    ALTER TABLE ProjectActivities
    ADD CONSTRAINT FK_ProjectActivities_Projects
    FOREIGN KEY (projectId) REFERENCES Projects(id);
END

-- FK to Users (author)
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE CONSTRAINT_NAME = 'FK_ProjectActivities_Users')
BEGIN
    PRINT 'Adding FK to Users (author)...';
    ALTER TABLE ProjectActivities
    ADD CONSTRAINT FK_ProjectActivities_Users
    FOREIGN KEY (userId) REFERENCES Users(id);
END

-- FK to Users (assignee)
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE CONSTRAINT_NAME = 'FK_ProjectActivities_Assignee')
BEGIN
    PRINT 'Adding FK to Users (assignee)...';
    ALTER TABLE ProjectActivities
    ADD CONSTRAINT FK_ProjectActivities_Assignee
    FOREIGN KEY (assigneeId) REFERENCES Users(id);
END

-- FK to self (parent activity for threading)
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE CONSTRAINT_NAME = 'FK_ProjectActivities_Parent')
BEGIN
    PRINT 'Adding FK for threaded replies...';
    ALTER TABLE ProjectActivities
    ADD CONSTRAINT FK_ProjectActivities_Parent
    FOREIGN KEY (parentActivityId) REFERENCES ProjectActivities(id);
END

PRINT 'Foreign key constraints added successfully.';
GO

-- =============================================
-- Step 3: Create Indexes for Performance
-- =============================================
PRINT 'Creating indexes...';

-- Index for fetching activities by project
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ProjectActivities_ProjectId_CreatedDate' AND object_id = OBJECT_ID('ProjectActivities'))
BEGIN
    PRINT 'Creating index on projectId and createdDate...';
    CREATE NONCLUSTERED INDEX IX_ProjectActivities_ProjectId_CreatedDate
    ON ProjectActivities(projectId, createdDate DESC)
    INCLUDE (activityType, isPinned, isActive);
END

-- Index for fetching activities by user (author)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ProjectActivities_UserId' AND object_id = OBJECT_ID('ProjectActivities'))
BEGIN
    PRINT 'Creating index on userId...';
    CREATE NONCLUSTERED INDEX IX_ProjectActivities_UserId
    ON ProjectActivities(userId)
    WHERE userId IS NOT NULL;
END

-- Index for fetching tasks by assignee
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ProjectActivities_Assignee_Tasks' AND object_id = OBJECT_ID('ProjectActivities'))
BEGIN
    PRINT 'Creating index on assigneeId for tasks...';
    CREATE NONCLUSTERED INDEX IX_ProjectActivities_Assignee_Tasks
    ON ProjectActivities(assigneeId, taskStatus, dueDate)
    WHERE assigneeId IS NOT NULL AND activityType IN ('task', 'action_item');
END

-- Index for activity types
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ProjectActivities_ActivityType' AND object_id = OBJECT_ID('ProjectActivities'))
BEGIN
    PRINT 'Creating index on activityType...';
    CREATE NONCLUSTERED INDEX IX_ProjectActivities_ActivityType
    ON ProjectActivities(activityType, isActive);
END

-- Index for pinned activities
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ProjectActivities_Pinned' AND object_id = OBJECT_ID('ProjectActivities'))
BEGIN
    PRINT 'Creating index on isPinned...';
    CREATE NONCLUSTERED INDEX IX_ProjectActivities_Pinned
    ON ProjectActivities(isPinned, createdDate DESC)
    WHERE isPinned = 1 AND isActive = 1;
END

-- Index for parent-child relationships (threading)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ProjectActivities_ParentId' AND object_id = OBJECT_ID('ProjectActivities'))
BEGIN
    PRINT 'Creating index on parentActivityId...';
    CREATE NONCLUSTERED INDEX IX_ProjectActivities_ParentId
    ON ProjectActivities(parentActivityId, createdDate ASC)
    WHERE parentActivityId IS NOT NULL;
END

PRINT 'Indexes created successfully.';
GO

-- =============================================
-- Step 4: Verification and Statistics
-- =============================================
PRINT '';
PRINT '============================================';
PRINT 'Migration Completed Successfully!';
PRINT '============================================';
PRINT '';

-- Show table info
PRINT 'ProjectActivities Table Info:';
SELECT
    'Total Columns' AS Metric,
    COUNT(*) AS Value
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'ProjectActivities';

PRINT '';
PRINT 'Existing Data Count:';
SELECT
    COUNT(*) AS TotalRecords
FROM ProjectActivities;

PRINT '';
PRINT 'Index Count:';
SELECT
    COUNT(*) AS TotalIndexes
FROM sys.indexes
WHERE object_id = OBJECT_ID('ProjectActivities');

PRINT '';
PRINT '============================================';
PRINT 'Migration Summary:';
PRINT '- ProjectActivities table created/updated';
PRINT '- All foreign keys established';
PRINT '- Performance indexes created';
PRINT '';
PRINT 'Features Enabled:';
PRINT '  ✓ Activity Feed & Comments';
PRINT '  ✓ Threaded Replies (max 3 levels)';
PRINT '  ✓ Tasks & Action Items';
PRINT '  ✓ User Mentions';
PRINT '  ✓ Pinned Activities';
PRINT '  ✓ Activity Editing';
PRINT '';
PRINT 'Note: Application uses Sequelize ORM for all queries.';
PRINT 'Ready for production use!';
PRINT '============================================';
GO
