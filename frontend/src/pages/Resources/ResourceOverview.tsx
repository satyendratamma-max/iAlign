import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  MenuItem,
  Divider,
  Autocomplete,
  Slider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Description as TemplateIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { exportToExcel, importFromExcel, generateResourceTemplate } from '../../utils/excelUtils';
import PageHeader from '../../components/common/PageHeader';
import ActionBar from '../../components/common/ActionBar';
import CompactFilterBar from '../../components/common/CompactFilterBar';
import FilterPresets from '../../components/common/FilterPresets';
import Pagination from '../../components/common/Pagination';
import { useAppSelector } from '../../hooks/redux';
import { useScenario } from '../../contexts/ScenarioContext';
import { useDebounce } from '../../hooks/useDebounce';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import NavigationPrompt from '../../components/common/NavigationPrompt';
import { People as PeopleIcon } from '@mui/icons-material';
import TableSkeleton from '../../components/common/TableSkeleton';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

interface Capability {
  id: number;
  appId: number;
  technologyId: number;
  roleId: number;
  proficiencyLevel: string;
  yearsOfExperience?: number;
  isPrimary: boolean;
  app: {
    id: number;
    name: string;
    code: string;
  };
  technology: {
    id: number;
    name: string;
    code: string;
  };
  role: {
    id: number;
    name: string;
    code: string;
    level: string;
  };
}

interface Resource {
  id: number;
  domainId?: number;
  segmentFunctionId?: number;
  employeeId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  primarySkill?: string;
  secondarySkills?: string;
  role?: string;
  location?: string;
  timezone?: string;
  hourlyRate?: number;
  monthlyCost?: number;
  totalCapacityHours?: number;
  utilizationRate?: number;
  homeLocation?: string;
  isRemote?: boolean;
  joiningDate?: string;
  endOfServiceDate?: string;
  isActive: boolean;
  domain?: {
    id: number;
    name: string;
  };
  segmentFunction?: {
    id: number;
    name: string;
  };
  capabilities?: Capability[];
}

interface Domain {
  id: number;
  name: string;
}

interface SegmentFunction {
  id: number;
  name: string;
}

interface App {
  id: number;
  name: string;
  code: string;
}

interface Technology {
  id: number;
  name: string;
  code: string;
}

interface RoleItem {
  id: number;
  name: string;
  code: string;
  level: string;
}

interface NewCapability {
  tempId: string;
  appId: number;
  technologyId: number;
  roleId: number;
  proficiencyLevel: string;
  yearsOfExperience: number;
  isPrimary: boolean;
}

interface Project {
  id: number;
  name: string;
  businessDecision?: string;
  fiscalYear?: string;
  startDate?: string;
  endDate?: string;
  domain?: {
    id: number;
    name: string;
  };
  requirements?: any[];
}

interface ProjectWithScore extends Project {
  matchScore: number;
  bestRequirement?: any;
  bestCapability?: Capability;
}

interface Allocation {
  id: number;
  resourceId: number;
  projectId: number;
  resourceCapabilityId?: number;
  projectRequirementId?: number;
  allocationPercentage: number;
  allocationType: string;
  startDate?: string;
  endDate?: string;
  matchScore?: number;
  project?: Project;
  resourceCapability?: Capability;
  projectRequirement?: {
    id: number;
    appId: number;
    technologyId: number;
    roleId: number;
    proficiencyLevel: string;
    app: { id: number; name: string; code: string };
    technology: { id: number; name: string; code: string };
    role: { id: number; name: string; code: string };
  };
}

