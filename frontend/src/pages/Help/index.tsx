import { useState } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import {
  ExpandMore,
  Help,
  TrendingUp,
  Assessment,
  Speed,
  Groups,
  AccountTree,
  Info,
} from '@mui/icons-material';

const HelpPage = () => {
  const [expanded, setExpanded] = useState<string | false>('panel1');

  const handleChange = (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const kpiFaqs = [
    {
      category: 'Resource Management KPIs',
      icon: <Groups />,
      questions: [
        {
          question: 'How is Resource Utilization calculated?',
          answer: (
            <Box>
              <Typography paragraph>
                <strong>Formula:</strong> (Total Allocated Hours / Total Capacity Hours) × 100
              </Typography>
              <Typography paragraph>
                Resource utilization measures how much of a resource's available capacity is being used across projects.
              </Typography>
              <Typography paragraph>
                <strong>Interpretation:</strong>
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="≥85% - High Utilization (Green)"
                    secondary="Resource is efficiently allocated"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="70-84% - Medium Utilization (Blue)"
                    secondary="Balanced allocation with some capacity available"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="<70% - Low Utilization (Orange)"
                    secondary="Resource may be underutilized or has available capacity"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary=">100% - Over-allocated (Red)"
                    secondary="Resource is over-committed and may need rebalancing"
                  />
                </ListItem>
              </List>
            </Box>
          ),
        },
        {
          question: 'What is Match Score and how is it calculated?',
          answer: (
            <Box>
              <Typography paragraph>
                Match Score measures how well a resource's capabilities align with project requirements on a scale of 0-100.
              </Typography>
              <Typography paragraph>
                <strong>Score Components:</strong>
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Component</strong></TableCell>
                      <TableCell><strong>Weight</strong></TableCell>
                      <TableCell><strong>Criteria</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Exact Match</TableCell>
                      <TableCell>40 points</TableCell>
                      <TableCell>App + Technology + Role all match</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Proficiency Level</TableCell>
                      <TableCell>30 points</TableCell>
                      <TableCell>Resource proficiency meets or exceeds requirement</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Experience</TableCell>
                      <TableCell>20 points</TableCell>
                      <TableCell>Years of experience meets minimum requirement</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Primary Skill</TableCell>
                      <TableCell>10 points</TableCell>
                      <TableCell>Capability is resource's primary skill</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
              <Typography paragraph>
                <strong>Recommended Actions:</strong>
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="90-100 - Excellent Match"
                    secondary="Proceed with allocation"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="75-89 - Good Match"
                    secondary="Consider for allocation with minor training"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="60-74 - Fair Match"
                    secondary="Review alternatives or plan for skill gap training"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="<60 - Poor Match"
                    secondary="Find alternative resources or invest in significant training"
                  />
                </ListItem>
              </List>
            </Box>
          ),
        },
        {
          question: 'What are Resource Capabilities and Project Requirements?',
          answer: (
            <Box>
              <Typography paragraph>
                <strong>Resource Capabilities</strong> define what a resource can do:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="App → Technology → Role"
                    secondary="E.g., SAP → S/4HANA → Developer"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Proficiency Level"
                    secondary="Beginner, Intermediate, Advanced, or Expert"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Years of Experience"
                    secondary="Actual experience with this technology"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Primary Skill"
                    secondary="Whether this is the resource's main expertise"
                  />
                </ListItem>
              </List>
              <Typography paragraph sx={{ mt: 2 }}>
                <strong>Project Requirements</strong> define what a project needs:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Required Skill Set"
                    secondary="App + Technology + Role combination needed"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Minimum Proficiency"
                    secondary="Minimum skill level required"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Minimum Experience"
                    secondary="Minimum years of experience needed"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Required Count"
                    secondary="Number of resources needed with this skill"
                  />
                </ListItem>
              </List>
            </Box>
          ),
        },
      ],
    },
    {
      category: 'Project & Portfolio KPIs',
      icon: <AccountTree />,
      questions: [
        {
          question: 'How is Project Health Status determined?',
          answer: (
            <Box>
              <Typography paragraph>
                Project Health Status is a visual indicator of overall project condition based on multiple factors:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="🟢 Green - On Track"
                    secondary="Within budget, on schedule, no major risks"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="🟡 Yellow - At Risk"
                    secondary="Minor delays, budget concerns, or manageable risks"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="🔴 Red - Critical"
                    secondary="Significant delays, over budget, or high-impact risks"
                  />
                </ListItem>
              </List>
              <Typography paragraph sx={{ mt: 2 }}>
                <strong>Health Status Factors:</strong>
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="Schedule variance (planned vs. actual dates)" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Budget variance (planned vs. actual cost)" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Resource availability and allocation" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Milestone completion rate" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Risk severity and mitigation status" />
                </ListItem>
              </List>
            </Box>
          ),
        },
        {
          question: 'What is ROI Index and how is it used?',
          answer: (
            <Box>
              <Typography paragraph>
                <strong>ROI (Return on Investment) Index</strong> is a percentage indicating the expected return from a segment function or project.
              </Typography>
              <Typography paragraph>
                <strong>Formula:</strong> ((Expected Benefits - Total Investment) / Total Investment) × 100
              </Typography>
              <Typography paragraph>
                <strong>Interpretation:</strong>
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary=">30% - High ROI"
                    secondary="Strong investment, high priority for funding"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="15-30% - Medium ROI"
                    secondary="Acceptable return, evaluate against alternatives"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="<15% - Low ROI"
                    secondary="Consider if strategic value justifies the investment"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Negative - Loss"
                    secondary="Re-evaluate project viability or strategic importance"
                  />
                </ListItem>
              </List>
              <Typography paragraph sx={{ mt: 2 }}>
                <strong>Use Cases:</strong> Portfolio prioritization, budget allocation decisions, strategic planning
              </Typography>
            </Box>
          ),
        },
        {
          question: 'What is Risk Score and how should it be interpreted?',
          answer: (
            <Box>
              <Typography paragraph>
                Risk Score measures the overall risk level of a segment function or project on a scale of 0-100.
              </Typography>
              <Typography paragraph>
                <strong>Risk Factors Considered:</strong>
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="Technical complexity and innovation level" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Resource availability and skill gaps" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Dependencies on other projects or systems" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Regulatory or compliance requirements" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Organizational change impact" />
                </ListItem>
              </List>
              <Typography paragraph sx={{ mt: 2 }}>
                <strong>Risk Categories:</strong>
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="20-40 - Low Risk"
                    secondary="Standard projects with proven approaches"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="41-60 - Medium Risk"
                    secondary="Some complexity, requires active monitoring"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="61-80 - High Risk"
                    secondary="Significant challenges, dedicated risk management needed"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary=">80 - Critical Risk"
                    secondary="Extensive mitigation planning and executive oversight required"
                  />
                </ListItem>
              </List>
            </Box>
          ),
        },
        {
          question: 'What is the difference between Budget, Actual Cost, and Forecasted Cost?',
          answer: (
            <Box>
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Metric</strong></TableCell>
                      <TableCell><strong>Definition</strong></TableCell>
                      <TableCell><strong>When Used</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Budget</TableCell>
                      <TableCell>Total approved funding for the project</TableCell>
                      <TableCell>Project planning and approval</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Actual Cost</TableCell>
                      <TableCell>Total expenses incurred to date</TableCell>
                      <TableCell>Current financial status tracking</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Forecasted Cost</TableCell>
                      <TableCell>Projected total cost at completion</TableCell>
                      <TableCell>Early warning of budget overruns</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
              <Typography paragraph>
                <strong>Budget Variance Analysis:</strong>
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Under Budget (Actual/Forecast < Budget)"
                    secondary="Project is performing well financially or may be behind schedule"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="On Budget (Actual/Forecast ≈ Budget)"
                    secondary="Project is on track financially"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Over Budget (Actual/Forecast > Budget)"
                    secondary="Requires immediate attention and corrective action"
                  />
                </ListItem>
              </List>
            </Box>
          ),
        },
      ],
    },
    {
      category: 'Capacity Planning KPIs',
      icon: <Speed />,
      questions: [
        {
          question: 'How is Capacity Utilization calculated?',
          answer: (
            <Box>
              <Typography paragraph>
                <strong>Formula:</strong> (Total Demand Hours / Total Supply Hours) × 100
              </Typography>
              <Typography paragraph>
                Capacity utilization measures how much of your available resource capacity is being consumed by project demands.
              </Typography>
              <Typography paragraph>
                <strong>Components:</strong>
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Total Supply Hours"
                    secondary="Available capacity from all resources with specific skills"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Total Demand Hours"
                    secondary="Required hours from all project requirements"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Over-Allocation Hours"
                    secondary="Demand exceeding supply (when utilization > 100%)"
                  />
                </ListItem>
              </List>
              <Typography paragraph sx={{ mt: 2 }}>
                <strong>Capacity Planning Actions:</strong>
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="<70% - Excess Capacity"
                    secondary="Consider taking on new projects or reducing resources"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="70-95% - Optimal Range"
                    secondary="Balanced capacity utilization"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary=">95% - Near Capacity"
                    secondary="Limited flexibility, plan for contingencies"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary=">100% - Over-Capacity"
                    secondary="Hire additional resources, defer projects, or adjust scope"
                  />
                </ListItem>
              </List>
            </Box>
          ),
        },
        {
          question: 'What are Capacity Scenarios and Models?',
          answer: (
            <Box>
              <Typography paragraph>
                <strong>Capacity Models</strong> represent different planning assumptions for resource capacity:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Baseline Model"
                    secondary="Current state with existing resources and commitments"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Optimistic Model"
                    secondary="Best-case scenario with planned hiring and low attrition"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Pessimistic Model"
                    secondary="Worst-case scenario with higher attrition and hiring delays"
                  />
                </ListItem>
              </List>
              <Typography paragraph sx={{ mt: 2 }}>
                <strong>Capacity Scenarios</strong> analyze capacity for specific:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="Domain (e.g., Engineering, Finance)" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Application (e.g., SAP, Salesforce)" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Technology (e.g., S/4HANA, React)" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Role (e.g., Developer, Architect)" />
                </ListItem>
              </List>
              <Typography paragraph sx={{ mt: 2 }}>
                Use scenarios to identify skill gaps and plan hiring or training initiatives.
              </Typography>
            </Box>
          ),
        },
      ],
    },
    {
      category: 'System Features',
      icon: <Assessment />,
      questions: [
        {
          question: 'How does the Resource Allocation Matrix work?',
          answer: (
            <Box>
              <Typography paragraph>
                The Resource Allocation Matrix provides a comprehensive view of how resources are allocated across projects with AI-powered matching capabilities.
              </Typography>
              <Typography paragraph>
                <strong>Key Features:</strong>
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Smart Matching"
                    secondary="Automatically calculates match scores based on resource capabilities and project requirements"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Allocation Management"
                    secondary="Create, edit, and delete resource allocations with allocation percentages, dates, and roles"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Capability Selection"
                    secondary="Choose specific resource capabilities to match against project requirements"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Match Score Display"
                    secondary="Visual indicators show how well each allocation matches project needs"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Allocation Types"
                    secondary="Dedicated (100%), Shared (multiple projects), or On-Demand (as-needed basis)"
                  />
                </ListItem>
              </List>
              <Typography paragraph sx={{ mt: 2 }}>
                <strong>Best Practice:</strong> Review match scores regularly and reallocate resources with low scores (&lt;75) to more suitable projects.
              </Typography>
            </Box>
          ),
        },
        {
          question: 'What is the hierarchy: Apps → Technologies → Roles?',
          answer: (
            <Box>
              <Typography paragraph>
                iAlign uses a three-tier capability hierarchy to precisely define skills and requirements:
              </Typography>
              <Typography paragraph sx={{ mt: 2 }}>
                <strong>Level 1: Apps</strong> (Application Systems)
              </Typography>
              <Typography variant="body2" paragraph>
                Top-level categorization of enterprise applications
              </Typography>
              <Typography variant="body2" paragraph>
                Examples: SAP, Salesforce, Oracle, Custom Applications
              </Typography>
              <Typography paragraph sx={{ mt: 2 }}>
                <strong>Level 2: Technologies</strong>
              </Typography>
              <Typography variant="body2" paragraph>
                Specific technologies or platforms within each app
              </Typography>
              <Typography variant="body2" paragraph>
                Examples: SAP → S/4HANA, Salesforce → Sales Cloud, Custom → React
              </Typography>
              <Typography paragraph sx={{ mt: 2 }}>
                <strong>Level 3: Roles</strong>
              </Typography>
              <Typography variant="body2" paragraph>
                Specific job functions or positions for each technology
              </Typography>
              <Typography variant="body2" paragraph>
                Examples: S/4HANA → Developer, Sales Cloud → Administrator, React → Full Stack Developer
              </Typography>
              <Alert severity="info" sx={{ mt: 2 }}>
                This hierarchy ensures precise skill matching and helps identify specific skill gaps in your organization.
              </Alert>
            </Box>
          ),
        },
        {
          question: 'How do I use the Data Management page?',
          answer: (
            <Box>
              <Typography paragraph>
                The Data Management page (Admin Tools → Data Management) provides comprehensive data control:
              </Typography>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                1. Reset All Data
              </Typography>
              <Typography paragraph>
                Deletes all projects, resources, allocations, and related data while preserving the admin user.
              </Typography>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <strong>Warning:</strong> This action cannot be undone. Use with caution!
              </Alert>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                2. Reset and Reseed with Sample Data
              </Typography>
              <Typography paragraph>
                Resets the database and populates it with comprehensive sample data including:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="48 Users (Admins, Domain Managers, Project Managers, Team Leads)" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="4 Apps, 20 Technologies, 16 Roles" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="12 Domains and 15 Segment Functions" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="~200 Resources with capabilities and domain/segment function assignments" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="~35 Projects with requirements, owners, and deadlines" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="~245 Milestones with owners and due dates" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="~213 Resource Allocations with match scores" />
                </ListItem>
              </List>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                3. Manual Data Import
              </Typography>
              <Typography paragraph>
                Import data from Excel/CSV files in the correct order:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="1. Apps → 2. Technologies → 3. Roles" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="4. Domains → 5. Segment Functions" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="6. Resources → 7. Resource Capabilities" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="8. Projects → 9. Project Requirements" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="10. Resource Allocations → 11. Milestones" />
                </ListItem>
              </List>
            </Box>
          ),
        },
        {
          question: 'What data is displayed on each page?',
          answer: (
            <Box>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Page</strong></TableCell>
                      <TableCell><strong>Key Information</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Dashboard</TableCell>
                      <TableCell>Overall metrics, active projects, resource utilization, budget tracking</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Domains</TableCell>
                      <TableCell>Organizational units, managers, locations, segment functions</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Segment Function Overview</TableCell>
                      <TableCell>Portfolios, domain, ROI index, risk score, total value, projects</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Projects</TableCell>
                      <TableCell>Project #, name, domain, segment function, owner, deadline, budget, status, health</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Milestones</TableCell>
                      <TableCell>Phase, project, owner, due date, status, progress, deliverables</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Resource Overview</TableCell>
                      <TableCell>Employee ID, name, domain, segment function, capabilities, utilization</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Allocation Matrix</TableCell>
                      <TableCell>Resource, project, capability, requirement, match score, allocation %, dates</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Pipeline Overview</TableCell>
                      <TableCell>Applications/systems, vendor, platform, environment, project dependencies</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Capacity Dashboard</TableCell>
                      <TableCell>Total resources, utilization, monthly cost, capacity breakdown, scenarios</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ),
        },
      ],
    },
  ];

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Help & Documentation
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Comprehensive guide to iAlign features, KPIs, and business logic
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Alert severity="info" icon={<Info />}>
            <strong>Quick Start:</strong> Use the Admin Tools → Data Management page to reset and reseed
            the database with sample data to explore all features. Password for all users: Admin@123
          </Alert>
        </Grid>

        {kpiFaqs.map((section, sectionIndex) => (
          <Grid item xs={12} key={sectionIndex}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  {section.icon}
                  <Typography variant="h5" fontWeight="bold" ml={1}>
                    {section.category}
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                {section.questions.map((faq, index) => (
                  <Accordion
                    key={`section${sectionIndex}-panel${index}`}
                    expanded={expanded === `section${sectionIndex}-panel${index}`}
                    onChange={handleChange(`section${sectionIndex}-panel${index}`)}
                    sx={{ mb: 1 }}
                  >
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography fontWeight="500">{faq.question}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box sx={{ color: 'text.secondary' }}>{faq.answer}</Box>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </CardContent>
            </Card>
          </Grid>
        ))}

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <TrendingUp />
                <Typography variant="h5" fontWeight="bold" ml={1}>
                  Key Performance Indicators (KPIs) Summary
                </Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Resource KPIs
                  </Typography>
                  <List dense>
                    <ListItem>
                      <Chip label="Utilization Rate" size="small" color="primary" sx={{ mr: 1 }} />
                      <Typography variant="body2">70-100% optimal range</Typography>
                    </ListItem>
                    <ListItem>
                      <Chip label="Match Score" size="small" color="secondary" sx={{ mr: 1 }} />
                      <Typography variant="body2">≥90 excellent, 75-89 good, 60-74 fair</Typography>
                    </ListItem>
                    <ListItem>
                      <Chip label="Allocation %" size="small" color="info" sx={{ mr: 1 }} />
                      <Typography variant="body2">Resource time commitment per project</Typography>
                    </ListItem>
                  </List>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Project KPIs
                  </Typography>
                  <List dense>
                    <ListItem>
                      <Chip label="Health Status" size="small" color="success" sx={{ mr: 1 }} />
                      <Typography variant="body2">Green/Yellow/Red indicator</Typography>
                    </ListItem>
                    <ListItem>
                      <Chip label="ROI Index" size="small" color="warning" sx={{ mr: 1 }} />
                      <Typography variant="body2">&gt;30% high, 15-30% medium, &lt;15% low</Typography>
                    </ListItem>
                    <ListItem>
                      <Chip label="Risk Score" size="small" color="error" sx={{ mr: 1 }} />
                      <Typography variant="body2">20-40 low, 41-60 medium, &gt;60 high</Typography>
                    </ListItem>
                  </List>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Alert severity="success">
            <Typography variant="body2">
              <strong>Need More Help?</strong> Contact your system administrator or refer to the Data Management
              page for sample data and import templates.
            </Typography>
          </Alert>
        </Grid>
      </Grid>
    </Box>
  );
};

export default HelpPage;
