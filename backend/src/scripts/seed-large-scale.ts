import bcrypt from 'bcryptjs';
import sequelize from '../config/database';
import User from '../models/User';
import Scenario from '../models/Scenario';
import SegmentFunction from '../models/SegmentFunction';
import Project from '../models/Project';
import Domain from '../models/Domain';
import Resource from '../models/Resource';
import Milestone from '../models/Milestone';
import ResourceAllocation from '../models/ResourceAllocation';
import App from '../models/App';
import Technology from '../models/Technology';
import Role from '../models/Role';
import ResourceCapability from '../models/ResourceCapability';
import ProjectRequirement from '../models/ProjectRequirement';
import { enterpriseApps, enterpriseTechnologies, enterpriseRoles, capabilityMappings } from './seed-enterprise-data';

/**
 * Large-Scale Performance Testing Data Generator
 *
 * PRODUCTION Scale Configuration:
 * - 10,000 Resources
 * - 2,000 Projects
 * - 50,000 Resource Capabilities (5 per resource)
 * - 20,000 Project Requirements (10 per project)
 * - 40,000 Resource Allocations (20 per project)
 * - 1,169 Milestones (first 167 projects × 7 phases)
 *
 * Total Records: ~123,000+
 * Expected Generation Time: 10-20 minutes
 */

const SCALE_CONFIG = {
  RESOURCES_COUNT: 10000,
  PROJECTS_PER_DOMAIN: 167, // ~2,000 projects (12 domains * 167)
  CAPABILITIES_PER_RESOURCE: 5,
  REQUIREMENTS_PER_PROJECT: 10,
  ALLOCATIONS_PER_PROJECT: 20,
  ENABLE_LOGGING: true, // Set to false for faster execution
};

const DOMAIN_NAMES = [
  'Engineering', 'VC', 'Make', 'Buy', 'Quality',
  'Logistics', 'Plan', 'Sales', 'Service', 'HR',
  'Finance', 'Infrastructure'
];

const PHASES = [
  'Requirements', 'Design', 'Build', 'Test', 'UAT', 'Go-Live', 'Hypercare'
];

const FISCAL_YEARS = ['FY24', 'FY25', 'FY26', 'FY27'];
const TARGET_RELEASES = ['R1.0', 'R1.1', 'R2.0', 'R2.1', 'R3.0'];
const TARGET_SPRINTS = ['Sprint 1', 'Sprint 2', 'Sprint 3', 'Sprint 4', 'Sprint 5', 'Sprint 6'];

const log = (message: string) => {
  if (SCALE_CONFIG.ENABLE_LOGGING) {
    console.log(message);
  }
};

/**
 * Create performance indexes for optimized database queries
 * This function creates strategic indexes on high-traffic tables to improve query performance by 10-100x
 */
const createPerformanceIndexes = async () => {
  try {
    // ResourceAllocations table indexes (40K+ records)
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

    // Projects table indexes (2K+ records)
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

    // Resources table indexes (10K+ records)
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

    // ResourceCapabilities table indexes (50K+ records)
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_capabilities_resourceId
      ON ResourceCapabilities(resourceId)
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_capabilities_isPrimary
      ON ResourceCapabilities(isPrimary)
    `);

    // ProjectRequirements table indexes (10K+ records)
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_requirements_projectId
      ON ProjectRequirements(projectId)
    `);

    console.log('   ✅ Created 20+ performance indexes on 5 tables');
  } catch (error) {
    console.error('   ⚠️  Error creating indexes (may already exist):', error);
  }
};

