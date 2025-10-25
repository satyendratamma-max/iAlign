import bcrypt from 'bcryptjs';
import sequelize from '../config/database';
import { Op } from 'sequelize';
import User from '../models/User';
import Scenario from '../models/Scenario';
import SegmentFunction from '../models/SegmentFunction';
import Project from '../models/Project';
import Domain from '../models/Domain';
import Resource from '../models/Resource';
import Milestone from '../models/Milestone';
import ResourceAllocation from '../models/ResourceAllocation';
// import Pipeline from '../models/Pipeline'; // Temporarily disabled
// import ProjectPipeline from '../models/ProjectPipeline'; // Temporarily disabled
import CapacityModel from '../models/CapacityModel';
import CapacityScenario from '../models/CapacityScenario';
import App from '../models/App';
import Technology from '../models/Technology';
import Role from '../models/Role';
import ResourceCapability from '../models/ResourceCapability';
import ProjectRequirement from '../models/ProjectRequirement';
import ProjectDomainImpact from '../models/ProjectDomainImpact';
import ProjectDependency from '../models/ProjectDependency';
import { enterpriseApps, enterpriseTechnologies, enterpriseRoles, capabilityMappings } from './seed-enterprise-data';

const DOMAIN_NAMES = [
  'Engineering', 'VC', 'Make', 'Buy', 'Quality',
  'Logistics', 'Plan', 'Sales', 'Service', 'HR',
  'Finance', 'Infrastructure'
];

const PHASES = [
  'Requirements',
  'Design',
  'Build',
  'Test',
  'UAT',
  'Go-Live',
  'Hypercare'
];

const FISCAL_YEARS = ['FY24', 'FY25', 'FY26', 'FY27'];
const TARGET_RELEASES = ['R1.0', 'R1.1', 'R2.0', 'R2.1', 'R3.0'];
const TARGET_SPRINTS = ['Sprint 1', 'Sprint 2', 'Sprint 3', 'Sprint 4', 'Sprint 5', 'Sprint 6'];

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

