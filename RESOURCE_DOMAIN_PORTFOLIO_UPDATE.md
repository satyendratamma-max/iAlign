# Resource Domain & Portfolio Relationship Update

## Summary
Successfully established relationships between Resources, Domains, and Portfolios throughout the application.

## Backend Changes

### 1. Resource Model (`backend/src/models/Resource.ts`)
- Added `domainId` field (optional INTEGER)
- Added `portfolioId` field (optional INTEGER)
- Updated TypeScript interface and class declarations

### 2. Model Associations (`backend/src/models/index.ts`)
Added new associations:
```typescript
// Resource Associations
Domain.hasMany(Resource, { foreignKey: 'domainId', as: 'resources' });
Resource.belongsTo(Domain, { foreignKey: 'domainId', as: 'domain' });

Portfolio.hasMany(Resource, { foreignKey: 'portfolioId', as: 'resources' });
Resource.belongsTo(Portfolio, { foreignKey: 'portfolioId', as: 'portfolio' });
```

### 3. Resource Controller (`backend/src/controllers/resource.controller.ts`)
- Updated `getAllResources()` to include Domain and Portfolio data
- Updated `getResourceById()` to include Domain and Portfolio data
- Both methods now return nested domain and portfolio objects with id and name

### 4. Database Migration
Created migration file: `backend/migrations/add_domain_portfolio_to_resources.sql`
- Added `domainId` column to Resources table
- Added `portfolioId` column to Resources table
- Created indexes for improved query performance
- Migration successfully executed on SQLite database

## Frontend Changes

### Resource Overview Page (`frontend/src/pages/Resources/ResourceOverview.tsx`)

#### Updated Interface
- Added `domainId` and `portfolioId` fields
- Added nested `domain` and `portfolio` objects

#### New Features
1. **Domain Column**: Displays the domain name for each resource
2. **Portfolio Column**: Displays the portfolio name for each resource
3. **Domain Filter**: Dropdown filter in header to filter by domain
4. **Portfolio Filter**: Dropdown filter in header to filter by portfolio
5. **Edit Dialog**: Added domain and portfolio selectors when creating/editing resources

#### Data Fetching
- Now fetches domains and portfolios alongside resources
- Uses Promise.all for parallel API calls

## Filterable Headers
Both Projects and Resource Overview pages now have filterable header columns:

### Projects Page Filters
- Project Name (text input)
- Domain (dropdown)
- Portfolio (dropdown)
- Status (dropdown)
- Priority (dropdown)
- Health Status (dropdown)

### Resource Overview Filters
- Employee ID (text input)
- Name (text input)
- Domain (dropdown)
- Portfolio (dropdown)
- Role (text input)
- Location (text input)

## How to Use

1. **Run the migration** (already completed):
   ```bash
   cd backend
   sqlite3 database.sqlite < migrations/add_domain_portfolio_to_resources.sql
   ```

2. **Restart the backend server** to load the updated models

3. **Access Resource Overview** to assign domains and portfolios to resources

4. **Use filters** to find resources by domain, portfolio, or other criteria

## Database Schema
The Resources table now includes:
- `domainId` (INTEGER) - Foreign key to Domains table
- `portfolioId` (INTEGER) - Foreign key to Portfolios table
- Indexes on both columns for performance

## Notes
- Domain and Portfolio assignments are optional for resources
- Existing resources will have NULL values for these fields until updated
- The UI shows "-" when domain or portfolio is not assigned
- All filters work in combination (AND logic)
