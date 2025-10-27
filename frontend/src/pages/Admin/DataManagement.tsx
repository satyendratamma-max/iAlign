import { useState } from 'react';
import {
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Paper,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Card,
  CardContent,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Upload as UploadIcon,
  CheckCircle,
  Warning,
  RestartAlt,
} from '@mui/icons-material';
import axios from 'axios';
import * as XLSX from 'xlsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

interface ImportStep {
  label: string;
  description: string;
  entity: string;
  templateData: any[];
  templateColumns: { [key: string]: number };
  endpoint: string;
  requiredFields: string[];
  completed: boolean;
  importing: boolean;
  result?: {
    success: number;
    failed: number;
    errors?: string[];
  };
}

const DataManagement = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [reseedDialogOpen, setReseedDialogOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [reseeding, setReseeding] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  const [reseedComplete, setReseedComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [steps, setSteps] = useState<ImportStep[]>([
    {
      label: 'Domains',
      description: 'Import organizational domains (e.g., Engineering, Sales, Finance)',
      entity: 'domains',
      endpoint: '/domains',
      requiredFields: ['Domain Name'],
      templateData: [
        { 'Domain Name': 'Engineering', 'Description': 'Engineering and Technology' },
        { 'Domain Name': 'Sales', 'Description': 'Sales and Business Development' },
      ],
      templateColumns: { 'Domain Name': 20, 'Description': 40 },
      completed: false,
      importing: false,
    },
    {
      label: 'Segment Functions',
      description: 'Import segment functions within domains',
      entity: 'segment-functions',
      endpoint: '/segment-functions',
      requiredFields: ['Segment Function Name', 'Domain Name'],
      templateData: [
        {
          'Segment Function Name': 'Digital Transformation',
          'Domain Name': 'Engineering',
          'Description': 'Digital transformation initiatives',
        },
      ],
      templateColumns: { 'Segment Function Name': 25, 'Domain Name': 20, 'Description': 40 },
      completed: false,
      importing: false,
    },
    {
      label: 'Projects',
      description: 'Import projects with portfolio mapping',
      entity: 'projects',
      endpoint: '/projects',
      requiredFields: ['Project Name', 'Status', 'Priority'],
      templateData: [
        {
          'Project #': 'PRJ-0001',
          'Project Name': 'Customer Portal Redesign',
          'Segment Function Name': 'Digital Transformation',
          'Status': 'In Progress',
          'Priority': 'High',
          'Type': 'Digital',
          'Fiscal Year': 'FY25',
          'Budget': 500000,
          'Start Date': '2025-01-15',
          'End Date': '2025-12-31',
          'Current Phase': 'Development',
          'Health Status': 'Green',
        },
      ],
      templateColumns: {
        'Project #': 12,
        'Project Name': 30,
        'Segment Function Name': 25,
        'Status': 15,
        'Priority': 12,
        'Type': 15,
        'Fiscal Year': 12,
        'Budget': 15,
        'Start Date': 12,
        'End Date': 12,
        'Current Phase': 15,
        'Health Status': 12,
      },
      completed: false,
      importing: false,
    },
    {
      label: 'Resources',
      description: 'Import resource/employee information',
      entity: 'resources',
      endpoint: '/resources',
      requiredFields: ['Employee ID', 'First Name', 'Last Name'],
      templateData: [
        {
          'Employee ID': 'EMP001',
          'First Name': 'John',
          'Last Name': 'Doe',
          'Email': 'john.doe@company.com',
          'Role': 'Senior Developer',
          'Location': 'New York',
          'Domain': 'Engineering',
          'Segment Function': 'Digital Transformation',
          'Hourly Rate': 75,
          'Utilization Rate': 85,
        },
      ],
      templateColumns: {
        'Employee ID': 12,
        'First Name': 15,
        'Last Name': 15,
        'Email': 25,
        'Role': 20,
        'Location': 15,
        'Domain': 20,
        'Segment Function': 25,
        'Hourly Rate': 12,
        'Utilization Rate': 15,
      },
      completed: false,
      importing: false,
    },
    {
      label: 'Milestones',
      description: 'Import project milestones',
      entity: 'milestones',
      endpoint: '/milestones',
      requiredFields: ['Milestone Name', 'Project Name'],
      templateData: [
        {
          'Milestone Name': 'Phase 1 Complete',
          'Project Name': 'Customer Portal Redesign',
          'Description': 'Complete initial development phase',
          'Status': 'In Progress',
          'Progress (%)': 65,
          'Due Date': '2025-03-31',
          'Owner': 'John Doe',
          'Dependencies': '',
        },
      ],
      templateColumns: {
        'Milestone Name': 30,
        'Project Name': 30,
        'Description': 40,
        'Status': 15,
        'Progress (%)': 12,
        'Due Date': 12,
        'Owner': 20,
        'Dependencies': 30,
      },
      completed: false,
      importing: false,
    },
    {
      label: 'Resource Allocations',
      description: 'Import resource-to-project allocations',
      entity: 'allocations',
      endpoint: '/allocations',
      requiredFields: ['Employee ID', 'Project Name', 'Allocation %'],
      templateData: [
        {
          'Employee ID': 'EMP001',
          'Project Name': 'Customer Portal Redesign',
          'Allocation %': 80,
          'Start Date': '2025-01-15',
          'End Date': '2025-12-31',
          'Role': 'Developer',
        },
      ],
      templateColumns: {
        'Employee ID': 12,
        'Project Name': 30,
        'Allocation %': 12,
        'Start Date': 12,
        'End Date': 12,
        'Role': 20,
      },
      completed: false,
      importing: false,
    },
  ]);

  const handleResetDatabase = async () => {
    if (resetting) return; // Prevent multiple submissions

    setResetting(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.post(`${API_URL}/admin/reset-data`, {}, config);

      setResetComplete(true);
      setResetDialogOpen(false);

      // Reset all steps
      setSteps(
        steps.map((step) => ({
          ...step,
          completed: false,
          importing: false,
          result: undefined,
        }))
      );
      setActiveStep(0);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error resetting database');
    } finally {
      setResetting(false);
    }
  };

  const handleResetAndReseed = async () => {
    if (reseeding) return; // Prevent multiple submissions

    setReseeding(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.post(`${API_URL}/admin/reset-and-reseed`, {}, config);

      setReseedComplete(true);
      setReseedDialogOpen(false);

      // Reset all steps
      setSteps(
        steps.map((step) => ({
          ...step,
          completed: false,
          importing: false,
          result: undefined,
        }))
      );
      setActiveStep(0);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error resetting and reseeding database');
    } finally {
      setReseeding(false);
    }
  };

  const generateTemplate = (step: ImportStep) => {
    const ws = XLSX.utils.json_to_sheet(step.templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, step.entity);

    // Set column widths
    ws['!cols'] = Object.values(step.templateColumns).map((wch) => ({ wch }));

    XLSX.writeFile(wb, `${step.entity}_template.xlsx`);
  };

  const handleImport = async (stepIndex: number, file: File) => {
    const step = steps[stepIndex];
    if (step.importing) return; // Prevent multiple imports

    setError(null);

    // Update importing state
    const updatedSteps = [...steps];
    updatedSteps[stepIndex].importing = true;
    setSteps(updatedSteps);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        throw new Error('The file is empty or has no data');
      }

      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      // Import each row
      for (let i = 0; i < jsonData.length; i++) {
        const row: any = jsonData[i];
        try {
          const payload = await mapRowToPayload(step.entity, row);
          await axios.post(`${API_URL}${step.endpoint}`, payload, config);
          successCount++;
        } catch (error: any) {
          errorCount++;
          errors.push(
            `Row ${i + 2}: ${error.response?.data?.message || error.message}`
          );
        }
      }

      // Update step with results
      updatedSteps[stepIndex].completed = successCount > 0;
      updatedSteps[stepIndex].importing = false;
      updatedSteps[stepIndex].result = {
        success: successCount,
        failed: errorCount,
        errors: errors.slice(0, 5), // Show first 5 errors
      };
      setSteps(updatedSteps);

      if (successCount > 0 && errorCount === 0) {
        // Auto advance to next step if all succeeded
        if (stepIndex < steps.length - 1) {
          setActiveStep(stepIndex + 1);
        }
      }
    } catch (error: any) {
      updatedSteps[stepIndex].importing = false;
      setSteps(updatedSteps);
      setError(error.message || 'Error importing file');
    }
  };

  const mapRowToPayload = async (entity: string, row: any): Promise<any> => {
    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    switch (entity) {
      case 'domains':
        return {
          name: row['Domain Name'],
          description: row['Description'],
        };

      case 'segment-functions': {
        const domainResponse = await axios.get(
          `${API_URL}/domains?name=${encodeURIComponent(row['Domain Name'])}`,
          config
        );
        const domain = domainResponse.data.data.find(
          (d: any) => d.name === row['Domain Name']
        );
        return {
          name: row['Segment Function Name'],
          domainId: domain?.id,
          description: row['Description'],
        };
      }

      case 'projects': {
        let segmentFunctionId, domainId;
        if (row['Segment Function Name']) {
          const segmentFunctionResponse = await axios.get(`${API_URL}/segment-functions`, config);
          const segmentFunction = segmentFunctionResponse.data.data.find(
            (p: any) => p.name === row['Segment Function Name']
          );
          segmentFunctionId = segmentFunction?.id;
          domainId = segmentFunction?.domainId;
        }

        return {
          projectNumber: row['Project #'],
          name: row['Project Name'],
          segmentFunctionId,
          domainId,
          status: row['Status'],
          priority: row['Priority'],
          type: row['Type'],
          fiscalYear: row['Fiscal Year'],
          budget: row['Budget'],
          startDate: row['Start Date'],
          endDate: row['End Date'],
          currentPhase: row['Current Phase'],
          healthStatus: row['Health Status'],
        };
      }

      case 'resources': {
        const [domainResponse, segmentFunctionResponse] = await Promise.all([
          axios.get(`${API_URL}/domains`, config),
          axios.get(`${API_URL}/segment-functions`, config),
        ]);

        const domain = domainResponse.data.data.find((d: any) => d.name === row['Domain']);
        const segmentFunction = segmentFunctionResponse.data.data.find(
          (p: any) => p.name === row['Segment Function']
        );

        return {
          employeeId: row['Employee ID'],
          firstName: row['First Name'],
          lastName: row['Last Name'],
          email: row['Email'],
          role: row['Role'],
          location: row['Location'],
          domainId: domain?.id,
          segmentFunctionId: segmentFunction?.id,
          hourlyRate: row['Hourly Rate'],
          utilizationRate: row['Utilization Rate'],
        };
      }

      case 'milestones': {
        const projectResponse = await axios.get(`${API_URL}/projects`, config);
        const project = projectResponse.data.data.find(
          (p: any) => p.name === row['Project Name']
        );

        return {
          projectId: project?.id,
          name: row['Milestone Name'],
          description: row['Description'],
          status: row['Status'],
          progress: row['Progress (%)'],
          dueDate: row['Due Date'],
          owner: row['Owner'],
          dependencies: row['Dependencies'],
        };
      }

      case 'allocations': {
        const [resourceResponse, projectResponse] = await Promise.all([
          axios.get(`${API_URL}/resources`, config),
          axios.get(`${API_URL}/projects`, config),
        ]);

        const resource = resourceResponse.data.data.find(
          (r: any) => r.employeeId === row['Employee ID']
        );
        const project = projectResponse.data.data.find(
          (p: any) => p.name === row['Project Name']
        );

        return {
          resourceId: resource?.id,
          projectId: project?.id,
          allocationPercentage: row['Allocation %'],
          startDate: row['Start Date'],
          endDate: row['End Date'],
          role: row['Role'],
        };
      }

      default:
        return row;
    }
  };

  return (
    <Box>
      <Box
        display="flex"
        flexDirection={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        mb={{ xs: 2, sm: 3 }}
        gap={{ xs: 2, sm: 0 }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              fontSize: { xs: '1.75rem', sm: '2rem', md: '2.125rem' },
            }}
            gutterBottom
          >
            Data Management
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
          >
            Reset and reload system data from external sources
          </Typography>
        </Box>
        <Box display="flex" gap={2} sx={{ alignSelf: { xs: 'stretch', sm: 'auto' } }}>
          <Button
            variant="outlined"
            color="warning"
            startIcon={<RestartAlt />}
            onClick={() => setReseedDialogOpen(true)}
          >
            Reset & Reseed
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<RestartAlt />}
            onClick={() => setResetDialogOpen(true)}
          >
            Reset All Data
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {resetComplete && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setResetComplete(false)}>
          Database has been reset successfully. You can now import your data using the steps below.
        </Alert>
      )}

      {reseedComplete && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setReseedComplete(false)}>
          Database has been reset and reseeded with sample data successfully. The application now has demonstration data.
        </Alert>
      )}

      {/* Import Instructions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            📋 Import Instructions
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon>
                <Typography color="primary" fontWeight="bold">
                  1.
                </Typography>
              </ListItemIcon>
              <ListItemText primary="Download the template for each step" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Typography color="primary" fontWeight="bold">
                  2.
                </Typography>
              </ListItemIcon>
              <ListItemText primary="Fill in your data in Excel or CSV format" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Typography color="primary" fontWeight="bold">
                  3.
                </Typography>
              </ListItemIcon>
              <ListItemText primary="Upload the file to import the data" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Typography color="primary" fontWeight="bold">
                  4.
                </Typography>
              </ListItemIcon>
              <ListItemText primary="Follow the steps in order - each step builds on the previous one" />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Stepper */}
      <Stepper activeStep={activeStep} orientation="vertical">
        {steps.map((step, index) => (
          <Step key={step.label} expanded>
            <StepLabel
              optional={
                step.completed ? (
                  <Chip
                    label="Completed"
                    size="small"
                    color="success"
                    icon={<CheckCircle />}
                  />
                ) : null
              }
            >
              <Typography fontWeight={600}>{step.label}</Typography>
            </StepLabel>
            <StepContent>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                {step.description}
              </Typography>

              <Box display="flex" gap={2} mb={2} flexWrap="wrap">
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => generateTemplate(step)}
                  size="small"
                >
                  Download Template
                </Button>
                <Button
                  variant="contained"
                  component="label"
                  startIcon={step.importing ? <CircularProgress size={20} /> : <UploadIcon />}
                  disabled={step.importing}
                  size="small"
                >
                  {step.importing ? 'Importing...' : 'Upload & Import'}
                  <input
                    type="file"
                    hidden
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleImport(index, file);
                      }
                      e.target.value = '';
                    }}
                  />
                </Button>
              </Box>

              {step.importing && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Importing data...
                  </Typography>
                  <LinearProgress />
                </Box>
              )}

              {step.result && (
                <Alert
                  severity={step.result.failed === 0 ? 'success' : 'warning'}
                  sx={{ mb: 2 }}
                >
                  <Typography variant="body2" fontWeight="bold">
                    Import Results:
                  </Typography>
                  <Typography variant="body2">
                    ✓ Successfully imported: {step.result.success} rows
                  </Typography>
                  {step.result.failed > 0 && (
                    <>
                      <Typography variant="body2">
                        ✗ Failed: {step.result.failed} rows
                      </Typography>
                      {step.result.errors && step.result.errors.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" fontWeight="bold">
                            First few errors:
                          </Typography>
                          {step.result.errors.map((err, idx) => (
                            <Typography key={idx} variant="caption" display="block">
                              {err}
                            </Typography>
                          ))}
                        </Box>
                      )}
                    </>
                  )}
                </Alert>
              )}

              <Box sx={{ mb: 2 }}>
                <Button
                  variant="text"
                  onClick={() => setActiveStep(index + 1)}
                  disabled={index === steps.length - 1}
                  sx={{ mr: 1 }}
                >
                  Skip
                </Button>
                <Button
                  variant="text"
                  disabled={index === 0}
                  onClick={() => setActiveStep(index - 1)}
                >
                  Back
                </Button>
              </Box>
            </StepContent>
          </Step>
        ))}
      </Stepper>

      {activeStep === steps.length && (
        <Paper square elevation={0} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            All steps completed!
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Your data has been imported successfully. You can now use the application with your data.
          </Typography>
          <Button onClick={() => setActiveStep(0)} sx={{ mt: 1, mr: 1 }}>
            Reset Steps
          </Button>
        </Paper>
      )}

      {/* Reset Confirmation Dialog */}
      <Dialog
        open={resetDialogOpen}
        onClose={resetting ? undefined : () => setResetDialogOpen(false)}
        disableEscapeKeyDown={resetting}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Warning color="error" />
            Reset All Data
          </Box>
        </DialogTitle>
        <DialogContent>
          {resetting && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="primary" gutterBottom>
                Resetting database...
              </Typography>
              <LinearProgress />
            </Box>
          )}
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="bold" gutterBottom>
              This action will permanently delete ALL data except the admin user:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="• All domains and segment functions" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• All projects and milestones" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• All resources and allocations" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• All apps, technologies, and roles" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• All pipelines and capacity data" />
              </ListItem>
            </List>
          </Alert>
          <Typography variant="body2">
            This action cannot be undone. Make sure you have exported any data you want to keep.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialogOpen(false)} disabled={resetting}>
            Cancel
          </Button>
          <Button
            onClick={handleResetDatabase}
            variant="contained"
            color="error"
            disabled={resetting}
            startIcon={resetting ? <CircularProgress size={20} /> : undefined}
          >
            {resetting ? 'Resetting...' : 'Yes, Reset All Data'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset and Reseed Confirmation Dialog */}
      <Dialog
        open={reseedDialogOpen}
        onClose={reseeding ? undefined : () => setReseedDialogOpen(false)}
        disableEscapeKeyDown={reseeding}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Warning color="warning" />
            Reset & Reseed with Sample Data
          </Box>
        </DialogTitle>
        <DialogContent>
          {reseeding && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="primary" gutterBottom>
                Resetting and reseeding database... This may take a few moments.
              </Typography>
              <LinearProgress />
            </Box>
          )}
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="bold" gutterBottom>
              This action will:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="✓ Delete ALL existing data" />
              </ListItem>
              <ListItem>
                <ListItemText primary="✓ Recreate sample users, domains, segment functions, projects, resources, and allocations" />
              </ListItem>
              <ListItem>
                <ListItemText primary="✓ Reset admin password to Admin@123" />
              </ListItem>
              <ListItem>
                <ListItemText primary="✓ Create ~100+ sample records for testing" />
              </ListItem>
            </List>
          </Alert>
          <Typography variant="body2" gutterBottom>
            This is useful for:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText primary="• Testing the application with realistic data" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Demonstrating features to stakeholders" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Resetting to a clean state for development" />
            </ListItem>
          </List>
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            Warning: All current data will be permanently deleted!
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReseedDialogOpen(false)} disabled={reseeding}>
            Cancel
          </Button>
          <Button
            onClick={handleResetAndReseed}
            variant="contained"
            color="warning"
            disabled={reseeding}
            startIcon={reseeding ? <CircularProgress size={20} /> : undefined}
          >
            {reseeding ? 'Resetting & Reseeding...' : 'Yes, Reset & Reseed'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DataManagement;