const ResourceOverview = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectedDomainIds } = useAppSelector((state) => state.filters);
  const { activeScenario } = useScenario();
  const [resources, setResources] = useState<Resource[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [segmentFunctions, setSegmentFunctions] = useState<SegmentFunction[]>([]);
  const [apps, setApps] = useState<App[]>([]);
  const [technologies, setTechnologies] = useState<Technology[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentResource, setCurrentResource] = useState<Partial<Resource>>({});
  const [currentCapabilities, setCurrentCapabilities] = useState<Capability[]>([]);
  const [newCapabilities, setNewCapabilities] = useState<NewCapability[]>([]);
  const [capabilitiesToDelete, setCapabilitiesToDelete] = useState<number[]>([]);
  const [openAllocationsDialog, setOpenAllocationsDialog] = useState(false);
  const [selectedResourceForAllocations, setSelectedResourceForAllocations] = useState<Resource | null>(null);
  const [resourceAllocations, setResourceAllocations] = useState<Allocation[]>([]);
  const [openAllocationEditDialog, setOpenAllocationEditDialog] = useState(false);
  const [currentAllocation, setCurrentAllocation] = useState<Partial<Allocation>>({});
  const [allocationEditMode, setAllocationEditMode] = useState(false);
  const [projectRequirements, setProjectRequirements] = useState<any[]>([]);
  const [availableProjects, setAvailableProjects] = useState<ProjectWithScore[]>([]);
  const [minMatchScore, setMinMatchScore] = useState<number>(0);
  const [filters, setFilters] = useState({
    employeeId: '',
    name: '',
    role: '',
    location: '',
    segmentFunction: '',
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Navigation blocking hook
  const { showPrompt, confirmNavigation, cancelNavigation, message: navigationMessage } = useUnsavedChanges(
    openDialog && hasUnsavedChanges,
    'You have unsaved changes in the resource form. Are you sure you want to leave this page?'
  );

  // Server-side pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchResources = async () => {
    if (!activeScenario) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Build query params for server-side filtering and pagination
      const params: any = {
        page: currentPage,
        limit: pageSize,
      };

      // Add filters to params (only non-empty values)
      if (debouncedFilters.employeeId) params.employeeId = debouncedFilters.employeeId;
      if (debouncedFilters.name) params.name = debouncedFilters.name;
      if (debouncedFilters.location) params.location = debouncedFilters.location;
      if (selectedDomainIds.length > 0) params.domainId = selectedDomainIds[0]; // Backend supports single domain for now
      if (debouncedFilters.segmentFunction) {
        // Find segment function ID by name
        const sf = segmentFunctions.find(s => s.name === debouncedFilters.segmentFunction);
        if (sf) params.segmentFunctionId = sf.id;
      }

      // SERVER-SIDE PAGINATION: Fetch only the current page
      const [resourcesRes, domainsRes, segmentFunctionsRes, appsRes, techsRes, rolesRes, projectsRes] = await Promise.all([
        axios.get(`${API_URL}/resources`, { ...config, params }),
        axios.get(`${API_URL}/domains`, config),
        axios.get(`${API_URL}/segment-functions`, config),
        axios.get(`${API_URL}/apps`, config),
        axios.get(`${API_URL}/technologies`, config),
        axios.get(`${API_URL}/roles`, config),
        // PERFORMANCE: Fetch only first 200 projects for reference (used in allocation dialogs)
        // Don't fetch all 2,000+ projects - not needed for resource list view
        axios.get(`${API_URL}/projects`, { ...config, params: { scenarioId: activeScenario.id, limit: 200 } }),
      ]);

      // Extract resources and pagination data
      setResources(resourcesRes.data.data);
      setTotalCount(resourcesRes.data.pagination.total);
      setTotalPages(resourcesRes.data.pagination.totalPages);
      setDomains(domainsRes.data.data);
      setSegmentFunctions(segmentFunctionsRes.data.data);
      setApps(appsRes.data.data);
      setTechnologies(techsRes.data.data);
      setRoles(rolesRes.data.data);
      setProjects(projectsRes.data.data);
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch debounced filters
  const debouncedFilters = useDebounce(filters, 300);

  // Refetch when page, filters, or scenario changes
  useEffect(() => {
    if (activeScenario) {
      fetchResources();
    }
  }, [activeScenario, currentPage, pageSize, debouncedFilters, selectedDomainIds]);

  // Reset to page 1 when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [debouncedFilters, selectedDomainIds]);

  // Handle deep linking - restore dialog state from URL on browser back/forward
  useEffect(() => {
    const editResourceId = searchParams.get('editResourceId');

    if (editResourceId && resources.length > 0) {
      const resourceId = parseInt(editResourceId);
      const resource = resources.find(r => r.id === resourceId);

      if (resource && !openDialog) {
        // Only open if not already open (prevent re-opening on every render)
        setEditMode(true);
        setCurrentResource(resource);
        setCurrentCapabilities(resource.capabilities || []);
        setNewCapabilities([]);
        setCapabilitiesToDelete([]);
        setOpenDialog(true);
        setHasUnsavedChanges(false);
      }
    } else if (!editResourceId && openDialog) {
      // No editResourceId in URL but dialog is open - user clicked back from dialog state
      setOpenDialog(false);
      setCurrentResource({});
      setCurrentCapabilities([]);
      setNewCapabilities([]);
      setCapabilitiesToDelete([]);
      setHasUnsavedChanges(false);
    }
  }, [searchParams, resources, openDialog]);

  const handleOpenDialog = (resource?: Resource) => {
    if (resource) {
      setEditMode(true);
      setCurrentResource(resource);
      setCurrentCapabilities(resource.capabilities || []);
      // Set URL params to preserve dialog state for browser back/forward
      setSearchParams({ editResourceId: resource.id!.toString() });
    } else {
      setEditMode(false);
      setCurrentResource({});
      setCurrentCapabilities([]);
    }
    setNewCapabilities([]);
    setCapabilitiesToDelete([]);
    setOpenDialog(true);
    setHasUnsavedChanges(false); // Reset on open
  };

  const handleCloseDialog = () => {
    // Just clear URL params - the useEffect will handle closing the dialog
    setSearchParams({});
  };

  // Helper to update resource and mark as unsaved
  const updateResource = (updates: Partial<Resource>) => {
    setCurrentResource({ ...currentResource, ...updates });
    setHasUnsavedChanges(true);
  };

  const handleAddCapability = () => {
    const newCap: NewCapability = {
      tempId: `temp_${Date.now()}`,
      appId: apps[0]?.id || 0,
      technologyId: technologies[0]?.id || 0,
      roleId: roles[0]?.id || 0,
      proficiencyLevel: 'Beginner',
      yearsOfExperience: 0,
      isPrimary: false,
    };
    setNewCapabilities([...newCapabilities, newCap]);
    setHasUnsavedChanges(true);
  };

  const handleUpdateNewCapability = (tempId: string, field: string, value: any) => {
    setNewCapabilities(newCapabilities.map(cap =>
      cap.tempId === tempId ? { ...cap, [field]: value } : cap
    ));
    setHasUnsavedChanges(true);
  };

  const handleDeleteNewCapability = (tempId: string) => {
    setNewCapabilities(newCapabilities.filter(cap => cap.tempId !== tempId));
    setHasUnsavedChanges(true);
  };

  const handleDeleteExistingCapability = (capabilityId: number) => {
    setCapabilitiesToDelete([...capabilitiesToDelete, capabilityId]);
    setCurrentCapabilities(currentCapabilities.filter(cap => cap.id !== capabilityId));
    setHasUnsavedChanges(true);
  };

  const handleTogglePrimaryCapability = (capabilityId: number) => {
    setCurrentCapabilities(currentCapabilities.map(cap => ({
      ...cap,
      isPrimary: cap.id === capabilityId ? !cap.isPrimary : false,
    })));
    setHasUnsavedChanges(true);
  };

  const handleToggleNewPrimaryCapability = (tempId: string) => {
    setNewCapabilities(newCapabilities.map(cap => ({
      ...cap,
      isPrimary: cap.tempId === tempId ? !cap.isPrimary : false,
    })));
    setHasUnsavedChanges(true);
  };

  const handleUpdateExistingCapability = (capabilityId: number, field: string, value: any) => {
    setCurrentCapabilities(currentCapabilities.map(cap =>
      cap.id === capabilityId ? { ...cap, [field]: value } : cap
    ));
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Save resource basic info
      let resourceId = currentResource.id;
      if (editMode && currentResource.id) {
        await axios.put(`${API_URL}/resources/${currentResource.id}`, currentResource, config);
      } else {
        const response = await axios.post(`${API_URL}/resources`, currentResource, config);
        resourceId = response.data.data.id;
      }

      // Delete capabilities marked for deletion
      for (const capId of capabilitiesToDelete) {
        await axios.delete(`${API_URL}/resource-capabilities/${capId}`, config);
      }

      // Update existing capabilities
      for (const cap of currentCapabilities) {
        await axios.put(`${API_URL}/resource-capabilities/${cap.id}`, {
          proficiencyLevel: cap.proficiencyLevel,
          yearsOfExperience: cap.yearsOfExperience,
          isPrimary: cap.isPrimary,
        }, config);
      }

      // Create new capabilities
      for (const newCap of newCapabilities) {
        await axios.post(`${API_URL}/resource-capabilities`, {
          resourceId,
          appId: newCap.appId,
          technologyId: newCap.technologyId,
          roleId: newCap.roleId,
          proficiencyLevel: newCap.proficiencyLevel,
          yearsOfExperience: newCap.yearsOfExperience,
          isPrimary: newCap.isPrimary,
        }, config);
      }

      fetchResources();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving resource:', error);
      alert('Error saving resource. Please check the console for details.');
    }
  };

  // Allocation Management Functions
  const handleOpenAllocationsDialog = async (resource: Resource) => {
    setSelectedResourceForAllocations(resource);
    setOpenAllocationsDialog(true);
    await fetchResourceAllocations(resource.id);
  };

  const handleCloseAllocationsDialog = () => {
    setOpenAllocationsDialog(false);
    setSelectedResourceForAllocations(null);
    setResourceAllocations([]);
  };

  const fetchResourceAllocations = async (resourceId: number) => {
    if (!activeScenario?.id) return;

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // SERVER-SIDE FILTERING: Fetch only allocations for this specific resource
      const allocationsRes = await axios.get(`${API_URL}/allocations`, {
        ...config,
        params: {
          scenarioId: activeScenario.id,
          resourceId: resourceId,
          limit: 100 // Max 100 allocations per resource should be enough
        }
      });

      setResourceAllocations(allocationsRes.data.data || []);
    } catch (error) {
      console.error('Error fetching resource allocations:', error);
    }
  };

  const handleOpenAllocationEditDialog = async (allocation?: Allocation) => {
    if (allocation) {
      setAllocationEditMode(true);
      setCurrentAllocation(allocation);

      // Load project requirements for the allocated project
      if (allocation.projectId) {
        await loadProjectRequirements(allocation.projectId);
      }
    } else {
      setAllocationEditMode(false);
      setCurrentAllocation({
        resourceId: selectedResourceForAllocations?.id,
        allocationPercentage: 50,
        allocationType: 'Shared',
      });
      setProjectRequirements([]);

      // Load projects with match scores for new allocation
      if (selectedResourceForAllocations) {
        await loadAvailableProjects(selectedResourceForAllocations);
      }
    }
    setOpenAllocationEditDialog(true);
  };

  const handleCloseAllocationEditDialog = () => {
    setOpenAllocationEditDialog(false);
    setCurrentAllocation({});
    setProjectRequirements([]);
    setAllocationEditMode(false);
    setAvailableProjects([]);
    setMinMatchScore(0);
  };

  const loadProjectRequirements = async (projectId: number) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`${API_URL}/project-requirements/project/${projectId}`, config);
      setProjectRequirements(res.data.data || []);
    } catch (err) {
      console.error('Error loading project requirements:', err);
    }
  };

  // Match score calculation
  const PROFICIENCY_SCORES: Record<string, number> = {
    Beginner: 1,
    Intermediate: 2,
    Advanced: 3,
    Expert: 4,
  };

  const WEIGHTS = {
    EXACT_MATCH: 40,
    PROFICIENCY: 30,
    EXPERIENCE: 20,
    IS_PRIMARY: 10,
  };

  const calculateMatchScore = (capability: Capability, requirement: any): number => {
    let score = 0;

    // 1. Exact Match (40 points)
    const appMatch = capability.appId === requirement.appId;
    const techMatch = capability.technologyId === requirement.technologyId;
    const roleMatch = capability.roleId === requirement.roleId;

    if (appMatch && techMatch && roleMatch) {
      score += WEIGHTS.EXACT_MATCH;
    } else {
      const matches = [appMatch, techMatch, roleMatch].filter(Boolean).length;
      score += (matches / 3) * WEIGHTS.EXACT_MATCH;
    }

    // 2. Proficiency Level (30 points)
    const capProficiency = PROFICIENCY_SCORES[capability.proficiencyLevel] || 0;
    const reqProficiency = PROFICIENCY_SCORES[requirement.proficiencyLevel] || 0;

    if (capProficiency >= reqProficiency) {
      score += WEIGHTS.PROFICIENCY;
    } else {
      const proficiencyGap = reqProficiency - capProficiency;
      score += Math.max(0, WEIGHTS.PROFICIENCY - (proficiencyGap * 10));
    }

    // 3. Years of Experience (20 points)
    score += WEIGHTS.EXPERIENCE;

    // 4. Is Primary Capability (10 points)
    if (capability.isPrimary) {
      score += WEIGHTS.IS_PRIMARY;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  };

  const loadAvailableProjects = async (resource: Resource) => {
    if (!resource.id || !activeScenario?.id) return;

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // PERFORMANCE: Load resource capabilities and limited projects
      // Only fetch first 500 projects (sorted by priority) to suggest for allocation
      // Fetching all 2000+ projects and their requirements is too slow
      const [capRes, projectsRes] = await Promise.all([
        axios.get(`${API_URL}/resource-capabilities?resourceId=${resource.id}`, config),
        axios.get(`${API_URL}/projects`, {
          ...config,
          params: {
            scenarioId: activeScenario.id,
            limit: 500,
            // TODO: Add sorting by priority/status in backend
          }
        }),
      ]);

      const resourceCapabilities = capRes.data.data || [];
      const limitedProjects = projectsRes.data.data || [];

      // Load requirements for limited set of projects
      const projectsWithRequirements = await Promise.all(
        limitedProjects.map(async (proj: Project) => {
          try {
            const reqRes = await axios.get(`${API_URL}/project-requirements/project/${proj.id}`, config);
            return { ...proj, requirements: reqRes.data.data || [] };
          } catch (error) {
            return { ...proj, requirements: [] };
          }
        })
      );

      // Calculate match scores
      const projectsWithScores: ProjectWithScore[] = projectsWithRequirements.map((proj) => {
        let bestScore = 0;
        let bestRequirement: any = undefined;
        let bestCapability: Capability | undefined;

        if (resourceCapabilities.length > 0 && proj.requirements && proj.requirements.length > 0) {
          resourceCapabilities.forEach((cap: Capability) => {
            proj.requirements!.forEach((req: any) => {
              const score = calculateMatchScore(cap, req);
              if (score > bestScore) {
                bestScore = score;
                bestCapability = cap;
                bestRequirement = req;
              }
            });
          });
        }

        return {
          ...proj,
          matchScore: bestScore,
          bestRequirement,
          bestCapability,
        };
      });

      // Sort by match score (highest first)
      projectsWithScores.sort((a, b) => b.matchScore - a.matchScore);

      setAvailableProjects(projectsWithScores);
    } catch (error) {
      console.error('Error loading projects with match scores:', error);
    }
  };

  const handleSaveAllocation = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Construct allocation data with only the fields backend expects
      const allocationData = {
        resourceId: currentAllocation.resourceId,
        projectId: currentAllocation.projectId,
        scenarioId: activeScenario?.id,
        resourceCapabilityId: currentAllocation.resourceCapabilityId,
        projectRequirementId: currentAllocation.projectRequirementId,
        allocationPercentage: currentAllocation.allocationPercentage,
        allocationType: currentAllocation.allocationType,
        startDate: currentAllocation.startDate,
        endDate: currentAllocation.endDate,
        isActive: true,
      };

      if (allocationEditMode && currentAllocation.id) {
        await axios.put(`${API_URL}/allocations/${currentAllocation.id}`, allocationData, config);
      } else {
        await axios.post(`${API_URL}/allocations`, allocationData, config);
      }

      await fetchResourceAllocations(selectedResourceForAllocations!.id);
      handleCloseAllocationEditDialog();
    } catch (error: any) {
      console.error('Error saving allocation:', error);
      console.error('Error response:', error.response?.data);

      // Get error message from backend response
      const backendError = error.response?.data?.error;
      const backendMessage = error.response?.data?.message;
      const errorMessage = backendError || backendMessage || error.message || 'Unknown error';

      alert(`Error saving allocation: ${errorMessage}`);
    }
  };

  const handleDeleteAllocation = async (allocationId: number) => {
    if (!confirm('Are you sure you want to delete this allocation?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/allocations/${allocationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchResourceAllocations(selectedResourceForAllocations!.id);
    } catch (error) {
      console.error('Error deleting allocation:', error);
      alert('Error deleting allocation. Please check the console for details.');
    }
  };


  const handleExport = () => {
    exportToExcel(resources, 'resources_export');
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    importFromExcel(
      file,
      async (data) => {
        try {
          const token = localStorage.getItem('token');
          const config = { headers: { Authorization: `Bearer ${token}` } };

          // Bulk create resources (shared across scenarios, no scenarioId)
          for (const resource of data) {
            await axios.post(`${API_URL}/resources`, resource, config);
          }

          alert(`Successfully imported ${data.length} resources`);
          fetchResources();
        } catch (error) {
          console.error('Error importing resources:', error);
          alert('Error importing some resources. Check console for details.');
        }
      },
      (error) => {
        alert(`Import error: ${error}`);
      }
    );

    // Reset input
    event.target.value = '';
  };

  const formatCurrency = (value?: number) => {
    if (!value) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getUtilizationColor = (rate?: number) => {
    if (!rate) return 'default';
    if (rate >= 90) return 'success';
    if (rate >= 70) return 'primary';
    if (rate >= 50) return 'warning';
    return 'error';
  };

  // Server-side filtering and pagination - resources are already filtered and paginated by backend
  // No need for client-side filtering/pagination anymore!

  // Get unique business decisions from projects
  const uniqueBusinessDecisions = Array.from(
    new Set(projects.map((p) => p.businessDecision).filter(Boolean))
  ) as string[];

  // Get unique fiscal years from projects
  const uniqueFiscalYears = Array.from(
    new Set(projects.map((p) => p.fiscalYear).filter(Boolean))
  ) as string[];

  return (
    <Box>
      <PageHeader
        title="Resource Overview"
        subtitle="Overview of all enterprise resources and utilization"
        icon={<PeopleIcon sx={{ fontSize: 32 }} />}
        compact
      />

      <ActionBar elevation={1}>
        <Button
          variant="outlined"
          startIcon={<TemplateIcon />}
          onClick={generateResourceTemplate}
          size="small"
        >
          Template
        </Button>

        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
          size="small"
        >
          Export
        </Button>

        <Button
          variant="outlined"
          component="label"
          startIcon={<UploadIcon />}
          size="small"
        >
          Import
          <input
            type="file"
            hidden
            accept=".csv,.xlsx,.xls"
            onChange={handleImport}
          />
        </Button>

        <Box sx={{ flexGrow: 1 }} />

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          size="small"
          sx={{
            px: 3,
            fontWeight: 600,
            boxShadow: 2,
            '&:hover': {
              boxShadow: 4,
            },
          }}
        >
          Add Resource
        </Button>
      </ActionBar>

      <CompactFilterBar
        domains={domains}
        businessDecisions={uniqueBusinessDecisions}
        fiscalYears={uniqueFiscalYears}
        extraActions={<FilterPresets />}
      />

      {loading ? (
        <TableSkeleton rows={10} columns={9} showHeader={true} />
      ) : (
        <>
      <TableContainer component={Paper} sx={{ overflowX: 'auto', boxShadow: 2, borderRadius: 1.5 }}>
        <Table sx={{ minWidth: { xs: 800, md: 1000 } }}>
          <TableHead sx={{ backgroundColor: (theme) => theme.palette.mode === 'light' ? theme.palette.grey[50] : theme.palette.grey[900] }}>
            <TableRow>
              <TableCell align="right" sx={{ minWidth: 120 }}>Actions</TableCell>
              <TableCell sx={{ minWidth: 110 }}>Employee ID</TableCell>
              <TableCell sx={{ minWidth: 150 }}>Name</TableCell>
              <TableCell sx={{ minWidth: 120 }}>Domain</TableCell>
              <TableCell sx={{ minWidth: 120 }}>Segment Function</TableCell>
              <TableCell sx={{ minWidth: 200 }}>Capabilities</TableCell>
              <TableCell sx={{ minWidth: 100 }}>Location</TableCell>
              <TableCell sx={{ minWidth: 100 }}>Hourly Rate</TableCell>
              <TableCell sx={{ minWidth: 100 }}>Utilization</TableCell>
            </TableRow>
            <TableRow>
              <TableCell />
              <TableCell>
                <TextField
                  size="small"
                  placeholder="Filter by ID"
                  value={filters.employeeId}
                  onChange={(e) => setFilters({ ...filters, employeeId: e.target.value })}
                  fullWidth
                />
              </TableCell>
              <TableCell>
                <TextField
                  size="small"
                  placeholder="Filter by name"
                  value={filters.name}
                  onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                  fullWidth
                />
              </TableCell>
              <TableCell />
              <TableCell>
                <Autocomplete
                  size="small"
                  options={['', ...segmentFunctions.map(sf => sf.name)]}
                  value={filters.segmentFunction || ''}
                  onChange={(_, newValue) => setFilters({ ...filters, segmentFunction: newValue || '' })}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="All Segment Functions"
                      size="small"
                    />
                  )}
                  getOptionLabel={(option) => option === '' ? 'All Segment Functions' : option}
                  fullWidth
                />
              </TableCell>
              <TableCell />
              <TableCell>
                <TextField
                  size="small"
                  placeholder="Filter by location"
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  fullWidth
                />
              </TableCell>
              <TableCell />
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {resources.map((resource) => (
              <TableRow key={resource.id}>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => handleOpenDialog(resource)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      startIcon={<AssignmentIcon />}
                      onClick={() => handleOpenAllocationsDialog(resource)}
                      color="primary"
                    >
                      Allocations
                    </Button>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {resource.employeeId}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body1">
                    {resource.firstName} {resource.lastName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {resource.email}
                  </Typography>
                </TableCell>
                <TableCell>
                  {resource.domain?.name || '-'}
                </TableCell>
                <TableCell>
                  {resource.segmentFunction?.name || '-'}
                </TableCell>
                <TableCell>
                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    {resource.capabilities && resource.capabilities.length > 0 ? (
                      resource.capabilities.map((capability) => (
                        <Chip
                          key={capability.id}
                          label={`${capability.app.code}/${capability.technology.code}/${capability.role.code}`}
                          size="small"
                          color={capability.isPrimary ? 'primary' : 'default'}
                          sx={{ fontSize: '0.75rem' }}
                          title={`${capability.app.name} - ${capability.technology.name} - ${capability.role.name} (${capability.proficiencyLevel})`}
                        />
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No capabilities
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>{resource.location || '-'}</TableCell>
                <TableCell>{formatCurrency(resource.hourlyRate)}/hr</TableCell>
                <TableCell>
                  <Chip
                    label={resource.utilizationRate ? `${resource.utilizationRate}%` : 'N/A'}
                    size="small"
                    color={getUtilizationColor(resource.utilizationRate) as any}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Pagination
        page={currentPage}
        pageSize={pageSize}
        totalItems={totalCount}
        totalPages={totalPages}
        startIndex={(currentPage - 1) * pageSize + 1}
        endIndex={Math.min(currentPage * pageSize, totalCount)}
        onPageChange={setCurrentPage}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setCurrentPage(1); // Reset to page 1 when page size changes
        }}
        onFirstPage={() => setCurrentPage(1)}
        onLastPage={() => setCurrentPage(totalPages)}
        onNextPage={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
        onPreviousPage={() => setCurrentPage(Math.max(currentPage - 1, 1))}
        hasNextPage={currentPage < totalPages}
        hasPreviousPage={currentPage > 1}
      />
        </>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
        <DialogTitle>{editMode ? 'Edit Resource' : 'Add Resource'}</DialogTitle>
        <DialogContent dividers sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Employee ID"
                value={currentResource.employeeId || ''}
                onChange={(e) =>
                  updateResource({ employeeId: e.target.value })
                }
                disabled={editMode}
                helperText={editMode ? 'Employee ID cannot be changed' : 'Unique identifier for the employee'}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={currentResource.email || ''}
                onChange={(e) =>
                  updateResource({ email: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Domain"
                value={currentResource.domainId || ''}
                onChange={(e) =>
                  updateResource({ domainId: e.target.value ? Number(e.target.value) : undefined })
                }
              >
                <MenuItem value="">None</MenuItem>
                {domains.map((domain) => (
                  <MenuItem key={domain.id} value={domain.id}>
                    {domain.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Segment Function"
                value={currentResource.segmentFunctionId || ''}
                onChange={(e) =>
                  updateResource({ segmentFunctionId: e.target.value ? Number(e.target.value) : undefined })
                }
              >
                <MenuItem value="">None</MenuItem>
                {segmentFunctions.map((segmentFunction) => (
                  <MenuItem key={segmentFunction.id} value={segmentFunction.id}>
                    {segmentFunction.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={currentResource.firstName || ''}
                onChange={(e) =>
                  updateResource({ firstName: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={currentResource.lastName || ''}
                onChange={(e) =>
                  updateResource({ lastName: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Role"
                value={currentResource.role || ''}
                onChange={(e) =>
                  updateResource({ role: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location"
                value={currentResource.location || ''}
                onChange={(e) =>
                  updateResource({ location: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Hourly Rate"
                type="number"
                value={currentResource.hourlyRate || ''}
                onChange={(e) =>
                  updateResource({ hourlyRate: parseFloat(e.target.value) || 0 })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Utilization Rate (%)"
                type="number"
                value={currentResource.utilizationRate || ''}
                onChange={(e) =>
                  updateResource({ utilizationRate: parseFloat(e.target.value) || 0 })
                }
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Primary Skill"
                value={currentResource.primarySkill || ''}
                onChange={(e) =>
                  updateResource({ primarySkill: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Secondary Skills"
                value={currentResource.secondarySkills || ''}
                onChange={(e) =>
                  updateResource({ secondarySkills: e.target.value })
                }
                placeholder="Comma separated skills"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Timezone"
                value={currentResource.timezone || ''}
                onChange={(e) =>
                  updateResource({ timezone: e.target.value })
                }
                placeholder="e.g., EST, PST, UTC"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Joining Date"
                type="date"
                value={currentResource.joiningDate?.split('T')[0] || ''}
                onChange={(e) =>
                  updateResource({ joiningDate: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
                helperText="Date when employee joined the organization"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="End of Service Date"
                type="date"
                value={currentResource.endOfServiceDate?.split('T')[0] || ''}
                onChange={(e) =>
                  updateResource({ endOfServiceDate: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
                helperText="Date when employee leaves the organization (optional)"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Monthly Cost"
                type="number"
                value={currentResource.monthlyCost || ''}
                onChange={(e) =>
                  updateResource({ monthlyCost: parseFloat(e.target.value) || 0 })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Total Capacity Hours"
                type="number"
                value={currentResource.totalCapacityHours || 160}
                onChange={(e) =>
                  updateResource({ totalCapacityHours: parseInt(e.target.value) || 160 })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Home Location"
                value={currentResource.homeLocation || ''}
                onChange={(e) =>
                  updateResource({ homeLocation: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Is Remote"
                value={currentResource.isRemote !== undefined ? (currentResource.isRemote ? 'true' : 'false') : 'false'}
                onChange={(e) =>
                  updateResource({ isRemote: e.target.value === 'true' })
                }
              >
                <MenuItem value="false">No</MenuItem>
                <MenuItem value="true">Yes</MenuItem>
              </TextField>
            </Grid>

            {/* Capabilities Management Section */}
            <Grid item xs={12}>
              <Divider sx={{ my: 3 }} />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" fontWeight="bold">
                    Capabilities (App/Technology/Role)
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={handleAddCapability}
                    size="small"
                  >
                    Add Capability
                  </Button>
                </Box>

                {/* Existing Capabilities */}
                {currentCapabilities.map((cap) => (
                  <Paper
                    key={cap.id}
                    sx={{
                      p: 2,
                      mb: 2,
                      backgroundColor: (theme) =>
                        theme.palette.mode === 'light'
                          ? theme.palette.grey[100]
                          : theme.palette.grey[800],
                      border: (theme) => `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={2}>
                        <TextField
                          select
                          fullWidth
                          label="App"
                          size="small"
                          value={cap.appId}
                          onChange={(e) => handleUpdateExistingCapability(cap.id, 'appId', Number(e.target.value))}
                        >
                          {apps.map((app) => (
                            <MenuItem key={app.id} value={app.id}>
                              {app.name}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <TextField
                          select
                          fullWidth
                          label="Technology"
                          size="small"
                          value={cap.technologyId}
                          onChange={(e) => handleUpdateExistingCapability(cap.id, 'technologyId', Number(e.target.value))}
                        >
                          {technologies.map((tech) => (
                            <MenuItem key={tech.id} value={tech.id}>
                              {tech.name}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <TextField
                          select
                          fullWidth
                          label="Role"
                          size="small"
                          value={cap.roleId}
                          onChange={(e) => handleUpdateExistingCapability(cap.id, 'roleId', Number(e.target.value))}
                        >
                          {roles.map((role) => (
                            <MenuItem key={role.id} value={role.id}>
                              {role.name}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <TextField
                          select
                          fullWidth
                          label="Proficiency"
                          size="small"
                          value={cap.proficiencyLevel}
                          onChange={(e) => handleUpdateExistingCapability(cap.id, 'proficiencyLevel', e.target.value)}
                        >
                          <MenuItem value="Beginner">Beginner</MenuItem>
                          <MenuItem value="Intermediate">Intermediate</MenuItem>
                          <MenuItem value="Advanced">Advanced</MenuItem>
                          <MenuItem value="Expert">Expert</MenuItem>
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={1.5}>
                        <TextField
                          fullWidth
                          label="Years"
                          type="number"
                          size="small"
                          value={cap.yearsOfExperience || 0}
                          onChange={(e) => handleUpdateExistingCapability(cap.id, 'yearsOfExperience', Number(e.target.value))}
                          inputProps={{ min: 0 }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={1} display="flex" justifyContent="center">
                        <Button
                          size="small"
                          onClick={() => handleTogglePrimaryCapability(cap.id)}
                          startIcon={cap.isPrimary ? <StarIcon /> : <StarBorderIcon />}
                          color={cap.isPrimary ? 'primary' : 'inherit'}
                          title={cap.isPrimary ? 'Primary capability' : 'Set as primary'}
                        >
                        </Button>
                      </Grid>
                      <Grid item xs={12} sm={1.5} display="flex" justifyContent="center">
                        <Button
                          size="small"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDeleteExistingCapability(cap.id)}
                        >
                          Delete
                        </Button>
                      </Grid>
                    </Grid>
                  </Paper>
                ))}

                {/* New Capabilities */}
                {newCapabilities.map((newCap) => (
                  <Paper
                    key={newCap.tempId}
                    sx={{
                      p: 2,
                      mb: 2,
                      backgroundColor: (theme) =>
                        theme.palette.mode === 'light'
                          ? theme.palette.primary.light + '20'
                          : theme.palette.primary.dark + '40',
                      border: (theme) => `1px solid ${theme.palette.primary.main}`,
                    }}
                  >
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={2}>
                        <TextField
                          select
                          fullWidth
                          label="App"
                          size="small"
                          value={newCap.appId}
                          onChange={(e) => handleUpdateNewCapability(newCap.tempId, 'appId', Number(e.target.value))}
                        >
                          {apps.map((app) => (
                            <MenuItem key={app.id} value={app.id}>
                              {app.name}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <TextField
                          select
                          fullWidth
                          label="Technology"
                          size="small"
                          value={newCap.technologyId}
                          onChange={(e) => handleUpdateNewCapability(newCap.tempId, 'technologyId', Number(e.target.value))}
                        >
                          {technologies.map((tech) => (
                            <MenuItem key={tech.id} value={tech.id}>
                              {tech.name}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <TextField
                          select
                          fullWidth
                          label="Role"
                          size="small"
                          value={newCap.roleId}
                          onChange={(e) => handleUpdateNewCapability(newCap.tempId, 'roleId', Number(e.target.value))}
                        >
                          {roles.map((role) => (
                            <MenuItem key={role.id} value={role.id}>
                              {role.name}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <TextField
                          select
                          fullWidth
                          label="Proficiency"
                          size="small"
                          value={newCap.proficiencyLevel}
                          onChange={(e) => handleUpdateNewCapability(newCap.tempId, 'proficiencyLevel', e.target.value)}
                        >
                          <MenuItem value="Beginner">Beginner</MenuItem>
                          <MenuItem value="Intermediate">Intermediate</MenuItem>
                          <MenuItem value="Advanced">Advanced</MenuItem>
                          <MenuItem value="Expert">Expert</MenuItem>
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={1.5}>
                        <TextField
                          fullWidth
                          label="Years"
                          type="number"
                          size="small"
                          value={newCap.yearsOfExperience}
                          onChange={(e) => handleUpdateNewCapability(newCap.tempId, 'yearsOfExperience', Number(e.target.value))}
                          inputProps={{ min: 0 }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={1} display="flex" justifyContent="center">
                        <Button
                          size="small"
                          onClick={() => handleToggleNewPrimaryCapability(newCap.tempId)}
                          startIcon={newCap.isPrimary ? <StarIcon /> : <StarBorderIcon />}
                          color={newCap.isPrimary ? 'primary' : 'inherit'}
                          title={newCap.isPrimary ? 'Primary capability' : 'Set as primary'}
                        >
                        </Button>
                      </Grid>
                      <Grid item xs={12} sm={1.5} display="flex" justifyContent="center">
                        <Button
                          size="small"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDeleteNewCapability(newCap.tempId)}
                        >
                          Delete
                        </Button>
                      </Grid>
                    </Grid>
                  </Paper>
                ))}

                {currentCapabilities.length === 0 && newCapabilities.length === 0 && (
                  <Paper
                    sx={{
                      p: 3,
                      textAlign: 'center',
                      backgroundColor: (theme) =>
                        theme.palette.mode === 'light'
                          ? theme.palette.grey[50]
                          : theme.palette.grey[900],
                      border: (theme) => `1px dashed ${theme.palette.divider}`,
                    }}
                  >
                    <Typography color="text.secondary">
                      No capabilities added yet. Click "Add Capability" to assign App/Technology/Role combinations.
                    </Typography>
                  </Paper>
                )}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Allocations Management Dialog */}
      <Dialog
        open={openAllocationsDialog}
        onClose={handleCloseAllocationsDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Manage Allocations - {selectedResourceForAllocations?.firstName} {selectedResourceForAllocations?.lastName}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenAllocationEditDialog()}
              size="small"
            >
              Add Allocation
            </Button>
          </Box>

          {resourceAllocations.length === 0 ? (
            <Paper
              sx={{
                p: 3,
                textAlign: 'center',
                backgroundColor: (theme) =>
                  theme.palette.mode === 'light'
                    ? theme.palette.grey[50]
                    : theme.palette.grey[900],
                border: (theme) => `1px dashed ${theme.palette.divider}`,
              }}
            >
              <Typography color="text.secondary">
                No allocations found for this resource. Click "Add Allocation" to assign to a project.
              </Typography>
            </Paper>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Project</TableCell>
                    <TableCell>Capability</TableCell>
                    <TableCell>Requirement</TableCell>
                    <TableCell>Match Score</TableCell>
                    <TableCell>Allocation %</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Timeline</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {resourceAllocations.map((allocation) => (
                    <TableRow key={allocation.id}>
                      <TableCell>
                        <Typography variant="body2">{allocation.project?.name}</Typography>
                      </TableCell>
                      <TableCell>
                        {allocation.resourceCapability ? (
                          <Chip
                            label={`${allocation.resourceCapability.app.code}/${allocation.resourceCapability.technology.code}/${allocation.resourceCapability.role.code}`}
                            size="small"
                            color={allocation.resourceCapability.isPrimary ? 'primary' : 'default'}
                          />
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {allocation.projectRequirement ? (
                          <Chip
                            label={`${allocation.projectRequirement.app.code}/${allocation.projectRequirement.technology.code}/${allocation.projectRequirement.role.code}`}
                            size="small"
                            variant="outlined"
                          />
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {allocation.matchScore ? (
                          <Chip
                            label={`${allocation.matchScore}%`}
                            size="small"
                            color={
                              allocation.matchScore >= 80
                                ? 'success'
                                : allocation.matchScore >= 60
                                ? 'primary'
                                : allocation.matchScore >= 40
                                ? 'warning'
                                : 'error'
                            }
                          />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip label={`${allocation.allocationPercentage}%`} size="small" />
                      </TableCell>
                      <TableCell>{allocation.allocationType}</TableCell>
                      <TableCell>
                        {allocation.startDate && allocation.endDate ? (
                          <Typography variant="caption">
                            {new Date(allocation.startDate).toLocaleDateString()} -{' '}
                            {new Date(allocation.endDate).toLocaleDateString()}
                          </Typography>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          <Button
                            size="small"
                            startIcon={<EditIcon />}
                            onClick={() => handleOpenAllocationEditDialog(allocation)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="small"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleDeleteAllocation(allocation.id)}
                            color="error"
                          >
                            Delete
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAllocationsDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Allocation Dialog */}
      <Dialog
        open={openAllocationEditDialog}
        onClose={handleCloseAllocationEditDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{allocationEditMode ? 'Edit Allocation' : 'Add Allocation'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Resource Name - Non-editable */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Resource"
                value={selectedResourceForAllocations ? `${selectedResourceForAllocations.firstName} ${selectedResourceForAllocations.lastName} (${selectedResourceForAllocations.employeeId})` : ''}
                disabled
                helperText="Resource is pre-selected and cannot be changed"
              />
            </Grid>

            {/* Match Score Filter Slider - Only show when adding new allocation with available projects */}
            {!allocationEditMode && availableProjects.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="body2" gutterBottom>
                  Minimum Match Score: {minMatchScore}%
                </Typography>
                <Slider
                  value={minMatchScore}
                  onChange={(_, value) => setMinMatchScore(value as number)}
                  min={0}
                  max={100}
                  step={10}
                  marks={[
                    { value: 0, label: '0%' },
                    { value: 50, label: '50%' },
                    { value: 80, label: '80%' },
                    { value: 100, label: '100%' },
                  ]}
                  valueLabelDisplay="auto"
                />
              </Grid>
            )}

            <Grid item xs={12}>
              {!allocationEditMode && availableProjects.length > 0 ? (
                <Autocomplete
                  fullWidth
                  options={availableProjects.filter(p => p.matchScore >= minMatchScore)}
                  getOptionLabel={(option) => `${option.name} - ${option.matchScore}%`}
                  value={availableProjects.find(p => p.id === currentAllocation.projectId) || null}
                  onChange={async (_, newValue) => {
                    if (newValue) {
                      setCurrentAllocation({
                        ...currentAllocation,
                        projectId: newValue.id,
                        projectRequirementId: undefined,
                        resourceCapabilityId: undefined,
                        startDate: newValue.startDate,
                        endDate: newValue.endDate,
                      });
                      await loadProjectRequirements(newValue.id);

                      // Auto-select best matching capability and requirement
                      if (newValue.bestCapability && newValue.bestRequirement) {
                        setCurrentAllocation(prev => ({
                          ...prev,
                          projectId: newValue.id,
                          resourceCapabilityId: newValue.bestCapability!.id,
                          projectRequirementId: newValue.bestRequirement!.id,
                          startDate: newValue.startDate,
                          endDate: newValue.endDate,
                        }));
                      }
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Project"
                      required
                      placeholder="Search projects..."
                      helperText={`${availableProjects.filter(p => p.matchScore >= minMatchScore).length} projects match your criteria`}
                    />
                  )}
                  renderOption={(props, option) => {
                    const matchColor = option.matchScore >= 80 ? 'success' :
                                     option.matchScore >= 60 ? 'primary' :
                                     option.matchScore >= 40 ? 'warning' : 'error';
                    return (
                      <li {...props} key={option.id}>
                        <Box sx={{ width: '100%' }}>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {option.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {option.domain?.name || 'No domain'}
                              </Typography>
                            </Box>
                            <Chip label={`${option.matchScore}%`} color={matchColor as any} size="small" />
                          </Box>
                          {option.bestRequirement && (
                            <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                              Best match: {option.bestRequirement.app.code}/{option.bestRequirement.technology.code}/{option.bestRequirement.role.code}
                            </Typography>
                          )}
                        </Box>
                      </li>
                    );
                  }}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                />
              ) : (
                <TextField
                  select
                  fullWidth
                  label="Project"
                  required
                  value={currentAllocation.projectId || ''}
                  onChange={async (e) => {
                    const projectId = Number(e.target.value);
                    const selectedProject = projects.find(p => p.id === projectId);
                    setCurrentAllocation({
                      ...currentAllocation,
                      projectId,
                      projectRequirementId: undefined,
                      startDate: selectedProject?.startDate,
                      endDate: selectedProject?.endDate,
                    });
                    await loadProjectRequirements(projectId);
                  }}
                >
                  <MenuItem value="">Select Project</MenuItem>
                  {projects.map((project) => (
                    <MenuItem key={project.id} value={project.id}>
                      {project.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Resource Capability"
                value={currentAllocation.resourceCapabilityId || ''}
                onChange={(e) =>
                  setCurrentAllocation({
                    ...currentAllocation,
                    resourceCapabilityId: Number(e.target.value) || undefined,
                  })
                }
              >
                <MenuItem value="">None</MenuItem>
                {(selectedResourceForAllocations?.capabilities || []).map((cap) => (
                  <MenuItem key={cap.id} value={cap.id}>
                    {cap.app.code}/{cap.technology.code}/{cap.role.code} ({cap.proficiencyLevel})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Project Requirement"
                value={currentAllocation.projectRequirementId || ''}
                onChange={(e) =>
                  setCurrentAllocation({
                    ...currentAllocation,
                    projectRequirementId: Number(e.target.value) || undefined,
                  })
                }
                disabled={!currentAllocation.projectId}
              >
                <MenuItem value="">None</MenuItem>
                {projectRequirements.map((req: any) => (
                  <MenuItem key={req.id} value={req.id}>
                    {req.app.code}/{req.technology.code}/{req.role.code} ({req.proficiencyLevel})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Allocation %"
                required
                value={currentAllocation.allocationPercentage || 50}
                onChange={(e) =>
                  setCurrentAllocation({
                    ...currentAllocation,
                    allocationPercentage: parseInt(e.target.value),
                  })
                }
                inputProps={{ min: 1, max: 100 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Allocation Type"
                required
                value={currentAllocation.allocationType || 'Shared'}
                onChange={(e) =>
                  setCurrentAllocation({
                    ...currentAllocation,
                    allocationType: e.target.value,
                  })
                }
              >
                <MenuItem value="Shared">Shared</MenuItem>
                <MenuItem value="Dedicated">Dedicated</MenuItem>
                <MenuItem value="On-Demand">On-Demand</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                value={currentAllocation.startDate?.split('T')[0] || ''}
                onChange={(e) =>
                  setCurrentAllocation({
                    ...currentAllocation,
                    startDate: e.target.value,
                  })
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="End Date"
                value={currentAllocation.endDate?.split('T')[0] || ''}
                onChange={(e) =>
                  setCurrentAllocation({
                    ...currentAllocation,
                    endDate: e.target.value,
                  })
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAllocationEditDialog}>Cancel</Button>
          <Button
            onClick={handleSaveAllocation}
            variant="contained"
            disabled={!currentAllocation.projectId}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Navigation Prompt - Warn when leaving with unsaved changes */}
      <NavigationPrompt
        open={showPrompt}
        message={navigationMessage}
        onConfirm={confirmNavigation}
        onCancel={cancelNavigation}
      />
    </Box>
  );
};

export default ResourceOverview;
