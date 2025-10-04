import User from './User';
import Portfolio from './Portfolio';
import Project from './Project';
import Domain from './Domain';
import Team from './Team';
import Resource from './Resource';
import Milestone from './Milestone';
import ResourceAllocation from './ResourceAllocation';
import Pipeline from './Pipeline';
import ProjectPipeline from './ProjectPipeline';
import CapacityModel from './CapacityModel';
import CapacityScenario from './CapacityScenario';

// Portfolio Associations
Portfolio.hasMany(Project, { foreignKey: 'portfolioId', as: 'projects' });
Project.belongsTo(Portfolio, { foreignKey: 'portfolioId', as: 'portfolio' });

Portfolio.belongsTo(User, { foreignKey: 'managerId', as: 'manager' });

// Domain Associations
Domain.hasMany(Portfolio, { foreignKey: 'domainId', as: 'portfolios' });
Portfolio.belongsTo(Domain, { foreignKey: 'domainId', as: 'domain' });

Domain.hasMany(Project, { foreignKey: 'domainId', as: 'projects' });
Project.belongsTo(Domain, { foreignKey: 'domainId', as: 'domain' });

Domain.hasMany(Team, { foreignKey: 'domainId', as: 'teams' });
Team.belongsTo(Domain, { foreignKey: 'domainId', as: 'domain' });

Domain.belongsTo(User, { foreignKey: 'managerId', as: 'manager' });

// Team Associations
Team.hasMany(Resource, { foreignKey: 'domainTeamId', as: 'resources' });
Resource.belongsTo(Team, { foreignKey: 'domainTeamId', as: 'domainTeam' });

Team.belongsTo(User, { foreignKey: 'leadId', as: 'lead' });

// Resource Associations
Domain.hasMany(Resource, { foreignKey: 'domainId', as: 'resources' });
Resource.belongsTo(Domain, { foreignKey: 'domainId', as: 'domain' });

Portfolio.hasMany(Resource, { foreignKey: 'portfolioId', as: 'resources' });
Resource.belongsTo(Portfolio, { foreignKey: 'portfolioId', as: 'portfolio' });

// Project Associations
Project.belongsTo(User, { foreignKey: 'projectManagerId', as: 'projectManager' });
Project.belongsTo(User, { foreignKey: 'sponsorId', as: 'sponsor' });
Project.belongsTo(User, { foreignKey: 'submittedById', as: 'submittedBy' });
Project.belongsTo(User, { foreignKey: 'domainManagerId', as: 'domainManager' });

Project.hasMany(Milestone, { foreignKey: 'projectId', as: 'milestones' });
Milestone.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

// Resource Allocation Associations (Many-to-Many with attributes)
Project.hasMany(ResourceAllocation, { foreignKey: 'projectId', as: 'allocations' });
ResourceAllocation.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

Resource.hasMany(ResourceAllocation, { foreignKey: 'resourceId', as: 'allocations' });
ResourceAllocation.belongsTo(Resource, { foreignKey: 'resourceId', as: 'resource' });

Milestone.hasMany(ResourceAllocation, { foreignKey: 'milestoneId', as: 'allocations' });
ResourceAllocation.belongsTo(Milestone, { foreignKey: 'milestoneId', as: 'milestone' });

Team.hasMany(ResourceAllocation, { foreignKey: 'domainTeamId', as: 'allocations' });
ResourceAllocation.belongsTo(Team, { foreignKey: 'domainTeamId', as: 'domainTeam' });

// Pipeline Associations (Many-to-Many)
Project.belongsToMany(Pipeline, {
  through: ProjectPipeline,
  foreignKey: 'projectId',
  otherKey: 'pipelineId',
  as: 'pipelines',
});

Pipeline.belongsToMany(Project, {
  through: ProjectPipeline,
  foreignKey: 'pipelineId',
  otherKey: 'projectId',
  as: 'projects',
});

// Direct access to junction table
Project.hasMany(ProjectPipeline, { foreignKey: 'projectId', as: 'projectPipelines' });
ProjectPipeline.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

Pipeline.hasMany(ProjectPipeline, { foreignKey: 'pipelineId', as: 'projectPipelines' });
ProjectPipeline.belongsTo(Pipeline, { foreignKey: 'pipelineId', as: 'pipeline' });

// Capacity Model Associations
CapacityModel.hasMany(CapacityScenario, { foreignKey: 'capacityModelId', as: 'scenarios' });
CapacityScenario.belongsTo(CapacityModel, { foreignKey: 'capacityModelId', as: 'capacityModel' });

CapacityModel.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

CapacityScenario.belongsTo(Domain, { foreignKey: 'domainId', as: 'domain' });
CapacityScenario.belongsTo(Team, { foreignKey: 'domainTeamId', as: 'domainTeam' });

export {
  User,
  Portfolio,
  Project,
  Domain,
  Team,
  Resource,
  Milestone,
  ResourceAllocation,
  Pipeline,
  ProjectPipeline,
  CapacityModel,
  CapacityScenario,
};

export default {
  User,
  Portfolio,
  Project,
  Domain,
  Team,
  Resource,
  Milestone,
  ResourceAllocation,
  Pipeline,
  ProjectPipeline,
  CapacityModel,
  CapacityScenario,
};
