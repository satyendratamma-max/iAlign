# Project Activities Migration Guide

This directory contains database migration scripts for the **Project Activities, Tasks, and Mentions** feature.

## Overview

The migration adds comprehensive activity tracking, threaded comments, tasks management, and user mentions to the iAlign platform.

### Features Included
- ✅ Activity Feed & Comments
- ✅ Threaded Replies (max 3 levels deep)
- ✅ Tasks & Action Items
- ✅ User Mentions (@mentions in comments)
- ✅ Pinned Activities
- ✅ Activity Editing
- ✅ Task Assignment and Status Tracking

## Migration Files

### 1. `add_project_activities_migration.sql`
**Main migration script** - Creates all necessary database objects.

**What it does:**
- Creates `ProjectActivities` table with all columns
- Adds foreign key constraints to Projects, Users
- Creates performance indexes
- Creates helper views (`vw_ActiveComments`, `vw_ActiveTasks`)
- Creates stored procedure (`sp_GetUserMentions`)
- Safe to run multiple times (idempotent)
- Preserves existing data

### 2. `rollback_project_activities_migration.sql`
**Rollback script** - Removes all migration changes.

**⚠️ WARNING:** This script will **DELETE ALL ACTIVITY DATA**. Use with extreme caution!

## How to Run the Migration

### Prerequisites
- SQL Server Management Studio (SSMS) or Azure Data Studio
- Database connection to your iAlign database
- Appropriate permissions (CREATE TABLE, CREATE INDEX, CREATE PROCEDURE)

### Step 1: Backup Your Database
**CRITICAL:** Always backup before running migrations!

```sql
-- In SSMS, right-click database > Tasks > Back Up...
-- Or use T-SQL:
BACKUP DATABASE iAlign
TO DISK = 'C:\Backups\iAlign_PreActivitiesMigration.bak'
WITH FORMAT, INIT, NAME = 'iAlign-Full Database Backup';
```

### Step 2: Review the Migration Script
1. Open `add_project_activities_migration.sql` in SSMS or Azure Data Studio
2. Review the script to understand what changes will be made
3. Check that the database name is correct (default: `iAlign`)

### Step 3: Run the Migration

**Option A: Using SSMS**
1. Open SQL Server Management Studio
2. Connect to your database server
3. File > Open > File... > select `add_project_activities_migration.sql`
4. Ensure you're connected to the correct database
5. Click Execute (F5)
6. Review the output messages for any errors

**Option B: Using sqlcmd (Command Line)**
```bash
sqlcmd -S localhost -d iAlign -i add_project_activities_migration.sql -o migration_output.log
```

**Option C: Using Azure Data Studio**
1. Open Azure Data Studio
2. Connect to your server
3. File > Open File > select `add_project_activities_migration.sql`
4. Select the correct database from dropdown
5. Run (F5)

### Step 4: Verify Migration Success

After running the migration, verify it was successful:

```sql
-- Check table exists
SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_NAME = 'ProjectActivities';
-- Should return 1

-- Check all columns exist
SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'ProjectActivities';
-- Should return 23 columns

-- Check indexes exist
SELECT name FROM sys.indexes
WHERE object_id = OBJECT_ID('ProjectActivities');
-- Should show 7 indexes (including PK)

-- Check views exist
SELECT name FROM sys.views
WHERE name IN ('vw_ActiveComments', 'vw_ActiveTasks');
-- Should return 2 rows

-- Check stored procedure exists
SELECT name FROM sys.procedures
WHERE name = 'sp_GetUserMentions';
-- Should return 1 row
```

## Database Schema

### ProjectActivities Table

| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK) | Auto-incrementing primary key |
| projectId | INT | Foreign key to Projects table |
| userId | INT (nullable) | Foreign key to Users (author) |
| activityType | VARCHAR(50) | Type: comment, task, status_change, etc. |
| content | NVARCHAR(MAX) | Comment/task text content |
| changes | NVARCHAR(MAX) | JSON field for tracking changes |
| relatedEntityType | VARCHAR(50) | Type of related entity |
| relatedEntityId | INT | ID of related entity |
| parentActivityId | INT (nullable) | For threaded replies |
| metadata | NVARCHAR(MAX) | JSON field for mentions, etc. |
| isPinned | BIT | Whether activity is pinned |
| isEdited | BIT | Whether activity was edited |
| editedDate | DATETIME2 | When activity was edited |
| assigneeId | INT (nullable) | User assigned to task |
| taskStatus | VARCHAR(20) | Task status (open, in_progress, etc.) |
| taskPriority | VARCHAR(20) | Task priority (low, medium, high, urgent) |
| dueDate | DATETIME2 | Task due date |
| completedDate | DATETIME2 | When task was completed |
| createdDate | DATETIME2 | When created |
| modifiedDate | DATETIME2 | When last modified |
| isActive | BIT | Soft delete flag |

### Indexes Created

1. **IX_ProjectActivities_ProjectId_CreatedDate** - For fetching project activities
2. **IX_ProjectActivities_UserId** - For user activity lookup
3. **IX_ProjectActivities_Assignee_Tasks** - For task queries by assignee
4. **IX_ProjectActivities_ActivityType** - For filtering by type
5. **IX_ProjectActivities_Pinned** - For pinned activities
6. **IX_ProjectActivities_ParentId** - For threaded replies

## Rollback Instructions

If you need to remove the Project Activities feature:

⚠️ **WARNING**: This will permanently delete all activity data!

### Before Rollback
1. Export activity data if you need it:
```sql
-- Export to CSV or backup
SELECT * INTO ProjectActivities_Backup FROM ProjectActivities;
```

2. Ensure no applications are currently using the table

### Run Rollback
```bash
sqlcmd -S localhost -d iAlign -i rollback_project_activities_migration.sql
```

## Troubleshooting

### Error: "Table already exists"
This is normal if the table was created by Sequelize sync. The script will check for missing columns and add them.

### Error: "Foreign key constraint conflict"
Check that Projects and Users tables exist and have the referenced columns (id).

### Error: "Cannot create index"
The index may already exist. The script checks before creating, but if you're re-running after a partial failure, you may need to drop existing indexes first.

### Performance Issues After Migration
If you experience slow queries:
1. Update statistics: `UPDATE STATISTICS ProjectActivities WITH FULLSCAN;`
2. Rebuild indexes: `ALTER INDEX ALL ON ProjectActivities REBUILD;`

## Production Deployment Checklist

- [ ] Database backup completed
- [ ] Migration script reviewed
- [ ] Database connection tested
- [ ] Application backend updated with new code
- [ ] Application frontend updated with new code
- [ ] Migration executed successfully
- [ ] Verification queries run successfully
- [ ] Application tested with new features
- [ ] Users notified of new features
- [ ] Rollback script available if needed

## Support

For issues or questions:
1. Check the application logs for errors
2. Review the migration output messages
3. Verify all verification queries return expected results
4. Check that backend routes are properly configured

## Related Files

### Backend Files
- `backend/src/models/ProjectActivity.ts` - Sequelize model
- `backend/src/controllers/projectActivity.controller.ts` - Activity endpoints
- `backend/src/controllers/userDashboard.controller.ts` - User tasks/mentions
- `backend/src/routes/projectActivity.routes.ts` - API routes

### Frontend Files
- `frontend/src/components/Projects/ProjectActivityFeed.tsx` - Activity feed UI
- `frontend/src/components/Projects/TasksList.tsx` - Tasks UI
- `frontend/src/services/activityService.ts` - API client
- `frontend/src/pages/UserDashboard/index.tsx` - User dashboard

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-02 | Initial migration with full feature set |

---

**Last Updated:** November 2, 2025