const seedDatabase = async (dropTables: boolean = true) => {
  try {
    console.log('🌱 Starting comprehensive database seeding...\n');

    // Backup existing users (except Admin) before dropping tables
    let backedUpUsers: any[] = [];
    if (dropTables) {
      try {
        console.log('💾 Backing up existing users (excluding Admin)...');
        const existingUsers = await User.findAll({
          where: {
            email: {
              [Op.ne]: 'admin@ialign.com'
            }
          },
          raw: true
        });

        backedUpUsers = existingUsers.map((user: any) => ({
          username: user.username,
          email: user.email,
          passwordHash: user.passwordHash,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          phoneNumber: user.phoneNumber,
          department: user.department,
          timezone: user.timezone,
          preferences: user.preferences,
          lastLoginDate: user.lastLoginDate,
          isActive: user.isActive,
        }));

        console.log(`   ✅ Backed up ${backedUpUsers.length} existing users\n`);
      } catch (error) {
        console.log('   ℹ️  No existing users to backup (fresh database)\n');
      }
    }

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

      // Explicitly drop scenarioId column from Resources table if it exists (migration cleanup)
      try {
        await sequelize.query(`
          IF EXISTS (
            SELECT * FROM sys.columns
            WHERE object_id = OBJECT_ID(N'[dbo].[Resources]')
            AND name = 'scenarioId'
          )
          BEGIN
            ALTER TABLE [Resources] DROP COLUMN [scenarioId];
          END
        `);
        console.log('✅ Removed scenarioId column from Resources table (if it existed)\n');
      } catch (err) {
        console.log('Note: Could not check/remove scenarioId column from Resources\n');
      }
    } else {
      await sequelize.sync();
      console.log('✅ Tables synced (non-destructive - missing tables created)\n');

      // Explicitly drop scenarioId column from Resources table if it exists (migration cleanup)
      try {
        await sequelize.query(`
          IF EXISTS (
            SELECT * FROM sys.columns
            WHERE object_id = OBJECT_ID(N'[dbo].[Resources]')
            AND name = 'scenarioId'
          )
          BEGIN
            ALTER TABLE [Resources] DROP COLUMN [scenarioId];
          END
        `);
        console.log('✅ Removed scenarioId column from Resources table (if it existed)\n');
      } catch (err) {
        console.log('Note: Could not check/remove scenarioId column from Resources\n');
      }
    }

    // Create performance indexes for optimized queries
    console.log('🚀 Creating performance indexes...');
    await createPerformanceIndexes();
    console.log('✅ Performance indexes created\n');

    // 1. Create Users
    console.log('1️⃣  Creating users...');
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

    const users: any[] = [admin];

    // Domain managers
    for (let i = 0; i < 12; i++) {
      const user = await User.create({
        username: `dm${i + 1}`,
        email: `domain.manager${i + 1}@ialign.com`,
        passwordHash,
        firstName: `DomainManager`,
        lastName: `${i + 1}`,
        role: 'Domain Manager',
        isActive: true,
      });
      users.push(user);
    }

    // Project managers
    for (let i = 0; i < 15; i++) {
      const user = await User.create({
        username: `pm${i + 1}`,
        email: `pm${i + 1}@ialign.com`,
        passwordHash,
        firstName: `PM`,
        lastName: `${i + 1}`,
        role: 'Project Manager',
        isActive: true,
      });
      users.push(user);
    }

    // Team leads
    for (let i = 0; i < 20; i++) {
      const user = await User.create({
        username: `lead${i + 1}`,
        email: `lead${i + 1}@ialign.com`,
        passwordHash,
        firstName: `TeamLead`,
        lastName: `${i + 1}`,
        role: 'Team Lead',
        isActive: true,
      });
      users.push(user);
    }

    console.log(`   ✅ Created ${users.length} seed users\n`);

    // Restore backed up users (if any)
    if (backedUpUsers.length > 0) {
      console.log('🔄 Restoring previously backed up users...');
      let restoredCount = 0;

      for (const userData of backedUpUsers) {
        try {
          const restoredUser = await User.create(userData);
          users.push(restoredUser);
          restoredCount++;
        } catch (error: any) {
          console.error(`   ⚠️  Failed to restore user ${userData.email}: ${error.message}`);
        }
      }

      console.log(`   ✅ Restored ${restoredCount} existing users\n`);
    }

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

    // 3. Create Apps, Technologies, and Roles (Using Enterprise Data)
    console.log('3️⃣  Creating Apps, Technologies, and Roles (Enterprise)...');

    // Seed Apps from enterprise data
    const apps: any[] = [];
    for (const appData of enterpriseApps) {
      const app = await App.create({ ...appData, isActive: true } as any);
      apps.push(app);
    }
    console.log(`   ✅ Created ${apps.length} apps`);

    // Create app code mapping for technology linking
    const appCodeMap: { [key: string]: number } = {};
    apps.forEach(app => {
      appCodeMap[app.code] = app.id;
    });

    // Seed Technologies from enterprise data (with proper appId mapping)
    const technologies: any[] = [];
    for (const techData of enterpriseTechnologies) {
      const techCode = techData.code;
      let appId = 1; // default

      // Map technology to app based on code patterns
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
      else if (techCode === 'S4H-PLT' || techCode === 'HANA') appId = appCodeMap['S4H']; // S/4HANA specific techs
      else if (techCode === 'ECC' || techCode === 'ABAP' || techCode === 'ABAP-OO' || techCode === 'BASIS' ||
               techCode === 'GATEWAY' || techCode === 'NETWVR' || techCode === 'CDS' || techCode === 'BTP')
        appId = appCodeMap['SAP']; // SAP ERP general techs
      else if (techCode === 'PP-MOD') appId = appCodeMap['PP'];
      else if (techCode === 'MM-MOD') appId = appCodeMap['MM'];
      else if (techCode === 'MDG-PLT') appId = appCodeMap['MDG'];
      else if (techCode === 'CRM-MOD') appId = appCodeMap['CRM'];
      else if (techCode === 'VC-ENG') appId = appCodeMap['VC'];
      else if (techCode === 'FIORI-ELEM') appId = appCodeMap['FIORI'];
      else if (techCode === 'BW4-PLT') appId = appCodeMap['BW4'];
      else if (techCode === 'SOLMAN-PLT') appId = appCodeMap['SOLMAN'];
      else if (techCode.startsWith('MNDX-')) appId = appCodeMap['MNDX'];
      else if (techCode.startsWith('OSYS-')) appId = appCodeMap['OSYS'];
      else if (techCode === 'PWRFX') appId = appCodeMap['PWRAPP'];
      else if (techCode === 'DAX') appId = appCodeMap['PWRBI'];
      else if (techCode === 'REACT' || techCode === 'TS') appId = appCodeMap['IALN'];
      else if (techCode === 'NODE' || techCode === 'EXPRESS') appId = appCodeMap['RESH'];
      else if (techCode.startsWith('DOTNET-') || techCode === 'ASPNET' || techCode === 'EF' || techCode === 'CSHARP')
        appId = appCodeMap['ENGP'];
      else if (techCode === 'NG' || techCode === 'VUE' || techCode === 'JS') appId = appCodeMap['PDASH'];
      else if (techCode === 'GIT-SCM') appId = appCodeMap['GIT'];
      else if (techCode.startsWith('JIRA-')) appId = appCodeMap['JIRA'];
      else if (techCode.startsWith('CONF-')) appId = appCodeMap['CONF'];
      else if (techCode.startsWith('AZ-')) appId = appCodeMap['AZDO'];
      else if (techCode.startsWith('JNKS-')) appId = appCodeMap['JNKS'];
      else if (techCode.startsWith('PSTMN-')) appId = appCodeMap['PSTMN'];
      else if (techCode.startsWith('SELN-')) appId = appCodeMap['SELN'];
      else if (techCode.startsWith('SOAP-')) appId = appCodeMap['SOAP'];
      else if (techCode.startsWith('CITX-')) appId = appCodeMap['CITX'];
      else if (techCode.startsWith('VMVDI-')) appId = appCodeMap['VMVDI'];
      else if (techCode.startsWith('SNOW-')) appId = appCodeMap['SNOW'];
      else if (techCode.startsWith('REMEDY-')) appId = appCodeMap['REMEDY'];
      else if (techCode.startsWith('AZURE-')) appId = appCodeMap['AZURE'];
      else if (techCode.startsWith('AWS-')) appId = appCodeMap['AWS'];
      else if (techCode.startsWith('DCKR-')) appId = appCodeMap['DCKR'];
      else if (techCode.startsWith('K8S-')) appId = appCodeMap['K8S'];
      else if (techCode.startsWith('TF-')) appId = appCodeMap['TF'];
      else if (techCode.startsWith('ANSBL-')) appId = appCodeMap['ANSBL'];
      else if (techCode === 'MSSQL' || techCode === 'ORACLE-DB' || techCode === 'PGSQL' || techCode === 'MONGO' || techCode === 'MYSQL')
        appId = appCodeMap['SAP']; // Generic database - map to SAP for now

      const tech = await Technology.create({
        ...techData,
        appId,
        isActive: true
      });
      technologies.push(tech);
    }
    console.log(`   ✅ Created ${technologies.length} technologies`);

    // Seed Roles from enterprise data (generic roles not tied to specific apps)
    const roles: any[] = [];
    for (const roleData of enterpriseRoles) {
      const role = await Role.create({
        ...roleData,
        isActive: true
      } as any); // Cast to any to bypass strict type checking for level field
      roles.push(role);
    }
    console.log(`   ✅ Created ${roles.length} roles\n`);

    // 4. Create Domains
    console.log('4️⃣  Creating domains...');
    const domains: any[] = [];
    const locations = ['San Francisco', 'New York', 'Austin', 'Chicago', 'Seattle', 'Boston'];

    for (let i = 0; i < DOMAIN_NAMES.length; i++) {
      const domain = await Domain.create({
        name: DOMAIN_NAMES[i],
        type: 'Business',
        managerId: users[i + 1].id,
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
      const segmentFunction = await SegmentFunction.create({
        domainId: domain.id,
        name: domain.name,
        description: `Primary segment function for ${domain.name} domain`,
        type: 'Strategic',
        totalValue: (Math.floor(Math.random() * 20) + 10) * 1000000,
        roiIndex: Math.floor(Math.random() * 30) + 15,
        riskScore: Math.floor(Math.random() * 60) + 20,
        managerId: domain.managerId,
        isActive: true,
      });
      segmentFunctions.push(segmentFunction);
    }

    // Add specific Engineering segment functions
    const engineeringDomain = domains.find(d => d.name === 'Engineering');
    if (engineeringDomain) {
      const engSegmentFunctions = [
        { name: 'NPI & Commercialization', description: 'New Product Introduction', type: 'Innovation' },
        { name: 'DevSecOps', description: 'Development, Security, and Operations', type: 'Operational' },
        { name: 'Simulation, Systems and Sustainability', description: 'Simulation and sustainability', type: 'Technical' },
      ];

      for (const engPortfolio of engSegmentFunctions) {
        const segmentFunction = await SegmentFunction.create({
          domainId: engineeringDomain.id,
          name: engPortfolio.name,
          description: engPortfolio.description,
          type: engPortfolio.type,
          totalValue: (Math.floor(Math.random() * 15) + 8) * 1000000,
          roiIndex: Math.floor(Math.random() * 25) + 18,
          riskScore: Math.floor(Math.random() * 50) + 25,
          managerId: engineeringDomain.managerId,
          isActive: true,
        });
        segmentFunctions.push(segmentFunction);
      }
    }

    console.log(`   ✅ Created ${segmentFunctions.length} segment functions\n`);

    // 6. Create Resources with domain and segment function assignments
    console.log('6️⃣  Creating resources...');
    const resources: any[] = [];
    let empId = 1;

    const firstNames = ['Alex', 'Blake', 'Casey', 'Dana', 'Ellis', 'Finley', 'Grey', 'Harper', 'Indigo', 'Jordan'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];

    // Skill sets for random assignment
    const primarySkills = [
      'JavaScript', 'Python', 'Java', 'C#', 'TypeScript', 'React', 'Angular', 'Vue.js',
      'Node.js', '.NET', 'Spring Boot', 'Django', 'SQL', 'MongoDB', 'AWS', 'Azure',
      'SAP ABAP', 'SAP Fiori', 'Salesforce', 'Oracle DB', 'DevOps', 'Kubernetes'
    ];

    const secondarySkillSets = [
      'Git, Docker, CI/CD',
      'REST APIs, GraphQL, Microservices',
      'Agile, Scrum, JIRA',
      'HTML, CSS, Bootstrap',
      'PostgreSQL, MySQL, Redis',
      'Jenkins, TeamCity, GitHub Actions',
      'Linux, Shell Scripting, Bash',
      'Unit Testing, Integration Testing, Selenium',
      'Cloud Architecture, Serverless, Lambda',
      'Security, OAuth, JWT',
    ];

    // First, create Resource records for users who are employees
    // Domain Managers (index 1-12), Project Managers (index 13-27), Team Leads (index 28-47)
    // Admin (index 0) does NOT get a Resource record
    console.log('   Creating employee resource records for Domain Managers, PMs, and Team Leads...');
    const employeeUsers = users.slice(1); // Skip admin (index 0)

    for (const user of employeeUsers) {
      // Determine domain based on user role
      let domainId: number;
      let segmentFunctionId: number;
      let userRole: string;

      if (user.role === 'Domain Manager') {
        // Domain managers get assigned to their own domain
        const domainIndex = users.indexOf(user) - 1; // Subtract 1 to account for admin
        domainId = domains[domainIndex % domains.length].id;
        const domainSegmentFunctions = segmentFunctions.filter(sf => sf.domainId === domainId);
        segmentFunctionId = domainSegmentFunctions[0].id;
        userRole = 'Domain Manager';
      } else if (user.role === 'Project Manager') {
        // Project managers get randomly assigned to domains
        const randomDomain = domains[Math.floor(Math.random() * domains.length)];
        domainId = randomDomain.id;
        const domainSegmentFunctions = segmentFunctions.filter(sf => sf.domainId === domainId);
        segmentFunctionId = domainSegmentFunctions[Math.floor(Math.random() * domainSegmentFunctions.length)].id;
        userRole = 'Project Manager';
      } else {
        // Team leads get randomly assigned to domains
        const randomDomain = domains[Math.floor(Math.random() * domains.length)];
        domainId = randomDomain.id;
        const domainSegmentFunctions = segmentFunctions.filter(sf => sf.domainId === domainId);
        segmentFunctionId = domainSegmentFunctions[Math.floor(Math.random() * domainSegmentFunctions.length)].id;
        userRole = 'Team Lead';
      }

      const domain = domains.find(d => d.id === domainId);
      const hourlyRate = userRole === 'Domain Manager' ? 150 : userRole === 'Project Manager' ? 120 : 100;
      const primarySkill = primarySkills[Math.floor(Math.random() * primarySkills.length)];
      const secondarySkills = secondarySkillSets[Math.floor(Math.random() * secondarySkillSets.length)];

      const resource = await Resource.create({
        userId: user.id, // Link to User account
        domainId,
        segmentFunctionId,
        employeeId: `EMP${String(empId).padStart(4, '0')}`,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: userRole,
        location: domain?.location || 'Remote',
        hourlyRate,
        utilizationRate: Math.floor(Math.random() * 30) + 70,
        joiningDate: new Date(2020, Math.floor(Math.random() * 5), 1), // Random date between 2020-2024
        primarySkill,
        secondarySkills,
        isActive: true,
      });
      resources.push(resource);
      empId++;
    }

    console.log(`   ✅ Created ${resources.length} employee resources (linked to users)`);

    // Then create additional resources without user accounts (contractors/external resources)
    console.log('   Creating additional contractor resources (no user accounts)...');
    let contractorCount = 0;

    for (const domain of domains) {
      const domainSegmentFunctions = segmentFunctions.filter(sf => sf.domainId === domain.id);
      const resourceCount = Math.floor(Math.random() * 4) + 2; // 2-5 contractors per domain

      for (let i = 0; i < resourceCount; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const hourlyRate = Math.floor(Math.random() * 100) + 80; // $80-180/hr
        const segmentFunction = domainSegmentFunctions[Math.floor(Math.random() * domainSegmentFunctions.length)];

        // Randomly assign skills
        const primarySkill = primarySkills[Math.floor(Math.random() * primarySkills.length)];
        const secondarySkills = secondarySkillSets[Math.floor(Math.random() * secondarySkillSets.length)];

        const resource = await Resource.create({
          // userId is undefined (not set) - contractor/external resource without user account
          domainId: domain.id,
          segmentFunctionId: segmentFunction.id,
          employeeId: `CTR${String(empId).padStart(4, '0')}`, // CTR prefix for contractors
          firstName,
          lastName,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${empId}@contractor.com`,
          role: `Contractor`,
          location: domain.location,
          hourlyRate,
          utilizationRate: Math.floor(Math.random() * 30) + 70,
          joiningDate: new Date(2020, Math.floor(Math.random() * 5), 1), // Random date between 2020-2024
          primarySkill,
          secondarySkills,
          isActive: true,
        });
        resources.push(resource);
        empId++;
        contractorCount++;
      }
    }

    console.log(`   ✅ Created ${contractorCount} contractor resources (no user accounts)`);
    console.log(`   ✅ Total resources: ${resources.length}\n`);

    // 7. Create Resource Capabilities (Using Realistic Capability Mappings)
    console.log('7️⃣  Creating resource capabilities...');
    let capabilityCount = 0;
    const proficiencyLevels: Array<'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'> = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

    // Create name-to-ID mappings for quick lookup
    const appNameMap: { [key: string]: any } = {};
    apps.forEach(app => { appNameMap[app.name] = app; });

    const techNameMap: { [key: string]: any } = {};
    technologies.forEach(tech => { techNameMap[tech.name] = tech; });

    const roleNameMap: { [key: string]: any } = {};
    roles.forEach(role => { roleNameMap[role.name] = role; });

    for (const resource of resources) {
      const numCapabilities = Math.floor(Math.random() * 3) + 2; // 2-4 capabilities
      const usedCombos = new Set<string>(); // Track used combos to avoid duplicates

      for (let i = 0; i < numCapabilities; i++) {
        let mapping;
        let attempts = 0;
        const maxAttempts = 10;

        // Try to find a unique capability mapping
        do {
          mapping = capabilityMappings[Math.floor(Math.random() * capabilityMappings.length)];
          attempts++;
        } while (
          usedCombos.has(`${mapping.app}-${mapping.tech}-${mapping.role}`) &&
          attempts < maxAttempts
        );

        // If we couldn't find from mappings, fall back to random assignment
        if (!appNameMap[mapping.app] || !techNameMap[mapping.tech] || !roleNameMap[mapping.role]) {
          // Fallback: random assignment
          const app = apps[Math.floor(Math.random() * apps.length)];
          const techsForApp = technologies.filter(t => t.appId === app.id);
          if (techsForApp.length === 0) continue;

          const technology = techsForApp[Math.floor(Math.random() * techsForApp.length)];
          const role = roles[Math.floor(Math.random() * roles.length)];

          const comboKey = `${app.id}-${technology.id}-${role.id}`;
          if (usedCombos.has(comboKey)) continue;

          const existing = await ResourceCapability.findOne({
            where: { resourceId: resource.id, appId: app.id, technologyId: technology.id, roleId: role.id },
          });

          if (!existing) {
            await ResourceCapability.create({
              resourceId: resource.id,
              appId: app.id,
              technologyId: technology.id,
              roleId: role.id,
              proficiencyLevel: proficiencyLevels[Math.floor(Math.random() * 4)],
              yearsOfExperience: Math.floor(Math.random() * 10) + 1,
              isPrimary: i === 0,
              lastUsedDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
              certifications: i === 0 ? JSON.stringify(['Certified Professional']) : undefined,
              isActive: true,
            });
            capabilityCount++;
            usedCombos.add(comboKey);
          }
        } else {
          // Use capability mapping data
          const app = appNameMap[mapping.app];
          const technology = techNameMap[mapping.tech];
          const role = roleNameMap[mapping.role];

          const comboKey = `${app.id}-${technology.id}-${role.id}`;
          if (usedCombos.has(comboKey)) continue;

          const existing = await ResourceCapability.findOne({
            where: { resourceId: resource.id, appId: app.id, technologyId: technology.id, roleId: role.id },
          });

          if (!existing) {
            // Use proficiency and years from mapping, or defaults
            const proficiency = (mapping.proficiency as 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert') || 'Intermediate';
            const yearsExp = mapping.yearsExp || Math.floor(Math.random() * 5) + 2;

            await ResourceCapability.create({
              resourceId: resource.id,
              appId: app.id,
              technologyId: technology.id,
              roleId: role.id,
              proficiencyLevel: proficiency,
              yearsOfExperience: yearsExp,
              isPrimary: i === 0,
              lastUsedDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
              certifications: i === 0 && proficiency === 'Expert' ? JSON.stringify([`${mapping.tech} Certified Professional`]) : undefined,
              isActive: true,
            });
            capabilityCount++;
            usedCombos.add(comboKey);
          }
        }
      }
    }

    console.log(`   ✅ Created ${capabilityCount} resource capabilities (using realistic mappings)\n`);

    // 8. Create Projects
    console.log('8️⃣  Creating projects...');
    const projects: any[] = [];
    let projectIndex = 1;

    const projectTemplates = [
      { name: 'Digital Transformation', process: 'Process Automation', type: 'Strategic' },
      { name: 'System Integration', process: 'Data Integration', type: 'Integration' },
      { name: 'Platform Modernization', process: 'Legacy Migration', type: 'Infrastructure' },
      { name: 'Analytics Dashboard', process: 'Reporting', type: 'Analytics' },
    ];

    const priorities = ['Low', 'Medium', 'High', 'Critical'];
    const healthStatuses = ['Green', 'Green', 'Yellow', 'Red'];

    for (const domain of domains) {
      const domainSegmentFunctions = segmentFunctions.filter(p => p.domainId === domain.id);
      const projectCount = Math.floor(Math.random() * 3) + 2; // 2-4 projects per domain

      for (let i = 0; i < projectCount; i++) {
        const template = projectTemplates[i % projectTemplates.length];
        const fiscalYear = FISCAL_YEARS[Math.floor(Math.random() * 4)];
        const segmentFunction = domainSegmentFunctions[i % domainSegmentFunctions.length];

        let startYear = 2024;
        let startMonth = Math.floor(Math.random() * 12);

        if (fiscalYear === 'FY24') {
          startYear = 2024;
          startMonth = Math.floor(Math.random() * 6);
        } else if (fiscalYear === 'FY25') {
          startYear = 2024;
          startMonth = 6 + Math.floor(Math.random() * 6);
        } else if (fiscalYear === 'FY26') {
          startYear = 2025;
        } else {
          startYear = 2026;
        }

        const startDate = new Date(startYear, startMonth, 1);
        const endDate = new Date(startYear, startMonth + 6 + Math.floor(Math.random() * 6), 28);

        const budget = (Math.floor(Math.random() * 15) + 5) * 100000;
        const progress = fiscalYear === 'FY24' ? Math.floor(Math.random() * 30) + 70 :
                        fiscalYear === 'FY25' ? Math.floor(Math.random() * 50) + 30 :
                        Math.floor(Math.random() * 30);

        const status = fiscalYear === 'FY24' && Math.random() > 0.5 ? 'Completed' :
                      fiscalYear === 'FY27' ? 'Planning' : 'In Progress';

        const businessDecisions = ['Above Cutline', 'Below Cutline', 'Pending'];

        const project = await Project.create({
          scenarioId: baselineScenario.id,
          projectNumber: `PROJ-${String(projectIndex).padStart(3, '0')}`,
          segmentFunctionId: segmentFunction.id,
          domainId: domain.id,
          name: `${domain.name} ${template.name} ${fiscalYear}`,
          description: `${template.name} initiative for ${domain.name} domain`,
          businessProcess: template.process,
          functionality: `Core ${domain.name} functionality enhancement`,
          status,
          priority: priorities[Math.floor(Math.random() * 4)],
          businessDecision: businessDecisions[Math.floor(Math.random() * 3)],
          type: template.type,
          fiscalYear,
          targetRelease: TARGET_RELEASES[Math.floor(Math.random() * TARGET_RELEASES.length)],
          targetSprint: TARGET_SPRINTS[Math.floor(Math.random() * TARGET_SPRINTS.length)],
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
          healthStatus: healthStatuses[Math.floor(Math.random() * 4)],
          projectManagerId: users[13 + (projectIndex % 15)].id,
          sponsorId: users[1 + (projectIndex % 12)].id,
          isActive: true,
        });

        projects.push(project);
        projectIndex++;
      }
    }

    console.log(`   ✅ Created ${projects.length} projects\n`);

    // 8. Create Project Requirements (Using Realistic Capability Mappings)
    console.log('8️⃣  Creating project requirements...');
    let requirementCount = 0;
    const reqProficiencyLevels: Array<'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'> = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
    const reqPriorities: Array<'Low' | 'Medium' | 'High' | 'Critical'> = ['Low', 'Medium', 'High', 'Critical'];

    for (const project of projects) {
      const numRequirements = Math.floor(Math.random() * 4) + 3; // 3-6 requirements
      const usedCombos = new Set<string>(); // Track used combos to avoid duplicates

      for (let i = 0; i < numRequirements; i++) {
        let mapping;
        let attempts = 0;
        const maxAttempts = 10;

        // Try to find a unique capability mapping
        do {
          mapping = capabilityMappings[Math.floor(Math.random() * capabilityMappings.length)];
          attempts++;
        } while (
          usedCombos.has(`${mapping.app}-${mapping.tech}-${mapping.role}`) &&
          attempts < maxAttempts
        );

        // If we couldn't find from mappings, fall back to random assignment
        if (!appNameMap[mapping.app] || !techNameMap[mapping.tech] || !roleNameMap[mapping.role]) {
          // Fallback: random assignment
          const app = apps[Math.floor(Math.random() * apps.length)];
          const techsForApp = technologies.filter(t => t.appId === app.id);
          if (techsForApp.length === 0) continue;

          const technology = techsForApp[Math.floor(Math.random() * techsForApp.length)];
          const role = roles[Math.floor(Math.random() * roles.length)];

          const comboKey = `${app.id}-${technology.id}-${role.id}`;
          if (usedCombos.has(comboKey)) continue;

          const existing = await ProjectRequirement.findOne({
            where: { projectId: project.id, appId: app.id, technologyId: technology.id, roleId: role.id },
          });

          if (!existing) {
            await ProjectRequirement.create({
              projectId: project.id,
              appId: app.id,
              technologyId: technology.id,
              roleId: role.id,
              proficiencyLevel: reqProficiencyLevels[Math.floor(Math.random() * 4)],
              minYearsExp: Math.floor(Math.random() * 5) + 2,
              requiredCount: Math.floor(Math.random() * 3) + 1,
              fulfilledCount: 0,
              priority: reqPriorities[Math.floor(Math.random() * 4)],
              isFulfilled: false,
              startDate: project.startDate,
              endDate: project.endDate,
              isActive: true,
            });
            requirementCount++;
            usedCombos.add(comboKey);
          }
        } else {
          // Use capability mapping data
          const app = appNameMap[mapping.app];
          const technology = techNameMap[mapping.tech];
          const role = roleNameMap[mapping.role];

          const comboKey = `${app.id}-${technology.id}-${role.id}`;
          if (usedCombos.has(comboKey)) continue;

          const existing = await ProjectRequirement.findOne({
            where: { projectId: project.id, appId: app.id, technologyId: technology.id, roleId: role.id },
          });

          if (!existing) {
            // Use proficiency and years from mapping, or defaults
            const proficiency = (mapping.proficiency as 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert') || 'Intermediate';
            const minYearsExp = mapping.yearsExp ? Math.max(1, mapping.yearsExp - 2) : Math.floor(Math.random() * 3) + 2;

            await ProjectRequirement.create({
              projectId: project.id,
              appId: app.id,
              technologyId: technology.id,
              roleId: role.id,
              proficiencyLevel: proficiency,
              minYearsExp,
              requiredCount: Math.floor(Math.random() * 3) + 1,
              fulfilledCount: 0,
              priority: reqPriorities[Math.floor(Math.random() * 4)],
              isFulfilled: false,
              startDate: project.startDate,
              endDate: project.endDate,
              isActive: true,
            });
            requirementCount++;
            usedCombos.add(comboKey);
          }
        }
      }
    }

    console.log(`   ✅ Created ${requirementCount} project requirements (using realistic mappings)\n`);

    // 9. Create Project Domain Impacts (Cross-Domain Impact Tracking)
    console.log('9️⃣  Creating project domain impacts...');
    let domainImpactCount = 0;
    const impactTypes: Array<'Primary' | 'Secondary' | 'Tertiary'> = ['Primary', 'Secondary', 'Tertiary'];
    const impactLevels: Array<'High' | 'Medium' | 'Low'> = ['High', 'Medium', 'Low'];

    for (const project of projects) {
      // 30% of projects have cross-domain impacts
      if (Math.random() > 0.7) {
        const numImpacts = Math.floor(Math.random() * 2) + 1; // 1-2 cross-domain impacts
        const availableDomains = domains.filter(d => d.id !== project.domainId);

        // Shuffle and take unique domains to avoid duplicates
        const shuffled = availableDomains.sort(() => 0.5 - Math.random());
        const selectedDomains = shuffled.slice(0, Math.min(numImpacts, shuffled.length));

        for (const impactedDomain of selectedDomains) {
          await ProjectDomainImpact.create({
            projectId: project.id,
            domainId: impactedDomain.id,
            impactType: impactTypes[Math.floor(Math.random() * impactTypes.length)],
            impactLevel: impactLevels[Math.floor(Math.random() * impactLevels.length)],
            description: `${project.name} impacts ${impactedDomain.name} domain processes`,
            isActive: true,
          });

          domainImpactCount++;
        }
      }
    }

    console.log(`   ✅ Created ${domainImpactCount} project domain impacts\n`);

    // 10. Create Milestones with owners
    console.log('🔟 Creating milestones...');
    let milestoneCount = 0;

    for (const project of projects) {
      const startDate = new Date(project.startDate);
      const endDate = new Date(project.endDate);
      const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      const daysPerPhase = totalDays / 7;

      // If project is completed, all milestones should be completed
      const projectIsCompleted = project.status === 'Completed';

      for (let i = 0; i < PHASES.length; i++) {
        const phaseStart = new Date(startDate.getTime() + (i * daysPerPhase * 24 * 60 * 60 * 1000));
        const phaseEnd = new Date(startDate.getTime() + ((i + 1) * daysPerPhase * 24 * 60 * 60 * 1000));

        // Determine milestone status based on project status
        let status: string;
        let phaseProgress: number;

        if (projectIsCompleted) {
          // If project is completed, all milestones must be completed
          status = 'Completed';
          phaseProgress = 100;
        } else {
          // Otherwise, calculate based on project progress
          phaseProgress = Math.max(0, Math.min(100, (project.progress - (i * 15))));
          status = 'Not Started';
          if (phaseProgress === 100) status = 'Completed';
          else if (phaseProgress > 0) status = 'In Progress';
        }

        // Assign random owner from project managers or team leads
        const owner = users[13 + Math.floor(Math.random() * 35)]; // PM or Team Lead

        await Milestone.create({
          scenarioId: baselineScenario.id,
          projectId: project.id,
          ownerId: owner.id,
          phase: PHASES[i],
          name: `${PHASES[i]} Phase`,
          description: `${PHASES[i]} milestone for ${project.name}`,
          plannedStartDate: phaseStart,
          plannedEndDate: phaseEnd,
          actualStartDate: status !== 'Not Started' ? phaseStart : undefined,
          actualEndDate: status === 'Completed' ? phaseEnd : undefined,
          status,
          progress: Math.floor(phaseProgress),
          dependencies: i > 0 ? JSON.stringify([i - 1]) : undefined,
          deliverables: JSON.stringify([`${PHASES[i]} documentation`, `${PHASES[i]} signoff`]),
          healthStatus: project.healthStatus,
          isActive: true,
        });
        milestoneCount++;
      }
    }

    console.log(`   ✅ Created ${milestoneCount} milestones\n`);

    // 11. Create Pipelines - Temporarily disabled
    // console.log('1️⃣1️⃣ Creating pipelines...');
    // const pipelineTypes = ['Application', 'Infrastructure', 'Integration'];
    // const vendors = ['SAP', 'Oracle', 'Salesforce', 'Microsoft', 'AWS', 'Custom'];
    // const pipelines: any[] = [];

    // const pipelineNames = [
    //   'ERP System', 'CRM Platform', 'Data Warehouse', 'API Gateway',
    //   'Cloud Infrastructure', 'Authentication Service', 'Payment Gateway',
    //   'Analytics Engine', 'Email Service', 'File Storage', 'CDN',
    //   'Load Balancer', 'Database Cluster', 'Message Queue', 'Cache Layer',
    //   'Monitoring System', 'Logging Platform', 'CI/CD Pipeline', 'Container Registry',
    //   'Service Mesh'
    // ];

    // for (const name of pipelineNames) {
    //   const pipeline = await Pipeline.create({
    //     name,
    //     type: pipelineTypes[Math.floor(Math.random() * 3)],
    //     vendor: vendors[Math.floor(Math.random() * 6)],
    //     platform: Math.random() > 0.5 ? 'Cloud' : 'On-Premise',
    //     environment: 'Production',
    //     description: `${name} for enterprise operations`,
    //     isActive: true,
    //   });
    //   pipelines.push(pipeline);
    // }

    // console.log(`   ✅ Created ${pipelines.length} pipelines\n`);

    // 12. Create Project-Pipeline relationships - Temporarily disabled
    // console.log('1️⃣2️⃣ Creating project-pipeline relationships...');
    // let ppCount = 0;

    // for (const project of projects) {
    //   const pipelineCount = Math.floor(Math.random() * 4) + 1;
    //   const selectedPipelines = pipelines
    //     .sort(() => 0.5 - Math.random())
    //     .slice(0, pipelineCount);

    //   for (const pipeline of selectedPipelines) {
    //     await ProjectPipeline.create({
    //       projectId: project.id,
    //       pipelineId: pipeline.id,
    //       integrationType: ['Source', 'Target', 'Middleware'][Math.floor(Math.random() * 3)],
    //       setupRequired: Math.random() > 0.3,
    //       status: project.status === 'Completed' ? 'Completed' :
    //               project.status === 'Planning' ? 'Planned' : 'In Progress',
    //       notes: `Integration requirement for ${project.name}`,
    //       isActive: true,
    //     });
    //     ppCount++;
    //   }
    // }

    // console.log(`   ✅ Created ${ppCount} project-pipeline relationships\n`);

    // 13. Create Resource Allocations with match scores
    console.log('1️⃣3️⃣ Creating resource allocations...');
    let allocationCount = 0;

    for (const project of projects) {
      const domainResources = resources.filter(r => r.domainId === project.domainId);
      const allocCount = Math.floor(Math.random() * 4) + 3; // 3-6 allocations per project

      // Shuffle resources to avoid duplicates
      const shuffledResources = [...domainResources].sort(() => Math.random() - 0.5);
      const resourcesToAllocate = shuffledResources.slice(0, Math.min(allocCount, domainResources.length));

      for (const resource of resourcesToAllocate) {
        // Get resource capabilities
        const resourceCapabilities = await ResourceCapability.findAll({
          where: { resourceId: resource.id, isActive: true },
        });

        // Get project requirements
        const projectRequirements = await ProjectRequirement.findAll({
          where: { projectId: project.id, isActive: true },
        });

        if (resourceCapabilities.length > 0 && projectRequirements.length > 0) {
          const capability = resourceCapabilities[0];
          const requirement = projectRequirements[0];
          const matchScore = 65 + Math.floor(Math.random() * 35); // 65-100

          await ResourceAllocation.create({
            scenarioId: baselineScenario.id,
            projectId: project.id,
            resourceId: resource.id,
            resourceCapabilityId: capability.id,
            projectRequirementId: requirement.id,
            matchScore,
            allocationType: ['Dedicated', 'Shared', 'On-Demand'][Math.floor(Math.random() * 3)],
            allocationPercentage: Math.floor(Math.random() * 50) + 25, // 25-75%
            allocatedHours: Math.floor(Math.random() * 80) + 40,
            startDate: project.startDate,
            endDate: project.endDate,
            actualStartDate: project.actualStartDate,
            actualEndDate: project.actualEndDate,
            billableRate: resource.hourlyRate,
            cost: resource.hourlyRate * 100,
            roleOnProject: `Developer`,
            isActive: true,
          });
          allocationCount++;
        }
      }
    }

    console.log(`   ✅ Created ${allocationCount} resource allocations\n`);

    // 14. Create Project Dependencies
    console.log('1️⃣4️⃣ Creating project dependencies...');
    let dependencyCount = 0;
    const MAX_DEPENDENCIES = 15;

    // Get all milestones for dependency linking
    const allMilestones = await Milestone.findAll({
      where: { scenarioId: baselineScenario.id, isActive: true },
    });

    // Track created dependencies to avoid duplicates and conflicts
    const createdDependencies = new Set<string>();

    const addDependency = async (
      predType: 'project' | 'milestone',
      predId: number,
      succType: 'project' | 'milestone',
      succId: number,
      depType: 'FS' | 'SS' | 'FF' | 'SF',
      lagDays: number = 0
    ) => {
      // Create unique key to track this dependency pair
      const key = `${predType}:${predId}-${succType}:${succId}`;

      // Skip if we already have a dependency between these entities
      if (createdDependencies.has(key)) {
        return false;
      }

      // Skip if this would create a self-dependency
      if (predType === succType && predId === succId) {
        return false;
      }

      const predPoint = depType === 'FS' || depType === 'FF' ? 'end' : 'start';
      const succPoint = depType === 'FS' || depType === 'SS' ? 'start' : 'end';

      await ProjectDependency.create({
        scenarioId: baselineScenario.id,
        predecessorType: predType,
        predecessorId: predId,
        predecessorPoint: predPoint,
        successorType: succType,
        successorId: succId,
        successorPoint: succPoint,
        dependencyType: depType,
        lagDays,
        isActive: true,
      });

      createdDependencies.add(key);
      return true;
    };

    // Group projects by domain for realistic dependencies
    const projectsByDomain = domains.map(domain => ({
      domainId: domain.id,
      domainName: domain.name,
      projects: projects.filter(p => p.domainId === domain.id).slice(0, 4) // Get up to 4 projects per domain
    }));

    // 1. Create sequential Finish-to-Start dependencies within each domain
    for (const { projects: domainProjects } of projectsByDomain) {
      if (domainProjects.length < 2 || dependencyCount >= MAX_DEPENDENCIES) continue;

      // Create chain: Project 0 -> Project 1 -> Project 2
      for (let i = 0; i < domainProjects.length - 1 && dependencyCount < MAX_DEPENDENCIES; i++) {
        const predecessor = domainProjects[i];
        const successor = domainProjects[i + 1];

        const added = await addDependency(
          'project',
          predecessor.id,
          'project',
          successor.id,
          'FS',
          Math.floor(Math.random() * 10) + 5 // 5-14 days lag
        );

        if (added) dependencyCount++;
      }
    }

    // 2. Create some milestone-to-project dependencies (within same domain)
    for (const { projects: domainProjects } of projectsByDomain) {
      if (domainProjects.length < 2 || dependencyCount >= MAX_DEPENDENCIES) continue;

      const predecessor = domainProjects[0];
      const successor = domainProjects[domainProjects.length - 1];

      const predecessorMilestones = allMilestones.filter((m: any) => m.projectId === predecessor.id);

      // Find UAT milestone of predecessor
      const predUAT = predecessorMilestones.find((m: any) => m.phase === 'UAT');

      if (predUAT && dependencyCount < MAX_DEPENDENCIES) {
        const added = await addDependency(
          'milestone',
          predUAT.id,
          'project',
          successor.id,
          'FS',
          7 // 1 week after UAT completes
        );

        if (added) dependencyCount++;
      }
    }

    // 3. Create a few cross-domain dependencies (Infrastructure domain enables other domains)
    const infraDomain = projectsByDomain.find(d => d.domainName === 'Infrastructure');
    if (infraDomain && infraDomain.projects.length > 0 && dependencyCount < MAX_DEPENDENCIES) {
      const infraProject = infraDomain.projects[0];

      // Pick 2-3 other domains that depend on infrastructure
      const otherDomains = projectsByDomain
        .filter(d => d.domainName !== 'Infrastructure' && d.projects.length > 0)
        .slice(0, 3);

      for (const otherDomain of otherDomains) {
        if (dependencyCount >= MAX_DEPENDENCIES) break;

        const added = await addDependency(
          'project',
          infraProject.id,
          'project',
          otherDomain.projects[0].id,
          'FS',
          14 // 2 weeks after infrastructure completes
        );

        if (added) dependencyCount++;
      }
    }

    console.log(`   ✅ Created ${dependencyCount} project dependencies\n`);

    // 15. Create Capacity Models
    console.log('1️⃣5️⃣ Creating capacity models...');
    const models: any[] = [];

    const modelTypes = ['Baseline', 'Optimistic', 'Pessimistic'];
    for (const modelType of modelTypes) {
      const model = await CapacityModel.create({
        name: `${modelType} Capacity Model FY25`,
        description: `${modelType} scenario for fiscal year 2025`,
        modelType,
        fiscalYear: 'FY25',
        quarter: 'Q2',
        prioritizationCriteria: JSON.stringify({
          criticalProjects: 'first',
          highPriority: 'second',
          skillMatch: 'preferred'
        }),
        assumptions: JSON.stringify({
          overtimeAllowed: modelType === 'Optimistic',
          hiringPlan: modelType !== 'Pessimistic',
          attritionRate: modelType === 'Pessimistic' ? 15 : 10
        }),
        createdBy: admin.id,
        isBaseline: modelType === 'Baseline',
        isActive: true,
      });
      models.push(model);
    }

    console.log(`   ✅ Created ${models.length} capacity models\n`);

    // 16. Create Capacity Scenarios
    console.log('1️⃣6️⃣ Creating capacity scenarios...');
    let scenarioCount = 0;

    for (const model of models) {
      for (const domain of domains) {
        // Get apps used in this domain
        const domainProjects = projects.filter(p => p.domainId === domain.id);
        const appsUsed = apps.slice(0, 2); // Use first 2 apps for scenarios

        for (const app of appsUsed) {
          const techsForApp = technologies.filter(t => t.appId === app.id);
          if (techsForApp.length === 0) continue;

          const tech = techsForApp[0];
          const rolesForTech = roles.filter(r => r.technologyId === tech.id);
          if (rolesForTech.length === 0) continue;

          const role = rolesForTech[0];

          const supply = 480;
          const demandMultiplier = model.modelType === 'Optimistic' ? 0.8 :
                                  model.modelType === 'Pessimistic' ? 1.2 : 1.0;
          const demand = Math.floor(supply * demandMultiplier);
          const utilization = (demand / supply) * 100;

          await CapacityScenario.create({
            capacityModelId: model.id,
            domainId: domain.id,
            appId: app.id,
            technologyId: tech.id,
            roleId: role.id,
            scenarioName: `${domain.name} ${app.name} Capacity`,
            description: `Capacity analysis for ${domain.name} ${app.name}`,
            totalDemandHours: demand,
            totalSupplyHours: supply,
            utilizationRate: utilization,
            overAllocationHours: Math.max(0, demand - supply),
            fiscalPeriod: 'FY25-Q2',
            calculations: JSON.stringify({
              totalProjects: domainProjects.length,
              activeAllocations: allocationCount,
              averageAllocation: 65
            }),
            recommendations: utilization > 100
              ? JSON.stringify(['Hire additional resources', 'Reduce project scope'])
              : JSON.stringify(['Capacity available for new projects']),
          });
          scenarioCount++;
        }
      }
    }

    console.log(`   ✅ Created ${scenarioCount} capacity scenarios\n`);

    // Summary
    console.log('\n🎉 Database seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Scenarios: 1 (Baseline)`);
    console.log(`   - Apps: ${apps.length}`);
    console.log(`   - Technologies: ${technologies.length}`);
    console.log(`   - Roles: ${roles.length}`);
    console.log(`   - Domains: ${domains.length}`);
    console.log(`   - Segment Functions: ${segmentFunctions.length}`);
    console.log(`   - Resources: ${resources.length}`);
    console.log(`   - Resource Capabilities: ${capabilityCount}`);
    console.log(`   - Projects: ${projects.length}`);
    console.log(`   - Project Requirements: ${requirementCount}`);
    console.log(`   - Project Domain Impacts: ${domainImpactCount}`);
    console.log(`   - Milestones: ${milestoneCount}`);
    // console.log(`   - Pipelines: ${pipelines.length}`); // Temporarily disabled
    // console.log(`   - Project-Pipeline Links: ${ppCount}`); // Temporarily disabled
    console.log(`   - Resource Allocations: ${allocationCount}`);
    console.log(`   - Capacity Models: ${models.length}`);
    console.log(`   - Capacity Scenarios: ${scenarioCount}`);
    console.log('\n🔐 Login credentials:');
    console.log('   Email: admin@ialign.com');
    console.log('   Password: Admin@123');
    console.log('\n✨ All users have the same password: Admin@123\n');

    return true;
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
};

// Only run if executed directly (not imported)
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default seedDatabase;
