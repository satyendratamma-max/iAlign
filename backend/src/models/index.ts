import User from './User';
import SegmentFunction from './SegmentFunction';
import Project from './Project';
import Domain from './Domain';
import Resource from './Resource';
import Milestone from './Milestone';
import ResourceAllocation from './ResourceAllocation';
// import Pipeline from './Pipeline'; // Temporarily disabled
// import ProjectPipeline from './ProjectPipeline'; // Temporarily disabled
import CapacityModel from './CapacityModel';
import CapacityScenario from './CapacityScenario';
import Notification from './notification.model';
import App from './App';
import Technology from './Technology';
import Role from './Role';
import ResourceCapability from './ResourceCapability';
import ProjectRequirement from './ProjectRequirement';
import ProjectDomainImpact from './ProjectDomainImpact';
import ProjectDependency from './ProjectDependency';
import Scenario from './Scenario';
import ProjectActivity from './ProjectActivity';

// Scenario Associations
Scenario.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Scenario.belongsTo(User, { foreignKey: 'publishedBy', as: 'publisher' });
Scenario.belongsTo(Scenario, { foreignKey: 'parentScenarioId', as: 'parentScenario' });
Scenario.hasMany(Scenario, { foreignKey: 'parentScenarioId', as: 'childScenarios' });

Scenario.hasMany(Project, { foreignKey: 'scenarioId', as: 'projects' });
Project.belongsTo(Scenario, { foreignKey: 'scenarioId', as: 'scenario' });

// Note: Resources are SHARED across all scenarios (not scenario-specific)
// Resources are linked to scenarios through ResourceAllocations, which are scenario-specific
Scenario.hasMany(ResourceAllocation, { foreignKey: 'scenarioId', as: 'allocations' });
ResourceAllocation.belongsTo(Scenario, { foreignKey: 'scenarioId', as: 'scenario' });

Scenario.hasMany(Milestone, { foreignKey: 'scenarioId', as: 'milestones' });
Milestone.belongsTo(Scenario, { foreignKey: 'scenarioId', as: 'scenario' });

Scenario.hasMany(ProjectDependency, { foreignKey: 'scenarioId', as: 'dependencies' });
ProjectDependency.belongsTo(Scenario, { foreignKey: 'scenarioId', as: 'scenario' });

// SegmentFunction Associations
SegmentFunction.hasMany(Project, { foreignKey: 'segmentFunctionId', as: 'projects' });
Project.belongsTo(SegmentFunction, { foreignKey: 'segmentFunctionId', as: 'segmentFunctionData' });

SegmentFunction.belongsTo(User, { foreignKey: 'managerId', as: 'manager' });

// Domain Associations
Domain.hasMany(SegmentFunction, { foreignKey: 'domainId', as: 'segmentFunctions' });
SegmentFunction.belongsTo(Domain, { foreignKey: 'domainId', as: 'domain' });

Domain.hasMany(Project, { foreignKey: 'domainId', as: 'projects' });
Project.belongsTo(Domain, { foreignKey: 'domainId', as: 'domain' });

Domain.belongsTo(User, { foreignKey: 'managerId', as: 'manager' });

// User-Resource Associations
// A user can have one employee profile (Resource)
// A resource can be linked to one user account (for login)
User.hasOne(Resource, { foreignKey: 'userId', as: 'employeeProfile' });
Resource.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Resource Associations
Domain.hasMany(Resource, { foreignKey: 'domainId', as: 'resources' });
Resource.belongsTo(Domain, { foreignKey: 'domainId', as: 'domain' });

SegmentFunction.hasMany(Resource, { foreignKey: 'segmentFunctionId', as: 'resources' });
Resource.belongsTo(SegmentFunction, { foreignKey: 'segmentFunctionId', as: 'segmentFunction' });

// Project Associations
Project.belongsTo(User, { foreignKey: 'projectManagerId', as: 'projectManager' });
Project.belongsTo(User, { foreignKey: 'sponsorId', as: 'sponsor' });
Project.belongsTo(User, { foreignKey: 'submittedById', as: 'submittedBy' });
Project.belongsTo(User, { foreignKey: 'domainManagerId', as: 'domainManager' });

Project.hasMany(Milestone, { foreignKey: 'projectId', as: 'milestones' });
Milestone.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

Milestone.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

// Resource Allocation Associations (Many-to-Many with attributes)
Project.hasMany(ResourceAllocation, { foreignKey: 'projectId', as: 'allocations' });
ResourceAllocation.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

