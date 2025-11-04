-- =============================================
-- Rollback: Remove Project Activities Feature
-- Description: Safely removes ProjectActivities table and related objects
-- WARNING: This will delete all activity data!
-- Use only if you need to completely remove this feature
-- =============================================

USE iAlign;
GO

PRINT 'Starting Project Activities Rollback...';
PRINT 'WARNING: This will delete all activity data!';
GO

-- =============================================
-- Step 1: Drop foreign key constraints
-- =============================================
PRINT 'Dropping foreign key constraints...';

IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE CONSTRAINT_NAME = 'FK_ProjectActivities_Parent')
BEGIN
    PRINT 'Dropping FK_ProjectActivities_Parent...';
    ALTER TABLE ProjectActivities DROP CONSTRAINT FK_ProjectActivities_Parent;
END

IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE CONSTRAINT_NAME = 'FK_ProjectActivities_Assignee')
BEGIN
    PRINT 'Dropping FK_ProjectActivities_Assignee...';
    ALTER TABLE ProjectActivities DROP CONSTRAINT FK_ProjectActivities_Assignee;
END

IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE CONSTRAINT_NAME = 'FK_ProjectActivities_Users')
BEGIN
    PRINT 'Dropping FK_ProjectActivities_Users...';
    ALTER TABLE ProjectActivities DROP CONSTRAINT FK_ProjectActivities_Users;
END

IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE CONSTRAINT_NAME = 'FK_ProjectActivities_Projects')
BEGIN
    PRINT 'Dropping FK_ProjectActivities_Projects...';
    ALTER TABLE ProjectActivities DROP CONSTRAINT FK_ProjectActivities_Projects;
END
GO

-- =============================================
-- Step 2: Drop indexes
-- =============================================
PRINT 'Dropping indexes...';

IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ProjectActivities_ParentId' AND object_id = OBJECT_ID('ProjectActivities'))
BEGIN
    DROP INDEX IX_ProjectActivities_ParentId ON ProjectActivities;
END

IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ProjectActivities_Pinned' AND object_id = OBJECT_ID('ProjectActivities'))
BEGIN
    DROP INDEX IX_ProjectActivities_Pinned ON ProjectActivities;
END

IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ProjectActivities_ActivityType' AND object_id = OBJECT_ID('ProjectActivities'))
BEGIN
    DROP INDEX IX_ProjectActivities_ActivityType ON ProjectActivities;
END

IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ProjectActivities_Assignee_Tasks' AND object_id = OBJECT_ID('ProjectActivities'))
BEGIN
    DROP INDEX IX_ProjectActivities_Assignee_Tasks ON ProjectActivities;
END

IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ProjectActivities_UserId' AND object_id = OBJECT_ID('ProjectActivities'))
BEGIN
    DROP INDEX IX_ProjectActivities_UserId ON ProjectActivities;
END

IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ProjectActivities_ProjectId_CreatedDate' AND object_id = OBJECT_ID('ProjectActivities'))
BEGIN
    DROP INDEX IX_ProjectActivities_ProjectId_CreatedDate ON ProjectActivities;
END
GO

-- =============================================
-- Step 3: Drop the table
-- =============================================
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'ProjectActivities')
BEGIN
    PRINT 'Dropping ProjectActivities table...';

    -- Get record count before dropping
    DECLARE @recordCount INT;
    SELECT @recordCount = COUNT(*) FROM ProjectActivities;
    PRINT 'Deleting ' + CAST(@recordCount AS VARCHAR) + ' activity records...';

    DROP TABLE ProjectActivities;
    PRINT 'ProjectActivities table dropped successfully.';
END
ELSE
BEGIN
    PRINT 'ProjectActivities table does not exist.';
END
GO

-- =============================================
-- Step 4: Verification
-- =============================================
PRINT '';
PRINT '============================================';
PRINT 'Rollback Completed Successfully!';
PRINT '============================================';
PRINT '';
PRINT 'All Project Activities objects removed:';
PRINT '  ✓ ProjectActivities table';
PRINT '  ✓ All foreign keys';
PRINT '  ✓ All indexes';
PRINT '';
PRINT 'Database restored to pre-migration state.';
PRINT '============================================';
GO
