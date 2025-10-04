# iAlign - React + Node.js + SQL Server Implementation Plan

## Technology Stack

### Frontend
- **Framework**: React 18+ with TypeScript
- **State Management**: Redux Toolkit or Zustand
- **UI Library**: Material-UI (MUI) or Ant Design
- **Charts**: Recharts or Chart.js React wrapper
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Forms**: React Hook Form + Yup validation
- **Build Tool**: Vite or Create React App
- **Styling**: CSS Modules / Styled Components / Tailwind CSS

### Backend
- **Runtime**: Node.js 18+ LTS
- **Framework**: Express.js
- **Database**: MS SQL Server 2019/2022
- **ORM**: Sequelize or TypeORM
- **Authentication**: Passport.js (JWT + Active Directory)
- **API Documentation**: Swagger/OpenAPI
- **Validation**: Joi or express-validator
- **Security**: Helmet, CORS, rate-limiting
- **Logging**: Winston or Pino

### DevOps
- **Version Control**: Git
- **Package Manager**: npm or yarn
- **Linting**: ESLint + Prettier
- **Testing**: Jest + React Testing Library (Frontend), Jest + Supertest (Backend)
- **CI/CD**: GitHub Actions or Azure DevOps
- **Containerization**: Docker + Docker Compose
- **Monitoring**: PM2, Application Insights

---

## Project Structure

```
iAlign/
├── frontend/                    # React application
│   ├── public/
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── common/        # Buttons, Cards, Modals, etc.
│   │   │   ├── charts/        # Chart components
│   │   │   ├── layout/        # Header, Sidebar, Layout
│   │   │   └── ai/            # AI Insights components
│   │   ├── pages/             # Page components
│   │   │   ├── Dashboard/
│   │   │   ├── Portfolio/
│   │   │   ├── Resources/
│   │   │   ├── Pipelines/
│   │   │   ├── Capacity/
│   │   │   └── Analytics/
│   │   ├── services/          # API services
│   │   ├── store/             # Redux/Zustand store
│   │   ├── hooks/             # Custom React hooks
│   │   ├── utils/             # Utility functions
│   │   ├── types/             # TypeScript types/interfaces
│   │   ├── constants/         # Constants and enums
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                     # Node.js application
│   ├── src/
│   │   ├── config/            # Configuration files
│   │   ├── controllers/       # Route controllers
│   │   ├── models/            # Sequelize/TypeORM models
│   │   ├── routes/            # API routes
│   │   ├── middleware/        # Express middleware
│   │   ├── services/          # Business logic
│   │   ├── utils/             # Utility functions
│   │   ├── validators/        # Request validators
│   │   ├── jobs/              # Background jobs
│   │   ├── app.ts             # Express app setup
│   │   └── server.ts          # Server entry point
│   ├── tests/                 # Backend tests
│   ├── package.json
│   └── tsconfig.json
│
├── database/                    # Database scripts
│   ├── migrations/            # Database migrations
│   ├── seeders/               # Seed data
│   └── schemas/               # SQL schemas
│
├── shared/                      # Shared types/constants
│   └── types/                 # Shared TypeScript types
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Database Schema

### Core Tables

#### 1. Portfolio Management Tables

```sql
-- Portfolios
CREATE TABLE Portfolios (
    PortfolioID INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(200) NOT NULL,
    Description NVARCHAR(MAX),
    Type NVARCHAR(50), -- Strategic, Operational, Innovation
    TotalValue DECIMAL(15,2),
    ROIIndex DECIMAL(5,2),
    RiskScore INT,
    ManagerID INT,
    CreatedDate DATETIME DEFAULT GETDATE(),
    ModifiedDate DATETIME DEFAULT GETDATE(),
    IsActive BIT DEFAULT 1
);

-- Projects
CREATE TABLE Projects (
    ProjectID INT PRIMARY KEY IDENTITY(1,1),
    PortfolioID INT FOREIGN KEY REFERENCES Portfolios(PortfolioID),
    Name NVARCHAR(200) NOT NULL,
    Description NVARCHAR(MAX),
    Status NVARCHAR(50), -- Planning, Active, OnHold, Completed, Cancelled
    Priority NVARCHAR(20), -- Critical, High, Medium, Low
    Type NVARCHAR(100),
    Progress INT CHECK (Progress BETWEEN 0 AND 100),
    Budget DECIMAL(15,2),
    ActualCost DECIMAL(15,2),
    StartDate DATE,
    EndDate DATE,
    Deadline DATE,
    HealthStatus NVARCHAR(20), -- Green, Yellow, Red
    ProjectManagerID INT,
    DomainID INT,
    CreatedDate DATETIME DEFAULT GETDATE(),
    ModifiedDate DATETIME DEFAULT GETDATE(),
    IsActive BIT DEFAULT 1
);

