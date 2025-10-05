import { useState } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  ExpandMore,
  Storage,
  AccountTree,
  Architecture,
  Link as LinkIcon,
  CheckCircle,
  Key,
  Description,
} from '@mui/icons-material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const DataModel = () => {
  const [tabValue, setTabValue] = useState(0);
  const [expanded, setExpanded] = useState<string>('users');

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAccordionChange = (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : '');
  };

  const entities = [
    {
      name: 'Users',
      table: 'Users',
      description: 'System users with authentication and role-based access',
      fields: [
        { name: 'id', type: 'INTEGER', required: true, primaryKey: true, description: 'Auto-incrementing primary key' },
        { name: 'username', type: 'VARCHAR(100)', required: true, unique: true, description: 'Unique username for login' },
        { name: 'email', type: 'VARCHAR(200)', required: true, unique: true, description: 'User email address' },
        { name: 'passwordHash', type: 'VARCHAR(500)', required: true, description: 'Bcrypt hashed password' },
        { name: 'firstName', type: 'VARCHAR(100)', required: false, description: 'User first name' },
        { name: 'lastName', type: 'VARCHAR(100)', required: false, description: 'User last name' },
        { name: 'role', type: 'VARCHAR(50)', required: true, default: 'User', description: 'User role (Administrator, Manager, User, Viewer)' },
        { name: 'isActive', type: 'BOOLEAN', required: true, default: true, description: 'Account active status' },
        { name: 'lastLoginDate', type: 'DATETIME', required: false, description: 'Last successful login timestamp' },
        { name: 'createdDate', type: 'DATETIME', required: true, description: 'Account creation timestamp' },
        { name: 'modifiedDate', type: 'DATETIME', required: true, description: 'Last modification timestamp' },
      ],
      relationships: [],
    },
    {
      name: 'Domains',
      table: 'Domains',
      description: 'Organizational domains (e.g., Engineering, Sales, Finance)',
      fields: [
        { name: 'id', type: 'INTEGER', required: true, primaryKey: true, description: 'Auto-incrementing primary key' },
        { name: 'name', type: 'VARCHAR(200)', required: true, unique: true, description: 'Domain name' },
        { name: 'description', type: 'TEXT', required: false, description: 'Domain description' },
        { name: 'managerId', type: 'INTEGER', required: false, foreignKey: 'Resources.id', description: 'Domain manager reference' },
        { name: 'createdDate', type: 'DATETIME', required: true, description: 'Creation timestamp' },
        { name: 'modifiedDate', type: 'DATETIME', required: true, description: 'Last modification timestamp' },
      ],
      relationships: [
        { type: 'hasMany', target: 'SegmentFunctions', description: 'A domain can have multiple segment functions' },
        { type: 'hasMany', target: 'Teams', description: 'A domain can have multiple teams' },
        { type: 'hasMany', target: 'Resources', description: 'A domain can have multiple resources' },
        { type: 'belongsTo', target: 'Resources', description: 'Domain manager is a resource' },
      ],
    },
    {
      name: 'SegmentFunctions',
      table: 'SegmentFunctions',
      description: 'Segment functions within domains',
      fields: [
        { name: 'id', type: 'INTEGER', required: true, primaryKey: true, description: 'Auto-incrementing primary key' },
        { name: 'domainId', type: 'INTEGER', required: false, foreignKey: 'Domains.id', description: 'Parent domain reference' },
        { name: 'name', type: 'VARCHAR(200)', required: true, description: 'Segment function name' },
        { name: 'description', type: 'TEXT', required: false, description: 'Segment function description' },
        { name: 'createdDate', type: 'DATETIME', required: true, description: 'Creation timestamp' },
        { name: 'modifiedDate', type: 'DATETIME', required: true, description: 'Last modification timestamp' },
      ],
      relationships: [
        { type: 'belongsTo', target: 'Domains', description: 'Segment function belongs to a domain' },
        { type: 'hasMany', target: 'Projects', description: 'Segment function can have multiple projects' },
      ],
    },
    {
      name: 'Teams',
      table: 'Teams',
      description: 'Domain teams for resource organization',
      fields: [
        { name: 'id', type: 'INTEGER', required: true, primaryKey: true, description: 'Auto-incrementing primary key' },
        { name: 'domainId', type: 'INTEGER', required: false, foreignKey: 'Domains.id', description: 'Parent domain reference' },
        { name: 'name', type: 'VARCHAR(200)', required: true, description: 'Team name' },
        { name: 'description', type: 'TEXT', required: false, description: 'Team description' },
        { name: 'createdDate', type: 'DATETIME', required: true, description: 'Creation timestamp' },
        { name: 'modifiedDate', type: 'DATETIME', required: true, description: 'Last modification timestamp' },
      ],
      relationships: [
        { type: 'belongsTo', target: 'Domains', description: 'Team belongs to a domain' },
        { type: 'hasMany', target: 'Resources', description: 'Team can have multiple resources' },
      ],
    },
    {
      name: 'Projects',
      table: 'Projects',
      description: 'Enterprise projects and initiatives',
      fields: [
        { name: 'id', type: 'INTEGER', required: true, primaryKey: true, description: 'Auto-incrementing primary key' },
        { name: 'projectNumber', type: 'VARCHAR(50)', required: false, unique: true, description: 'Unique project identifier (e.g., PRJ-0001)' },
        { name: 'segmentFunctionId', type: 'INTEGER', required: false, foreignKey: 'SegmentFunctions.id', description: 'Parent segment function reference' },
        { name: 'domainId', type: 'INTEGER', required: false, foreignKey: 'Domains.id', description: 'Domain reference' },
        { name: 'name', type: 'VARCHAR(300)', required: true, description: 'Project name' },
        { name: 'description', type: 'TEXT', required: false, description: 'Project description' },
        { name: 'status', type: 'VARCHAR(50)', required: true, description: 'Project status (Planning, In Progress, Completed, On Hold, Cancelled)' },
        { name: 'priority', type: 'VARCHAR(50)', required: true, description: 'Project priority (Low, Medium, High, Critical)' },
        { name: 'type', type: 'VARCHAR(100)', required: false, description: 'Project type/category' },
        { name: 'fiscalYear', type: 'VARCHAR(20)', required: false, description: 'Fiscal year (e.g., FY25)' },
        { name: 'budget', type: 'DECIMAL(15,2)', required: false, description: 'Total budget allocation' },
        { name: 'actualCost', type: 'DECIMAL(15,2)', required: false, description: 'Actual cost incurred' },
        { name: 'startDate', type: 'DATE', required: false, description: 'Project start date' },
        { name: 'endDate', type: 'DATE', required: false, description: 'Project end date' },
        { name: 'currentPhase', type: 'VARCHAR(100)', required: false, description: 'Current project phase' },
        { name: 'healthStatus', type: 'VARCHAR(50)', required: false, description: 'Project health (Green, Yellow, Red)' },
        { name: 'progress', type: 'INTEGER', required: false, default: 0, description: 'Completion percentage (0-100)' },
        { name: 'createdDate', type: 'DATETIME', required: true, description: 'Creation timestamp' },
        { name: 'modifiedDate', type: 'DATETIME', required: true, description: 'Last modification timestamp' },
      ],
      relationships: [
        { type: 'belongsTo', target: 'SegmentFunctions', description: 'Project belongs to a segment function' },
        { type: 'belongsTo', target: 'Domains', description: 'Project belongs to a domain' },
        { type: 'hasMany', target: 'Milestones', description: 'Project can have multiple milestones' },
        { type: 'hasMany', target: 'Allocations', description: 'Project can have multiple resource allocations' },
      ],
    },
    {
      name: 'Resources',
      table: 'Resources',
      description: 'Human resources and employees',
      fields: [
        { name: 'id', type: 'INTEGER', required: true, primaryKey: true, description: 'Auto-incrementing primary key' },
        { name: 'employeeId', type: 'VARCHAR(50)', required: true, unique: true, description: 'Employee identifier (e.g., EMP001)' },
        { name: 'firstName', type: 'VARCHAR(100)', required: true, description: 'First name' },
        { name: 'lastName', type: 'VARCHAR(100)', required: true, description: 'Last name' },
        { name: 'email', type: 'VARCHAR(200)', required: false, description: 'Email address' },
        { name: 'role', type: 'VARCHAR(100)', required: false, description: 'Job role/title' },
        { name: 'location', type: 'VARCHAR(100)', required: false, description: 'Work location' },
        { name: 'domainId', type: 'INTEGER', required: false, foreignKey: 'Domains.id', description: 'Domain reference' },
        { name: 'segmentFunctionId', type: 'INTEGER', required: false, foreignKey: 'SegmentFunctions.id', description: 'Segment function reference' },
        { name: 'domainTeamId', type: 'INTEGER', required: false, foreignKey: 'Teams.id', description: 'Team reference' },
        { name: 'hourlyRate', type: 'DECIMAL(10,2)', required: false, description: 'Hourly billing rate' },
        { name: 'utilizationRate', type: 'DECIMAL(5,2)', required: false, description: 'Target utilization percentage' },
        { name: 'createdDate', type: 'DATETIME', required: true, description: 'Creation timestamp' },
        { name: 'modifiedDate', type: 'DATETIME', required: true, description: 'Last modification timestamp' },
      ],
      relationships: [
        { type: 'belongsTo', target: 'Domains', description: 'Resource belongs to a domain' },
        { type: 'belongsTo', target: 'SegmentFunctions', description: 'Resource belongs to a segment function' },
        { type: 'belongsTo', target: 'Teams', description: 'Resource belongs to a team' },
        { type: 'hasMany', target: 'Allocations', description: 'Resource can have multiple project allocations' },
      ],
    },
    {
      name: 'Milestones',
      table: 'Milestones',
      description: 'Project milestones and key deliverables',
      fields: [
        { name: 'id', type: 'INTEGER', required: true, primaryKey: true, description: 'Auto-incrementing primary key' },
        { name: 'projectId', type: 'INTEGER', required: true, foreignKey: 'Projects.id', description: 'Parent project reference' },
        { name: 'name', type: 'VARCHAR(300)', required: true, description: 'Milestone name' },
        { name: 'description', type: 'TEXT', required: false, description: 'Milestone description' },
        { name: 'status', type: 'VARCHAR(50)', required: false, description: 'Milestone status (Not Started, In Progress, Completed, At Risk, Delayed)' },
        { name: 'progress', type: 'INTEGER', required: false, default: 0, description: 'Completion percentage (0-100)' },
        { name: 'dueDate', type: 'DATE', required: false, description: 'Due date' },
        { name: 'owner', type: 'VARCHAR(200)', required: false, description: 'Milestone owner/responsible person' },
        { name: 'dependencies', type: 'TEXT', required: false, description: 'Dependencies on other milestones' },
        { name: 'createdDate', type: 'DATETIME', required: true, description: 'Creation timestamp' },
        { name: 'modifiedDate', type: 'DATETIME', required: true, description: 'Last modification timestamp' },
      ],
      relationships: [
        { type: 'belongsTo', target: 'Projects', description: 'Milestone belongs to a project' },
      ],
    },
    {
      name: 'Allocations',
      table: 'Allocations',
      description: 'Resource-to-project allocations',
      fields: [
        { name: 'id', type: 'INTEGER', required: true, primaryKey: true, description: 'Auto-incrementing primary key' },
        { name: 'resourceId', type: 'INTEGER', required: true, foreignKey: 'Resources.id', description: 'Allocated resource reference' },
        { name: 'projectId', type: 'INTEGER', required: true, foreignKey: 'Projects.id', description: 'Target project reference' },
        { name: 'allocationPercentage', type: 'DECIMAL(5,2)', required: true, description: 'Allocation percentage (0-100)' },
        { name: 'startDate', type: 'DATE', required: false, description: 'Allocation start date' },
        { name: 'endDate', type: 'DATE', required: false, description: 'Allocation end date' },
        { name: 'role', type: 'VARCHAR(100)', required: false, description: 'Role in this project' },
        { name: 'createdDate', type: 'DATETIME', required: true, description: 'Creation timestamp' },
        { name: 'modifiedDate', type: 'DATETIME', required: true, description: 'Last modification timestamp' },
      ],
      relationships: [
        { type: 'belongsTo', target: 'Resources', description: 'Allocation belongs to a resource' },
        { type: 'belongsTo', target: 'Projects', description: 'Allocation belongs to a project' },
      ],
    },
  ];

  const architectureLayers = [
    {
      name: 'Frontend Layer',
      color: '#667eea',
      components: [
        'React 18 with TypeScript',
        'Material-UI Components',
        'Redux Toolkit for State Management',
        'React Router for Navigation',
        'Axios for HTTP Requests',
        'XLSX for Excel Import/Export',
      ],
    },
    {
      name: 'API Layer',
      color: '#f093fb',
      components: [
        'RESTful API Design',
        'JWT Authentication',
        'Role-Based Access Control',
        'Express Rate Limiting',
        'CORS & Security Headers',
        'Request Validation',
      ],
    },
    {
      name: 'Backend Layer',
      color: '#4facfe',
      components: [
        'Node.js Runtime',
        'Express.js Framework',
        'Passport.js Authentication',
        'Bcrypt Password Hashing',
        'Winston Logger',
        'TypeScript Support',
      ],
    },
    {
      name: 'Data Layer',
      color: '#43e97b',
      components: [
        'Sequelize ORM',
        'SQLite Database',
        'Transaction Support',
        'Model Associations',
        'Migration Support',
        'Query Optimization',
      ],
    },
  ];

  return (
    <Box>
      <Box mb={3}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            fontSize: { xs: '1.75rem', sm: '2rem', md: '2.125rem' },
          }}
          gutterBottom
        >
          Data Model & Architecture
        </Typography>
        <Typography
          color="text.secondary"
          sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
        >
          Complete system data model, entity relationships, and architecture overview
        </Typography>
      </Box>

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab icon={<Storage />} iconPosition="start" label="Database Schema" />
        <Tab icon={<AccountTree />} iconPosition="start" label="Relationships" />
        <Tab icon={<Architecture />} iconPosition="start" label="Architecture" />
      </Tabs>

      {/* Tab 1: Database Schema */}
      <TabPanel value={tabValue} index={0}>
        {entities.map((entity) => (
          <Accordion
            key={entity.name}
            expanded={expanded === entity.name.toLowerCase()}
            onChange={handleAccordionChange(entity.name.toLowerCase())}
            sx={{ mb: 2 }}
          >
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box display="flex" alignItems="center" gap={2} width="100%">
                <Storage color="primary" />
                <Box flex={1}>
                  <Typography variant="h6" fontWeight="bold">
                    {entity.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Table: {entity.table} • {entity.fields.length} fields
                  </Typography>
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Typography color="text.secondary" paragraph>
                {entity.description}
              </Typography>

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Field Name</strong></TableCell>
                      <TableCell><strong>Data Type</strong></TableCell>
                      <TableCell><strong>Constraints</strong></TableCell>
                      <TableCell><strong>Description</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {entity.fields.map((field) => (
                      <TableRow key={field.name}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="600" fontFamily="monospace">
                            {field.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={field.type}
                            size="small"
                            sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={0.5} flexWrap="wrap">
                            {field.primaryKey && (
                              <Chip
                                label="PK"
                                size="small"
                                color="error"
                                icon={<Key sx={{ fontSize: 12 }} />}
                                sx={{ fontSize: '0.7rem' }}
                              />
                            )}
                            {field.required && (
                              <Chip
                                label="Required"
                                size="small"
                                color="warning"
                                sx={{ fontSize: '0.7rem' }}
                              />
                            )}
                            {field.unique && (
                              <Chip
                                label="Unique"
                                size="small"
                                color="info"
                                sx={{ fontSize: '0.7rem' }}
                              />
                            )}
                            {field.foreignKey && (
                              <Chip
                                label={`FK → ${field.foreignKey}`}
                                size="small"
                                color="secondary"
                                icon={<LinkIcon sx={{ fontSize: 12 }} />}
                                sx={{ fontSize: '0.7rem' }}
                              />
                            )}
                            {field.default !== undefined && (
                              <Chip
                                label={`Default: ${field.default}`}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem' }}
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {field.description}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        ))}
      </TabPanel>

      {/* Tab 2: Relationships */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          {entities.map((entity) => (
            <Grid item xs={12} md={6} key={entity.name}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <AccountTree color="primary" />
                    <Typography variant="h6" fontWeight="bold">
                      {entity.name}
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />

                  {entity.relationships.length > 0 ? (
                    <List dense>
                      {entity.relationships.map((rel, idx) => (
                        <ListItem key={idx}>
                          <ListItemIcon>
                            <LinkIcon color="action" />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography variant="body2" fontWeight="600">
                                {rel.type} → {rel.target}
                              </Typography>
                            }
                            secondary={rel.description}
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No relationships defined
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Tab 3: Architecture */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          {architectureLayers.map((layer, index) => (
            <Grid item xs={12} md={6} key={layer.name}>
              <Card
                sx={{
                  background: layer.color,
                  color: 'white',
                  height: '100%',
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Architecture />
                    <Typography variant="h6" fontWeight="bold">
                      {layer.name}
                    </Typography>
                  </Box>
                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)', mb: 2 }} />
                  <List dense>
                    {layer.components.map((component) => (
                      <ListItem key={component} sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <CheckCircle sx={{ color: 'white', fontSize: 20 }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={component}
                          primaryTypographyProps={{
                            color: 'white',
                            fontSize: '0.875rem',
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              <Description sx={{ mr: 1, verticalAlign: 'middle' }} />
              Architecture Overview
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Request Flow:
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="1. Client (React App) → HTTP Request"
                      primaryTypographyProps={{ fontSize: '0.875rem' }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="2. API Gateway → Authentication & Authorization"
                      primaryTypographyProps={{ fontSize: '0.875rem' }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="3. Controller → Business Logic"
                      primaryTypographyProps={{ fontSize: '0.875rem' }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="4. Model (Sequelize) → Database Query"
                      primaryTypographyProps={{ fontSize: '0.875rem' }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="5. Response → JSON Data"
                      primaryTypographyProps={{ fontSize: '0.875rem' }}
                    />
                  </ListItem>
                </List>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Key Technologies:
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Frontend: React 18 + TypeScript + MUI"
                      primaryTypographyProps={{ fontSize: '0.875rem' }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Backend: Node.js + Express + TypeScript"
                      primaryTypographyProps={{ fontSize: '0.875rem' }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Database: SQLite + Sequelize ORM"
                      primaryTypographyProps={{ fontSize: '0.875rem' }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Auth: JWT + Passport.js + Bcrypt"
                      primaryTypographyProps={{ fontSize: '0.875rem' }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="State: Redux Toolkit + React Context"
                      primaryTypographyProps={{ fontSize: '0.875rem' }}
                    />
                  </ListItem>
                </List>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </TabPanel>
    </Box>
  );
};

export default DataModel;
