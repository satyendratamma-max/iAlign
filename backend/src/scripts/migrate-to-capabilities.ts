/**
 * Migration Script: Transform old Team/Skill model to App/Technology/Role Capabilities
 *
 * This script migrates existing resources from the old model:
 * - domainTeamId (being removed)
 * - primarySkill (string field)
 * - secondarySkills (JSON array string)
 * - role (string field)
 *
 * To the new cascaded capability model:
 * - ResourceCapabilities junction table with App → Technology → Role
 *
 * Run with: npx ts-node src/scripts/migrate-to-capabilities.ts
 */

import Resource from '../models/Resource';
import App from '../models/App';
import Technology from '../models/Technology';
import Role from '../models/Role';
import ResourceCapability from '../models/ResourceCapability';
import sequelize from '../config/database';
import logger from '../config/logger';

// ========================================
// SKILL MAPPING CONFIGURATION
// ========================================
// Maps old skill names to Technology codes
const SKILL_TO_TECHNOLOGY_MAP: Record<string, string> = {
  // SAP-related skills
  'ABAP': 'ABAP',
  'SAP Fiori': 'FIORI',
  'SAP HANA': 'HANA',
  'SAP UI5': 'UI5',

  // Salesforce-related skills
  'Apex': 'APEX',
  'Visualforce': 'VF',
  'Lightning Web Components': 'LWC',
  'LWC': 'LWC',
  'SOQL': 'SOQL',

  // AWS-related skills
  'Lambda': 'LAMBDA',
  'AWS Lambda': 'LAMBDA',
  'EC2': 'EC2',
  'S3': 'S3',
  'RDS': 'RDS',

  // Global technologies
  'JavaScript': 'JS',
  'JS': 'JS',
  'TypeScript': 'TS',
  'TS': 'TS',
  'React': 'REACT',
  'Node.js': 'NODE',
  'Node': 'NODE',
  'Python': 'PY',
  'Java': 'JAVA',
  'PostgreSQL': 'PSQL',
  'Postgres': 'PSQL',
  'Docker': 'DOCKER',
};

// Maps old role names to Role codes
const ROLE_NAME_MAP: Record<string, string> = {
  // Generic roles
  'Developer': 'DEV',
  'Software Developer': 'DEV',
  'Senior Developer': 'SR_DEV',
  'Senior Software Engineer': 'SR_DEV',
  'QA Engineer': 'QA',
  'Tester': 'QA',
  'Project Manager': 'PM',
  'DevOps Engineer': 'DEVOPS',
  'DevOps': 'DEVOPS',

  // SAP-specific roles
  'SAP Consultant': 'SAP_FUNC',
  'SAP Functional Consultant': 'SAP_FUNC',
  'SAP Administrator': 'SAP_BASIS',
  'SAP Basis Administrator': 'SAP_BASIS',
  'SAP ABAP Developer': 'SAP_ABAP_DEV',
  'Senior SAP ABAP Developer': 'SR_SAP_ABAP_DEV',
  'SAP Fiori Developer': 'SAP_FIORI_DEV',

  // Salesforce-specific roles
  'Salesforce Administrator': 'SFDC_ADMIN',
  'SFDC Admin': 'SFDC_ADMIN',
  'Salesforce Architect': 'SFDC_ARCH',
  'Salesforce Apex Developer': 'SFDC_APEX_DEV',
  'Salesforce LWC Developer': 'SFDC_LWC_DEV',

  // AWS-specific roles
  'AWS Architect': 'AWS_ARCH',
  'AWS Solutions Architect': 'AWS_ARCH',
  'AWS Lambda Developer': 'AWS_LAMBDA_DEV',
};

// ========================================
// MIGRATION FUNCTIONS
// ========================================

interface MigrationStats {
  totalResources: number;
  migratedResources: number;
  capabilitiesCreated: number;
  skippedResources: number;
  errors: string[];
}

async function findTechnologyByCode(code: string): Promise<Technology | null> {
  return await Technology.findOne({ where: { code } });
}

async function findRoleByCode(code: string): Promise<Role | null> {
  return await Role.findOne({ where: { code } });
}

async function findCompatibleRole(
  technologyId: number | null,
  roleCode: string
): Promise<Role | null> {
  const technology = technologyId ? await Technology.findByPk(technologyId) : null;
  const appId = technology?.appId;

  // Try to find role by code that matches the cascade
  const role = await Role.findOne({ where: { code: roleCode } });
  if (!role) return null;

  // Check if role is compatible with the app
  if (appId && role.appId && role.appId !== appId) {
    // Role is app-specific but doesn't match our app
    // Try to find a global role with same code
    return await Role.findOne({
      where: { code: roleCode, appId: undefined, technologyId: undefined }
    });
  }

  return role;
}

