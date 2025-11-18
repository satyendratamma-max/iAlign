/**
 * Data Migration Script: Fix ResourceAllocations with missing or zero scenarioId
 *
 * Purpose:
 * - Find all allocations with scenarioId = 0, NULL, or undefined
 * - Set scenarioId from the associated project's scenarioId
 * - Log all changes for audit purposes
 *
 * Usage:
 *   npx ts-node src/scripts/fixAllocationScenarioIds.ts
 */

import { Op } from 'sequelize';
import sequelize from '../config/database';
import logger from '../config/logger';
// Import models with associations
import { ResourceAllocation, Project } from '../models';

async function fixAllocationScenarioIds() {
  const transaction = await sequelize.transaction();

  try {
    console.log('🔍 Finding allocations with missing or zero scenarioId...\n');

    // Find all allocations with scenarioId = 0, NULL, or undefined
    // Type assertion needed because model now defines scenarioId as required,
    // but we're specifically searching for invalid legacy data to fix
    const problematicAllocations = await ResourceAllocation.findAll({
      where: {
        [Op.or]: [
          { scenarioId: 0 },
          { scenarioId: null as any },
        ],
        isActive: true,
      } as any,
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'scenarioId'],
        },
      ],
    });

    console.log(`Found ${problematicAllocations.length} allocations with missing scenarioId\n`);

    if (problematicAllocations.length === 0) {
      console.log('✅ No allocations need fixing. All allocations have valid scenarioId.');
      await transaction.commit();
      return;
    }

    let fixed = 0;
    let skipped = 0;
    const fixes: any[] = [];

    for (const allocation of problematicAllocations) {
      const project = (allocation as any).project;

      if (!project) {
        console.log(`⚠️  Allocation ${allocation.id}: No associated project found - SKIPPED`);
        skipped++;
        continue;
      }

      if (!project.scenarioId) {
        console.log(
          `⚠️  Allocation ${allocation.id}: Project ${project.id} (${project.name}) has no scenarioId - SKIPPED`
        );
        skipped++;
        continue;
      }

      // Update the allocation with the project's scenarioId
      await allocation.update(
        { scenarioId: project.scenarioId },
        { transaction }
      );

      fixes.push({
        allocationId: allocation.id,
        projectId: project.id,
        projectName: project.name,
        newScenarioId: project.scenarioId,
      });

      fixed++;
    }

    // Commit the transaction
    await transaction.commit();

    console.log('\n📊 Summary:');
    console.log(`   Total found: ${problematicAllocations.length}`);
    console.log(`   Fixed: ${fixed}`);
    console.log(`   Skipped: ${skipped}`);

    if (fixes.length > 0) {
      console.log('\n✅ Fixed allocations:');
      fixes.forEach((fix) => {
        console.log(
          `   - Allocation ${fix.allocationId}: Set scenarioId=${fix.newScenarioId} (from Project ${fix.projectId}: "${fix.projectName}")`
        );
      });
    }

    console.log('\n✅ Data migration completed successfully!');
    logger.info(`Fixed ${fixed} resource allocations with missing scenarioId`);
  } catch (error) {
    await transaction.rollback();
    console.error('\n❌ Error during migration:', error);
    logger.error('Failed to fix allocation scenarioIds:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the migration
fixAllocationScenarioIds()
  .then(() => {
    console.log('\n🎉 Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration script failed:', error);
    process.exit(1);
  });
