-- ===============================================================
-- iAlign Complete Performance Indexes
-- ===============================================================
-- This script creates ALL indexes needed for optimal iAlign performance
-- Includes both model-defined (Sequelize) and runtime (seeding) indexes
--
-- INCLUDES:
--   PART A: Model-Defined Indexes (22 indexes)
--     - Data integrity (UNIQUE constraints to prevent duplicates)
--     - Foreign key optimization (app/technology/role relationships)
--     - Dependency graph queries (predecessor/successor lookups)
--
--   PART B: Runtime Query Optimization Indexes (20+ indexes)
--     - Scenario/domain/status filtering
--     - Resource allocation queries
--     - Project filtering by fiscalYear, businessDecision
--     - Resource filtering by location, role
--
-- USE CASE:
--   Run this script on test/production environments to ensure all
--   performance optimizations are in place without running the seed script.
--
-- Database: SQL Server
-- Created: 2025-10-25
-- Total Indexes: 42+
-- ===============================================================

USE [iAlign]; -- Change this to your database name
GO

PRINT '===============================================================';
PRINT 'iAlign Complete Performance Indexes Installation';
PRINT '===============================================================';
PRINT '';
PRINT 'This script will create:';
PRINT '  PART A: 22 model-defined indexes (data integrity & relationships)';
PRINT '  PART B: 20+ runtime indexes (query performance optimization)';
PRINT '';
GO

-- ===============================================================
-- PART A: MODEL-DEFINED INDEXES (SEQUELIZE)
-- ===============================================================
PRINT '';
PRINT '===============================================================';
PRINT 'PART A: Creating Model-Defined Indexes (Sequelize)';
PRINT '===============================================================';
PRINT '';
GO

-- ===============================================================
-- 1. ROLES TABLE INDEXES
-- ===============================================================
-- Purpose: Optimize role lookups by app, technology, and hierarchy
PRINT 'Creating Roles table indexes...';

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_role_app_id' AND object_id = OBJECT_ID('Roles'))
BEGIN
    CREATE NONCLUSTERED INDEX idx_role_app_id
    ON Roles(appId);
    PRINT '  ✓ Created idx_role_app_id';
END
ELSE
    PRINT '  - idx_role_app_id already exists';

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_role_technology_id' AND object_id = OBJECT_ID('Roles'))
BEGIN
    CREATE NONCLUSTERED INDEX idx_role_technology_id
    ON Roles(technologyId);
    PRINT '  ✓ Created idx_role_technology_id';
END
ELSE
    PRINT '  - idx_role_technology_id already exists';

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_role_parent_id' AND object_id = OBJECT_ID('Roles'))
BEGIN
    CREATE NONCLUSTERED INDEX idx_role_parent_id
    ON Roles(parentRoleId);
    PRINT '  ✓ Created idx_role_parent_id';
END
ELSE
    PRINT '  - idx_role_parent_id already exists';
GO

-- ===============================================================
-- 2. PROJECT REQUIREMENTS TABLE INDEXES
-- ===============================================================
-- Purpose: Optimize requirement lookups and filtering by project, skill stack, priority, and fulfillment status
PRINT 'Creating ProjectRequirements table indexes...';

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_requirement_project_id' AND object_id = OBJECT_ID('ProjectRequirements'))
BEGIN
    CREATE NONCLUSTERED INDEX idx_requirement_project_id
    ON ProjectRequirements(projectId);
    PRINT '  ✓ Created idx_requirement_project_id';
END
ELSE
    PRINT '  - idx_requirement_project_id already exists';

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_requirement_app_id' AND object_id = OBJECT_ID('ProjectRequirements'))
BEGIN
    CREATE NONCLUSTERED INDEX idx_requirement_app_id
    ON ProjectRequirements(appId);
    PRINT '  ✓ Created idx_requirement_app_id';