async function createResourceCapability(
  resourceId: number,
  skill: string,
  roleName: string | undefined,
  isPrimary: boolean
): Promise<boolean> {
  try {
    // Map skill to technology
    const techCode = SKILL_TO_TECHNOLOGY_MAP[skill];
    if (!techCode) {
      logger.warn(`No technology mapping found for skill: ${skill}`);
      return false;
    }

    const technology = await findTechnologyByCode(techCode);
    if (!technology) {
      logger.warn(`Technology not found for code: ${techCode}`);
      return false;
    }

    // Determine role
    let role: Role | null = null;
    if (roleName) {
      const roleCode = ROLE_NAME_MAP[roleName];
      if (roleCode) {
        role = await findCompatibleRole(technology.id, roleCode);
      }
    }

    // Fall back to generic "Software Developer" role if no specific role found
    if (!role) {
      role = await findRoleByCode('DEV');
    }

    if (!role) {
      logger.warn(`No compatible role found for: ${roleName}`);
      return false;
    }

    // Determine app
    // If technology is app-specific, use that app
    // If technology is global, use the "General" app
    let appId = technology.appId;
    if (!appId) {
      const generalApp = await App.findOne({ where: { code: 'GEN' } });
      appId = generalApp?.id;
    }
    if (!appId) {
      logger.warn(`No app found for technology: ${technology.name}`);
      return false;
    }

    // Create the capability
    await ResourceCapability.create({
      resourceId,
      appId,
      technologyId: technology.id,
      roleId: role.id,
      proficiencyLevel: isPrimary ? 'Advanced' : 'Intermediate',
      isPrimary,
      isActive: true,
    });

    logger.info(`Created capability: Resource ${resourceId} - ${technology.name} (${role.name})`);
    return true;
  } catch (error: any) {
    logger.error(`Error creating capability for resource ${resourceId}, skill ${skill}: ${error.message}`);
    return false;
  }
}

async function migrateResource(resource: Resource, stats: MigrationStats): Promise<void> {
  try {
    let capabilitiesCreated = 0;

    // Migrate primary skill
    if (resource.primarySkill) {
      const success = await createResourceCapability(
        resource.id,
        resource.primarySkill,
        resource.role,
        true // isPrimary
      );
      if (success) capabilitiesCreated++;
    }

    // Migrate secondary skills
    if (resource.secondarySkills) {
      try {
        const secondarySkills = JSON.parse(resource.secondarySkills);
        if (Array.isArray(secondarySkills)) {
          for (const skill of secondarySkills) {
            const success = await createResourceCapability(
              resource.id,
              skill,
              resource.role,
              false // not primary
            );
            if (success) capabilitiesCreated++;
          }
        }
      } catch (parseError) {
        logger.warn(`Could not parse secondarySkills for resource ${resource.id}`);
      }
    }

    if (capabilitiesCreated > 0) {
      stats.migratedResources++;
      stats.capabilitiesCreated += capabilitiesCreated;
      logger.info(`✅ Migrated resource ${resource.employeeId} (${resource.id}): ${capabilitiesCreated} capabilities`);
    } else {
      stats.skippedResources++;
      logger.warn(`⚠️ Skipped resource ${resource.employeeId} (${resource.id}): no valid skills to migrate`);
    }
  } catch (error: any) {
    stats.skippedResources++;
    stats.errors.push(`Resource ${resource.id}: ${error.message}`);
    logger.error(`❌ Error migrating resource ${resource.id}: ${error.message}`);
  }
}

async function runMigration(): Promise<void> {
  const stats: MigrationStats = {
    totalResources: 0,
    migratedResources: 0,
    capabilitiesCreated: 0,
    skippedResources: 0,
    errors: [],
  };

  try {
    await sequelize.authenticate();
    logger.info('✅ Database connected');

    // Get all active resources
    const resources = await Resource.findAll({
      where: { isActive: true },
      order: [['id', 'ASC']],
    });

    stats.totalResources = resources.length;
    logger.info(`\n📊 Found ${stats.totalResources} active resources to migrate\n`);

    // Migrate each resource
    for (const resource of resources) {
      await migrateResource(resource, stats);
    }

    // Print summary
    logger.info('\n' + '='.repeat(60));
    logger.info('MIGRATION SUMMARY');
    logger.info('='.repeat(60));
    logger.info(`Total Resources:         ${stats.totalResources}`);
    logger.info(`Successfully Migrated:   ${stats.migratedResources}`);
    logger.info(`Capabilities Created:    ${stats.capabilitiesCreated}`);
    logger.info(`Skipped:                 ${stats.skippedResources}`);
    logger.info(`Errors:                  ${stats.errors.length}`);

    if (stats.errors.length > 0) {
      logger.info('\nErrors:');
      stats.errors.forEach(err => logger.error(`  - ${err}`));
    }

    logger.info('='.repeat(60));
    logger.info('\n✅ Migration completed!\n');

    // Note about cleanup
    logger.info('💡 NEXT STEPS:');
    logger.info('   1. Review the migrated capabilities in the database');
    logger.info('   2. Update Resource model to remove: domainTeamId, primarySkill, secondarySkills, role');
    logger.info('   3. Create database migration to drop those columns');
    logger.info('   4. Update frontend to use the new CapabilityBuilder component\n');

    process.exit(0);
  } catch (error: any) {
    logger.error(`❌ Migration failed: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
  }
}

// Run migration
runMigration();
