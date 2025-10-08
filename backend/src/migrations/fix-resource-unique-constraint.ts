import sequelize from '../config/database';

async function migrateResourceUniqueConstraint() {
  try {
    console.log('Starting migration: Fixing Resource unique constraint...');

    // SQLite doesn't support dropping constraints directly
    // We need to recreate the table
    await sequelize.query(`
      -- Create a temporary table with the new structure
      CREATE TABLE Resources_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scenarioId INTEGER,
        domainId INTEGER,
        segmentFunctionId INTEGER,
        employeeId VARCHAR(50) NOT NULL,
        firstName VARCHAR(100),
        lastName VARCHAR(100),
        email VARCHAR(200),
        primarySkill VARCHAR(50),
        secondarySkills TEXT,
        role VARCHAR(100),
        location VARCHAR(100),
        timezone VARCHAR(50),
        hourlyRate DECIMAL(10, 2),
        monthlyCost DECIMAL(15, 2),
        totalCapacityHours INTEGER DEFAULT 160,
        utilizationRate DECIMAL(5, 2),
        homeLocation VARCHAR(100),
        isRemote BOOLEAN NOT NULL DEFAULT 0,
        isActive BOOLEAN NOT NULL DEFAULT 1,
        createdDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Copy data from old table to new table
    await sequelize.query(`
      INSERT INTO Resources_new
      SELECT * FROM Resources;
    `);

    // Drop old table
    await sequelize.query('DROP TABLE Resources;');

    // Rename new table to Resources
    await sequelize.query('ALTER TABLE Resources_new RENAME TO Resources;');

    // Create the composite unique index
    await sequelize.query(`
      CREATE UNIQUE INDEX unique_scenario_employee
      ON Resources(scenarioId, employeeId);
    `);

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  migrateResourceUniqueConstraint()
    .then(() => {
      console.log('Migration complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export default migrateResourceUniqueConstraint;