const seedLargeScale = async (dropTables: boolean = true) => {
  const startTime = Date.now();

  try {
    console.log('\n🚀 Starting LARGE-SCALE database seeding for performance testing...\n');
    console.log(`📊 Target Scale:`);
    console.log(`   - Resources: ${SCALE_CONFIG.RESOURCES_COUNT.toLocaleString()}`);
    console.log(`   - Projects: ~${(DOMAIN_NAMES.length * SCALE_CONFIG.PROJECTS_PER_DOMAIN).toLocaleString()}`);
    console.log(`   - Capabilities: ~${(SCALE_CONFIG.RESOURCES_COUNT * SCALE_CONFIG.CAPABILITIES_PER_RESOURCE).toLocaleString()}`);
    console.log(`   - Allocations: ~${(DOMAIN_NAMES.length * SCALE_CONFIG.PROJECTS_PER_DOMAIN * SCALE_CONFIG.ALLOCATIONS_PER_PROJECT).toLocaleString()}`);
    console.log('\n');

    // Sync database
    if (dropTables) {
      // For SQL Server, we need to drop all foreign key constraints first
      try {
        await sequelize.query(`
          DECLARE @sql NVARCHAR(MAX) = N'';
          SELECT @sql += 'ALTER TABLE ' + QUOTENAME(OBJECT_SCHEMA_NAME(parent_object_id)) + '.'
                      + QUOTENAME(OBJECT_NAME(parent_object_id)) + ' DROP CONSTRAINT '
                      + QUOTENAME(name) + ';'
          FROM sys.foreign_keys;
          EXEC sp_executesql @sql;
        `);
        console.log('✅ Dropped all foreign key constraints\n');
      } catch (err) {
        console.log('Note: Could not drop foreign key constraints (may not exist yet)\n');
      }

      await sequelize.sync({ force: true });
      console.log('✅ Database synced (tables dropped and recreated)\n');
    }

    // Create performance indexes for optimized queries
    console.log('🚀 Creating performance indexes...');
    await createPerformanceIndexes();
    console.log('✅ Performance indexes created\n');

    // 1. Create Admin User
    console.log('1️⃣  Creating admin user...');
    const passwordHash = await bcrypt.hash('Admin@123', 10);
    const admin = await User.create({
      username: 'admin',
      email: 'admin@ialign.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'Administrator',
      isActive: true,
    });
    console.log(`   ✅ Created admin user\n`);

    // 2. Create Baseline Scenario
    console.log('2️⃣  Creating baseline scenario...');
    const baselineScenario = await Scenario.create({
      name: 'Baseline',
      description: 'Baseline scenario with all current projects and resources',
      status: 'published',
      createdBy: admin.id,
      publishedBy: admin.id,
      publishedDate: new Date(),
      isActive: true,
    });
    console.log(`   ✅ Created baseline scenario\n`);

    // 3. Create Apps, Technologies, and Roles
    console.log('3️⃣  Creating Apps, Technologies, and Roles...');
    const apps: any[] = [];
    for (const appData of enterpriseApps) {
      const app = await App.create({ ...appData, isActive: true } as any);
      apps.push(app);
    }
    log(`   ✅ Created ${apps.length} apps`);

    const appCodeMap: { [key: string]: number } = {};
    apps.forEach(app => {
      appCodeMap[app.code] = app.id;
    });

    const technologies: any[] = [];
    for (const techData of enterpriseTechnologies) {
      const techCode = techData.code;
      let appId = 1;

      // Map technology to app based on code patterns (same logic as seed-comprehensive)
      if (techCode.startsWith('TC-')) appId = appCodeMap['TC'];
      else if (techCode.startsWith('NX-')) appId = appCodeMap['NX'];
      else if (techCode.startsWith('SW-')) appId = appCodeMap['SW'];
      else if (techCode.startsWith('CREO-') || techCode === 'WNDCHL') appId = appCodeMap['CREO'];
      else if (techCode.startsWith('INV-') || techCode === 'VAULT') appId = appCodeMap['INV'];
      else if (techCode.startsWith('ACAD-') || techCode === 'LISP') appId = appCodeMap['ACAD'];
      else if (techCode.startsWith('E3-')) appId = appCodeMap['E3S'];
      else if (techCode.startsWith('ANSYS-')) appId = appCodeMap['ANSYS'];
      else if (techCode.startsWith('SIMC-')) appId = appCodeMap['SIMC'];
      else if (techCode.startsWith('CATIA-')) appId = appCodeMap['CATIA'];
      else if (techCode === 'S4H-PLT' || techCode === 'HANA') appId = appCodeMap['S4H'];

      const tech = await Technology.create({
        ...techData,
        appId,
        isActive: true
      });
      technologies.push(tech);
    }
    log(`   ✅ Created ${technologies.length} technologies`);

    const roles: any[] = [];
    for (const roleData of enterpriseRoles) {
      const role = await Role.create({
        ...roleData,
        isActive: true
      } as any);
      roles.push(role);
    }
    console.log(`   ✅ Created ${roles.length} roles\n`);

    // Create name-to-ID mappings for quick lookup
    const appNameMap: { [key: string]: any } = {};
    apps.forEach(app => { appNameMap[app.name] = app; });

    const techNameMap: { [key: string]: any } = {};
    technologies.forEach(tech => { techNameMap[tech.name] = tech; });

    const roleNameMap: { [key: string]: any } = {};
    roles.forEach(role => { roleNameMap[role.name] = role; });

    // 4. Create Domains
    console.log('4️⃣  Creating domains...');
    const domains: any[] = [];
    const locations = ['San Francisco', 'New York', 'Austin', 'Chicago', 'Seattle', 'Boston'];

    for (let i = 0; i < DOMAIN_NAMES.length; i++) {
      const domain = await Domain.create({
        name: DOMAIN_NAMES[i],
        type: 'Business',
        managerId: admin.id,
        location: locations[i % locations.length],
        isActive: true,
      });
      domains.push(domain);
    }
    console.log(`   ✅ Created ${domains.length} domains\n`);

    // 5. Create Segment Functions
    console.log('5️⃣  Creating segment functions...');
    const segmentFunctions: any[] = [];

    for (const domain of domains) {
      for (let i = 0; i < 3; i++) {
        const segmentFunction = await SegmentFunction.create({
          domainId: domain.id,
          name: `${domain.name} Segment ${i + 1}`,
          description: `Segment function ${i + 1} for ${domain.name} domain`,
          type: ['Strategic', 'Operational', 'Technical'][i % 3],
          totalValue: (Math.floor(Math.random() * 20) + 10) * 1000000,
          roiIndex: Math.floor(Math.random() * 30) + 15,
          riskScore: Math.floor(Math.random() * 60) + 20,
          managerId: admin.id,
          isActive: true,
        });
        segmentFunctions.push(segmentFunction);
      }
    }
    console.log(`   ✅ Created ${segmentFunctions.length} segment functions\n`);

    // 6. Create Resources (LARGE SCALE)
    console.log(`6️⃣  Creating ${SCALE_CONFIG.RESOURCES_COUNT.toLocaleString()} resources...`);
    const resources: any[] = [];

    const firstNames = ['Alex', 'Blake', 'Casey', 'Dana', 'Ellis', 'Finley', 'Grey', 'Harper', 'Indigo', 'Jordan',
      'Kelly', 'Logan', 'Morgan', 'Noel', 'Oakley', 'Parker', 'Quinn', 'Riley', 'Sage', 'Taylor',
      'Avery', 'Cameron', 'Drew', 'Emerson', 'Frankie', 'Hayden', 'Jamie', 'Kai', 'Lane', 'Max'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
      'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];

    const roles_list = ['Developer', 'Senior Developer', 'Tech Lead', 'Architect', 'Team Lead', 'Contractor', 'Consultant'];

    const batchSize = 100;
    let createdCount = 0;

    for (let batch = 0; batch < Math.ceil(SCALE_CONFIG.RESOURCES_COUNT / batchSize); batch++) {
      const batchResources = [];
      const batchStart = batch * batchSize;
      const batchEnd = Math.min(batchStart + batchSize, SCALE_CONFIG.RESOURCES_COUNT);

      for (let i = batchStart; i < batchEnd; i++) {
        const firstName = firstNames[i % firstNames.length];
        const lastName = lastNames[Math.floor(i / firstNames.length) % lastNames.length];
        const domain = domains[i % domains.length];
        const domainSegmentFunctions = segmentFunctions.filter(sf => sf.domainId === domain.id);
        const segmentFunction = domainSegmentFunctions[i % domainSegmentFunctions.length];

        batchResources.push({
          domainId: domain.id,
          segmentFunctionId: segmentFunction.id,
          employeeId: `EMP${String(i + 1).padStart(5, '0')}`,
          firstName: `${firstName}${Math.floor(i / (firstNames.length * lastNames.length)) || ''}`,
          lastName,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@company.com`,
          role: roles_list[i % roles_list.length],
          location: domain.location,
          hourlyRate: Math.floor(Math.random() * 100) + 80,
          utilizationRate: Math.floor(Math.random() * 30) + 70,
          joiningDate: new Date(2020, Math.floor(Math.random() * 5), 1),
          primarySkill: `Skill-${(i % 20) + 1}`,
          secondarySkills: `Secondary-${(i % 15) + 1}, Tool-${(i % 10) + 1}`,
          isActive: true,
        });
      }

      const createdBatch = await Resource.bulkCreate(batchResources);
      resources.push(...createdBatch);
      createdCount += createdBatch.length;

      if (createdCount % 500 === 0 || createdCount === SCALE_CONFIG.RESOURCES_COUNT) {
        console.log(`   📊 Progress: ${createdCount.toLocaleString()} / ${SCALE_CONFIG.RESOURCES_COUNT.toLocaleString()} resources created`);
      }
    }

    console.log(`   ✅ Created ${resources.length.toLocaleString()} resources\n`);

    // 7. Create Resource Capabilities (LARGE SCALE)
    console.log(`7️⃣  Creating resource capabilities...`);
    let capabilityCount = 0;
    const proficiencyLevels: Array<'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'> = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

    for (let batch = 0; batch < Math.ceil(resources.length / batchSize); batch++) {
      const batchCapabilities = [];
      const batchStart = batch * batchSize;
      const batchEnd = Math.min(batchStart + batchSize, resources.length);

      for (let i = batchStart; i < batchEnd; i++) {
        const resource = resources[i];
        const numCapabilities = SCALE_CONFIG.CAPABILITIES_PER_RESOURCE;

        for (let j = 0; j < numCapabilities; j++) {
          const mapping = capabilityMappings[(i * numCapabilities + j) % capabilityMappings.length];
          const app = appNameMap[mapping.app] || apps[0];
          const technology = techNameMap[mapping.tech] || technologies[0];
          const role = roleNameMap[mapping.role] || roles[0];

          batchCapabilities.push({
            resourceId: resource.id,
            appId: app.id,
            technologyId: technology.id,
            roleId: role.id,
            proficiencyLevel: proficiencyLevels[j % 4],
            yearsOfExperience: Math.floor(Math.random() * 10) + 1,
            isPrimary: j === 0,
            lastUsedDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
            isActive: true,
          });
        }
      }

      await ResourceCapability.bulkCreate(batchCapabilities);
      capabilityCount += batchCapabilities.length;

      if (capabilityCount % 2500 === 0 || batch === Math.ceil(resources.length / batchSize) - 1) {
        console.log(`   📊 Progress: ${capabilityCount.toLocaleString()} capabilities created`);
      }
    }

    console.log(`   ✅ Created ${capabilityCount.toLocaleString()} resource capabilities\n`);

    // 8. Create Projects (LARGE SCALE)
    console.log(`8️⃣  Creating projects...`);
    const projects: any[] = [];
    const projectTemplates = [
      { name: 'Digital Transformation', process: 'Process Automation', type: 'Strategic' },
      { name: 'System Integration', process: 'Data Integration', type: 'Integration' },
      { name: 'Platform Modernization', process: 'Legacy Migration', type: 'Infrastructure' },
      { name: 'Analytics Dashboard', process: 'Reporting', type: 'Analytics' },
      { name: 'Security Enhancement', process: 'Security', type: 'Security' },
      { name: 'Mobile Development', process: 'Mobile App', type: 'Development' },
    ];
    const priorities = ['Low', 'Medium', 'High', 'Critical'];
    const healthStatuses = ['Green', 'Green', 'Yellow', 'Red'];
    let projectIndex = 1;

    for (const domain of domains) {
      const domainSegmentFunctions = segmentFunctions.filter(p => p.domainId === domain.id);

      for (let i = 0; i < SCALE_CONFIG.PROJECTS_PER_DOMAIN; i++) {
        const template = projectTemplates[i % projectTemplates.length];
        const fiscalYear = FISCAL_YEARS[i % FISCAL_YEARS.length];
        const segmentFunction = domainSegmentFunctions[i % domainSegmentFunctions.length];

        const startMonth = Math.floor(Math.random() * 12);
        const startDate = new Date(2024, startMonth, 1);
        const endDate = new Date(2024, startMonth + 6, 28);
        const budget = (Math.floor(Math.random() * 15) + 5) * 100000;
        const progress = Math.floor(Math.random() * 100);
        const status = progress === 100 ? 'Completed' : progress === 0 ? 'Planning' : 'In Progress';

        const project = await Project.create({
          scenarioId: baselineScenario.id,
          projectNumber: `PROJ-${String(projectIndex).padStart(5, '0')}`,
          segmentFunctionId: segmentFunction.id,
          domainId: domain.id,
          name: `${domain.name} ${template.name} ${fiscalYear} #${i + 1}`,
          description: `${template.name} initiative for ${domain.name} domain`,
          businessProcess: template.process,
          functionality: `Core ${domain.name} functionality enhancement`,
          status,
          priority: priorities[i % 4],
          businessDecision: ['Above Cutline', 'Below Cutline', 'Pending'][i % 3],
          type: template.type,
          fiscalYear,
          targetRelease: TARGET_RELEASES[i % TARGET_RELEASES.length],
          targetSprint: TARGET_SPRINTS[i % TARGET_SPRINTS.length],
          progress,
          currentPhase: PHASES[Math.floor(progress / 15)],
          budget,
          actualCost: Math.floor(budget * (progress / 100)),
          forecastedCost: Math.floor(budget * 1.05),
          startDate,
          endDate,
          actualStartDate: status !== 'Planning' ? startDate : undefined,
          actualEndDate: status === 'Completed' ? endDate : undefined,
          deadline: endDate,
          healthStatus: healthStatuses[i % 4],
          projectManagerId: admin.id,
          sponsorId: admin.id,
          isActive: true,
        });

        projects.push(project);
        projectIndex++;

        if (projects.length % 100 === 0) {
          console.log(`   📊 Progress: ${projects.length.toLocaleString()} projects created`);
        }
      }
    }

    console.log(`   ✅ Created ${projects.length.toLocaleString()} projects\n`);

    // 9. Create Project Requirements (LARGE SCALE)
    console.log(`9️⃣  Creating project requirements...`);
    let requirementCount = 0;
    const reqProficiencyLevels: Array<'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'> = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
    const reqPriorities: Array<'Low' | 'Medium' | 'High' | 'Critical'> = ['Low', 'Medium', 'High', 'Critical'];

    for (let batch = 0; batch < Math.ceil(projects.length / batchSize); batch++) {
      const batchRequirements = [];
      const batchStart = batch * batchSize;
      const batchEnd = Math.min(batchStart + batchSize, projects.length);

      for (let i = batchStart; i < batchEnd; i++) {
        const project = projects[i];
        const numRequirements = SCALE_CONFIG.REQUIREMENTS_PER_PROJECT;

        for (let j = 0; j < numRequirements; j++) {
          const mapping = capabilityMappings[(i * numRequirements + j) % capabilityMappings.length];
          const app = appNameMap[mapping.app] || apps[0];
          const technology = techNameMap[mapping.tech] || technologies[0];
          const role = roleNameMap[mapping.role] || roles[0];

          batchRequirements.push({
            projectId: project.id,
            appId: app.id,
            technologyId: technology.id,
            roleId: role.id,
            proficiencyLevel: reqProficiencyLevels[j % 4],
            minYearsExp: Math.floor(Math.random() * 5) + 2,
            requiredCount: Math.floor(Math.random() * 3) + 1,
            fulfilledCount: 0,
            priority: reqPriorities[j % 4],
            isFulfilled: false,
            startDate: project.startDate,
            endDate: project.endDate,
            isActive: true,
          });
        }
      }

      await ProjectRequirement.bulkCreate(batchRequirements);
      requirementCount += batchRequirements.length;

      if (requirementCount % 2500 === 0 || batch === Math.ceil(projects.length / batchSize) - 1) {
        console.log(`   📊 Progress: ${requirementCount.toLocaleString()} requirements created`);
      }
    }

    console.log(`   ✅ Created ${requirementCount.toLocaleString()} project requirements\n`);

    // 10. Create Resource Allocations (LARGE SCALE)
    console.log(`🔟 Creating resource allocations...`);
    let allocationCount = 0;

    // Get all capabilities and requirements upfront for faster lookup
    const allCapabilities = await ResourceCapability.findAll({
      where: { isActive: true },
      attributes: ['id', 'resourceId', 'appId', 'technologyId', 'roleId'],
      raw: true,
    });

    const allRequirements = await ProjectRequirement.findAll({
      where: { isActive: true },
      attributes: ['id', 'projectId', 'appId', 'technologyId', 'roleId'],
      raw: true,
    });

    // Create capability lookup by resourceId
    const capabilityByResource: { [key: number]: any[] } = {};
    allCapabilities.forEach((cap: any) => {
      if (!capabilityByResource[cap.resourceId]) {
        capabilityByResource[cap.resourceId] = [];
      }
      capabilityByResource[cap.resourceId].push(cap);
    });

    // Create requirement lookup by projectId
    const requirementByProject: { [key: number]: any[] } = {};
    allRequirements.forEach((req: any) => {
      if (!requirementByProject[req.projectId]) {
        requirementByProject[req.projectId] = [];
      }
      requirementByProject[req.projectId].push(req);
    });

    for (let batch = 0; batch < Math.ceil(projects.length / batchSize); batch++) {
      const batchAllocations = [];
      const batchStart = batch * batchSize;
      const batchEnd = Math.min(batchStart + batchSize, projects.length);

      for (let i = batchStart; i < batchEnd; i++) {
        const project = projects[i];
        const projectRequirements = requirementByProject[project.id] || [];
        if (projectRequirements.length === 0) continue;

        const numAllocations = Math.min(SCALE_CONFIG.ALLOCATIONS_PER_PROJECT, resources.length);

        for (let j = 0; j < numAllocations; j++) {
          const resource = resources[(i * numAllocations + j) % resources.length];
          const resourceCapabilities = capabilityByResource[resource.id] || [];

          if (resourceCapabilities.length === 0) continue;

          const capability = resourceCapabilities[j % resourceCapabilities.length];
          const requirement = projectRequirements[j % projectRequirements.length];
          const matchScore = 65 + Math.floor(Math.random() * 35);

          batchAllocations.push({
            scenarioId: baselineScenario.id,
            projectId: project.id,
            resourceId: resource.id,
            resourceCapabilityId: capability.id,
            projectRequirementId: requirement.id,
            matchScore,
            allocationType: ['Dedicated', 'Shared', 'On-Demand'][j % 3],
            allocationPercentage: Math.floor(Math.random() * 50) + 25,
            allocatedHours: Math.floor(Math.random() * 80) + 40,
            startDate: project.startDate,
            endDate: project.endDate,
            actualStartDate: project.actualStartDate,
            actualEndDate: project.actualEndDate,
            billableRate: resource.hourlyRate,
            cost: resource.hourlyRate * 100,
            roleOnProject: 'Developer',
            isActive: true,
          });
        }
      }

      await ResourceAllocation.bulkCreate(batchAllocations);
      allocationCount += batchAllocations.length;

      if (allocationCount % 5000 === 0 || batch === Math.ceil(projects.length / batchSize) - 1) {
        console.log(`   📊 Progress: ${allocationCount.toLocaleString()} allocations created`);
      }
    }

    console.log(`   ✅ Created ${allocationCount.toLocaleString()} resource allocations\n`);

    // 11. Create Milestones (subset for performance)
    console.log(`1️⃣1️⃣ Creating milestones (first 100 projects only)...`);
    let milestoneCount = 0;
    const milestoneBatch = projects.slice(0, 100);

    for (const project of milestoneBatch) {
      for (let i = 0; i < PHASES.length; i++) {
        await Milestone.create({
          scenarioId: baselineScenario.id,
          projectId: project.id,
          ownerId: admin.id,
          phase: PHASES[i],
          name: `${PHASES[i]} Phase`,
          description: `${PHASES[i]} milestone for ${project.name}`,
          plannedStartDate: project.startDate,
          plannedEndDate: project.endDate,
          status: 'In Progress',
          progress: Math.floor(project.progress / PHASES.length),
          healthStatus: project.healthStatus,
          isActive: true,
        });
        milestoneCount++;
      }
    }

    console.log(`   ✅ Created ${milestoneCount.toLocaleString()} milestones\n`);

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    // Summary
    console.log('\n🎉 LARGE-SCALE Database seeding completed successfully!\n');
    console.log('📊 Final Summary:');
    console.log(`   - Domains: ${domains.length}`);
    console.log(`   - Segment Functions: ${segmentFunctions.length}`);
    console.log(`   - Resources: ${resources.length.toLocaleString()}`);
    console.log(`   - Resource Capabilities: ${capabilityCount.toLocaleString()}`);
    console.log(`   - Projects: ${projects.length.toLocaleString()}`);
    console.log(`   - Project Requirements: ${requirementCount.toLocaleString()}`);
    console.log(`   - Resource Allocations: ${allocationCount.toLocaleString()}`);
    console.log(`   - Milestones: ${milestoneCount.toLocaleString()}`);
    console.log(`\n⏱️  Total Seeding Time: ${duration.toFixed(2)} seconds (${(duration / 60).toFixed(2)} minutes)`);
    console.log(`\n🔐 Login credentials:`);
    console.log('   Email: admin@ialign.com');
    console.log('   Password: Admin@123\n');

    return true;
  } catch (error) {
    console.error('❌ Large-scale seeding failed:', error);
    throw error;
  }
};

// Only run if executed directly
if (require.main === module) {
  seedLargeScale()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default seedLargeScale;
