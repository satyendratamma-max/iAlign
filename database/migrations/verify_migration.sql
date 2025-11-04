-- =============================================
-- Verification Script: Project Activities Migration
-- Description: Comprehensive verification of migration success
-- Safe to run anytime - read-only checks
-- =============================================

USE iAlign;
GO

PRINT '';
PRINT '============================================';
PRINT 'Project Activities Migration Verification';
PRINT '============================================';
PRINT '';

DECLARE @ErrorCount INT = 0;

-- =============================================
-- Check 1: Table Exists
-- =============================================
PRINT '1. Checking if ProjectActivities table exists...';
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'ProjectActivities')
    PRINT '   ✓ ProjectActivities table exists';
ELSE
BEGIN
    PRINT '   ✗ ERROR: ProjectActivities table does not exist!';
    SET @ErrorCount = @ErrorCount + 1;
END
PRINT '';

-- =============================================
-- Check 2: Column Count
-- =============================================
PRINT '2. Checking column count...';
DECLARE @ColumnCount INT;
SELECT @ColumnCount = COUNT(*)
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'ProjectActivities';

IF @ColumnCount = 23
    PRINT '   ✓ All 23 columns present';
ELSE
BEGIN
    PRINT '   ✗ WARNING: Expected 23 columns, found ' + CAST(@ColumnCount AS VARCHAR);
    PRINT '   Missing or extra columns detected:';

    -- Show all columns
    SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'ProjectActivities'
    ORDER BY ORDINAL_POSITION;
END
PRINT '';

-- =============================================
-- Check 3: Required Columns
-- =============================================
PRINT '3. Checking for required columns...';

DECLARE @MissingColumns TABLE (ColumnName VARCHAR(100));

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ProjectActivities' AND COLUMN_NAME = 'id')
    INSERT INTO @MissingColumns VALUES ('id');
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ProjectActivities' AND COLUMN_NAME = 'projectId')
    INSERT INTO @MissingColumns VALUES ('projectId');
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ProjectActivities' AND COLUMN_NAME = 'userId')
    INSERT INTO @MissingColumns VALUES ('userId');
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ProjectActivities' AND COLUMN_NAME = 'activityType')
    INSERT INTO @MissingColumns VALUES ('activityType');
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ProjectActivities' AND COLUMN_NAME = 'parentActivityId')
    INSERT INTO @MissingColumns VALUES ('parentActivityId');
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ProjectActivities' AND COLUMN_NAME = 'metadata')
    INSERT INTO @MissingColumns VALUES ('metadata');
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ProjectActivities' AND COLUMN_NAME = 'assigneeId')
    INSERT INTO @MissingColumns VALUES ('assigneeId');
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ProjectActivities' AND COLUMN_NAME = 'taskStatus')
    INSERT INTO @MissingColumns VALUES ('taskStatus');
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ProjectActivities' AND COLUMN_NAME = 'isPinned')
    INSERT INTO @MissingColumns VALUES ('isPinned');
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ProjectActivities' AND COLUMN_NAME = 'isEdited')
    INSERT INTO @MissingColumns VALUES ('isEdited');

IF (SELECT COUNT(*) FROM @MissingColumns) = 0
    PRINT '   ✓ All required columns present';
ELSE
BEGIN
    PRINT '   ✗ ERROR: Missing columns detected:';
    SELECT ColumnName FROM @MissingColumns;
    SET @ErrorCount = @ErrorCount + 1;
END
PRINT '';

-- =============================================
-- Check 4: Foreign Keys
-- =============================================
PRINT '4. Checking foreign key constraints...';

IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE CONSTRAINT_NAME = 'FK_ProjectActivities_Projects')
    PRINT '   ✓ FK to Projects exists';
ELSE
BEGIN
    PRINT '   ✗ WARNING: FK to Projects is missing';
    SET @ErrorCount = @ErrorCount + 1;
END

IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE CONSTRAINT_NAME = 'FK_ProjectActivities_Users')
    PRINT '   ✓ FK to Users (author) exists';
ELSE
BEGIN
    PRINT '   ✗ WARNING: FK to Users (author) is missing';
END

IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE CONSTRAINT_NAME = 'FK_ProjectActivities_Assignee')
    PRINT '   ✓ FK to Users (assignee) exists';
ELSE
BEGIN
    PRINT '   ✗ WARNING: FK to Users (assignee) is missing';
END

IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE CONSTRAINT_NAME = 'FK_ProjectActivities_Parent')
    PRINT '   ✓ FK for threaded replies exists';
ELSE
BEGIN
    PRINT '   ✗ WARNING: FK for threaded replies is missing';
END
PRINT '';

-- =============================================
-- Check 5: Indexes
-- =============================================
PRINT '5. Checking indexes...';

DECLARE @IndexCount INT;
SELECT @IndexCount = COUNT(*)
FROM sys.indexes
WHERE object_id = OBJECT_ID('ProjectActivities')
  AND name IS NOT NULL; -- Exclude heap

IF @IndexCount >= 6
    PRINT '   ✓ Performance indexes created (' + CAST(@IndexCount AS VARCHAR) + ' indexes)';
ELSE
BEGIN
    PRINT '   ✗ WARNING: Expected at least 6 indexes, found ' + CAST(@IndexCount AS VARCHAR);
    PRINT '   Existing indexes:';
    SELECT name, type_desc
    FROM sys.indexes
    WHERE object_id = OBJECT_ID('ProjectActivities')
      AND name IS NOT NULL;
END
PRINT '';

