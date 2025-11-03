# Quick Start: Project Activities Migration

## TL;DR - Migration Steps

### For SQL Server Management Studio (SSMS)

1. **Backup Database**
   ```
   Right-click database "iAlign" > Tasks > Back Up...
   ```

2. **Run Migration**
   ```
   File > Open > add_project_activities_migration.sql
   Press F5 to execute
   ```

3. **Verify Success**
   ```
   File > Open > verify_migration.sql
   Press F5 to execute
   Look for "✓ ALL CHECKS PASSED!"
   ```

4. **Done!** Your database is ready.

---

## For Azure Data Studio

1. **Backup Database**
   ```sql
   BACKUP DATABASE iAlign
   TO DISK = 'C:\Backups\iAlign_Backup.bak';
   ```

2. **Run Migration**
   - Open `add_project_activities_migration.sql`
   - Select database: `iAlign`
   - Click Run (F5)

3. **Verify**
   - Open `verify_migration.sql`
   - Run (F5)

---

## For Command Line (sqlcmd)

```bash
# 1. Navigate to migrations directory
cd C:\Users\satye\projects\iAlign\database\migrations

# 2. Run migration
sqlcmd -S localhost -d iAlign -i add_project_activities_migration.sql

# 3. Verify
sqlcmd -S localhost -d iAlign -i verify_migration.sql
```

---

## What Gets Created

- **1 Table**: `ProjectActivities` (23 columns)
- **4 Foreign Keys**: To Projects, Users (x2), Self-referencing
- **6 Indexes**: For optimal query performance
- **2 Views**: `vw_ActiveComments`, `vw_ActiveTasks`
- **1 Stored Procedure**: `sp_GetUserMentions`

---

## Safety Features

✅ **Safe to run multiple times** - Script checks if objects exist
✅ **Preserves existing data** - No DROP or TRUNCATE commands
✅ **Production-ready** - Includes proper error handling
✅ **Rollback available** - Can be reversed if needed

---

## Troubleshooting

### "Table already exists"
✅ This is fine! The script will add any missing columns.

### "Foreign key conflict"
❌ Check that `Projects` and `Users` tables exist.

### "Permission denied"
❌ Ensure you have `db_ddladmin` role or higher.

---

## Need Help?

📖 Full documentation: See `README.md`
🔄 Rollback script: `rollback_project_activities_migration.sql`
✔️ Verification script: `verify_migration.sql`

---

## After Migration

1. ✅ Restart your backend application
2. ✅ Test creating a comment on a project
3. ✅ Test creating a task
4. ✅ Test @mentioning a user
5. ✅ Test replying to a comment

**Application URL**: http://localhost:3001

---

**Migration Version**: 1.0
**Last Updated**: November 2, 2025
