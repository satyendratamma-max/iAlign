import sequelize from '../config/database';
import Scenario from '../models/Scenario';
import Project from '../models/Project';
import Resource from '../models/Resource';
import Milestone from '../models/Milestone';
import ProjectDependency from '../models/ProjectDependency';
import User from '../models/User';

const migrateAddScenarios = async () => {
  try {
    console.log('🔄 Starting scenario migration...\n');

    // Step 1: Sync Scenario model to create the table
    console.log('1️⃣  Creating Scenarios table...');
    await Scenario.sync({ alter: true });
    console.log('   ✅ Scenarios table created\n');

    // Step 2: Add scenarioId columns to existing tables
    console.log('2️⃣  Adding scenarioId columns to existing tables...');

    // Add scenarioId to Projects table
    try {
      await sequelize.query(`
        ALTER TABLE Projects ADD COLUMN scenarioId INTEGER;
      `);
      console.log('   ✅ Added scenarioId to Projects table');
    } catch (error: any) {
      if (error.message.includes('duplicate column name')) {
        console.log('   ⏭️  scenarioId column already exists in Projects table');
      } else {
        throw error;
      }
    }

    // Add scenarioId to Resources table
    try {
      await sequelize.query(`
        ALTER TABLE Resources ADD COLUMN scenarioId INTEGER;
      `);
      console.log('   ✅ Added scenarioId to Resources table');
    } catch (error: any) {
      if (error.message.includes('duplicate column name')) {
        console.log('   ⏭️  scenarioId column already exists in Resources table');
      } else {
        throw error;
      }
    }

    // Add scenarioId to Milestones table
    try {
      await sequelize.query(`
        ALTER TABLE Milestones ADD COLUMN scenarioId INTEGER;
      `);
      console.log('   ✅ Added scenarioId to Milestones table');
    } catch (error: any) {
      if (error.message.includes('duplicate column name')) {
        console.log('   ⏭️  scenarioId column already exists in Milestones table');
      } else {
        throw error;
      }
    }

    // Add scenarioId to ProjectDependencies table
    try {
      await sequelize.query(`
        ALTER TABLE ProjectDependencies ADD COLUMN scenarioId INTEGER;
      `);
      console.log('   ✅ Added scenarioId to ProjectDependencies table');
    } catch (error: any) {
      if (error.message.includes('duplicate column name')) {
        console.log('   ⏭️  scenarioId column already exists in ProjectDependencies table');
      } else {
        throw error;
      }
    }
    console.log();

    // Step 3: Create baseline scenario
    console.log('3️⃣  Creating baseline scenario...');

    // Get the first admin user to be the creator
    const adminUser = await User.findOne({ where: { role: 'Administrator' } });
    const creatorId = adminUser?.id || 1;

    // Check if baseline scenario already exists
    let baselineScenario = await Scenario.findOne({
      where: { name: 'Baseline', status: 'published' }
    });

    if (!baselineScenario) {
      baselineScenario = await Scenario.create({
        name: 'Baseline',
        description: 'Default baseline scenario containing all existing project and resource data',
        status: 'published',
        createdBy: creatorId,
        publishedBy: creatorId,
        publishedDate: new Date(),
      });
      console.log(`   ✅ Created baseline scenario (ID: ${baselineScenario.id})\n`);
    } else {
      console.log(`   ⏭️  Baseline scenario already exists (ID: ${baselineScenario.id})\n`);
    }

    // Step 4: Assign all existing data to baseline scenario
    console.log('4️⃣  Assigning existing data to baseline scenario...');

    // Update Projects with scenarioId = NULL
    const projects = await Project.findAll();
    let projectsCount = 0;
    for (const project of projects) {
      if (!project.scenarioId) {
        await project.update({ scenarioId: baselineScenario.id });
        projectsCount++;
      }
    }
    console.log(`   ✅ Updated ${projectsCount} projects`);

    // Update Resources with scenarioId = NULL
    const resources = await Resource.findAll();
    let resourcesCount = 0;
    for (const resource of resources) {
      if (!resource.scenarioId) {
        await resource.update({ scenarioId: baselineScenario.id });
        resourcesCount++;
      }
    }
    console.log(`   ✅ Updated ${resourcesCount} resources`);

    // Update Milestones with scenarioId = NULL
    const milestonesList = await Milestone.findAll();
    let milestonesCount = 0;
    for (const milestone of milestonesList) {
      if (!milestone.scenarioId) {
        await milestone.update({ scenarioId: baselineScenario.id });
        milestonesCount++;
      }
    }
    console.log(`   ✅ Updated ${milestonesCount} milestones`);

    // Update ProjectDependencies with scenarioId = NULL
    const dependencies = await ProjectDependency.findAll();
    let dependenciesCount = 0;
    for (const dependency of dependencies) {
      if (!dependency.scenarioId) {
        await dependency.update({ scenarioId: baselineScenario.id });
        dependenciesCount++;
      }
    }
    console.log(`   ✅ Updated ${dependenciesCount} project dependencies\n`);

    // Step 5: Verification
    console.log('5️⃣  Verifying migration...');
    const scenarios = await Scenario.findAll();
    const projectCount = await Project.count({ where: { scenarioId: baselineScenario.id } });
    const resourceCount = await Resource.count({ where: { scenarioId: baselineScenario.id } });
    const milestoneCount = await Milestone.count({ where: { scenarioId: baselineScenario.id } });
    const dependencyCount = await ProjectDependency.count({ where: { scenarioId: baselineScenario.id } });

    console.log(`   📊 Total scenarios: ${scenarios.length}`);
    console.log(`   📊 Projects in baseline: ${projectCount}`);
    console.log(`   📊 Resources in baseline: ${resourceCount}`);
    console.log(`   📊 Milestones in baseline: ${milestoneCount}`);
    console.log(`   📊 Dependencies in baseline: ${dependencyCount}\n`);

    console.log('✅ Scenario migration completed successfully!\n');
    console.log('🎯 Next Steps:');
    console.log('   - All existing data is now in the "Baseline" published scenario');
    console.log('   - Users can now create their own planned scenarios');
    console.log('   - Domain managers and admins can publish scenarios');
    console.log('   - Start building backend controllers and frontend UI\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// Run the migration if this script is executed directly
if (require.main === module) {
  migrateAddScenarios()
    .then(() => {
      console.log('✨ Migration script finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

export default migrateAddScenarios;
