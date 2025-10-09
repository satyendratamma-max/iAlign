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
import Pipeline from '../models/Pipeline';
import ProjectPipeline from '../models/ProjectPipeline';
import CapacityModel from '../models/CapacityModel';
import CapacityScenario from '../models/CapacityScenario';
import App from '../models/App';
import Technology from '../models/Technology';
import Role from '../models/Role';
import ResourceCapability from '../models/ResourceCapability';
import ProjectRequirement from '../models/ProjectRequirement';
import ProjectDomainImpact from '../models/ProjectDomainImpact';
import ProjectDependency from '../models/ProjectDependency';

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

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting comprehensive database seeding...\n');

    // Sync database
    await sequelize.sync({ force: true });
    console.log('✅ Database synced\n');

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

    console.log(`   ✅ Created ${users.length} users\n`);

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

    const appsData = [
      { name: 'SAP', code: 'SAP', category: 'ERP', description: 'SAP ERP System', isGlobal: true, status: 'Active' as const },
      { name: 'Salesforce', code: 'SFDC', category: 'CRM', description: 'Salesforce CRM', isGlobal: true, status: 'Active' as const },
      { name: 'Oracle', code: 'ORCL', category: 'Database', description: 'Oracle Database & Applications', isGlobal: true, status: 'Active' as const },
      { name: 'Custom Applications', code: 'CUSTOM', category: 'Custom', description: 'Custom built applications', isGlobal: false, status: 'Active' as const },
    ];

    const apps: any[] = [];
    for (const appData of appsData) {
      const app = await App.create({ ...appData, isActive: true });
      apps.push(app);
    }

    console.log(`   ✅ Created ${apps.length} apps`);

    const technologiesData: any[] = [
      { appId: 1, name: 'SAP ECC', code: 'ECC', category: 'Platform', description: 'SAP ECC 6.0' },
      { appId: 1, name: 'SAP S/4HANA', code: 'S4H', category: 'Platform', description: 'SAP S/4HANA' },
      { appId: 1, name: 'SAP Fiori', code: 'FIORI', category: 'Framework', description: 'SAP Fiori UX' },
      { appId: 1, name: 'SAP BW', code: 'BW', category: 'Platform', description: 'SAP Business Warehouse' },
      { appId: 2, name: 'Sales Cloud', code: 'SALES', category: 'Platform', description: 'Salesforce Sales Cloud' },
      { appId: 2, name: 'Service Cloud', code: 'SERVICE', category: 'Platform', description: 'Salesforce Service Cloud' },
      { appId: 2, name: 'Marketing Cloud', code: 'MKTG', category: 'Platform', description: 'Salesforce Marketing Cloud' },
      { appId: 3, name: 'Oracle DB', code: 'ODB', category: 'Database', description: 'Oracle Database' },
      { appId: 3, name: 'Oracle Fusion', code: 'FUSION', category: 'Platform', description: 'Oracle Fusion Applications' },
      { appId: 4, name: 'React', code: 'REACT', category: 'Framework', description: 'React.js Framework' },
      { appId: 4, name: 'Node.js', code: 'NODE', category: 'Platform', description: 'Node.js Runtime' },
      { appId: 4, name: 'Python', code: 'PY', category: 'Language', description: 'Python Language' },
      { appId: 4, name: '.NET', code: 'DOTNET', category: 'Framework', description: 'Microsoft .NET Framework' },
      { appId: 4, name: 'Java', code: 'JAVA', category: 'Language', description: 'Java Platform' },
      { appId: 4, name: 'Angular', code: 'NG', category: 'Framework', description: 'Angular Framework' },
      { appId: 4, name: 'Vue.js', code: 'VUE', category: 'Framework', description: 'Vue.js Framework' },
      { appId: 4, name: 'Django', code: 'DJANGO', category: 'Framework', description: 'Django Framework' },
      { appId: 4, name: 'Spring Boot', code: 'SPRING', category: 'Framework', description: 'Spring Boot Framework' },
      { appId: 4, name: 'Express.js', code: 'EXPRESS', category: 'Framework', description: 'Express.js Framework' },
      { appId: 4, name: 'Flask', code: 'FLASK', category: 'Framework', description: 'Flask Framework' },
    ];

    const technologies: any[] = [];
    for (const techData of technologiesData) {
      const tech = await Technology.create({ ...techData, isActive: true });
      technologies.push(tech);
    }

    console.log(`   ✅ Created ${technologies.length} technologies`);

    const rolesData: any[] = [
      { appId: 1, technologyId: 1, name: 'SAP ECC Consultant', code: 'ECC-CON', level: 'Senior', category: 'Consulting' },
      { appId: 1, technologyId: 2, name: 'SAP S/4HANA Architect', code: 'S4H-ARCH', level: 'Lead', category: 'Architecture' },
      { appId: 1, technologyId: 2, name: 'SAP S/4HANA Developer', code: 'S4H-DEV', level: 'Mid', category: 'Development' },
      { appId: 1, technologyId: 3, name: 'SAP Fiori Developer', code: 'FIORI-DEV', level: 'Mid', category: 'Development' },
      { appId: 1, technologyId: 4, name: 'SAP BW Consultant', code: 'BW-CON', level: 'Senior', category: 'Consulting' },
      { appId: 2, technologyId: 5, name: 'Salesforce Developer', code: 'SFDC-DEV', level: 'Mid', category: 'Development' },
      { appId: 2, technologyId: 5, name: 'Salesforce Admin', code: 'SFDC-ADM', level: 'Junior', category: 'Operations' },
      { appId: 2, technologyId: 6, name: 'Service Cloud Specialist', code: 'SVC-SPEC', level: 'Senior', category: 'Consulting' },
      { appId: 3, technologyId: 8, name: 'Oracle DBA', code: 'ORA-DBA', level: 'Senior', category: 'Operations' },
      { appId: 3, technologyId: 9, name: 'Oracle Fusion Developer', code: 'FUSION-DEV', level: 'Mid', category: 'Development' },
      { appId: 4, technologyId: 10, name: 'React Developer', code: 'REACT-DEV', level: 'Mid', category: 'Development' },
      { appId: 4, technologyId: 11, name: 'Node.js Developer', code: 'NODE-DEV', level: 'Mid', category: 'Development' },
      { appId: 4, technologyId: 12, name: 'Python Developer', code: 'PY-DEV', level: 'Mid', category: 'Development' },
      { appId: 4, technologyId: 13, name: '.NET Developer', code: 'NET-DEV', level: 'Senior', category: 'Development' },
      { appId: 4, technologyId: 14, name: 'Java Developer', code: 'JAVA-DEV', level: 'Senior', category: 'Development' },
      { appId: 4, technologyId: 15, name: 'Full Stack Developer', code: 'FS-DEV', level: 'Lead', category: 'Development' },
    ];

    const roles: any[] = [];
    for (const roleData of rolesData) {
      const role = await Role.create({ ...roleData, isActive: true });
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

    // Create 15-20 resources per domain
    for (const domain of domains) {
      const domainSegmentFunctions = segmentFunctions.filter(sf => sf.domainId === domain.id);
      const resourceCount = Math.floor(Math.random() * 6) + 15; // 15-20 resources

      for (let i = 0; i < resourceCount; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const hourlyRate = Math.floor(Math.random() * 100) + 80; // $80-180/hr
        const segmentFunction = domainSegmentFunctions[Math.floor(Math.random() * domainSegmentFunctions.length)];

        const resource = await Resource.create({
          scenarioId: baselineScenario.id,
          domainId: domain.id,
          segmentFunctionId: segmentFunction.id,
          employeeId: `EMP${String(empId).padStart(4, '0')}`,
          firstName,
          lastName,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${empId}@ialign.com`,
          role: `Developer`,
          location: domain.location,
          hourlyRate,
          utilizationRate: Math.floor(Math.random() * 30) + 70,
          isActive: true,
        });
        resources.push(resource);
        empId++;
      }
    }

    console.log(`   ✅ Created ${resources.length} resources\n`);

    // 7. Create Resource Capabilities
    console.log('7️⃣  Creating resource capabilities...');
    let capabilityCount = 0;
    const proficiencyLevels: Array<'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'> = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

    for (const resource of resources) {
      const numCapabilities = Math.floor(Math.random() * 3) + 2; // 2-4 capabilities

      for (let i = 0; i < numCapabilities; i++) {
        const app = apps[Math.floor(Math.random() * apps.length)];
        const techsForApp = technologies.filter(t => t.appId === app.id);
        if (techsForApp.length === 0) continue;

        const technology = techsForApp[Math.floor(Math.random() * techsForApp.length)];
        const rolesForTech = roles.filter(r => r.technologyId === technology.id);
        if (rolesForTech.length === 0) continue;

        const role = rolesForTech[Math.floor(Math.random() * rolesForTech.length)];

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
        }
      }
    }

    console.log(`   ✅ Created ${capabilityCount} resource capabilities\n`);

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

    // 8. Create Project Requirements
    console.log('8️⃣  Creating project requirements...');
    let requirementCount = 0;
    const reqProficiencyLevels: Array<'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'> = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
    const reqPriorities: Array<'Low' | 'Medium' | 'High' | 'Critical'> = ['Low', 'Medium', 'High', 'Critical'];

    for (const project of projects) {
      const numRequirements = Math.floor(Math.random() * 4) + 3; // 3-6 requirements

      for (let i = 0; i < numRequirements; i++) {
        const app = apps[Math.floor(Math.random() * apps.length)];
        const techsForApp = technologies.filter(t => t.appId === app.id);
        if (techsForApp.length === 0) continue;

        const technology = techsForApp[Math.floor(Math.random() * techsForApp.length)];
        const rolesForTech = roles.filter(r => r.technologyId === technology.id);
        if (rolesForTech.length === 0) continue;

        const role = rolesForTech[Math.floor(Math.random() * rolesForTech.length)];

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
        }
      }
    }

    console.log(`   ✅ Created ${requirementCount} project requirements\n`);

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

      for (let i = 0; i < PHASES.length; i++) {
        const phaseStart = new Date(startDate.getTime() + (i * daysPerPhase * 24 * 60 * 60 * 1000));
        const phaseEnd = new Date(startDate.getTime() + ((i + 1) * daysPerPhase * 24 * 60 * 60 * 1000));

        const phaseProgress = Math.max(0, Math.min(100, (project.progress - (i * 15))));
        let status = 'Not Started';
        if (phaseProgress === 100) status = 'Completed';
        else if (phaseProgress > 0) status = 'In Progress';

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

    // 11. Create Pipelines
    console.log('1️⃣1️⃣ Creating pipelines...');
    const pipelineTypes = ['Application', 'Infrastructure', 'Integration'];
    const vendors = ['SAP', 'Oracle', 'Salesforce', 'Microsoft', 'AWS', 'Custom'];
    const pipelines: any[] = [];

    const pipelineNames = [
      'ERP System', 'CRM Platform', 'Data Warehouse', 'API Gateway',
      'Cloud Infrastructure', 'Authentication Service', 'Payment Gateway',
      'Analytics Engine', 'Email Service', 'File Storage', 'CDN',
      'Load Balancer', 'Database Cluster', 'Message Queue', 'Cache Layer',
      'Monitoring System', 'Logging Platform', 'CI/CD Pipeline', 'Container Registry',
      'Service Mesh'
    ];

    for (const name of pipelineNames) {
      const pipeline = await Pipeline.create({
        name,
        type: pipelineTypes[Math.floor(Math.random() * 3)],
        vendor: vendors[Math.floor(Math.random() * 6)],
        platform: Math.random() > 0.5 ? 'Cloud' : 'On-Premise',
        environment: 'Production',
        description: `${name} for enterprise operations`,
        isActive: true,
      });
      pipelines.push(pipeline);
    }

    console.log(`   ✅ Created ${pipelines.length} pipelines\n`);

    // 12. Create Project-Pipeline relationships
    console.log('1️⃣2️⃣ Creating project-pipeline relationships...');
    let ppCount = 0;

    for (const project of projects) {
      const pipelineCount = Math.floor(Math.random() * 4) + 1;
      const selectedPipelines = pipelines
        .sort(() => 0.5 - Math.random())
        .slice(0, pipelineCount);

      for (const pipeline of selectedPipelines) {
        await ProjectPipeline.create({
          projectId: project.id,
          pipelineId: pipeline.id,
          integrationType: ['Source', 'Target', 'Middleware'][Math.floor(Math.random() * 3)],
          setupRequired: Math.random() > 0.3,
          status: project.status === 'Completed' ? 'Completed' :
                  project.status === 'Planning' ? 'Planned' : 'In Progress',
          notes: `Integration requirement for ${project.name}`,
          isActive: true,
        });
        ppCount++;
      }
    }

    console.log(`   ✅ Created ${ppCount} project-pipeline relationships\n`);

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
    const MAX_DEPENDENCIES = 10;

    // Get all milestones for dependency linking
    const allMilestones = await Milestone.findAll({
      where: { scenarioId: baselineScenario.id, isActive: true },
    });

    // Group projects by domain for realistic dependencies
    const projectsByDomain = domains.map(domain => ({
      domainId: domain.id,
      projects: projects.filter(p => p.domainId === domain.id).slice(0, 5) // Get up to 5 projects per domain
    }));

    for (const { projects: domainProjects } of projectsByDomain) {
      if (domainProjects.length < 2 || dependencyCount >= MAX_DEPENDENCIES) break;

      // Create sequential project-to-project dependencies within domain
      for (let i = 0; i < domainProjects.length - 1 && dependencyCount < MAX_DEPENDENCIES; i++) {
        const predecessor = domainProjects[i];
        const successor = domainProjects[i + 1];

        // Create a Finish-to-Start dependency (most common)
        await ProjectDependency.create({
          scenarioId: baselineScenario.id,
          predecessorType: 'project',
          predecessorId: predecessor.id,
          predecessorPoint: 'end',
          successorType: 'project',
          successorId: successor.id,
          successorPoint: 'start',
          dependencyType: 'FS',
          lagDays: Math.floor(Math.random() * 10) + 5, // 5-15 days lag
          isActive: true,
        });
        dependencyCount++;

        // Add some milestone-to-milestone dependencies
        if (dependencyCount < MAX_DEPENDENCIES) {
          const predecessorMilestones = allMilestones.filter((m: any) => m.projectId === predecessor.id);
          const successorMilestones = allMilestones.filter((m: any) => m.projectId === successor.id);

          if (predecessorMilestones.length > 0 && successorMilestones.length > 0) {
            // Link UAT of predecessor to Requirements of successor
            const predUAT = predecessorMilestones.find((m: any) => m.phase === 'UAT');
            const succReq = successorMilestones.find((m: any) => m.phase === 'Requirements');

            if (predUAT && succReq) {
              await ProjectDependency.create({
                scenarioId: baselineScenario.id,
                predecessorType: 'milestone',
                predecessorId: predUAT.id,
                predecessorPoint: 'end',
                successorType: 'milestone',
                successorId: succReq.id,
                successorPoint: 'start',
                dependencyType: 'FS',
                lagDays: 3,
                isActive: true,
              });
              dependencyCount++;
            }
          }
        }
      }

      // Create some Start-to-Start dependencies (parallel work)
      if (domainProjects.length >= 3 && dependencyCount < MAX_DEPENDENCIES) {
        const proj1 = domainProjects[0];
        const proj2 = domainProjects[1];

        await ProjectDependency.create({
          scenarioId: baselineScenario.id,
          predecessorType: 'project',
          predecessorId: proj1.id,
          predecessorPoint: 'start',
          successorType: 'project',
          successorId: proj2.id,
          successorPoint: 'start',
          dependencyType: 'SS',
          lagDays: 7, // Start 7 days after predecessor starts
          isActive: true,
        });
        dependencyCount++;
      }

      // Create some Finish-to-Finish dependencies
      if (domainProjects.length >= 4 && dependencyCount < MAX_DEPENDENCIES) {
        const proj2 = domainProjects[1];
        const proj3 = domainProjects[2];

        await ProjectDependency.create({
          scenarioId: baselineScenario.id,
          predecessorType: 'project',
          predecessorId: proj2.id,
          predecessorPoint: 'end',
          successorType: 'project',
          successorId: proj3.id,
          successorPoint: 'end',
          dependencyType: 'FF',
          lagDays: 0,
          isActive: true,
        });
        dependencyCount++;
      }
    }

    // Create some cross-domain dependencies
    if (projectsByDomain.length >= 2 && dependencyCount < MAX_DEPENDENCIES) {
      const domain1Projects = projectsByDomain[0].projects;
      const domain2Projects = projectsByDomain[1].projects;

      if (domain1Projects.length > 0 && domain2Projects.length > 0) {
        // Infrastructure project must finish before application project starts
        await ProjectDependency.create({
          scenarioId: baselineScenario.id,
          predecessorType: 'project',
          predecessorId: domain1Projects[0].id,
          predecessorPoint: 'end',
          successorType: 'project',
          successorId: domain2Projects[0].id,
          successorPoint: 'start',
          dependencyType: 'FS',
          lagDays: 14, // 2 week buffer between domains
          isActive: true,
        });
        dependencyCount++;
      }
    }

    console.log(`   ✅ Created ${dependencyCount} project dependencies (max ${MAX_DEPENDENCIES})\n`);

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
    console.log(`   - Pipelines: ${pipelines.length}`);
    console.log(`   - Project-Pipeline Links: ${ppCount}`);
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