-- Project Dependencies
CREATE TABLE ProjectDependencies (
    DependencyID INT PRIMARY KEY IDENTITY(1,1),
    SourceProjectID INT FOREIGN KEY REFERENCES Projects(ProjectID),
    DependentProjectID INT FOREIGN KEY REFERENCES Projects(ProjectID),
    DependencyType NVARCHAR(50), -- FinishToStart, StartToStart, etc.
    Status NVARCHAR(50),
    CreatedDate DATETIME DEFAULT GETDATE()
);

-- Project Milestones
CREATE TABLE Milestones (
    MilestoneID INT PRIMARY KEY IDENTITY(1,1),
    ProjectID INT FOREIGN KEY REFERENCES Projects(ProjectID),
    Name NVARCHAR(200) NOT NULL,
    Description NVARCHAR(MAX),
    DueDate DATE,
    Status NVARCHAR(50), -- NotStarted, InProgress, Completed, Delayed
    CreatedDate DATETIME DEFAULT GETDATE()
);

-- Project Risks
CREATE TABLE ProjectRisks (
    RiskID INT PRIMARY KEY IDENTITY(1,1),
    ProjectID INT FOREIGN KEY REFERENCES Projects(ProjectID),
    Category NVARCHAR(50), -- Technical, Resource, Financial, Schedule
    Level NVARCHAR(20), -- Low, Medium, High, Critical
    Description NVARCHAR(MAX),
    Mitigation NVARCHAR(MAX),
    Status NVARCHAR(50), -- Open, Mitigated, Accepted, Closed
    CreatedDate DATETIME DEFAULT GETDATE()
);
```

#### 2. Resource Management Tables

```sql
-- Domains
CREATE TABLE Domains (
    DomainID INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(200) NOT NULL,
    Type NVARCHAR(50),
    ManagerID INT,
    Location NVARCHAR(100),
    CreatedDate DATETIME DEFAULT GETDATE(),
    IsActive BIT DEFAULT 1
);

-- Teams
CREATE TABLE Teams (
    TeamID INT PRIMARY KEY IDENTITY(1,1),
    DomainID INT FOREIGN KEY REFERENCES Domains(DomainID),
    Name NVARCHAR(200) NOT NULL,
    Type NVARCHAR(50), -- Portfolio Manager, Functional Analyst, Development, Testing
    LeadID INT,
    Location NVARCHAR(100),
    TotalMembers INT,
    UtilizationRate DECIMAL(5,2),
    MonthlyCost DECIMAL(15,2),
    CreatedDate DATETIME DEFAULT GETDATE(),
    IsActive BIT DEFAULT 1
);

-- Resources/Employees
CREATE TABLE Resources (
    ResourceID INT PRIMARY KEY IDENTITY(1,1),
    EmployeeID NVARCHAR(50) UNIQUE,
    FirstName NVARCHAR(100),
    LastName NVARCHAR(100),
    Email NVARCHAR(200),
    Role NVARCHAR(100),
    Location NVARCHAR(100),
    HourlyRate DECIMAL(10,2),
    UtilizationRate DECIMAL(5,2),
    IsActive BIT DEFAULT 1,
    CreatedDate DATETIME DEFAULT GETDATE()
);

-- Team Memberships
CREATE TABLE TeamMemberships (
    MembershipID INT PRIMARY KEY IDENTITY(1,1),
    TeamID INT FOREIGN KEY REFERENCES Teams(TeamID),
    ResourceID INT FOREIGN KEY REFERENCES Resources(ResourceID),
    Role NVARCHAR(100),
    StartDate DATE,
    EndDate DATE,
    AllocationPercentage INT CHECK (AllocationPercentage BETWEEN 0 AND 100)
);

-- Skills
CREATE TABLE Skills (
    SkillID INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(200) NOT NULL,
    Category NVARCHAR(50), -- Technical, Business, Leadership, Domain
    Description NVARCHAR(MAX),
    CreatedDate DATETIME DEFAULT GETDATE()
);

