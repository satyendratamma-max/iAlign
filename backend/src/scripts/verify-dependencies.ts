import sequelize from '../config/database';
// Import models WITH associations from index
import { ProjectDependency, Project, Milestone } from '../models';

const verifyDependencies = async () => {
  try {
    console.log('🔍 Verifying project dependencies...\n');

    // Query all dependencies with their related projects and milestones
    const dependencies = await ProjectDependency.findAll({
      where: { isActive: true },
      include: [
        {
          model: Project,
          as: 'predecessorProject',
          attributes: ['id', 'projectNumber', 'name'],
          required: false,
        },
        {
          model: Project,
          as: 'successorProject',
          attributes: ['id', 'projectNumber', 'name'],
          required: false,
        },
        {
          model: Milestone,
          as: 'predecessorMilestone',
          attributes: ['id', 'phase', 'name'],
          required: false,
        },
        {
          model: Milestone,
          as: 'successorMilestone',
          attributes: ['id', 'phase', 'name'],
          required: false,
        },
      ],
      limit: 10,
    });

    console.log(`✅ Found ${dependencies.length} dependencies\n`);

    if (dependencies.length === 0) {
      console.log('⚠️  No dependencies found in database');
      return;
    }

    console.log('📋 Sample Dependencies:\n');

    dependencies.forEach((dep: any, index: number) => {
      console.log(`${index + 1}. Dependency ID: ${dep.id}`);
      console.log(`   Type: ${dep.dependencyType} (${dep.lagDays} days lag)`);

      // Predecessor
      if (dep.predecessorType === 'project' && dep.predecessorProject) {
        console.log(`   Predecessor: Project "${dep.predecessorProject.name}" (${dep.predecessorProject.projectNumber})`);
      } else if (dep.predecessorType === 'milestone' && dep.predecessorMilestone) {
        console.log(`   Predecessor: Milestone "${dep.predecessorMilestone.name}" (${dep.predecessorMilestone.phase})`);
      } else {
        console.log(`   ⚠️  Predecessor: UNKNOWN (${dep.predecessorType} #${dep.predecessorId})`);
      }

      // Successor
      if (dep.successorType === 'project' && dep.successorProject) {
        console.log(`   Successor: Project "${dep.successorProject.name}" (${dep.successorProject.projectNumber})`);
      } else if (dep.successorType === 'milestone' && dep.successorMilestone) {
        console.log(`   Successor: Milestone "${dep.successorMilestone.name}" (${dep.successorMilestone.phase})`);
      } else {
        console.log(`   ⚠️  Successor: UNKNOWN (${dep.successorType} #${dep.successorId})`);
      }

      console.log('');
    });

    // Check for any dependencies with missing associations
    const unknownCount = dependencies.filter((dep: any) => {
      const predUnknown = (dep.predecessorType === 'project' && !dep.predecessorProject) ||
                          (dep.predecessorType === 'milestone' && !dep.predecessorMilestone);
      const succUnknown = (dep.successorType === 'project' && !dep.successorProject) ||
                          (dep.successorType === 'milestone' && !dep.successorMilestone);
      return predUnknown || succUnknown;
    }).length;

    if (unknownCount > 0) {
      console.log(`❌ Found ${unknownCount} dependencies with UNKNOWN predecessors/successors`);
    } else {
      console.log('✅ All dependencies have properly resolved predecessors and successors!');
    }

    await sequelize.close();
  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  }
};

if (require.main === module) {
  verifyDependencies()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default verifyDependencies;
