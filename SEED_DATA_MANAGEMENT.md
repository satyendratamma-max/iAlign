# Seed Data Management

## Overview

The iAlign application uses seed data for Apps, Technologies, and Roles. This document explains how to manage and update this seed data to ensure that UI changes persist across database resets.

## The Problem

Previously, if you updated Apps, Technologies, or Roles through the UI and then ran the seed script again, your changes would be lost because the seed script always used static data from `backend/src/scripts/seed-enterprise-data.ts`.

## The Solution

We now have a two-way sync system:
1. **Export**: Extract current database state to update the seed data file
2. **Import**: Seed script uses the updated data on next run

## Workflow

### 1. Make Changes in the UI

Use the Admin Tools section to:
- Add/edit/delete Apps in **Apps Management**
- Add/edit/delete Technologies in **Technologies Management**
- Add/edit/delete Roles in **Roles Management**

### 2. Export Changes to Seed File

After making your changes, run the export script to update the seed data file:

```bash
cd backend
npm run seed:export
```

This will:
- Read all current Apps, Technologies, and Roles from the database
- Create a backup of the existing `seed-enterprise-data.ts` file
- Update `seed-enterprise-data.ts` with the current database state
- Show a summary of what was exported

### 3. Run Seed Script (Next Time)

The next time you run the seed script, it will use your updated data:

```bash
cd backend
npm run seed:dev
```

## Available Scripts

### `npm run seed:dev`
Runs the comprehensive seed script that:
- Drops and recreates all tables (with `dropTables: true`)
- Seeds Apps, Technologies, Roles
- Creates Users, Domains, Segment Functions
- Creates Projects, Resources, Allocations
- Creates all other test data

### `npm run seed:export`
Exports current Apps, Technologies, and Roles from the database to `seed-enterprise-data.ts`:
- Creates a timestamped backup of the existing file
- Overwrites `seed-enterprise-data.ts` with current database state
- Preserves capability mappings (reference data)

## File Structure

```
backend/src/scripts/
├── seed-enterprise-data.ts       # Static seed data (Apps, Technologies, Roles)
├── seed-comprehensive.ts         # Main seed script (creates all data)
├── export-seed-data.ts          # Export script (DB → seed file)
└── seed-enterprise-data.backup.*.ts  # Automatic backups
```

## Important Notes

1. **Capability Mappings**: The `capabilityMappings` array in `seed-enterprise-data.ts` is reference data and is NOT automatically updated. You'll need to manually maintain these if you add new app/tech/role combinations.

2. **Backups**: Every time you run `npm run seed:export`, a timestamped backup is created. These files can be deleted manually if they accumulate.

3. **Tech-to-App Mapping**: Technologies are automatically mapped to their parent Apps based on code patterns. If you add new technologies with new code patterns, you may need to update the mapping logic in both:
   - `backend/src/scripts/export-seed-data.ts` (export logic)
   - `backend/src/scripts/seed-enterprise-data.ts` (import logic)

4. **Data Types**: The export script preserves all required fields:
   - Apps: name, code, category, description, isGlobal, status
   - Technologies: name, code, category, description
   - Roles: name, code, level, category

## Example Use Case

**Scenario**: You need to add a new App called "ServiceNow ITSM" with associated technologies.

**Steps**:
1. Use Admin Tools → Apps Management to create the new app
2. Use Admin Tools → Technologies Management to create related technologies
3. Use Admin Tools → Roles Management to create related roles (if needed)
4. Run `npm run seed:export` to save your changes
5. Commit the updated `seed-enterprise-data.ts` to version control
6. Team members pulling your changes will get the updated seed data

## Troubleshooting

### Export fails with database connection error
- Make sure the backend server is not running (it may lock the database)
- Check your database connection settings in `.env`

### Changes not reflected after seeding
- Verify you ran `npm run seed:export` after making UI changes
- Check that `seed-enterprise-data.ts` was actually updated (check file timestamp)
- Ensure you ran `npm run seed:dev` (not just `npm run seed`)

### Lost data after running seed script
- The seed script with `dropTables: true` will **delete all data**
- Use `npm run seed:export` BEFORE running the seed script to preserve changes
- Check the backup files (`seed-enterprise-data.backup.*.ts`) to restore if needed