-- Resource Skills
CREATE TABLE ResourceSkills (
    ResourceSkillID INT PRIMARY KEY IDENTITY(1,1),
    ResourceID INT FOREIGN KEY REFERENCES Resources(ResourceID),
    SkillID INT FOREIGN KEY REFERENCES Skills(SkillID),
    ProficiencyLevel INT CHECK (ProficiencyLevel BETWEEN 1 AND 5),
    YearsOfExperience DECIMAL(4,1),
    CertificationName NVARCHAR(200),
    CertificationDate DATE,
    CreatedDate DATETIME DEFAULT GETDATE()
);

-- Locations
CREATE TABLE Locations (
    LocationID INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(100) NOT NULL,
    Country NVARCHAR(100),
    State NVARCHAR(100),
    City NVARCHAR(100),
    CostMultiplier DECIMAL(5,2),
    TotalResources INT,
    CreatedDate DATETIME DEFAULT GETDATE()
);

-- Resource Allocations
CREATE TABLE ResourceAllocations (
    AllocationID INT PRIMARY KEY IDENTITY(1,1),
    ResourceID INT FOREIGN KEY REFERENCES Resources(ResourceID),
    ProjectID INT FOREIGN KEY REFERENCES Projects(ProjectID),
    AllocationPercentage INT CHECK (AllocationPercentage BETWEEN 0 AND 100),
    StartDate DATE,
    EndDate DATE,
    Status NVARCHAR(50), -- Planned, Active, Completed
    CreatedDate DATETIME DEFAULT GETDATE()
);

-- Time Entries
CREATE TABLE TimeEntries (
    TimeEntryID INT PRIMARY KEY IDENTITY(1,1),
    ResourceID INT FOREIGN KEY REFERENCES Resources(ResourceID),
    ProjectID INT FOREIGN KEY REFERENCES Projects(ProjectID),
    EntryDate DATE,
    Hours DECIMAL(5,2),
    Description NVARCHAR(MAX),
    CreatedDate DATETIME DEFAULT GETDATE()
);
```

#### 3. Pipeline Management Tables

```sql
-- Platforms
CREATE TABLE Platforms (
    PlatformID INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(200) NOT NULL,
    Type NVARCHAR(50), -- SAP, Teamcenter, Databricks, CorePlus, Azure, PowerPlatform
    Vendor NVARCHAR(200),
    Description NVARCHAR(MAX),
    CreatedDate DATETIME DEFAULT GETDATE()
);

-- Platform Instances (Environments)
CREATE TABLE PlatformInstances (
    InstanceID INT PRIMARY KEY IDENTITY(1,1),
    PlatformID INT FOREIGN KEY REFERENCES Platforms(PlatformID),
    Name NVARCHAR(200) NOT NULL,
    Environment NVARCHAR(50), -- Development, Test, Staging, Production
    Location NVARCHAR(100),
    TotalCapacity INT,
    CurrentUsage INT,
    AvailableCapacity AS (TotalCapacity - CurrentUsage),
    MonthlyCost DECIMAL(15,2),
    Status NVARCHAR(50), -- Available, Maintenance, Offline
    HealthStatus NVARCHAR(20), -- Green, Yellow, Red
    CreatedDate DATETIME DEFAULT GETDATE(),
    IsActive BIT DEFAULT 1
);

-- Capacity Requests
CREATE TABLE CapacityRequests (
    RequestID INT PRIMARY KEY IDENTITY(1,1),
    RequestNumber NVARCHAR(50) UNIQUE,
    RequesterID INT,
    DomainID INT FOREIGN KEY REFERENCES Domains(DomainID),
    ProjectID INT FOREIGN KEY REFERENCES Projects(ProjectID),
    PlatformID INT FOREIGN KEY REFERENCES Platforms(PlatformID),
    RequestedCapacity INT,
    StartDate DATE,
    EndDate DATE,
    Justification NVARCHAR(MAX),
    Status NVARCHAR(50), -- Pending, UnderReview, Approved, Rejected
    Priority NVARCHAR(20),
    EstimatedCost DECIMAL(15,2),
    ApproverID INT,
    ApprovalDate DATETIME,
    CreatedDate DATETIME DEFAULT GETDATE()
);

