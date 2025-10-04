# Database Setup Guide

## Quick Setup with Docker

The easiest way to get started:

```bash
docker-compose up -d sqlserver
```

This will:
- Start MS SQL Server 2022 on port 1433
- Create database automatically
- Use credentials from docker-compose.yml

**Default credentials:**
- Server: localhost:1433
- User: sa
- Password: iAlign@2024!
- Database: iAlign

## Manual SQL Server Setup

### Step 1: Install SQL Server

Download and install SQL Server 2019 or 2022:
- Windows: https://www.microsoft.com/en-us/sql-server/sql-server-downloads
- Linux/Mac: Use Docker (recommended)

### Step 2: Create Database

```sql
-- Connect to master database
USE master;
GO

-- Create database
CREATE DATABASE iAlign
COLLATE SQL_Latin1_General_CP1_CI_AS;
GO

-- Verify database
SELECT name, database_id, create_date
FROM sys.databases
WHERE name = 'iAlign';
GO
```

### Step 3: Create Login and User

```sql
-- Create login
CREATE LOGIN ialignuser
WITH PASSWORD = 'iAlign@2024!',
CHECK_POLICY = OFF;
GO

-- Use iAlign database
USE iAlign;
GO

-- Create user from login
CREATE USER ialignuser FOR LOGIN ialignuser;
GO

-- Grant permissions
ALTER ROLE db_owner ADD MEMBER ialignuser;
GO
```

### Step 4: Run Migrations

The application will automatically create tables on first run if using Sequelize sync.

For manual table creation, use the SQL scripts below.

## Database Schema

### Core Tables

```sql
-- Users Table
CREATE TABLE Users (
    id INT PRIMARY KEY IDENTITY(1,1),
    username NVARCHAR(100) UNIQUE NOT NULL,
    email NVARCHAR(200) UNIQUE NOT NULL,
    passwordHash NVARCHAR(500) NOT NULL,
    firstName NVARCHAR(100),
    lastName NVARCHAR(100),
    role NVARCHAR(50) NOT NULL DEFAULT 'User',
    isActive BIT NOT NULL DEFAULT 1,
    lastLoginDate DATETIME,
    createdDate DATETIME NOT NULL DEFAULT GETDATE(),
    modifiedDate DATETIME NOT NULL DEFAULT GETDATE()
);

-- Portfolios Table
CREATE TABLE Portfolios (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(200) NOT NULL,
    description NVARCHAR(MAX),
    type NVARCHAR(50),
    totalValue DECIMAL(15,2),
    roiIndex DECIMAL(5,2),
    riskScore INT,
    managerId INT FOREIGN KEY REFERENCES Users(id),
    createdDate DATETIME NOT NULL DEFAULT GETDATE(),
    modifiedDate DATETIME NOT NULL DEFAULT GETDATE(),
    isActive BIT NOT NULL DEFAULT 1
);

-- Domains Table
CREATE TABLE Domains (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(200) NOT NULL,
    type NVARCHAR(50),
    managerId INT FOREIGN KEY REFERENCES Users(id),
    location NVARCHAR(100),
    createdDate DATETIME NOT NULL DEFAULT GETDATE(),
    isActive BIT NOT NULL DEFAULT 1
);

-- Projects Table
CREATE TABLE Projects (
    id INT PRIMARY KEY IDENTITY(1,1),
    portfolioId INT FOREIGN KEY REFERENCES Portfolios(id),
    name NVARCHAR(200) NOT NULL,
    description NVARCHAR(MAX),
    status NVARCHAR(50) NOT NULL DEFAULT 'Planning',
    priority NVARCHAR(20) NOT NULL DEFAULT 'Medium',
    type NVARCHAR(100),
    progress INT NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    budget DECIMAL(15,2),
    actualCost DECIMAL(15,2),
    startDate DATE,
    endDate DATE,
    deadline DATE,
    healthStatus NVARCHAR(20) DEFAULT 'Green',
    projectManagerId INT FOREIGN KEY REFERENCES Users(id),
    domainId INT FOREIGN KEY REFERENCES Domains(id),
    createdDate DATETIME NOT NULL DEFAULT GETDATE(),
    modifiedDate DATETIME NOT NULL DEFAULT GETDATE(),
    isActive BIT NOT NULL DEFAULT 1
);

-- Teams Table
CREATE TABLE Teams (
    id INT PRIMARY KEY IDENTITY(1,1),
    domainId INT NOT NULL FOREIGN KEY REFERENCES Domains(id),
    name NVARCHAR(200) NOT NULL,
    type NVARCHAR(50),
    leadId INT FOREIGN KEY REFERENCES Users(id),
    location NVARCHAR(100),
    totalMembers INT DEFAULT 0,
    utilizationRate DECIMAL(5,2),
    monthlyCost DECIMAL(15,2),
    createdDate DATETIME NOT NULL DEFAULT GETDATE(),
    isActive BIT NOT NULL DEFAULT 1
);

-- Resources Table
CREATE TABLE Resources (
    id INT PRIMARY KEY IDENTITY(1,1),
    employeeId NVARCHAR(50) UNIQUE NOT NULL,
    firstName NVARCHAR(100),
    lastName NVARCHAR(100),
    email NVARCHAR(200),
    role NVARCHAR(100),
    location NVARCHAR(100),
    hourlyRate DECIMAL(10,2),
    utilizationRate DECIMAL(5,2),
    isActive BIT NOT NULL DEFAULT 1,
    createdDate DATETIME NOT NULL DEFAULT GETDATE()
);
```

### Indexes for Performance