Resource.hasMany(ResourceAllocation, { foreignKey: 'resourceId', as: 'allocations' });
ResourceAllocation.belongsTo(Resource, { foreignKey: 'resourceId', as: 'resource' });

Milestone.hasMany(ResourceAllocation, { foreignKey: 'milestoneId', as: 'allocations' });
ResourceAllocation.belongsTo(Milestone, { foreignKey: 'milestoneId', as: 'milestone' });

ResourceCapability.hasMany(ResourceAllocation, { foreignKey: 'resourceCapabilityId', as: 'allocations' });
ResourceAllocation.belongsTo(ResourceCapability, { foreignKey: 'resourceCapabilityId', as: 'resourceCapability' });

ProjectRequirement.hasMany(ResourceAllocation, { foreignKey: 'projectRequirementId', as: 'allocations' });
ResourceAllocation.belongsTo(ProjectRequirement, { foreignKey: 'projectRequirementId', as: 'projectRequirement' });

// Pipeline Associations (Many-to-Many) - Temporarily disabled
// Project.belongsToMany(Pipeline, {
//   through: ProjectPipeline,
//   foreignKey: 'projectId',
//   otherKey: 'pipelineId',
//   as: 'pipelines',
// });

// Pipeline.belongsToMany(Project, {
//   through: ProjectPipeline,
//   foreignKey: 'pipelineId',
//   otherKey: 'projectId',
//   as: 'projects',
// });

// Direct access to junction table
// Project.hasMany(ProjectPipeline, { foreignKey: 'projectId', as: 'projectPipelines' });
// ProjectPipeline.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

// Pipeline.hasMany(ProjectPipeline, { foreignKey: 'pipelineId', as: 'projectPipelines' });
// ProjectPipeline.belongsTo(Pipeline, { foreignKey: 'pipelineId', as: 'pipeline' });

// Capacity Model Associations
CapacityModel.hasMany(CapacityScenario, { foreignKey: 'capacityModelId', as: 'scenarios' });
CapacityScenario.belongsTo(CapacityModel, { foreignKey: 'capacityModelId', as: 'capacityModel' });

CapacityModel.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

CapacityScenario.belongsTo(Domain, { foreignKey: 'domainId', as: 'domain' });
CapacityScenario.belongsTo(App, { foreignKey: 'appId', as: 'app' });
CapacityScenario.belongsTo(Technology, { foreignKey: 'technologyId', as: 'technology' });
CapacityScenario.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });

// Notification Associations
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// ⭐ App, Technology, Role - Cascaded Associations
// Technologies can be app-specific or global
App.hasMany(Technology, { foreignKey: 'appId', as: 'technologies' });
Technology.belongsTo(App, { foreignKey: 'appId', as: 'app' });

// Roles can be app-specific, tech-specific, or global
App.hasMany(Role, { foreignKey: 'appId', as: 'roles' });
Role.belongsTo(App, { foreignKey: 'appId', as: 'app' });

Technology.hasMany(Role, { foreignKey: 'technologyId', as: 'roles' });
Role.belongsTo(Technology, { foreignKey: 'technologyId', as: 'technology' });

// Role hierarchy (self-referencing)
Role.hasMany(Role, { foreignKey: 'parentRoleId', as: 'childRoles' });
Role.belongsTo(Role, { foreignKey: 'parentRoleId', as: 'parentRole' });

// ⭐ ResourceCapability Associations (Junction Table)
Resource.hasMany(ResourceCapability, { foreignKey: 'resourceId', as: 'capabilities' });
ResourceCapability.belongsTo(Resource, { foreignKey: 'resourceId', as: 'resource' });

App.hasMany(ResourceCapability, { foreignKey: 'appId', as: 'resourceCapabilities' });
ResourceCapability.belongsTo(App, { foreignKey: 'appId', as: 'app' });

Technology.hasMany(ResourceCapability, { foreignKey: 'technologyId', as: 'resourceCapabilities' });
ResourceCapability.belongsTo(Technology, { foreignKey: 'technologyId', as: 'technology' });

Role.hasMany(ResourceCapability, { foreignKey: 'roleId', as: 'resourceCapabilities' });
ResourceCapability.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });

// ⭐ ProjectRequirement Associations
Project.hasMany(ProjectRequirement, { foreignKey: 'projectId', as: 'requirements' });
ProjectRequirement.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