-- Capacity Reservations
CREATE TABLE CapacityReservations (
    ReservationID INT PRIMARY KEY IDENTITY(1,1),
    ReservationNumber NVARCHAR(50) UNIQUE,
    ProjectID INT FOREIGN KEY REFERENCES Projects(ProjectID),
    InstanceID INT FOREIGN KEY REFERENCES PlatformInstances(InstanceID),
    RequestID INT FOREIGN KEY REFERENCES CapacityRequests(RequestID),
    ReservedCapacity INT,
    StartDate DATE,
    EndDate DATE,
    Status NVARCHAR(50), -- Active, Completed, Cancelled
    CreatedDate DATETIME DEFAULT GETDATE()
);
```

#### 4. Capacity Management Tables

```sql
-- Capacity Plans
CREATE TABLE CapacityPlans (
    PlanID INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(200) NOT NULL,
    Description NVARCHAR(MAX),
    PlanType NVARCHAR(50), -- Planning, Forecasting, Optimization
    TimeHorizon NVARCHAR(50), -- Quarter, Half, Annual
    StartDate DATE,
    EndDate DATE,
    Status NVARCHAR(50),
    CreatedBy INT,
    CreatedDate DATETIME DEFAULT GETDATE()
);

-- Capacity Scenarios
CREATE TABLE CapacityScenarios (
    ScenarioID INT PRIMARY KEY IDENTITY(1,1),
    PlanID INT FOREIGN KEY REFERENCES CapacityPlans(PlanID),
    Name NVARCHAR(200) NOT NULL,
    Description NVARCHAR(MAX),
    Type NVARCHAR(50), -- Baseline, Optimistic, Pessimistic, WhatIf
    Assumptions NVARCHAR(MAX),
    Results NVARCHAR(MAX), -- JSON
    CreatedDate DATETIME DEFAULT GETDATE()
);

-- Resource Demand Forecasts
CREATE TABLE ResourceDemands (
    DemandID INT PRIMARY KEY IDENTITY(1,1),
    ScenarioID INT FOREIGN KEY REFERENCES CapacityScenarios(ScenarioID),
    TeamID INT FOREIGN KEY REFERENCES Teams(TeamID),
    SkillID INT FOREIGN KEY REFERENCES Skills(SkillID),
    DemandedCapacity INT,
    Period NVARCHAR(50), -- Q1-2024, Q2-2024, etc.
    CreatedDate DATETIME DEFAULT GETDATE()
);

-- Platform Demand Forecasts
CREATE TABLE PlatformDemands (
    DemandID INT PRIMARY KEY IDENTITY(1,1),
    ScenarioID INT FOREIGN KEY REFERENCES CapacityScenarios(ScenarioID),
    InstanceID INT FOREIGN KEY REFERENCES PlatformInstances(InstanceID),
    DemandedCapacity INT,
    Period NVARCHAR(50),
    CreatedDate DATETIME DEFAULT GETDATE()
);

-- Capacity Alerts
CREATE TABLE CapacityAlerts (
    AlertID INT PRIMARY KEY IDENTITY(1,1),
    Type NVARCHAR(50), -- ResourceBottleneck, OverCapacity, UnderUtilization
    Severity NVARCHAR(20), -- Critical, High, Medium, Low
    Title NVARCHAR(200),
    Message NVARCHAR(MAX),
    ThresholdValue DECIMAL(10,2),
    CurrentValue DECIMAL(10,2),
    EntityType NVARCHAR(50), -- Team, Project, Instance
    EntityID INT,
    Status NVARCHAR(50), -- Active, Acknowledged, Resolved
    CreatedDate DATETIME DEFAULT GETDATE()
);
```

#### 5. AI & Common Tables

```sql
-- AI Recommendations
CREATE TABLE AIRecommendations (
    RecommendationID INT PRIMARY KEY IDENTITY(1,1),
    Type NVARCHAR(50), -- ResourceOptimization, CapacityPlanning, RiskMitigation
    Context NVARCHAR(50), -- Dashboard, Projects, Resources, Capacity
    Priority NVARCHAR(20), -- Critical, High, Medium, Low
    Title NVARCHAR(200),
    Content NVARCHAR(MAX),
    ConfidenceScore DECIMAL(5,2),
    ImpactDescription NVARCHAR(MAX),
    ImpactValue DECIMAL(15,2),
    Status NVARCHAR(50), -- Pending, Applied, Dismissed, Expired
    CreatedDate DATETIME DEFAULT GETDATE(),
    ExpiryDate DATETIME
);

