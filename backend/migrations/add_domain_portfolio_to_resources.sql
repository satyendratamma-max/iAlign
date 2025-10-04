-- Add domainId and portfolioId columns to Resources table (SQLite version)

-- SQLite doesn't support adding multiple columns in one statement
ALTER TABLE Resources ADD COLUMN domainId INTEGER;
ALTER TABLE Resources ADD COLUMN portfolioId INTEGER;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_resources_domain_id ON Resources(domainId);
CREATE INDEX IF NOT EXISTS idx_resources_portfolio_id ON Resources(portfolioId);
