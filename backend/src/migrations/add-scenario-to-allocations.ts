import sequelize from '../config/database';

async function migrateResourceAllocationScenario() {
  try {
    console.log('Starting migration: Adding scenarioId to ResourceAllocations...');

    // SQLite doesn't support adding columns with constraints directly
    // We need to recreate the table
    await sequelize.query(`
      -- Create a temporary table with the new structure
      CREATE TABLE ResourceAllocations_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scenarioId INTEGER,
        projectId INTEGER NOT NULL,
        resourceId INTEGER NOT NULL,
        milestoneId INTEGER,
        resourceCapabilityId INTEGER,
        projectRequirementId INTEGER,
        allocationType VARCHAR(50) NOT NULL DEFAULT 'Shared',
        allocationPercentage DECIMAL(5, 2) NOT NULL DEFAULT 0,
        allocatedHours DECIMAL(10, 2),
        matchScore DECIMAL(5, 2),
        startDate DATETIME,
        endDate DATETIME,
        actualStartDate DATETIME,
        actualEndDate DATETIME,
        billableRate DECIMAL(10, 2),
        cost DECIMAL(15, 2),
        roleOnProject VARCHAR(100),
        createdDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        modifiedDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        isActive BOOLEAN NOT NULL DEFAULT 1
      );
    `);

    // Copy data from old table to new table
    // For existing records, derive scenarioId from the Project's scenarioId
    await sequelize.query(`
      INSERT INTO ResourceAllocations_new
      SELECT
        ra.id,
        p.scenarioId as scenarioId,
        ra.projectId,
        ra.resourceId,
        ra.milestoneId,
        ra.resourceCapabilityId,
        ra.projectRequirementId,
        ra.allocationType,
        ra.allocationPercentage,
        ra.allocatedHours,
        ra.matchScore,
        ra.startDate,
        ra.endDate,
        ra.actualStartDate,
        ra.actualEndDate,
        ra.billableRate,
        ra.cost,
        ra.roleOnProject,
        ra.createdDate,
        ra.modifiedDate,
        ra.isActive
      FROM ResourceAllocations ra
      LEFT JOIN Projects p ON ra.projectId = p.id;
    `);

    // Drop old table
    await sequelize.query('DROP TABLE ResourceAllocations;');

    // Rename new table to ResourceAllocations
    await sequelize.query('ALTER TABLE ResourceAllocations_new RENAME TO ResourceAllocations;');

    // Create the composite unique index
    await sequelize.query(`
      CREATE UNIQUE INDEX unique_scenario_project_resource
      ON ResourceAllocations(scenarioId, projectId, resourceId);
    `);

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  migrateResourceAllocationScenario()
    .then(() => {
      console.log('Migration complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export default migrateResourceAllocationScenario;