-- Notifications
CREATE TABLE Notifications (
    NotificationID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT,
    Type NVARCHAR(50), -- Info, Warning, Error, Success, Alert
    Title NVARCHAR(200),
    Message NVARCHAR(MAX),
    IsRead BIT DEFAULT 0,
    CreatedDate DATETIME DEFAULT GETDATE()
);

-- Audit Logs
CREATE TABLE AuditLogs (
    LogID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT,
    Action NVARCHAR(50), -- Create, Update, Delete, Login, Logout, View
    EntityType NVARCHAR(100),
    EntityID INT,
    OldValue NVARCHAR(MAX),
    NewValue NVARCHAR(MAX),
    IPAddress NVARCHAR(50),
    UserAgent NVARCHAR(500),
    Timestamp DATETIME DEFAULT GETDATE()
);

-- System Configuration
CREATE TABLE SystemConfigurations (
    ConfigID INT PRIMARY KEY IDENTITY(1,1),
    ConfigKey NVARCHAR(100) UNIQUE NOT NULL,
    ConfigValue NVARCHAR(MAX),
    Category NVARCHAR(50),
    Description NVARCHAR(MAX),
    ModifiedDate DATETIME DEFAULT GETDATE()
);

-- Users (if not using external AD)
CREATE TABLE Users (
    UserID INT PRIMARY KEY IDENTITY(1,1),
    Username NVARCHAR(100) UNIQUE NOT NULL,
    Email NVARCHAR(200) UNIQUE NOT NULL,
    PasswordHash NVARCHAR(500),
    FirstName NVARCHAR(100),
    LastName NVARCHAR(100),
    Role NVARCHAR(50), -- Administrator, Manager, Analyst, User
    IsActive BIT DEFAULT 1,
    LastLoginDate DATETIME,
    CreatedDate DATETIME DEFAULT GETDATE()
);
```

---

## API Endpoints

### Portfolio Management APIs

```
GET    /api/v1/portfolios                    # List all portfolios
GET    /api/v1/portfolios/:id                # Get portfolio details
POST   /api/v1/portfolios                    # Create portfolio
PUT    /api/v1/portfolios/:id                # Update portfolio
DELETE /api/v1/portfolios/:id                # Delete portfolio
GET    /api/v1/portfolios/:id/metrics        # Portfolio metrics

GET    /api/v1/projects                      # List all projects
GET    /api/v1/projects/:id                  # Get project details
POST   /api/v1/projects                      # Create project
PUT    /api/v1/projects/:id                  # Update project
DELETE /api/v1/projects/:id                  # Delete project
GET    /api/v1/projects/:id/dependencies     # Project dependencies
POST   /api/v1/projects/:id/dependencies     # Add dependency
GET    /api/v1/projects/:id/risks           # Project risks
POST   /api/v1/projects/:id/risks           # Add risk
GET    /api/v1/projects/:id/milestones      # Project milestones
POST   /api/v1/projects/:id/milestones      # Add milestone
```

### Resource Management APIs

```
GET    /api/v1/domains                       # List all domains
GET    /api/v1/domains/:id                   # Get domain details
GET    /api/v1/domains/:id/teams            # Domain teams

GET    /api/v1/teams                         # List all teams
GET    /api/v1/teams/:id                     # Get team details
GET    /api/v1/teams/:id/members            # Team members
GET    /api/v1/teams/:id/capacity           # Team capacity
GET    /api/v1/teams/:id/utilization        # Team utilization

GET    /api/v1/resources                     # List all resources
GET    /api/v1/resources/:id                 # Get resource details
GET    /api/v1/resources/:id/skills         # Resource skills
POST   /api/v1/resources/:id/skills         # Add skill
GET    /api/v1/resources/:id/allocations    # Resource allocations
POST   /api/v1/resources/:id/allocations    # Create allocation

GET    /api/v1/skills                        # List all skills
GET    /api/v1/skills/:id                    # Get skill details

GET    /api/v1/locations                     # List all locations
GET    /api/v1/locations/:id                 # Get location details
```

### Pipeline Management APIs

```
GET    /api/v1/platforms                     # List all platforms
GET    /api/v1/platforms/:id                 # Get platform details

