import sequelize from '../config/database';

async function dropUniqueConstraint() {
  try {
    console.log('Dropping unique constraint from ResourceAllocations table...');

    // Drop the unique constraint
    await sequelize.query(`
      IF EXISTS (
        SELECT * FROM sys.indexes
        WHERE name = 'unique_scenario_project_resource'
        AND object_id = OBJECT_ID('ResourceAllocations')
      )
      BEGIN
        DROP INDEX unique_scenario_project_resource ON ResourceAllocations;
        PRINT 'Unique constraint dropped successfully';
      END
      ELSE
      BEGIN
        PRINT 'Unique constraint does not exist, nothing to drop';
      END
    `);

    console.log('✓ Migration completed successfully');
    console.log('Resources can now be allocated multiple times to the same project for different requirements');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error dropping unique constraint:', error);
    process.exit(1);
  }
}

dropUniqueConstraint();