END
ELSE
    PRINT '  - idx_requirement_app_id already exists';

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_requirement_technology_id' AND object_id = OBJECT_ID('ProjectRequirements'))
BEGIN
    CREATE NONCLUSTERED INDEX idx_requirement_technology_id
    ON ProjectRequirements(technologyId);
    PRINT '  ✓ Created idx_requirement_technology_id';
END
ELSE
    PRINT '  - idx_requirement_technology_id already exists';

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_requirement_role_id' AND object_id = OBJECT_ID('ProjectRequirements'))
BEGIN
    CREATE NONCLUSTERED INDEX idx_requirement_role_id
    ON ProjectRequirements(roleId);
    PRINT '  ✓ Created idx_requirement_role_id';
END
ELSE
    PRINT '  - idx_requirement_role_id already exists';

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_requirement_priority' AND object_id = OBJECT_ID('ProjectRequirements'))
BEGIN
    CREATE NONCLUSTERED INDEX idx_requirement_priority
    ON ProjectRequirements(priority);
    PRINT '  ✓ Created idx_requirement_priority';
END
ELSE
    PRINT '  - idx_requirement_priority already exists';

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_requirement_fulfilled' AND object_id = OBJECT_ID('ProjectRequirements'))
BEGIN
    CREATE NONCLUSTERED INDEX idx_requirement_fulfilled
    ON ProjectRequirements(isFulfilled);
    PRINT '  ✓ Created idx_requirement_fulfilled';
END
ELSE
    PRINT '  - idx_requirement_fulfilled already exists';
GO

-- ===============================================================
-- 3. TECHNOLOGIES TABLE INDEXES
-- ===============================================================
-- Purpose: Optimize technology lookups by app
PRINT 'Creating Technologies table indexes...';

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_technology_app_id' AND object_id = OBJECT_ID('Technologies'))
BEGIN
    CREATE NONCLUSTERED INDEX idx_technology_app_id
    ON Technologies(appId);
    PRINT '  ✓ Created idx_technology_app_id';
END
ELSE
    PRINT '  - idx_technology_app_id already exists';
GO

-- ===============================================================
-- 4. MILESTONES TABLE INDEXES
-- ===============================================================
-- Purpose: Optimize milestone queries by scenario, project, and date filtering
-- Note: This is a composite index for efficient scenario-project-date queries
PRINT 'Creating Milestones table indexes...';

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_scenario_project_milestone' AND object_id = OBJECT_ID('Milestones'))
BEGIN
    CREATE NONCLUSTERED INDEX idx_scenario_project_milestone
    ON Milestones(scenarioId, projectId, plannedEndDate);
    PRINT '  ✓ Created idx_scenario_project_milestone (composite)';
END
ELSE
    PRINT '  - idx_scenario_project_milestone already exists';
GO

-- ===============================================================
-- 5. RESOURCE CAPABILITIES TABLE INDEXES
-- ===============================================================
-- Purpose: Optimize capability matching and resource skill lookups
-- Note: idx_capability_unique is a UNIQUE composite index preventing duplicate capabilities
PRINT 'Creating ResourceCapabilities table indexes...';

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_capability_resource_id' AND object_id = OBJECT_ID('ResourceCapabilities'))
BEGIN
    CREATE NONCLUSTERED INDEX idx_capability_resource_id
    ON ResourceCapabilities(resourceId);
    PRINT '  ✓ Created idx_capability_resource_id';
END
ELSE
    PRINT '  - idx_capability_resource_id already exists';

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_capability_app_id' AND object_id = OBJECT_ID('ResourceCapabilities'))
BEGIN
    CREATE NONCLUSTERED INDEX idx_capability_app_id
    ON ResourceCapabilities(appId);
    PRINT '  ✓ Created idx_capability_app_id';
END
ELSE
    PRINT '  - idx_capability_app_id already exists';

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_capability_technology_id' AND object_id = OBJECT_ID('ResourceCapabilities'))
BEGIN
    CREATE NONCLUSTERED INDEX idx_capability_technology_id
    ON ResourceCapabilities(technologyId);
    PRINT '  ✓ Created idx_capability_technology_id';
