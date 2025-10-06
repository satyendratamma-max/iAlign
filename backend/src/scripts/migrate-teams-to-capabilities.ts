/**
 * Migration Script: Domain Teams to Resource Capabilities
 *
 * This script migrates existing team/skill-based data to the new
 * capability-based system (App/Technology/Role).
 *
 * Usage:
 *   npx ts-node src/scripts/migrate-teams-to-capabilities.ts
 */

import sequelize from '../config/database';
import Resource from '../models/Resource';
import ResourceCapability from '../models/ResourceCapability';
import App from '../models/App';
import Technology from '../models/Technology';
import Role from '../models/Role';
import logger from '../config/logger';

interface SkillMapping {
  skill: string;
  appId: number;
  technologyId: number;
  roleId: number;
  proficiencyLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
}

/**
 * Default skill mappings
 * Map common skills to App/Technology/Role combinations
 */
const SKILL_MAPPINGS: SkillMapping[] = [
  // SAP Skills
  { skill: 'SAP ABAP', appId: 1, technologyId: 1, roleId: 1, proficiencyLevel: 'Intermediate' },
  { skill: 'SAP Fiori', appId: 1, technologyId: 2, roleId: 2, proficiencyLevel: 'Intermediate' },
  { skill: 'SAP HANA', appId: 1, technologyId: 3, roleId: 3, proficiencyLevel: 'Advanced' },
  { skill: 'SAP BTP', appId: 1, technologyId: 4, roleId: 4, proficiencyLevel: 'Intermediate' },

  // Salesforce Skills
  { skill: 'Salesforce Apex', appId: 2, technologyId: 6, roleId: 6, proficiencyLevel: 'Intermediate' },
  { skill: 'Salesforce Lightning', appId: 2, technologyId: 7, roleId: 7, proficiencyLevel: 'Intermediate' },
  { skill: 'Salesforce Admin', appId: 2, technologyId: 8, roleId: 8, proficiencyLevel: 'Intermediate' },

  // AWS Skills
  { skill: 'AWS Lambda', appId: 3, technologyId: 10, roleId: 10, proficiencyLevel: 'Intermediate' },
  { skill: 'AWS EC2', appId: 3, technologyId: 11, roleId: 11, proficiencyLevel: 'Intermediate' },
  { skill: 'AWS DevOps', appId: 3, technologyId: 12, roleId: 12, proficiencyLevel: 'Advanced' },

  // Generic/Global Skills
  { skill: 'JavaScript', appId: 4, technologyId: 14, roleId: 13, proficiencyLevel: 'Intermediate' },
  { skill: 'React', appId: 4, technologyId: 14, roleId: 13, proficiencyLevel: 'Intermediate' },
  { skill: 'Node.js', appId: 4, technologyId: 15, roleId: 14, proficiencyLevel: 'Intermediate' },
  { skill: 'Python', appId: 4, technologyId: 16, roleId: 15, proficiencyLevel: 'Intermediate' },
  { skill: 'Java', appId: 4, technologyId: 17, roleId: 16, proficiencyLevel: 'Intermediate' },
  { skill: 'Database', appId: 4, technologyId: 18, roleId: 15, proficiencyLevel: 'Intermediate' },
];

/**
 * Find best matching capability for a given skill
 */
function findSkillMapping(skill: string): SkillMapping | null {
  const normalizedSkill = skill.toLowerCase().trim();

  // Try exact match first
  const exactMatch = SKILL_MAPPINGS.find(
    (m) => m.skill.toLowerCase() === normalizedSkill
  );
  if (exactMatch) return exactMatch;

  // Try partial match
  const partialMatch = SKILL_MAPPINGS.find(
    (m) => normalizedSkill.includes(m.skill.toLowerCase()) ||
           m.skill.toLowerCase().includes(normalizedSkill)
  );
  if (partialMatch) return partialMatch;

  // Default to generic developer role
  return {
    skill: skill,
    appId: 4, // General Development
    technologyId: 14, // JavaScript (most common)
    roleId: 13, // Full Stack Developer
    proficiencyLevel: 'Intermediate',
  };
}

/**
 * Estimate proficiency level based on years of experience
 */
function estimateProficiency(yearsExp?: number): 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' {
  if (!yearsExp || yearsExp < 2) return 'Beginner';
  if (yearsExp < 5) return 'Intermediate';
  if (yearsExp < 10) return 'Advanced';
  return 'Expert';
}

/**
 * Main migration function
 */
