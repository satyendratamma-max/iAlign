/**
 * Seed Data for Cascaded Resource Taxonomy
 * App → Technology → Role hierarchy
 *
 * Run with: npx ts-node src/seed/cascade-taxonomy-seed.ts
 */

import App from '../models/App';
import Technology from '../models/Technology';
import Role from '../models/Role';
import sequelize from '../config/database';

async function seedCascadeTaxonomy() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // ========================================
    // STEP 1: CREATE APPS
    // ========================================
    console.log('\n📱 Creating Apps...');

    const apps = await App.bulkCreate([
      {
        name: 'SAP',
        code: 'SAP',
        category: 'ERP',
        description: 'SAP ERP system for enterprise resource planning',
        vendor: 'SAP AG',
        isGlobal: false,
        status: 'Active',
        criticality: 'Critical',
        isActive: true,
      },
      {
        name: 'Salesforce',
        code: 'SFDC',
        category: 'CRM',
        description: 'Salesforce CRM for customer relationship management',
        vendor: 'Salesforce Inc',
        isGlobal: false,
        status: 'Active',
        criticality: 'High',
        isActive: true,
      },
      {
        name: 'AWS',
        code: 'AWS',
        category: 'Cloud',
        description: 'Amazon Web Services cloud platform',
        vendor: 'Amazon',
        isGlobal: false,
        status: 'Active',
        criticality: 'Critical',
        isActive: true,
      },
      {
        name: 'General',
        code: 'GEN',
        category: 'Platform',
        description: 'General cross-functional applications',
        vendor: undefined,
        isGlobal: true,
        status: 'Active',
        criticality: 'Medium',
        isActive: true,
      },
    ]);

    console.log(`✅ Created ${apps.length} apps`);

    // Get app IDs for foreign keys
    const sapApp = apps.find(a => a.code === 'SAP')!;
    const sfdcApp = apps.find(a => a.code === 'SFDC')!;
    const awsApp = apps.find(a => a.code === 'AWS')!;

    // ========================================
    // STEP 2: CREATE TECHNOLOGIES
    // ========================================
    console.log('\n💻 Creating Technologies...');

    const technologies = await Technology.bulkCreate([
      // SAP-specific technologies
      { appId: sapApp.id, name: 'ABAP', code: 'ABAP', category: 'Language', stackType: 'Backend', isActive: true },
      { appId: sapApp.id, name: 'SAP Fiori', code: 'FIORI', category: 'Framework', stackType: 'Frontend', isActive: true },
      { appId: sapApp.id, name: 'SAP HANA', code: 'HANA', category: 'Database', stackType: 'Database', isActive: true },
      { appId: sapApp.id, name: 'SAP UI5', code: 'UI5', category: 'Framework', stackType: 'Frontend', isActive: true },

      // Salesforce-specific technologies
      { appId: sfdcApp.id, name: 'Apex', code: 'APEX', category: 'Language', stackType: 'Backend', isActive: true },
      { appId: sfdcApp.id, name: 'Visualforce', code: 'VF', category: 'Framework', stackType: 'Frontend', isActive: true },
      { appId: sfdcApp.id, name: 'Lightning Web Components', code: 'LWC', category: 'Framework', stackType: 'Frontend', isActive: true },
      { appId: sfdcApp.id, name: 'SOQL', code: 'SOQL', category: 'Query Language', stackType: 'Database', isActive: true },

      // AWS-specific technologies
      { appId: awsApp.id, name: 'Lambda', code: 'LAMBDA', category: 'Serverless', stackType: 'Backend', isActive: true },
      { appId: awsApp.id, name: 'EC2', code: 'EC2', category: 'Compute', stackType: 'Infrastructure', isActive: true },
      { appId: awsApp.id, name: 'S3', code: 'S3', category: 'Storage', stackType: 'Infrastructure', isActive: true },
      { appId: awsApp.id, name: 'RDS', code: 'RDS', category: 'Database Service', stackType: 'Database', isActive: true },

      // Global technologies (undefined appId - available everywhere)
      { appId: undefined, name: 'JavaScript', code: 'JS', category: 'Language', stackType: 'Frontend', isActive: true },
      { appId: undefined, name: 'TypeScript', code: 'TS', category: 'Language', stackType: 'Frontend', isActive: true },
      { appId: undefined, name: 'React', code: 'REACT', category: 'Framework', stackType: 'Frontend', isActive: true },
      { appId: undefined, name: 'Node.js', code: 'NODE', category: 'Runtime', stackType: 'Backend', isActive: true },
      { appId: undefined, name: 'Python', code: 'PY', category: 'Language', stackType: 'Backend', isActive: true },
      { appId: undefined, name: 'Java', code: 'JAVA', category: 'Language', stackType: 'Backend', isActive: true },
      { appId: undefined, name: 'PostgreSQL', code: 'PSQL', category: 'Database', stackType: 'Database', isActive: true },
      { appId: undefined, name: 'Docker', code: 'DOCKER', category: 'Container', stackType: 'Infrastructure', isActive: true },
    ]);

    console.log(`✅ Created ${technologies.length} technologies`);

    // Get technology IDs for roles
    const abap = technologies.find(t => t.code === 'ABAP')!;
    const fiori = technologies.find(t => t.code === 'FIORI')!;
    const apex = technologies.find(t => t.code === 'APEX')!;
    const lwc = technologies.find(t => t.code === 'LWC')!;
    const lambda = technologies.find(t => t.code === 'LAMBDA')!;

    // ========================================
    // STEP 3: CREATE ROLES (3 LEVELS)
    // ========================================
    console.log('\n👔 Creating Roles...');

    const roles = await Role.bulkCreate([
      // ---- LEVEL 1: GLOBAL ROLES (no app/tech dependency) ----
      {
        appId: undefined,
        technologyId: undefined,
        name: 'Software Developer',
        code: 'DEV',
        level: 'Mid',
        category: 'Development',
        description: 'General software development role',
        minYearsExp: 2,
        maxYearsExp: 5,
        isActive: true,
      },
      {
        appId: undefined,
        technologyId: undefined,
        name: 'Senior Software Engineer',
        code: 'SR_DEV',
        level: 'Senior',
        category: 'Development',
        minYearsExp: 5,
        maxYearsExp: 10,
        isActive: true,
      },
      {
        appId: undefined,
        technologyId: undefined,
        name: 'QA Engineer',
        code: 'QA',
        level: 'Mid',
        category: 'Quality Assurance',
        minYearsExp: 2,
        maxYearsExp: 5,
        isActive: true,
      },
      {
        appId: undefined,
        technologyId: undefined,
        name: 'Project Manager',
        code: 'PM',
        level: undefined,
        category: 'Management',
        minYearsExp: 5,
        isActive: true,
      },
      {
        appId: undefined,
        technologyId: undefined,
        name: 'DevOps Engineer',
        code: 'DEVOPS',
        level: 'Mid',
        category: 'Operations',
        minYearsExp: 3,
        maxYearsExp: 7,
        isActive: true,
      },

      // ---- LEVEL 2: APP-SPECIFIC ROLES (no tech dependency) ----
      {
        appId: sapApp.id,
        technologyId: undefined,
        name: 'SAP Functional Consultant',
        code: 'SAP_FUNC',
        level: 'Mid',
        category: 'Consulting',
        description: 'SAP functional consultant for business processes',
        minYearsExp: 3,
        maxYearsExp: 8,
        isActive: true,
      },
      {
        appId: sapApp.id,
        technologyId: undefined,
        name: 'SAP Basis Administrator',
        code: 'SAP_BASIS',
        level: 'Mid',
        category: 'Administration',
        minYearsExp: 4,
        maxYearsExp: 8,
        isActive: true,
      },
      {
        appId: sfdcApp.id,
        technologyId: undefined,
        name: 'Salesforce Administrator',
        code: 'SFDC_ADMIN',
        level: 'Mid',
        category: 'Administration',
        minYearsExp: 2,
        maxYearsExp: 5,
        isActive: true,
      },
      {
        appId: sfdcApp.id,
        technologyId: undefined,
        name: 'Salesforce Architect',
        code: 'SFDC_ARCH',
        level: 'Architect',
        category: 'Architecture',
        minYearsExp: 8,
        isActive: true,
      },
      {
        appId: awsApp.id,
        technologyId: undefined,
        name: 'AWS Solutions Architect',
        code: 'AWS_ARCH',
        level: 'Architect',
        category: 'Architecture',
        minYearsExp: 6,
        isActive: true,
      },

      // ---- LEVEL 3: APP + TECHNOLOGY SPECIFIC ROLES ----
      {
        appId: sapApp.id,
        technologyId: abap.id,
        name: 'SAP ABAP Developer',
        code: 'SAP_ABAP_DEV',
        level: 'Mid',
        category: 'Development',
        description: 'SAP ABAP programming specialist',
        minYearsExp: 3,
        maxYearsExp: 7,
        isActive: true,
      },
      {
        appId: sapApp.id,
        technologyId: abap.id,
        name: 'Senior SAP ABAP Developer',
        code: 'SR_SAP_ABAP_DEV',
        level: 'Senior',
        category: 'Development',
        minYearsExp: 7,
        maxYearsExp: 12,
        isActive: true,
      },
      {
        appId: sapApp.id,
        technologyId: fiori.id,
        name: 'SAP Fiori Developer',
        code: 'SAP_FIORI_DEV',
        level: 'Mid',
        category: 'Development',
        description: 'SAP Fiori UX development specialist',
        minYearsExp: 2,
        maxYearsExp: 6,
        isActive: true,
      },
      {
        appId: sfdcApp.id,
        technologyId: apex.id,
        name: 'Salesforce Apex Developer',
        code: 'SFDC_APEX_DEV',
        level: 'Mid',
        category: 'Development',
        description: 'Salesforce Apex backend developer',
        minYearsExp: 2,
        maxYearsExp: 6,
        isActive: true,
      },
      {
        appId: sfdcApp.id,
        technologyId: lwc.id,
        name: 'Salesforce LWC Developer',
        code: 'SFDC_LWC_DEV',
        level: 'Mid',
        category: 'Development',
        description: 'Lightning Web Components specialist',
        minYearsExp: 2,
        maxYearsExp: 5,
        isActive: true,
      },
      {
        appId: awsApp.id,
        technologyId: lambda.id,
        name: 'AWS Lambda Developer',
        code: 'AWS_LAMBDA_DEV',
        level: 'Mid',
        category: 'Development',
        description: 'Serverless application developer',
        minYearsExp: 2,
        maxYearsExp: 6,
        isActive: true,
      },
    ]);

    console.log(`✅ Created ${roles.length} roles`);

    // ========================================
    // SUMMARY
    // ========================================
    console.log('\n📊 ========================================');
    console.log('SEED DATA SUMMARY');
    console.log('==========================================');
    console.log(`📱 Apps:          ${apps.length}`);
    console.log(`   - App-specific: ${apps.filter(a => !a.isGlobal).length}`);
    console.log(`   - Global:       ${apps.filter(a => a.isGlobal).length}`);
    console.log(`\n💻 Technologies:  ${technologies.length}`);
    console.log(`   - SAP-specific:        ${technologies.filter(t => t.appId === sapApp.id).length}`);
    console.log(`   - Salesforce-specific: ${technologies.filter(t => t.appId === sfdcApp.id).length}`);
    console.log(`   - AWS-specific:        ${technologies.filter(t => t.appId === awsApp.id).length}`);
    console.log(`   - Global (any app):    ${technologies.filter(t => !t.appId).length}`);
    console.log(`\n👔 Roles:         ${roles.length}`);
    console.log(`   - Global (Level 1):           ${roles.filter(r => !r.appId && !r.technologyId).length}`);
    console.log(`   - App-specific (Level 2):     ${roles.filter(r => r.appId && !r.technologyId).length}`);
    console.log(`   - App+Tech specific (Level 3): ${roles.filter(r => r.appId && r.technologyId).length}`);
    console.log('==========================================\n');

    console.log('✅ Seed data created successfully!');
    console.log('\n💡 Example Cascades:');
    console.log('   SAP → ABAP → SAP ABAP Developer');
    console.log('   SAP → Fiori → SAP Fiori Developer');
    console.log('   Salesforce → Apex → Salesforce Apex Developer');
    console.log('   General → React → (uses global "Software Developer")');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

seedCascadeTaxonomy();