```sql
-- Users
CREATE NONCLUSTERED INDEX IX_Users_Email ON Users(email);
CREATE NONCLUSTERED INDEX IX_Users_Role ON Users(role);

-- Projects
CREATE NONCLUSTERED INDEX IX_Projects_Status ON Projects(status);
CREATE NONCLUSTERED INDEX IX_Projects_Priority ON Projects(priority);
CREATE NONCLUSTERED INDEX IX_Projects_PortfolioId ON Projects(portfolioId);
CREATE NONCLUSTERED INDEX IX_Projects_DomainId ON Projects(domainId);

-- Teams
CREATE NONCLUSTERED INDEX IX_Teams_DomainId ON Teams(domainId);

-- Resources
CREATE NONCLUSTERED INDEX IX_Resources_EmployeeId ON Resources(employeeId);
CREATE NONCLUSTERED INDEX IX_Resources_Location ON Resources(location);
```

## Sample Data

```sql
-- Insert sample user
INSERT INTO Users (username, email, passwordHash, firstName, lastName, role, isActive)
VALUES (
    'admin',
    'admin@ialign.com',
    '$2b$10$YourHashedPasswordHere', -- Use bcrypt to hash
    'Admin',
    'User',
    'Administrator',
    1
);

-- Insert sample domain
INSERT INTO Domains (name, type, location, isActive)
VALUES ('Engineering & Technology', 'Engineering', 'San Francisco', 1);

-- Insert sample portfolio
INSERT INTO Portfolios (name, description, type, totalValue, roiIndex, riskScore, isActive)
VALUES (
    'Digital Transformation',
    'Enterprise-wide digital transformation initiatives',
    'Strategic',
    124800000.00,
    127.00,
    23,
    1
);

-- Insert sample project
INSERT INTO Projects (
    portfolioId,
    name,
    description,
    status,
    priority,
    progress,
    budget,
    isActive
)
VALUES (
    1,
    'CRM Modernization',
    'Upgrade legacy CRM system to modern cloud platform',
    'Active',
    'Critical',
    65,
    2500000.00,
    1
);
```

## Connection String Examples

### Node.js (Sequelize)
```javascript
{
  database: 'iAlign',
  username: 'ialignuser',
  password: 'iAlign@2024!',
  host: 'localhost',
  port: 1433,
  dialect: 'mssql',
  dialectOptions: {
    options: {
      encrypt: false,
      trustServerCertificate: true
    }
  }
}
```

### .NET (Connection String)
```
Server=localhost,1433;Database=iAlign;User Id=ialignuser;Password=iAlign@2024!;TrustServerCertificate=true;
```

### JDBC
```
jdbc:sqlserver://localhost:1433;databaseName=iAlign;user=ialignuser;password=iAlign@2024!;encrypt=false;
```

## Backup and Restore

### Backup Database
```sql
BACKUP DATABASE iAlign
TO DISK = 'C:\Backups\iAlign_backup.bak'
WITH FORMAT,
    MEDIANAME = 'iAlign_Backup',
    NAME = 'Full Backup of iAlign';
GO
```

### Restore Database
```sql
USE master;
GO

RESTORE DATABASE iAlign
FROM DISK = 'C:\Backups\iAlign_backup.bak'
WITH REPLACE,
    RECOVERY;
GO
```

### Automated Backups (Recommended)
Set up SQL Server Agent jobs for:
- Daily full backups
- Hourly differential backups
- Transaction log backups every 15 minutes

## Monitoring Queries

### Check Database Size
```sql
SELECT
    DB_NAME() AS DatabaseName,
    SUM(size * 8 / 1024) AS SizeMB
FROM sys.master_files
WHERE database_id = DB_ID()
GROUP BY database_id;
```

### Check Table Sizes
```sql
SELECT
    t.NAME AS TableName,
    p.rows AS RowCounts,
    SUM(a.total_pages) * 8 / 1024 AS TotalSpaceMB,
    SUM(a.used_pages) * 8 / 1024 AS UsedSpaceMB
FROM sys.tables t
INNER JOIN sys.indexes i ON t.OBJECT_ID = i.object_id
INNER JOIN sys.partitions p ON i.object_id = p.OBJECT_ID AND i.index_id = p.index_id
INNER JOIN sys.allocation_units a ON p.partition_id = a.container_id
WHERE t.is_ms_shipped = 0
GROUP BY t.Name, p.Rows
ORDER BY TotalSpaceMB DESC;
```

### Active Connections
```sql
SELECT
    DB_NAME(dbid) as DatabaseName,
    COUNT(dbid) as NumberOfConnections,
    loginame as LoginName
FROM sys.sysprocesses
WHERE dbid > 0
GROUP BY dbid, loginame
ORDER BY NumberOfConnections DESC;
```

## Troubleshooting

### Can't connect to database
```bash
# Check if SQL Server is running
docker ps | grep sqlserver

# Check port is open
telnet localhost 1433
```

### Authentication failed
```sql
-- Enable SQL Server authentication
USE master;
GO
EXEC xp_instance_regwrite
    N'HKEY_LOCAL_MACHINE',
    N'Software\Microsoft\MSSQLServer\MSSQLServer',
    N'LoginMode',
    REG_DWORD,
    2;
GO
-- Restart SQL Server after this change
```

### Performance issues
```sql
-- Update statistics
EXEC sp_updatestats;
GO

-- Rebuild indexes
ALTER INDEX ALL ON Projects REBUILD;
GO
```

---

For more help, consult the [SQL Server documentation](https://docs.microsoft.com/en-us/sql/).