async function migrateTeamsToCapabilities() {
  const transaction = await sequelize.transaction();

  try {
    logger.info('Starting migration: Domain Teams → Resource Capabilities');

    // 1. Get all active resources
    const resources = await Resource.findAll({
      where: { isActive: true },
      transaction,
    });

    logger.info(`Found ${resources.length} active resources to migrate`);

    let createdCount = 0;
    let skippedCount = 0;

    for (const resource of resources) {
      logger.info(`Processing resource: ${resource.firstName} ${resource.lastName} (ID: ${resource.id})`);

      // Check if resource already has capabilities
      const existingCapabilities = await ResourceCapability.count({
        where: { resourceId: resource.id, isActive: true },
        transaction,
      });

      if (existingCapabilities > 0) {
        logger.info(`  ↳ Skipping - already has ${existingCapabilities} capabilities`);
        skippedCount++;
        continue;
      }

      // Create capabilities based on primary and secondary skills
      const capabilities: Array<{
        resourceId: number;
        appId: number;
        technologyId: number;
        roleId: number;
        proficiencyLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
        yearsOfExperience?: number;
        isPrimary: boolean;
        isActive: boolean;
      }> = [];

      // Process primary skill
      if (resource.primarySkill) {
        const mapping = findSkillMapping(resource.primarySkill);
        if (mapping) {
          capabilities.push({
            resourceId: resource.id,
            appId: mapping.appId,
            technologyId: mapping.technologyId,
            roleId: mapping.roleId,
            proficiencyLevel: mapping.proficiencyLevel,
            yearsOfExperience: undefined,
            isPrimary: true,
            isActive: true,
          });
          logger.info(`  ↳ Primary skill: ${resource.primarySkill} → ${mapping.skill}`);
        }
      }

      // Process secondary skills (comma-separated)
      if (resource.secondarySkills) {
        const secondarySkillList = resource.secondarySkills
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s.length > 0);

        for (const skill of secondarySkillList) {
          const mapping = findSkillMapping(skill);
          if (mapping) {
            // Check for duplicates
            const isDuplicate = capabilities.some(
              (c) =>
                c.appId === mapping.appId &&
                c.technologyId === mapping.technologyId &&
                c.roleId === mapping.roleId
            );

            if (!isDuplicate) {
              capabilities.push({
                resourceId: resource.id,
                appId: mapping.appId,
                technologyId: mapping.technologyId,
                roleId: mapping.roleId,
                proficiencyLevel: mapping.proficiencyLevel,
                yearsOfExperience: undefined,
                isPrimary: false,
                isActive: true,
              });
              logger.info(`  ↳ Secondary skill: ${skill} → ${mapping.skill}`);
            }
          }
        }
      }

      // If no skills found, create a default capability
      if (capabilities.length === 0) {
        logger.info(`  ↳ No skills found, creating default capability`);
        capabilities.push({
          resourceId: resource.id,
          appId: 4, // General Development
          technologyId: 14, // JavaScript
          roleId: 13, // Full Stack Developer
          proficiencyLevel: 'Intermediate',
          yearsOfExperience: undefined,
          isPrimary: true,
          isActive: true,
        });
      }

      // Bulk create capabilities
      if (capabilities.length > 0) {
        await ResourceCapability.bulkCreate(capabilities, { transaction });
        createdCount += capabilities.length;
        logger.info(`  ✓ Created ${capabilities.length} capabilities`);
      }
    }

    await transaction.commit();

    logger.info('='.repeat(60));
    logger.info('Migration completed successfully!');
    logger.info(`Resources processed: ${resources.length}`);
    logger.info(`Capabilities created: ${createdCount}`);
    logger.info(`Resources skipped (already migrated): ${skippedCount}`);
    logger.info('='.repeat(60));

  } catch (error) {
    await transaction.rollback();
    logger.error('Migration failed!', error);
    throw error;
  }
}

/**
 * Dry run - preview what would be migrated without making changes
 */
async function dryRunMigration() {
  try {
    logger.info('DRY RUN: Previewing migration (no changes will be made)');
    logger.info('='.repeat(60));

    const resources = await Resource.findAll({
      where: { isActive: true },
    });

    logger.info(`Found ${resources.length} active resources\n`);

    for (const resource of resources) {
      const existingCapabilities = await ResourceCapability.count({
        where: { resourceId: resource.id, isActive: true },
      });

      logger.info(`${resource.firstName} ${resource.lastName} (ID: ${resource.id})`);
      logger.info(`  Primary Skill: ${resource.primarySkill || 'None'}`);
      logger.info(`  Secondary Skills: ${resource.secondarySkills || 'None'}`);
      logger.info(`  Existing Capabilities: ${existingCapabilities}`);

      if (existingCapabilities === 0) {
        logger.info(`  Would create capabilities for:`);

        if (resource.primarySkill) {
          const mapping = findSkillMapping(resource.primarySkill);
          logger.info(`    - ${resource.primarySkill} → App:${mapping?.appId}, Tech:${mapping?.technologyId}, Role:${mapping?.roleId} (Primary)`);
        }

        if (resource.secondarySkills) {
          const skills = resource.secondarySkills.split(',').map((s) => s.trim());
          for (const skill of skills) {
            const mapping = findSkillMapping(skill);
            logger.info(`    - ${skill} → App:${mapping?.appId}, Tech:${mapping?.technologyId}, Role:${mapping?.roleId}`);
          }
        }
      }

      logger.info('');
    }

    logger.info('='.repeat(60));
    logger.info('DRY RUN COMPLETE - No changes were made');
    logger.info('To run actual migration: npx ts-node src/scripts/migrate-teams-to-capabilities.ts --execute');

  } catch (error) {
    logger.error('Dry run failed!', error);
    throw error;
  }
}

// Entry point
const args = process.argv.slice(2);
const isExecute = args.includes('--execute');

if (isExecute) {
  migrateTeamsToCapabilities()
    .then(() => {
      logger.info('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Migration script failed', error);
      process.exit(1);
    });
} else {
  dryRunMigration()
    .then(() => {
      logger.info('Dry run completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Dry run failed', error);
      process.exit(1);
    });
}