GET    /api/v1/instances                     # List all instances
GET    /api/v1/instances/:id                 # Get instance details
GET    /api/v1/instances/:id/capacity       # Instance capacity
GET    /api/v1/instances/:id/health         # Instance health

GET    /api/v1/capacity-requests             # List requests
GET    /api/v1/capacity-requests/:id         # Get request details
POST   /api/v1/capacity-requests             # Create request
PUT    /api/v1/capacity-requests/:id         # Update request
PUT    /api/v1/capacity-requests/:id/approve # Approve request
PUT    /api/v1/capacity-requests/:id/reject  # Reject request

GET    /api/v1/reservations                  # List reservations
GET    /api/v1/reservations/:id              # Get reservation details
POST   /api/v1/reservations                  # Create reservation
PUT    /api/v1/reservations/:id              # Update reservation
DELETE /api/v1/reservations/:id              # Cancel reservation
```

### Capacity Management APIs

```
GET    /api/v1/capacity-plans                # List plans
GET    /api/v1/capacity-plans/:id            # Get plan details
POST   /api/v1/capacity-plans                # Create plan
PUT    /api/v1/capacity-plans/:id            # Update plan

GET    /api/v1/scenarios                     # List scenarios
GET    /api/v1/scenarios/:id                 # Get scenario details
POST   /api/v1/scenarios                     # Create scenario
POST   /api/v1/scenarios/:id/analyze         # Analyze scenario
POST   /api/v1/scenarios/compare             # Compare scenarios

GET    /api/v1/forecasts/resources           # Resource forecasts
GET    /api/v1/forecasts/platforms           # Platform forecasts
POST   /api/v1/forecasts/whatif              # What-if analysis

GET    /api/v1/alerts                        # List alerts
GET    /api/v1/alerts/:id                    # Get alert details
PUT    /api/v1/alerts/:id/acknowledge        # Acknowledge alert
```

### AI & Analytics APIs

```
GET    /api/v1/recommendations               # List recommendations
GET    /api/v1/recommendations/:id           # Get recommendation
POST   /api/v1/recommendations/:id/apply     # Apply recommendation
POST   /api/v1/recommendations/:id/dismiss   # Dismiss recommendation
GET    /api/v1/recommendations/context/:page # Context-based recommendations

GET    /api/v1/analytics/dashboard           # Dashboard analytics
GET    /api/v1/analytics/portfolio           # Portfolio analytics
GET    /api/v1/analytics/resources           # Resource analytics
GET    /api/v1/analytics/capacity            # Capacity analytics

GET    /api/v1/notifications                 # List notifications
PUT    /api/v1/notifications/:id/read        # Mark as read
DELETE /api/v1/notifications/:id             # Delete notification
```

### Authentication & User APIs

```
POST   /api/v1/auth/login                    # Login
POST   /api/v1/auth/logout                   # Logout
POST   /api/v1/auth/refresh                  # Refresh token
GET    /api/v1/auth/me                       # Current user info

GET    /api/v1/users                         # List users (admin)
GET    /api/v1/users/:id                     # Get user details
POST   /api/v1/users                         # Create user
PUT    /api/v1/users/:id                     # Update user
```

---

## React Components Structure

### Core Layout Components

```typescript
// Layout Components
- App.tsx                        # Root component
- Layout/
  - MainLayout.tsx              # Main application layout
  - Sidebar.tsx                 # Navigation sidebar
  - Header.tsx                  # Top header with search & user
  - Breadcrumb.tsx              # Breadcrumb navigation
  - Footer.tsx                  # Footer component

// Common Components
- common/
  - Button.tsx
  - Card.tsx
  - Modal.tsx
  - Table.tsx
  - Form/
    - Input.tsx
    - Select.tsx
    - DatePicker.tsx
    - Checkbox.tsx
  - Loading.tsx
  - ErrorBoundary.tsx
  - Notification.tsx
```

### Feature Components

```typescript
// Dashboard
- Dashboard/
  - DashboardPage.tsx
  - MetricCard.tsx
  - QuickActions.tsx
  - RecentActivity.tsx

// Portfolio
- Portfolio/
  - PortfolioOverview.tsx
  - StrategicAlignmentMatrix.tsx
  - PortfolioTimeline.tsx
  - ProjectList.tsx
  - ProjectDetails.tsx
  - ProjectForm.tsx
  - DependencyGraph.tsx
  - RiskMatrix.tsx

