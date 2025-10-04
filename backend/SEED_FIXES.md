# Seed Script Fixes Applied

## TypeScript Errors Fixed

### 1. Removed Unused Variable
**Error:** `'statuses' is declared but its value is never read`
**Fix:** Removed the unused `statuses` array declaration at line 218

### 2. Fixed null vs undefined Type Issues
**Error:** `Type 'null' is not assignable to type 'Date | undefined'`
**Fix:** Changed all `null` values to `undefined` for optional Date fields

**Locations Fixed:**
- Line 273-274: `actualStartDate` and `actualEndDate` in Project creation
- Line 315-316: `actualStartDate` and `actualEndDate` in Milestone creation
- Line 319: `dependencies` field in Milestone creation

## Changes Made

### In Project Creation (around line 255-280):
```typescript
// BEFORE
actualStartDate: status !== 'Planning' ? startDate : null,
actualEndDate: status === 'Completed' ? endDate : null,

// AFTER
actualStartDate: status !== 'Planning' ? startDate : undefined,
actualEndDate: status === 'Completed' ? endDate : undefined,
```

### In Milestone Creation (around line 308-323):
```typescript
// BEFORE
actualStartDate: status !== 'Not Started' ? phaseStart : null,
actualEndDate: status === 'Completed' ? phaseEnd : null,
dependencies: i > 0 ? JSON.stringify([i - 1]) : null,

// AFTER
actualStartDate: status !== 'Not Started' ? phaseStart : undefined,
actualEndDate: status === 'Completed' ? phaseEnd : undefined,
dependencies: i > 0 ? JSON.stringify([i - 1]) : undefined,
```

## Why This Matters

In TypeScript, when a field is defined as optional with type `Date | undefined`, you should use `undefined` rather than `null` to indicate the absence of a value. This aligns with TypeScript's type system and makes the code more consistent.

## Next Step

The seed script should now compile and run successfully:

```bash
npm run seed:dev
```

Expected output:
- Creates 48 users
- Creates 12 domains
- Creates 48 teams
- Creates ~150 resources
- Creates ~30 projects
- Creates ~210 milestones
- Creates 50 pipelines
- Creates resource allocations
- Creates capacity models and scenarios

Total execution time: ~10-30 seconds depending on system performance.
