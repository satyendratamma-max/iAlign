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
  Chip,
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
} from '@mui/material';
import {
  ExpandMore,
  Help,
  Upload,
  Download,
  Description,
  CheckCircle,
  Warning,
} from '@mui/icons-material';

const HelpPage = () => {
  const [expanded, setExpanded] = useState<string | false>('panel1');

  const handleChange = (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const faqs = [
    {
      question: 'How do I import data from external sources?',
      answer: (
        <Box>
          <Typography paragraph>
            iAlign supports importing data via Excel files (.xlsx, .xls, .csv). Each section
            (Resources, Projects, Milestones) has its own import/export functionality:
          </Typography>
          <List>
            <ListItem>
              <ListItemText
                primary="1. Download the template"
                secondary="Click the 'Template' button to download a pre-formatted Excel template"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="2. Fill in your data"
                secondary="Open the template in Excel and fill in your data following the column headers"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="3. Import the file"
                secondary="Click the 'Import' button and select your filled template"
              />
            </ListItem>
          </List>
        </Box>
      ),
    },
    {
      question: 'What data formats are supported?',
      answer: (
        <Typography>
          iAlign supports Excel files (.xlsx, .xls) and CSV files (.csv). The recommended format
          is .xlsx as it preserves formatting and supports multiple sheets.
        </Typography>
      ),
    },
    {
      question: 'How do I export my data?',
      answer: (
        <Typography>
          Navigate to the relevant page (Resources, Projects, Milestones, etc.) and click the
          'Export' button. Your data will be downloaded as an Excel file with all current
          filters applied.
        </Typography>
      ),
    },
    {
      question: 'What happens if my import fails?',
      answer: (
        <Typography>
          If an import fails, you'll see an error message indicating how many rows succeeded
          and how many failed. Common issues include: missing required fields, invalid data
          types, or references to non-existent entities (e.g., a project that doesn't exist).
          Check your data and try again.
        </Typography>
      ),
    },
    {
      question: 'Can I undo an import?',
      answer: (
        <Typography>
          Currently, imports cannot be undone automatically. However, you can manually delete
          the imported records or restore from a previous export. We recommend exporting your
          current data before performing large imports.
        </Typography>
      ),
    },
    {
      question: 'How do I track resource utilization?',
      answer: (
        <Typography>
          Navigate to Resources → Allocation Matrix to see resource utilization across
          projects. The dashboard also shows average utilization, over-allocated resources,
          and available capacity.
        </Typography>
      ),
    },
    {
      question: 'What is the difference between Domain and Portfolio?',
      answer: (
        <Typography>
          Domains represent organizational units (e.g., Engineering, Marketing). Portfolios
          are collections of projects within a domain. A domain can have multiple portfolios,
          and each portfolio contains related projects.
        </Typography>
      ),
    },
    {
      question: 'How do I enable dark mode?',
      answer: (
        <Typography>
          Click the sun/moon icon in the top-right corner of the header to toggle between
          light and dark modes. Your preference will be saved automatically.
        </Typography>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Help & Documentation
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Find answers to common questions and learn how to use iAlign effectively
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Alert severity="info" icon={<Help />}>
            Need additional help? Check the FAQ section below or refer to the detailed data
            import instructions.
          </Alert>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Frequently Asked Questions
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {faqs.map((faq, index) => (
                <Accordion
                  key={index}
                  expanded={expanded === `panel${index + 1}`}
                  onChange={handleChange(`panel${index + 1}`)}
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

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                <Upload sx={{ mr: 1, verticalAlign: 'middle' }} />
                Data Import Instructions
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Typography variant="h6" fontWeight="600" gutterBottom sx={{ mt: 3 }}>
                1. Importing Resources
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                Navigate to: Resources → Resource Overview
              </Alert>
              <Typography paragraph>
                <strong>Required Fields:</strong> Employee ID, First Name, Last Name
              </Typography>
              <Typography paragraph>
                <strong>Optional Fields:</strong> Email, Role, Location, Hourly Rate,
                Utilization Rate, Domain, Portfolio, Domain Team
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Column</strong></TableCell>
                      <TableCell><strong>Format</strong></TableCell>
                      <TableCell><strong>Example</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Employee ID</TableCell>
                      <TableCell>Text</TableCell>
                      <TableCell>EMP001</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>First Name</TableCell>
                      <TableCell>Text</TableCell>
                      <TableCell>John</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Last Name</TableCell>
                      <TableCell>Text</TableCell>
                      <TableCell>Doe</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Email</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>john.doe@example.com</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Hourly Rate</TableCell>
                      <TableCell>Number</TableCell>
                      <TableCell>75</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <Typography variant="h6" fontWeight="600" gutterBottom sx={{ mt: 3 }}>
                2. Importing Projects
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                Navigate to: Portfolio → Projects
              </Alert>
              <Typography paragraph>
                <strong>Required Fields:</strong> Project Name, Status, Priority
              </Typography>
              <Typography paragraph>
                <strong>Optional Fields:</strong> Project Number, Type, Fiscal Year,
                Description, Budget, Start Date, End Date, Current Phase, Health Status
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Column</strong></TableCell>
                      <TableCell><strong>Format</strong></TableCell>
                      <TableCell><strong>Example</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Project Name</TableCell>
                      <TableCell>Text</TableCell>
                      <TableCell>Digital Transformation FY25</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Status</TableCell>
                      <TableCell>Planning, In Progress, Completed, On Hold, Cancelled</TableCell>
                      <TableCell>In Progress</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Priority</TableCell>
                      <TableCell>Low, Medium, High, Critical</TableCell>
                      <TableCell>High</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Budget</TableCell>
                      <TableCell>Number</TableCell>
                      <TableCell>500000</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Start Date</TableCell>
                      <TableCell>YYYY-MM-DD</TableCell>
                      <TableCell>2025-01-15</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <Typography variant="h6" fontWeight="600" gutterBottom sx={{ mt: 3 }}>
                3. Importing Milestones
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                Navigate to: Portfolio → Milestones
              </Alert>
              <Typography paragraph>
                <strong>Required Fields:</strong> Milestone Name, Project Name
              </Typography>
              <Typography paragraph>
                <strong>Optional Fields:</strong> Description, Status, Progress, Due Date,
                Owner, Dependencies
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Column</strong></TableCell>
                      <TableCell><strong>Format</strong></TableCell>
                      <TableCell><strong>Example</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Milestone Name</TableCell>
                      <TableCell>Text</TableCell>
                      <TableCell>Phase 1 Completion</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Project Name</TableCell>
                      <TableCell>Text (must match existing project)</TableCell>
                      <TableCell>Digital Transformation FY25</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Status</TableCell>
                      <TableCell>Not Started, In Progress, Completed, At Risk, Delayed</TableCell>
                      <TableCell>In Progress</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Progress (%)</TableCell>
                      <TableCell>Number (0-100)</TableCell>
                      <TableCell>65</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Due Date</TableCell>
                      <TableCell>YYYY-MM-DD</TableCell>
                      <TableCell>2025-03-31</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <Typography variant="h6" fontWeight="600" gutterBottom sx={{ mt: 4 }}>
                <CheckCircle sx={{ mr: 1, verticalAlign: 'middle', color: 'success.main' }} />
                Best Practices
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Always download the template first"
                    secondary="Templates ensure correct column names and formats"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Export before large imports"
                    secondary="Create a backup of your current data before importing"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Start with small batches"
                    secondary="Test with 5-10 rows first to ensure data format is correct"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Validate dates and numbers"
                    secondary="Use YYYY-MM-DD format for dates and plain numbers (no currency symbols)"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Import in the right order"
                    secondary="Import Domains/Portfolios → Projects → Resources → Allocations → Milestones"
                  />
                </ListItem>
              </List>

              <Alert severity="warning" icon={<Warning />} sx={{ mt: 3 }}>
                <strong>Important:</strong> When referencing other entities (e.g., Project Name
                for milestones), make sure the referenced entity exists in the system. Otherwise,
                the import will fail for those rows.
              </Alert>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                <Download sx={{ mr: 1, verticalAlign: 'middle' }} />
                Data Export
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography paragraph>
                You can export data from any page that has an "Export" button. The exported
                file will include all visible data based on your current filters.
              </Typography>
              <Typography variant="h6" fontWeight="600" gutterBottom>
                Available Exports:
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <Chip
                    icon={<Description />}
                    label="Resources"
                    variant="outlined"
                    sx={{ width: '100%', justifyContent: 'flex-start' }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Chip
                    icon={<Description />}
                    label="Projects"
                    variant="outlined"
                    sx={{ width: '100%', justifyContent: 'flex-start' }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Chip
                    icon={<Description />}
                    label="Milestones"
                    variant="outlined"
                    sx={{ width: '100%', justifyContent: 'flex-start' }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Chip
                    icon={<Description />}
                    label="Resource Allocations"
                    variant="outlined"
                    sx={{ width: '100%', justifyContent: 'flex-start' }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Chip
                    icon={<Description />}
                    label="Domains"
                    variant="outlined"
                    sx={{ width: '100%', justifyContent: 'flex-start' }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Chip
                    icon={<Description />}
                    label="Portfolios"
                    variant="outlined"
                    sx={{ width: '100%', justifyContent: 'flex-start' }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default HelpPage;