-- =============================================
-- Check 6: Check Constraints
-- =============================================
PRINT '6. Checking constraints...';

IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS WHERE CONSTRAINT_NAME = 'CHK_ActivityType')
    PRINT '   ✓ ActivityType constraint exists';
ELSE
    PRINT '   ✗ WARNING: ActivityType constraint is missing';

IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS WHERE CONSTRAINT_NAME = 'CHK_TaskStatus')
    PRINT '   ✓ TaskStatus constraint exists';
ELSE
    PRINT '   ✗ WARNING: TaskStatus constraint is missing';

IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS WHERE CONSTRAINT_NAME = 'CHK_TaskPriority')
    PRINT '   ✓ TaskPriority constraint exists';
ELSE
    PRINT '   ✗ WARNING: TaskPriority constraint is missing';
PRINT '';

-- =============================================
-- Check 7: Data Integrity
-- =============================================
PRINT '7. Checking data integrity...';

DECLARE @TotalRecords INT;
SELECT @TotalRecords = COUNT(*) FROM ProjectActivities;
PRINT '   Total Records: ' + CAST(@TotalRecords AS VARCHAR);

IF @TotalRecords > 0
BEGIN
    DECLARE @ActiveRecords INT, @InactiveRecords INT;
    SELECT @ActiveRecords = COUNT(*) FROM ProjectActivities WHERE isActive = 1;
    SELECT @InactiveRecords = COUNT(*) FROM ProjectActivities WHERE isActive = 0;

    PRINT '   Active Records: ' + CAST(@ActiveRecords AS VARCHAR);
    PRINT '   Inactive Records: ' + CAST(@InactiveRecords AS VARCHAR);

    -- Activity type distribution
    PRINT '';
    PRINT '   Activity Type Distribution:';
    SELECT
        activityType,
        COUNT(*) AS Count
    FROM ProjectActivities
    WHERE isActive = 1
    GROUP BY activityType
    ORDER BY COUNT(*) DESC;

    -- Task status distribution (if any tasks exist)
    IF EXISTS (SELECT 1 FROM ProjectActivities WHERE activityType IN ('task', 'action_item'))
    BEGIN
        PRINT '';
        PRINT '   Task Status Distribution:';
        SELECT
            taskStatus,
            COUNT(*) AS Count
        FROM ProjectActivities
        WHERE activityType IN ('task', 'action_item')
          AND isActive = 1
        GROUP BY taskStatus
        ORDER BY COUNT(*) DESC;
    END
END
ELSE
    PRINT '   ✓ Table is empty (no data yet)';
PRINT '';

-- =============================================
-- Check 8: Orphaned Records
-- =============================================
PRINT '8. Checking for orphaned records...';

DECLARE @OrphanedProjects INT = 0;
SELECT @OrphanedProjects = COUNT(*)
FROM ProjectActivities pa
LEFT JOIN Projects p ON pa.projectId = p.id
WHERE p.id IS NULL;

IF @OrphanedProjects = 0
    PRINT '   ✓ No orphaned project references';
ELSE
BEGIN
    PRINT '   ✗ WARNING: ' + CAST(@OrphanedProjects AS VARCHAR) + ' activities reference non-existent projects';
    SET @ErrorCount = @ErrorCount + 1;
END

DECLARE @OrphanedUsers INT = 0;
SELECT @OrphanedUsers = COUNT(*)
FROM ProjectActivities pa
LEFT JOIN Users u ON pa.userId = u.id
WHERE pa.userId IS NOT NULL AND u.id IS NULL;

IF @OrphanedUsers = 0
    PRINT '   ✓ No orphaned user references';
ELSE
    PRINT '   ✗ WARNING: ' + CAST(@OrphanedUsers AS VARCHAR) + ' activities reference non-existent users';
PRINT '';

-- =============================================
-- Summary
-- =============================================
PRINT '============================================';
PRINT 'Verification Summary';
PRINT '============================================';
PRINT '';

IF @ErrorCount = 0
BEGIN
    PRINT '✓ ALL CHECKS PASSED!';
    PRINT '';
    PRINT 'Migration is complete and verified.';
    PRINT 'The Project Activities feature is ready for use.';
END
ELSE
BEGIN
    PRINT '✗ VERIFICATION FAILED!';
    PRINT '';
    PRINT 'Total Errors/Warnings: ' + CAST(@ErrorCount AS VARCHAR);
    PRINT '';
    PRINT 'Please review the errors above and:';
    PRINT '1. Re-run the migration script if objects are missing';
    PRINT '2. Check for partial migration completion';
    PRINT '3. Review database permissions';
END

PRINT '';
PRINT '============================================';
PRINT 'Database Statistics';
PRINT '============================================';

-- Table size
PRINT 'Table Size:';
SELECT
    t.NAME AS TableName,
    p.rows AS RowCounts,
    SUM(a.total_pages) * 8 AS TotalSpaceKB,
    SUM(a.used_pages) * 8 AS UsedSpaceKB,
    (SUM(a.total_pages) - SUM(a.used_pages)) * 8 AS UnusedSpaceKB
FROM sys.tables t
INNER JOIN sys.indexes i ON t.OBJECT_ID = i.object_id
INNER JOIN sys.partitions p ON i.object_id = p.OBJECT_ID AND i.index_id = p.index_id
INNER JOIN sys.allocation_units a ON p.partition_id = a.container_id
WHERE t.NAME = 'ProjectActivities'
  AND i.index_id <= 1
GROUP BY t.Name, p.Rows;

PRINT '';
PRINT 'Verification complete.';
GO
