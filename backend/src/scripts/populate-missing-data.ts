import Resource from '../models/Resource';
import Project from '../models/Project';
import ResourceCapability from '../models/ResourceCapability';
import ProjectRequirement from '../models/ProjectRequirement';
import ResourceAllocation from '../models/ResourceAllocation';
import App from '../models/App';
import Technology from '../models/Technology';
import Role from '../models/Role';
import Domain from '../models/Domain';
import SegmentFunction from '../models/SegmentFunction';
import { calculateMatchScore } from '../utils/resourceMatcher';

const populateMissingData = async () => {
  try {
    console.log('🔄 Populating missing data...\n');

    // 1. Update Resources with domainId and segmentFunctionId
    console.log('1️⃣  Updating Resources with domain and segment function associations...');
    const resources = await Resource.findAll({ where: { isActive: true } });
    const domains = await Domain.findAll({ where: { isActive: true } });
    const segmentFunctions = await SegmentFunction.findAll({ where: { isActive: true } });

    let resourceUpdateCount = 0;
    for (const resource of resources) {
      // Assign random domain
      const domain = domains[Math.floor(Math.random() * domains.length)];

      // Get segment functions for this domain
      const domainSegmentFunctions = segmentFunctions.filter(sf => sf.domainId === domain.id);
      const segmentFunction = domainSegmentFunctions.length > 0
        ? domainSegmentFunctions[Math.floor(Math.random() * domainSegmentFunctions.length)]
        : segmentFunctions[0];

      await resource.update({
        domainId: domain.id,
        segmentFunctionId: segmentFunction.id,
      });
      resourceUpdateCount++;
    }
    console.log(`   ✅ Updated ${resourceUpdateCount} resources with domain/segment function\n`);

    // 2. Create ResourceCapabilities for all resources
    console.log('2️⃣  Creating ResourceCapabilities for all resources...');
    const apps = await App.findAll({ where: { isActive: true } });
    const technologies = await Technology.findAll({ where: { isActive: true } });
    const roles = await Role.findAll({ where: { isActive: true } });

    // Delete existing capabilities to start fresh
    await ResourceCapability.destroy({ where: {} });

    let capabilityCount = 0;
    for (const resource of resources) {
      // Each resource gets 2-4 capabilities
      const numCapabilities = Math.floor(Math.random() * 3) + 2; // 2-4

      for (let i = 0; i < numCapabilities; i++) {
        const app = apps[Math.floor(Math.random() * apps.length)];
        const techsForApp = technologies.filter(t => t.appId === app.id);

        if (techsForApp.length === 0) continue;

        const technology = techsForApp[Math.floor(Math.random() * techsForApp.length)];
        const rolesForTech = roles.filter(r => r.technologyId === technology.id);

        if (rolesForTech.length === 0) continue;

        const role = rolesForTech[Math.floor(Math.random() * rolesForTech.length)];

        // Check if this combination already exists for this resource
        const existing = await ResourceCapability.findOne({
          where: {
            resourceId: resource.id,
            appId: app.id,
            technologyId: technology.id,
            roleId: role.id,
          },
        });

        if (!existing) {
          const proficiencyLevels: Array<'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'> = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
          await ResourceCapability.create({
            resourceId: resource.id,
            appId: app.id,
            technologyId: technology.id,
            roleId: role.id,
            proficiencyLevel: proficiencyLevels[Math.floor(Math.random() * 4)],
            yearsOfExperience: Math.floor(Math.random() * 10) + 1,
            isPrimary: i === 0, // First capability is primary
            lastUsedDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000), // Within last year
            certifications: i === 0 ? JSON.stringify(['Certified Professional']) : undefined,
            isActive: true,
          });
          capabilityCount++;
        }
      }
    }
    console.log(`   ✅ Created ${capabilityCount} resource capabilities\n`);

    // 3. Create ProjectRequirements for all projects
    console.log('3️⃣  Creating ProjectRequirements for all projects...');
    const projects = await Project.findAll({ where: { isActive: true } });

    // Delete existing requirements to start fresh
    await ProjectRequirement.destroy({ where: {} });

    let requirementCount = 0;
    for (const project of projects) {
      // Each project needs 3-6 requirements
      const numRequirements = Math.floor(Math.random() * 4) + 3; // 3-6

      for (let i = 0; i < numRequirements; i++) {
        const app = apps[Math.floor(Math.random() * apps.length)];
        const techsForApp = technologies.filter(t => t.appId === app.id);

        if (techsForApp.length === 0) continue;

        const technology = techsForApp[Math.floor(Math.random() * techsForApp.length)];
        const rolesForTech = roles.filter(r => r.technologyId === technology.id);

        if (rolesForTech.length === 0) continue;

        const role = rolesForTech[Math.floor(Math.random() * rolesForTech.length)];

        // Check if this combination already exists for this project
        const existing = await ProjectRequirement.findOne({
          where: {
            projectId: project.id,
            appId: app.id,
            technologyId: technology.id,
            roleId: role.id,
          },
        });

        if (!existing) {
          const proficiencyLevels: Array<'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'> = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
          const priorities: Array<'Low' | 'Medium' | 'High' | 'Critical'> = ['Low', 'Medium', 'High', 'Critical'];
          await ProjectRequirement.create({
            projectId: project.id,
            appId: app.id,
            technologyId: technology.id,
            roleId: role.id,
            proficiencyLevel: proficiencyLevels[Math.floor(Math.random() * 4)],
            minYearsExp: Math.floor(Math.random() * 5) + 2,
            requiredCount: Math.floor(Math.random() * 3) + 1,
            fulfilledCount: 0,
            priority: priorities[Math.floor(Math.random() * 4)],
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

    // 4. Update ResourceAllocations with capability/requirement/match scores
    console.log('4️⃣  Updating ResourceAllocations with capabilities, requirements, and match scores...');
    const allocations = await ResourceAllocation.findAll({
      where: { isActive: true },
    });

    let allocationUpdateCount = 0;
    for (const allocation of allocations) {
      // Get resource capabilities
      const resourceCapabilities = await ResourceCapability.findAll({
        where: {
          resourceId: allocation.resourceId,
          isActive: true,
        },
        include: [
          { model: App, as: 'app' },
          { model: Technology, as: 'technology' },
          { model: Role, as: 'role' },
        ],
      });

      // Get project requirements
      const projectRequirements = await ProjectRequirement.findAll({
        where: {
          projectId: allocation.projectId,
          isActive: true,
        },
        include: [
          { model: App, as: 'app' },
          { model: Technology, as: 'technology' },
          { model: Role, as: 'role' },
        ],
      });

      if (resourceCapabilities.length === 0 || projectRequirements.length === 0) {
        continue;
      }

      // Find best matching capability-requirement pair
      let bestMatch: any = null;
      let bestScore = 0;

      for (const capability of resourceCapabilities) {
        for (const requirement of projectRequirements) {
          const score = calculateMatchScore(capability as any, requirement as any);
          if (score > bestScore) {
            bestScore = score;
            bestMatch = { capability, requirement };
          }
        }
      }

      if (bestMatch) {
        await allocation.update({
          resourceCapabilityId: bestMatch.capability.id,
          projectRequirementId: bestMatch.requirement.id,
          matchScore: bestScore,
        });
        allocationUpdateCount++;
      }
    }
    console.log(`   ✅ Updated ${allocationUpdateCount} allocations with match data\n`);

    console.log('✨ Summary:');
    console.log(`   - Resources updated: ${resourceUpdateCount}`);
    console.log(`   - Capabilities created: ${capabilityCount}`);
    console.log(`   - Requirements created: ${requirementCount}`);
    console.log(`   - Allocations updated: ${allocationUpdateCount}`);
    console.log('\n✅ All missing data populated successfully!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error populating missing data:', error);
    process.exit(1);
  }
};

populateMissingData();