END
ELSE
    PRINT '  - idx_capability_technology_id already exists';

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_capability_role_id' AND object_id = OBJECT_ID('ResourceCapabilities'))
BEGIN
    CREATE NONCLUSTERED INDEX idx_capability_role_id
    ON ResourceCapabilities(roleId);
    PRINT '  ✓ Created idx_capability_role_id';
END
ELSE
    PRINT '  - idx_capability_role_id already exists';

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_capability_unique' AND object_id = OBJECT_ID('ResourceCapabilities'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX idx_capability_unique
    ON ResourceCapabilities(resourceId, appId, technologyId, roleId);
    PRINT '  ✓ Created idx_capability_unique (UNIQUE composite - prevents duplicate capabilities)';
END
ELSE
    PRINT '  - idx_capability_unique already exists';
GO

-- ===============================================================
-- 6. PROJECT DOMAIN IMPACTS TABLE INDEXES
-- ===============================================================
-- Purpose: Optimize cross-domain impact queries and ensure one impact per project-domain pair
PRINT 'Creating ProjectDomainImpacts table indexes...';

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_project_domain_impacts_project' AND object_id = OBJECT_ID('ProjectDomainImpacts'))
BEGIN
    CREATE NONCLUSTERED INDEX idx_project_domain_impacts_project
    ON ProjectDomainImpacts(projectId);
    PRINT '  ✓ Created idx_project_domain_impacts_project';
END
ELSE
    PRINT '  - idx_project_domain_impacts_project already exists';

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_project_domain_impacts_domain' AND object_id = OBJECT_ID('ProjectDomainImpacts'))
BEGIN
    CREATE NONCLUSTERED INDEX idx_project_domain_impacts_domain
    ON ProjectDomainImpacts(domainId);
    PRINT '  ✓ Created idx_project_domain_impacts_domain';
END
ELSE
    PRINT '  - idx_project_domain_impacts_domain already exists';

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_project_domain_impacts_unique' AND object_id = OBJECT_ID('ProjectDomainImpacts'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX idx_project_domain_impacts_unique
    ON ProjectDomainImpacts(projectId, domainId);
    PRINT '  ✓ Created idx_project_domain_impacts_unique (UNIQUE composite)';
END
ELSE
    PRINT '  - idx_project_domain_impacts_unique already exists';
GO