// Resources
- Resources/
  - ResourceOverview.tsx
  - DomainTeams.tsx
  - TeamCard.tsx
  - ResourceAllocation.tsx
  - SkillsMatrix.tsx
  - UtilizationChart.tsx
  - AllocationTimeline.tsx

// Pipeline
- Pipeline/
  - PipelineOverview.tsx
  - EnvironmentCatalog.tsx
  - EnvironmentCard.tsx
  - CapacityRequests.tsx
  - RequestForm.tsx
  - Reservations.tsx
  - CapacityChart.tsx

// Capacity
- Capacity/
  - CapacityDashboard.tsx
  - CapacityPlanning.tsx
  - ScenarioModeling.tsx
  - ScenarioComparison.tsx
  - ForecastChart.tsx
  - AlertList.tsx

// Charts
- charts/
  - DoughnutChart.tsx
  - LineChart.tsx
  - BarChart.tsx
  - RadarChart.tsx
  - BubbleChart.tsx
  - GanttChart.tsx

// AI Components
- ai/
  - AIInsightsPanel.tsx
  - InsightCard.tsx
  - RecommendationList.tsx
```

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
**Backend:**
- [x] Set up Node.js + Express project
- [x] Configure TypeScript
- [x] Set up MS SQL Server connection (Sequelize/TypeORM)
- [x] Implement authentication (JWT + Passport)
- [x] Create base database schema
- [x] Set up middleware (CORS, Helmet, logging)
- [x] Implement error handling

**Frontend:**
- [x] Set up React + TypeScript project
- [x] Configure routing (React Router)
- [x] Set up state management (Redux Toolkit/Zustand)
- [x] Create base layout components
- [x] Implement authentication flow
- [x] Set up API service layer (Axios)

### Phase 2: Portfolio Module (Weeks 3-4)
**Backend:**
- [x] Portfolio & Project models
- [x] Portfolio CRUD APIs
- [x] Project CRUD APIs
- [x] Dependencies, Risks, Milestones APIs
- [x] Portfolio analytics endpoints

**Frontend:**
- [x] Portfolio Overview page
- [x] Project Management page
- [x] Portfolio Analytics page
- [x] Strategic Alignment Matrix
- [x] Timeline visualization
- [x] Forms and validation

### Phase 3: Resource Module (Weeks 5-6)
**Backend:**
- [x] Domain, Team, Resource models
- [x] Skills and allocation models
- [x] Resource management APIs
- [x] Utilization calculation logic
- [x] Skills management APIs

**Frontend:**
- [x] Resource Overview page
- [x] Domain Teams page
- [x] Resource Allocation page
- [x] Skills Matrix visualization
- [x] Utilization charts
- [x] Allocation forms

### Phase 4: Pipeline Module (Weeks 7-8)
**Backend:**
- [x] Platform and Instance models
- [x] Capacity request workflow
- [x] Reservation management
- [x] Capacity tracking APIs
- [x] Health monitoring

**Frontend:**
- [x] Pipeline Overview page
- [x] Environment Catalog
- [x] Capacity Requests page
- [x] Reservations page
- [x] Request approval workflow
- [x] Capacity visualization

### Phase 5: Capacity Module (Weeks 9-10)
**Backend:**
- [x] Capacity planning models
- [x] Scenario modeling APIs
- [x] Forecasting algorithms
- [x] What-if analysis logic
- [x] Alert generation

**Frontend:**
- [x] Capacity Dashboard
- [x] Capacity Planning page
- [x] Scenario Modeling page
- [x] Scenario comparison
- [x] Forecast charts
- [x] Alert management

### Phase 6: AI & Analytics (Weeks 11-12)
**Backend:**
- [x] AI recommendation engine
- [x] Context-aware insights logic
- [x] Analytics aggregation APIs
- [x] Notification system
- [x] Audit logging

**Frontend:**
- [x] AI Insights Panel
- [x] Recommendation cards
- [x] Analytics dashboards
- [x] Notification center
- [x] Real-time updates

### Phase 7: Testing & Polish (Weeks 13-14)
- [x] Unit tests (Frontend & Backend)
- [x] Integration tests
- [x] E2E tests
- [x] Performance optimization
- [x] Security audit
- [x] Documentation
- [x] Bug fixes

### Phase 8: Deployment (Week 15-16)
- [x] Docker containerization
- [x] CI/CD pipeline setup
- [x] Environment configuration
- [x] Database migration scripts
- [x] Production deployment
- [x] Monitoring setup
- [x] User training

---

## Development Setup

### Environment Variables

```env
# Backend (.env)
NODE_ENV=development
PORT=5000
API_VERSION=v1

