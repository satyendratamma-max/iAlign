# 🌱 Seed Database with Test Data

## Quick Start

Run this command from the backend directory to populate your database with test data:

```bash
cd backend
npm run seed:dev
```

## What Gets Created

### 👥 Users (5)
- **admin@ialign.com** - Administrator
- **john.smith@ialign.com** - Portfolio Manager
- **sarah.jones@ialign.com** - Portfolio Manager
- **mike.davis@ialign.com** - Project Manager
- **emma.wilson@ialign.com** - Project Manager

**All users have the same password**: `Admin@123`

### 📁 Portfolios (3)
1. **Digital Transformation** - $5.5M value, 22.5% ROI
2. **Infrastructure Modernization** - $3.2M value, 18.3% ROI
3. **Customer Experience** - $4.1M value, 25.8% ROI

### 📊 Projects (8)
Distributed across portfolios with various:
- Statuses: In Progress, Planning, Completed, On Hold
- Priorities: Critical, High, Medium, Low
- Health: Green, Yellow, Red
- Progress: 15% to 100%
- Budgets: $420K to $2.2M

## Dashboard Data

After seeding, the dashboard will show:
- **Total Portfolio Value**: $12.8M
- **Active Projects**: 8 projects
- **Average ROI**: 22.2%
- **Projects by Status**: Visual breakdown
- **Budget vs Actual**: Cost tracking
- **Health Status**: Traffic light indicators

## ⚠️ Warning

**This will DELETE all existing data and create fresh test data!**

The seed script runs `sequelize.sync({ force: true })` which:
- Drops all tables
- Recreates schema
- Inserts test data

## Alternative: Manual Seeding

If you want to keep existing data, you can selectively create records via the API:

### Create Portfolio
```bash
curl -X POST http://localhost:5000/api/v1/portfolios \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Portfolio",
    "description": "Test portfolio",
    "type": "Strategic",
    "totalValue": 1000000
  }'
```

### Create Project
```bash
curl -X POST http://localhost:5000/api/v1/projects \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "portfolioId": 1,
    "name": "My Project",
    "status": "In Progress",
    "priority": "High",
    "progress": 50,
    "budget": 500000
  }'
```

## Next Steps

1. Run the seed script
2. Restart the backend (if needed): `npm run dev`
3. Login to the frontend with: **admin@ialign.com** / **Admin@123**
4. View populated dashboard with charts and metrics
5. Explore portfolios, projects, and other modules

---

**Seed Script Location**: `backend/src/scripts/seed.ts`