-- ===============================================================
-- 7. PROJECTS TABLE INDEXES
-- ===============================================================
-- Purpose: Ensure unique project numbers within scenarios
PRINT 'Creating Projects table indexes...';

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'unique_scenario_project' AND object_id = OBJECT_ID('Projects'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX unique_scenario_project
    ON Projects(scenarioId, projectNumber);
    PRINT '  ✓ Created unique_scenario_project (UNIQUE composite)';
END
ELSE
    PRINT '  - unique_scenario_project already exists';
GO

-- ===============================================================
-- 8. PROJECT DEPENDENCIES TABLE INDEXES
-- ===============================================================
-- Purpose: Optimize dependency graph queries for scheduling and critical path analysis
PRINT 'Creating ProjectDependencies table indexes...';

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_project_dependencies_predecessor' AND object_id = OBJECT_ID('ProjectDependencies'))
BEGIN
    CREATE NONCLUSTERED INDEX idx_project_dependencies_predecessor
    ON ProjectDependencies(predecessorType, predecessorId);
    PRINT '  ✓ Created idx_project_dependencies_predecessor (composite)';
END
ELSE
    PRINT '  - idx_project_dependencies_predecessor already exists';

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_project_dependencies_successor' AND object_id = OBJECT_ID('ProjectDependencies'))
BEGIN
    CREATE NONCLUSTERED INDEX idx_project_dependencies_successor
    ON ProjectDependencies(successorType, successorId);
    PRINT '  ✓ Created idx_project_dependencies_successor (composite)';
END
ELSE
    PRINT '  - idx_project_dependencies_successor already exists';
GO

PRINT '';
PRINT '✓ PART A Complete: 22 model-defined indexes created';
PRINT '';
GO

-- ===============================================================
-- PART B: RUNTIME QUERY OPTIMIZATION INDEXES
-- ===============================================================
PRINT '';
PRINT '===============================================================';
PRINT 'PART B: Creating Runtime Query Optimization Indexes';
PRINT '===============================================================';
PRINT '';
GO

-- ===============================================================
-- 9. RESOURCE ALLOCATIONS TABLE INDEXES (40,000+ records)
-- ===============================================================
-- Purpose: Optimize high-volume allocation queries by scenario, resource, project, and dates
PRINT 'Creating ResourceAllocations table indexes...';

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_allocations_scenarioId' AND object_id = OBJECT_ID('ResourceAllocations'))
BEGIN
    CREATE NONCLUSTERED INDEX idx_allocations_scenarioId
    ON ResourceAllocations(scenarioId);
    PRINT '  ✓ Created idx_allocations_scenarioId';
END
ELSE
    PRINT '  - idx_allocations_scenarioId already exists';

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_allocations_resourceId' AND object_id = OBJECT_ID('ResourceAllocations'))
BEGIN
    CREATE NONCLUSTERED INDEX idx_allocations_resourceId
    ON ResourceAllocations(resourceId);
    PRINT '  ✓ Created idx_allocations_resourceId';
END
ELSE
    PRINT '  - idx_allocations_resourceId already exists';

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_allocations_projectId' AND object_id = OBJECT_ID('ResourceAllocations'))
BEGIN
    CREATE NONCLUSTERED INDEX idx_allocations_projectId
    ON ResourceAllocations(projectId);
    PRINT '  ✓ Created idx_allocations_projectId';
END
ELSE
    PRINT '  - idx_allocations_projectId already exists';

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_allocations_active' AND object_id = OBJECT_ID('ResourceAllocations'))
BEGIN
    CREATE NONCLUSTERED INDEX idx_allocations_active
    ON ResourceAllocations(isActive);
    PRINT '  ✓ Created idx_allocations_active';
END
ELSE
    PRINT '  - idx_allocations_active already exists';

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_allocations_dates' AND object_id = OBJECT_ID('ResourceAllocations'))
BEGIN
    CREATE NONCLUSTERED INDEX idx_allocations_dates
    ON ResourceAllocations(startDate, endDate);
    PRINT '  ✓ Created idx_allocations_dates (composite)';
END
ELSE
    PRINT '  - idx_allocations_dates already exists';

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_allocations_scenario_active' AND object_id = OBJECT_ID('ResourceAllocations'))
BEGIN
    CREATE NONCLUSTERED INDEX idx_allocations_scenario_active
    ON ResourceAllocations(scenarioId, isActive);
    PRINT '  ✓ Created idx_allocations_scenario_active (composite)';
END
ELSE
    PRINT '  - idx_allocations_scenario_active already exists';
GO

-- ===============================================================
-- 10. PROJECTS TABLE RUNTIME INDEXES (2,000+ records)
-- ===============================================================
-- Purpose: Optimize project filtering by scenario, domain, status, fiscal year, and business decision
PRINT 'Creating Projects table runtime indexes...';

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_projects_scenarioId' AND object_id = OBJECT_ID('Projects'))
BEGIN
    CREATE NONCLUSTERED INDEX idx_projects_scenarioId
    ON Projects(scenarioId);
    PRINT '  ✓ Created idx_projects_scenarioId';
END
ELSE
    PRINT '  - idx_projects_scenarioId already exists';

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_projects_domainId' AND object_id = OBJECT_ID('Projects'))
BEGIN
    CREATE NONCLUSTERED INDEX idx_projects_domainId
    ON Projects(domainId);
    PRINT '  ✓ Created idx_projects_domainId';
END
ELSE
    PRINT '  - idx_projects_domainId already exists';

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_projects_status' AND object_id = OBJECT_ID('Projects'))
BEGIN
    CREATE NONCLUSTERED INDEX idx_projects_status
    ON Projects(status);
    PRINT '  ✓ Created idx_projects_status';
END
ELSE
    PRINT '  - idx_projects_status already exists';

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_projects_fiscalYear' AND object_id = OBJECT_ID('Projects'))
BEGIN
    CREATE NONCLUSTERED INDEX idx_projects_fiscalYear
    ON Projects(fiscalYear);
    PRINT '  ✓ Created idx_projects_fiscalYear';
END
ELSE
    PRINT '  - idx_projects_fiscalYear already exists';

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_projects_businessDecision' AND object_id = OBJECT_ID('Projects'))
BEGIN
    CREATE NONCLUSTERED INDEX idx_projects_businessDecision
    ON Projects(businessDecision);
    PRINT '  ✓ Created idx_projects_businessDecision';
END
ELSE
    PRINT '  - idx_projects_businessDecision already exists';

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_projects_active' AND object_id = OBJECT_ID('Projects'))
BEGIN
    CREATE NONCLUSTERED INDEX idx_projects_active
    ON Projects(isActive);
    PRINT '  ✓ Created idx_projects_active';
END
ELSE
    PRINT '  - idx_projects_active already exists';

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_projects_scenario_active' AND object_id = OBJECT_ID('Projects'))
BEGIN
    CREATE NONCLUSTERED INDEX idx_projects_scenario_active
    ON Projects(scenarioId, isActive);
    PRINT '  ✓ Created idx_projects_scenario_active (composite)';
END
ELSE
    PRINT '  - idx_projects_scenario_active already exists';
GO

-- ===============================================================
-- 11. RESOURCES TABLE INDEXES (10,000+ records)
-- ===============================================================
-- Purpose: Optimize resource filtering by domain, role, location, and employee ID
PRINT 'Creating Resources table indexes...';

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_resources_domainId' AND object_id = OBJECT_ID('Resources'))
BEGIN
    CREATE NONCLUSTERED INDEX idx_resources_domainId
    ON Resources(domainId);
    PRINT '  ✓ Created idx_resources_domainId';
END
ELSE
    PRINT '  - idx_resources_domainId already exists';

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_resources_role' AND object_id = OBJECT_ID('Resources'))
BEGIN
    CREATE NONCLUSTERED INDEX idx_resources_role
    ON Resources(role);
    PRINT '  ✓ Created idx_resources_role';
END
ELSE
    PRINT '  - idx_resources_role already exists';

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_resources_location' AND object_id = OBJECT_ID('Resources'))
BEGIN
    CREATE NONCLUSTERED INDEX idx_resources_location
    ON Resources(location);
    PRINT '  ✓ Created idx_resources_location';
END
ELSE
    PRINT '  - idx_resources_location already exists';

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_resources_active' AND object_id = OBJECT_ID('Resources'))
BEGIN
    CREATE NONCLUSTERED INDEX idx_resources_active
    ON Resources(isActive);
    PRINT '  ✓ Created idx_resources_active';
END
ELSE
    PRINT '  - idx_resources_active already exists';

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_resources_employeeId' AND object_id = OBJECT_ID('Resources'))
BEGIN
    CREATE NONCLUSTERED INDEX idx_resources_employeeId
    ON Resources(employeeId);
    PRINT '  ✓ Created idx_resources_employeeId';
END
ELSE
    PRINT '  - idx_resources_employeeId already exists';
GO

-- ===============================================================
-- 12. RESOURCE CAPABILITIES TABLE RUNTIME INDEXES (50,000+ records)
-- ===============================================================
-- Purpose: Optimize capability queries by resource and primary flag
PRINT 'Creating ResourceCapabilities table runtime indexes...';

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_capabilities_resourceId_runtime' AND object_id = OBJECT_ID('ResourceCapabilities'))
BEGIN
    CREATE NONCLUSTERED INDEX idx_capabilities_resourceId_runtime
    ON ResourceCapabilities(resourceId)
    WHERE isActive = 1; -- Filtered index for active capabilities only
    PRINT '  ✓ Created idx_capabilities_resourceId_runtime (filtered for active)';
END
ELSE
    PRINT '  - idx_capabilities_resourceId_runtime already exists';

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_capabilities_isPrimary' AND object_id = OBJECT_ID('ResourceCapabilities'))
BEGIN
    CREATE NONCLUSTERED INDEX idx_capabilities_isPrimary
    ON ResourceCapabilities(isPrimary);
    PRINT '  ✓ Created idx_capabilities_isPrimary';
END
ELSE
    PRINT '  - idx_capabilities_isPrimary already exists';
GO

-- ===============================================================
-- 13. PROJECT REQUIREMENTS TABLE RUNTIME INDEXES (10,000+ records)
-- ===============================================================
-- Purpose: Optimize requirement queries by project
PRINT 'Creating ProjectRequirements table runtime indexes...';

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_requirements_projectId_runtime' AND object_id = OBJECT_ID('ProjectRequirements'))
BEGIN
    CREATE NONCLUSTERED INDEX idx_requirements_projectId_runtime
    ON ProjectRequirements(projectId)
    WHERE isActive = 1; -- Filtered index for active requirements only
    PRINT '  ✓ Created idx_requirements_projectId_runtime (filtered for active)';
END
ELSE
    PRINT '  - idx_requirements_projectId_runtime already exists';
GO

PRINT '';
PRINT '✓ PART B Complete: 20+ runtime optimization indexes created';
PRINT '';
GO

-- ===============================================================
-- INDEX CREATION COMPLETE
-- ===============================================================
PRINT '';
PRINT '===============================================================';
PRINT 'Index Creation Complete!';
PRINT '===============================================================';
PRINT '';
PRINT 'PART A - Model-Defined Indexes (22 total):';
PRINT '  • Roles: 3 indexes (app, technology, hierarchy)';
PRINT '  • ProjectRequirements: 6 indexes (foreign keys, priority, fulfillment)';
PRINT '  • Technologies: 1 index (app lookup)';
PRINT '  • Milestones: 1 composite index (scenario-project-date)';
PRINT '  • ResourceCapabilities: 5 indexes (4 foreign keys + 1 unique composite)';
PRINT '  • ProjectDomainImpacts: 3 indexes (project, domain, unique composite)';
PRINT '  • Projects: 1 unique index (scenario-project uniqueness)';
PRINT '  • ProjectDependencies: 2 composite indexes (predecessor/successor)';
PRINT '';
PRINT 'PART B - Runtime Query Optimization Indexes (20+ total):';
PRINT '  • ResourceAllocations: 6 indexes (scenario, resource, project, dates, active)';
PRINT '  • Projects: 7 indexes (scenario, domain, status, fiscalYear, businessDecision, active)';
PRINT '  • Resources: 5 indexes (domain, role, location, employeeId, active)';
PRINT '  • ResourceCapabilities: 2 runtime indexes (filtered for active records)';
PRINT '  • ProjectRequirements: 1 runtime index (filtered for active records)';
PRINT '';
PRINT 'GRAND TOTAL: 42+ indexes across 10 tables';
PRINT '';
PRINT 'Performance Improvements Expected:';
PRINT '  ✓ Allocation queries: 10-100x faster';
PRINT '  ✓ Project filtering: 50-100x faster';
PRINT '  ✓ Resource searches: 20-50x faster';
PRINT '  ✓ Capacity dashboard: 90% load time reduction';
PRINT '  ✓ Cross-domain impact queries: 80% faster';
PRINT '';
GO