# Database
DB_HOST=localhost
DB_PORT=1433
DB_NAME=iAlign
DB_USER=sa
DB_PASSWORD=your_password
DB_DIALECT=mssql

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_EXPIRES_IN=7d

# Active Directory (optional)
AD_URL=ldap://your-ad-server
AD_BASE_DN=DC=company,DC=com
AD_USERNAME=ad_user
AD_PASSWORD=ad_password

# CORS
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=debug
```

```env
# Frontend (.env)
REACT_APP_API_URL=http://localhost:5000/api/v1
REACT_APP_ENV=development
REACT_APP_VERSION=1.0.0
```

### Docker Setup

```yaml
# docker-compose.yml
version: '3.8'

services:
  sqlserver:
    image: mcr.microsoft.com/mssql/server:2022-latest
    environment:
      SA_PASSWORD: "YourStrong@Password"
      ACCEPT_EULA: "Y"
    ports:
      - "1433:1433"
    volumes:
      - sqldata:/var/opt/mssql

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=development
      - DB_HOST=sqlserver
    depends_on:
      - sqlserver
    volumes:
      - ./backend:/app
      - /app/node_modules

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:5000/api/v1
    volumes:
      - ./frontend:/app
      - /app/node_modules

volumes:
  sqldata:
```

---

## Key Considerations

### Security
- Implement JWT-based authentication
- Hash passwords with bcrypt
- Validate and sanitize all inputs
- Implement rate limiting
- Use HTTPS in production
- Implement RBAC (Role-Based Access Control)
- SQL injection prevention (parameterized queries)
- XSS protection
- CSRF tokens for state-changing operations

### Performance
- Implement pagination (20 items per page)
- Use database indexing on foreign keys and lookup fields
- Implement caching (Redis) for frequently accessed data
- Lazy loading for large datasets
- Optimize SQL queries with proper JOINs
- Use connection pooling
- Implement API response compression

### Monitoring
- Application logging (Winston/Pino)
- Error tracking (Sentry)
- Performance monitoring (New Relic/Application Insights)
- Database query monitoring
- API metrics and analytics

### Testing Strategy
- Unit tests: Jest (80%+ coverage target)
- Integration tests: Supertest (Backend), React Testing Library (Frontend)
- E2E tests: Cypress or Playwright
- API testing: Postman/Newman
- Load testing: Artillery or k6

---

## Migration from HTML Mockup

### Data Migration
1. Extract mock data from `script.js`
2. Create seed files for database
3. Map mock data to database schema
4. Import initial reference data (domains, skills, platforms)

### Component Migration
1. Convert HTML pages to React components
2. Extract inline styles to CSS modules/styled-components
3. Migrate Chart.js implementations to Recharts/React-Chartjs-2
4. Refactor event handlers to React patterns
5. Implement React Router for navigation

### State Management Migration
1. Identify global state (user, notifications, AI insights)
2. Identify local component state
3. Implement Redux store with slices or Zustand stores
4. Create async thunks for API calls
5. Implement selectors for derived state

---

## Next Steps

1. **Create Backend Scaffolding**
   - Initialize Node.js project
   - Set up Express server
   - Configure database connection
   - Implement authentication

2. **Create Frontend Scaffolding**
   - Initialize React project
   - Set up routing
   - Create layout components
   - Implement auth flow

3. **Database Setup**
   - Create SQL Server database
   - Run schema creation scripts
   - Create seed data

4. **Start Implementation**
   - Begin with Phase 1 (Foundation)
   - Follow modular approach
   - Test each module before proceeding

5. **Continuous Integration**
   - Set up Git repository
   - Configure CI/CD pipeline
   - Implement automated testing
   - Deploy to staging environment

---

**Total Estimated Timeline**: 16 weeks
**Team Size**: 2-3 developers (1 backend, 1 frontend, 1 full-stack)
**Budget Consideration**: Cloud hosting, SQL Server licensing, monitoring tools
