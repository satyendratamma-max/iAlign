import sequelize from '../config/database';
import seedDatabase from './seed-comprehensive';

const resetAndSeed = async () => {
  try {
    console.log('🗑️  Dropping all tables in correct order...\n');

    // Drop tables in reverse dependency order
    const tablesToDrop = [
      'ProjectDependencies',
      'ProjectDomainImpacts',
      'ProjectRequirements',
      'ResourceCapabilities',
      'Roles',
      'Technologies',
      'Apps',
      'CapacityScenarios',
      'CapacityModels',
      'ResourceAllocations',
      'Milestones',
      'Resources',
      'Projects',
      'SegmentFunctions',
      'Domains',
      'Scenarios',
      'Notifications',
      'Users',
    ];

    for (const table of tablesToDrop) {
      try {
        await sequelize.query(`DROP TABLE IF EXISTS [${table}]`);
        console.log(`   ✅ Dropped ${table}`);
      } catch (error: any) {
        console.log(`   ⚠️  Could not drop ${table}: ${error.message}`);
      }
    }

    console.log('\n✅ All tables dropped successfully\n');

    // Now run the seed
    await seedDatabase(false); // Don't force sync since we just dropped everything

    process.exit(0);
  } catch (error) {
    console.error('❌ Reset and seed failed:', error);
    process.exit(1);
  }
};

resetAndSeed();
