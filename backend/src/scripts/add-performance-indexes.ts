import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.resolve(__dirname, '../../database.sqlite'),
  logging: console.log,
});

async function addPerformanceIndexes() {
  console.log('Adding performance indexes...');

  try {
    // Allocations table indexes
    console.log('Adding indexes to ResourceAllocations table...');
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_allocations_scenarioId
      ON ResourceAllocations(scenarioId)
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_allocations_resourceId
      ON ResourceAllocations(resourceId)
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_allocations_projectId
      ON ResourceAllocations(projectId)
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_allocations_active
      ON ResourceAllocations(isActive)
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_allocations_dates
      ON ResourceAllocations(startDate, endDate)
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_allocations_scenario_active
      ON ResourceAllocations(scenarioId, isActive)
    `);

    // Projects table indexes
    console.log('Adding indexes to Projects table...');
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_projects_scenarioId
      ON Projects(scenarioId)
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_projects_domainId
      ON Projects(domainId)
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_projects_status
      ON Projects(status)
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_projects_fiscalYear
      ON Projects(fiscalYear)
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_projects_businessDecision
      ON Projects(businessDecision)
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_projects_active
      ON Projects(isActive)
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_projects_scenario_active
      ON Projects(scenarioId, isActive)
    `);

    // Resources table indexes
    console.log('Adding indexes to Resources table...');
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_resources_domainId
      ON Resources(domainId)
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_resources_role
      ON Resources(role)
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_resources_location
      ON Resources(location)
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_resources_active
      ON Resources(isActive)
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_resources_employeeId
      ON Resources(employeeId)
    `);

    // ResourceCapabilities table indexes
    console.log('Adding indexes to ResourceCapabilities table...');
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_capabilities_resourceId
      ON ResourceCapabilities(resourceId)
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_capabilities_isPrimary
      ON ResourceCapabilities(isPrimary)
    `);

    // ProjectRequirements table indexes
    console.log('Adding indexes to ProjectRequirements table...');
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_requirements_projectId
      ON ProjectRequirements(projectId)
    `);

    console.log('✅ All performance indexes added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding indexes:', error);
    process.exit(1);
  }
}

addPerformanceIndexes();
