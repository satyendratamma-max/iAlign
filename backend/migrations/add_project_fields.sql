-- Add comprehensive project fields to Projects table (SQLite version)

-- Add project identification and business fields
ALTER TABLE Projects ADD COLUMN projectNumber VARCHAR(50);
ALTER TABLE Projects ADD COLUMN businessDecision VARCHAR(100);
ALTER TABLE Projects ADD COLUMN businessPriority VARCHAR(50);

-- Add financial fields
ALTER TABLE Projects ADD COLUMN plannedOpex DECIMAL(15,2);
ALTER TABLE Projects ADD COLUMN plannedCapex DECIMAL(15,2);
ALTER TABLE Projects ADD COLUMN totalPlannedCost DECIMAL(15,2);
ALTER TABLE Projects ADD COLUMN financialBenefit DECIMAL(15,2);

-- Add date fields
ALTER TABLE Projects ADD COLUMN desiredStartDate DATETIME;
ALTER TABLE Projects ADD COLUMN desiredCompletionDate DATETIME;

-- Add strategic fields
ALTER TABLE Projects ADD COLUMN needleMover VARCHAR(100);
ALTER TABLE Projects ADD COLUMN dow VARCHAR(100);
ALTER TABLE Projects ADD COLUMN investmentClass VARCHAR(100);
ALTER TABLE Projects ADD COLUMN benefitArea VARCHAR(100);
ALTER TABLE Projects ADD COLUMN technologyArea VARCHAR(100);
ALTER TABLE Projects ADD COLUMN enterpriseCategory VARCHAR(100);

-- Add boolean fields
ALTER TABLE Projects ADD COLUMN projectInfrastructureNeeded TINYINT(1) DEFAULT 0;
ALTER TABLE Projects ADD COLUMN coCreation TINYINT(1) DEFAULT 0;

-- Add classification fields
ALTER TABLE Projects ADD COLUMN technologyChoice VARCHAR(200);
ALTER TABLE Projects ADD COLUMN segmentFunction VARCHAR(100);
ALTER TABLE Projects ADD COLUMN division VARCHAR(100);
ALTER TABLE Projects ADD COLUMN newOrCarryOver VARCHAR(50);

-- Add user relationship fields
ALTER TABLE Projects ADD COLUMN submittedById INTEGER;
ALTER TABLE Projects ADD COLUMN domainManagerId INTEGER;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_project_number ON Projects(projectNumber);
CREATE INDEX IF NOT EXISTS idx_projects_submitted_by ON Projects(submittedById);
CREATE INDEX IF NOT EXISTS idx_projects_domain_manager ON Projects(domainManagerId);
CREATE INDEX IF NOT EXISTS idx_projects_business_decision ON Projects(businessDecision);
CREATE INDEX IF NOT EXISTS idx_projects_investment_class ON Projects(investmentClass);
CREATE INDEX IF NOT EXISTS idx_projects_segment_function ON Projects(segmentFunction);
CREATE INDEX IF NOT EXISTS idx_projects_division ON Projects(division);
