import sequelize from '../config/database';
import { ProjectDependency, Project, Milestone } from '../models';

const testDependencyAPI = async () => {
  try {
    console.log('🧪 Testing dependency API query...\n');

    // Simulate the API query
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
          attributes: ['id', 'phase', 'name', 'projectId'],
          required: false,
        },
        {
          model: Milestone,
          as: 'successorMilestone',
          attributes: ['id', 'phase', 'name', 'projectId'],
          required: false,
        },
      ],
      order: [['createdDate', 'DESC']],
      limit: 5,
    });

    console.log(`✅ Found ${dependencies.length} dependencies\n`);

    if (dependencies.length === 0) {
      console.log('⚠️  No dependencies found');
      return;
    }

    console.log('📋 Sample API Response:\n');

    dependencies.forEach((dep: any, index: number) => {
      console.log(`${index + 1}. Dependency ID: ${dep.id}`);
      console.log(`   Raw Data:`);
      console.log(`   - predecessorType: ${dep.predecessorType}`);
      console.log(`   - predecessorId: ${dep.predecessorId}`);
      console.log(`   - successorType: ${dep.successorType}`);
      console.log(`   - successorId: ${dep.successorId}`);

      console.log(`\n   Associated Objects:`);
      if (dep.predecessorProject) {
        console.log(`   ✅ predecessorProject: ${dep.predecessorProject.projectNumber} - ${dep.predecessorProject.name}`);
      } else {
        console.log(`   ❌ predecessorProject: null`);
      }

      if (dep.predecessorMilestone) {
        console.log(`   ✅ predecessorMilestone: ${dep.predecessorMilestone.name} (${dep.predecessorMilestone.phase})`);
      } else {
        console.log(`   ❌ predecessorMilestone: null`);
      }

      if (dep.successorProject) {
        console.log(`   ✅ successorProject: ${dep.successorProject.projectNumber} - ${dep.successorProject.name}`);
      } else {
        console.log(`   ❌ successorProject: null`);
      }

      if (dep.successorMilestone) {
        console.log(`   ✅ successorMilestone: ${dep.successorMilestone.name} (${dep.successorMilestone.phase})`);
      } else {
        console.log(`   ❌ successorMilestone: null`);
      }

      console.log('');
    });

    // Check for any dependencies missing associations
    const missingAssociations = dependencies.filter((dep: any) => {
      const predMissing = (dep.predecessorType === 'project' && !dep.predecessorProject) ||
                          (dep.predecessorType === 'milestone' && !dep.predecessorMilestone);
      const succMissing = (dep.successorType === 'project' && !dep.successorProject) ||
                          (dep.successorType === 'milestone' && !dep.successorMilestone);
      return predMissing || succMissing;
    }).length;

    if (missingAssociations > 0) {
      console.log(`❌ ${missingAssociations} dependencies are missing associated objects!`);
      console.log('   This means "Unknown Project/Milestone" will still appear in the UI.');
    } else {
      console.log('✅ All dependencies have proper associations!');
      console.log('   The UI should now display project/milestone names correctly.');
    }

    await sequelize.close();
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
};

if (require.main === module) {
  testDependencyAPI()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default testDependencyAPI;