App.hasMany(ProjectRequirement, { foreignKey: 'appId', as: 'projectRequirements' });
ProjectRequirement.belongsTo(App, { foreignKey: 'appId', as: 'app' });

Technology.hasMany(ProjectRequirement, { foreignKey: 'technologyId', as: 'projectRequirements' });
ProjectRequirement.belongsTo(Technology, { foreignKey: 'technologyId', as: 'technology' });

Role.hasMany(ProjectRequirement, { foreignKey: 'roleId', as: 'projectRequirements' });
ProjectRequirement.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });

// ⭐ ProjectDomainImpact Associations (Cross-Domain Impact Tracking)
Project.hasMany(ProjectDomainImpact, { foreignKey: 'projectId', as: 'domainImpacts' });
ProjectDomainImpact.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

Domain.hasMany(ProjectDomainImpact, { foreignKey: 'domainId', as: 'impactedProjects' });
ProjectDomainImpact.belongsTo(Domain, { foreignKey: 'domainId', as: 'domain' });

// ⭐ ProjectDependency Associations
// Predecessor Project associations
Project.hasMany(ProjectDependency, {
  foreignKey: 'predecessorId',
  constraints: false,
  scope: { predecessorType: 'project' },
  as: 'successorDependencies'
});

ProjectDependency.belongsTo(Project, {
  foreignKey: 'predecessorId',
  constraints: false,
  as: 'predecessorProject'
});

// Successor Project associations
Project.hasMany(ProjectDependency, {
  foreignKey: 'successorId',
  constraints: false,
  scope: { successorType: 'project' },
  as: 'predecessorDependencies'
});

ProjectDependency.belongsTo(Project, {
  foreignKey: 'successorId',
  constraints: false,
  as: 'successorProject'
});

// Predecessor Milestone associations
Milestone.hasMany(ProjectDependency, {
  foreignKey: 'predecessorId',
  constraints: false,
  scope: { predecessorType: 'milestone' },
  as: 'successorDependencies'
});

ProjectDependency.belongsTo(Milestone, {
  foreignKey: 'predecessorId',
  constraints: false,
  as: 'predecessorMilestone'
});

// Successor Milestone associations
Milestone.hasMany(ProjectDependency, {
  foreignKey: 'successorId',
  constraints: false,
  scope: { successorType: 'milestone' },
  as: 'predecessorDependencies'
});

ProjectDependency.belongsTo(Milestone, {
  foreignKey: 'successorId',
  constraints: false,
  as: 'successorMilestone'
});

// ⭐ ProjectActivity Associations (Activity Feed / Notes / Discussion)
Project.hasMany(ProjectActivity, { foreignKey: 'projectId', as: 'activities' });
ProjectActivity.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

User.hasMany(ProjectActivity, { foreignKey: 'userId', as: 'activities' });
ProjectActivity.belongsTo(User, { foreignKey: 'userId', as: 'author' });

// Task assignee association
User.hasMany(ProjectActivity, { foreignKey: 'assigneeId', as: 'assignedTasks' });
ProjectActivity.belongsTo(User, { foreignKey: 'assigneeId', as: 'assignee' });

// Self-referential for threading (replies)
ProjectActivity.hasMany(ProjectActivity, { foreignKey: 'parentActivityId', as: 'replies' });
ProjectActivity.belongsTo(ProjectActivity, { foreignKey: 'parentActivityId', as: 'parentActivity' });

export {
  User,
  SegmentFunction,
  Project,
  Domain,
  Resource,
  Milestone,
  ResourceAllocation,
  // Pipeline, // Temporarily disabled
  // ProjectPipeline, // Temporarily disabled
  CapacityModel,
  CapacityScenario,
  Notification,
  App,
  Technology,
  Role,
  ResourceCapability,
  ProjectRequirement,
  ProjectDomainImpact,
  ProjectDependency,
  Scenario,
  ProjectActivity,
};

export default {
  User,
  SegmentFunction,
  Project,
  Domain,
  Resource,
  Milestone,
  ResourceAllocation,
  // Pipeline, // Temporarily disabled
  // ProjectPipeline, // Temporarily disabled
  CapacityModel,
  CapacityScenario,
  Notification,
  App,
  Technology,
  Role,
  ResourceCapability,
  ProjectRequirement,
  ProjectDomainImpact,
  ProjectDependency,
  Scenario,
  ProjectActivity,
};
