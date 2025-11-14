import { useState, useEffect, useMemo } from 'react';
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
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Tooltip,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Tabs,
  Tab,
  Autocomplete,
  Slider,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  TableChart as TableChartIcon,
  Timeline as TimelineIcon,
  ViewKanban as ViewKanbanIcon,
  InfoOutlined,
} from '@mui/icons-material';
import axios from 'axios';
import PageHeader from '../../components/common/PageHeader';
import ActionBar, { ActionGroup } from '../../components/common/ActionBar';
import CompactFilterBar from '../../components/common/CompactFilterBar';
import FilterPresets from '../../components/common/FilterPresets';
import Pagination from '../../components/common/Pagination';
import { useScenario } from '../../contexts/ScenarioContext';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import NavigationPrompt from '../../components/common/NavigationPrompt';
import { setDomainFilter, setBusinessDecisionFilter, setFiscalYearFilter, clearAllFilters } from '../../store/slices/filtersSlice';
import TimelineView from '../../components/TimelineView';
import KanbanView from '../../components/KanbanView';
import { calculateMaxConcurrentAllocation } from '../../utils/allocationCalculations';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

interface Capability {
  id: number;
  appId: number;
  technologyId: number;
  roleId: number;
  proficiencyLevel: string;
  isPrimary: boolean;
  app: { id: number; name: string; code: string };
  technology: { id: number; name: string; code: string };
  role: { id: number; name: string; code: string };
}

interface Requirement {
  id: number;
  appId: number;
  technologyId: number;
  roleId: number;
  proficiencyLevel: string;
  requiredCount: number;
  fulfilledCount: number;
  app: { id: number; name: string; code: string };
  technology: { id: number; name: string; code: string };
  role: { id: number; name: string; code: string };
}

interface Resource {
  id: number;
  employeeId: string;
  firstName?: string;
  lastName?: string;
  domainId?: number;
  capabilities?: Capability[];
  domain?: {
    id: number;
    name: string;
  };
}

interface Project {
  id: number;
  name: string;
  status: string;
  startDate?: string;
  endDate?: string;
  domainId?: number;
  businessDecision?: string;
  fiscalYear?: string;
  domain?: {
    id: number;
    name: string;
  };
  requirements?: Requirement[];
}

interface ProjectWithScore extends Project {
  matchScore: number;
  bestRequirement?: Requirement;
  bestCapability?: Capability;
}

interface Allocation {
  id: number;
  projectId: number;
  resourceId: number;
  resourceCapabilityId?: number;
  projectRequirementId?: number;
  allocationType: string;
  allocationPercentage: number;
  matchScore?: number;
  startDate?: string;
  endDate?: string;
  resource?: Resource;
  project?: Project;
  resourceCapability?: Capability;
  projectRequirement?: Requirement;
}

interface Domain {
  id: number;
  name: string;
}

const ResourceAllocation = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeScenario } = useScenario();
  const dispatch = useAppDispatch();
  const { selectedDomainIds, selectedBusinessDecisions, selectedFiscalYears } = useAppSelector((state) => state.filters);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [resources, setResources] = useState<Resource[]>([]); // All resources for dropdowns
  const [displayResources, setDisplayResources] = useState<Resource[]>([]); // Filtered resources for timeline/kanban
  const [projects, setProjects] = useState<Project[]>([]); // All projects for dropdowns
  const [displayProjects, setDisplayProjects] = useState<Project[]>([]); // Filtered projects for timeline/kanban
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50); // Show 50 records per page
  const [totalCount, setTotalCount] = useState(0);
  // Summary/KPI state (server-side calculated)
  const [summary, setSummary] = useState({
    totalAllocations: 0,
    overAllocatedResources: 0,
    poorMatchAllocations: 0,
    avgMatchScore: 0,
  });
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentAllocation, setCurrentAllocation] = useState<Partial<Allocation>>({
    allocationPercentage: 50,
    allocationType: 'Shared',
  });
  const [selectedResourceCapabilities, setSelectedResourceCapabilities] = useState<Capability[]>([]);
  const [selectedProjectRequirements, setSelectedProjectRequirements] = useState<Requirement[]>([]);
  const [availableProjects, setAvailableProjects] = useState<ProjectWithScore[]>([]);
  const [minMatchScore, setMinMatchScore] = useState<number>(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Navigation blocking hook
  const { showPrompt, confirmNavigation, cancelNavigation, message: navigationMessage } = useUnsavedChanges(
    openDialog && hasUnsavedChanges,
    'You have unsaved changes in the allocation form. Are you sure you want to leave this page?'
  );

  // Persist view selection across page refreshes
  const [currentView, setCurrentView] = useState<'table' | 'timeline' | 'kanban'>(() => {
    const savedView = localStorage.getItem('resourceAllocationView');
    return (savedView === 'timeline' || savedView === 'kanban' || savedView === 'table') ? savedView : 'table';
  });

  // Save view to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('resourceAllocationView', currentView);
  }, [currentView]);
  const [filters, setFilters] = useState({
    resource: '',
    project: [] as string[],
    allocationType: [] as string[],
    matchScore: '',
    domainId: '',
    businessDecision: '',
  });
  const [showScopingWarning, setShowScopingWarning] = useState(false);

  // Visualization-specific filters (timeline/kanban only)
  const [selectedResourceIds, setSelectedResourceIds] = useState<number[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<number[]>([]);
  const [loadAllResults, setLoadAllResults] = useState(false);
  const [showLoadAllWarning, setShowLoadAllWarning] = useState(false);

  // Search states for dropdowns (server-side search)
  const [resourceSearchTerm, setResourceSearchTerm] = useState('');
  const [projectSearchTerm, setProjectSearchTerm] = useState('');
  const [debouncedResourceSearch, setDebouncedResourceSearch] = useState('');
  const [debouncedProjectSearch, setDebouncedProjectSearch] = useState('');

  // Debounce state for text filters
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [debouncedResourceFilter, setDebouncedResourceFilter] = useState('');

  // Check if filters are sufficient for visualization views (timeline/kanban)
  const hasScopingFilters = () => {
    // Require at least one scoping filter: domain, business decision, fiscal year, or global filters
    return (
      filters.domainId !== '' ||
      filters.businessDecision !== '' ||
      selectedDomainIds.length > 0 ||
      selectedBusinessDecisions.length > 0 ||
      selectedFiscalYears.length > 0
    );
  };

  // Debounce resource name filter (300ms delay)
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    const timeout = setTimeout(() => {
      setDebouncedResourceFilter(filters.resource);
      setPage(1); // Reset to page 1 when filter changes
    }, 300);
    setSearchTimeout(timeout);
    return () => clearTimeout(timeout);
  }, [filters.resource]);

  // Debounce resource search for dropdown (750ms delay)
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedResourceSearch(resourceSearchTerm);
    }, 750);
    return () => clearTimeout(timeout);
  }, [resourceSearchTerm]);

  // Debounce project search for dropdown (750ms delay)
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedProjectSearch(projectSearchTerm);
    }, 750);
    return () => clearTimeout(timeout);
  }, [projectSearchTerm]);

  // Reset to page 1 when any filter changes (except resource which is debounced above)
  useEffect(() => {
    if (page !== 1) {
      setPage(1);
    }
  }, [filters.project, filters.allocationType, filters.matchScore, filters.domainId, filters.businessDecision, selectedDomainIds, selectedBusinessDecisions, selectedFiscalYears]);

  useEffect(() => {
    if (activeScenario) {
      fetchData();
    }
  }, [activeScenario, page, pageSize, debouncedResourceFilter, filters.project, filters.allocationType, filters.matchScore, filters.domainId, filters.businessDecision, selectedDomainIds, selectedBusinessDecisions, selectedFiscalYears, currentView, selectedResourceIds, selectedProjectIds, loadAllResults, debouncedResourceSearch, debouncedProjectSearch]);

  // Check scoping warnings for visualization views
  useEffect(() => {
    const isVisualizationView = currentView === 'timeline' || currentView === 'kanban';
    const hasScoping = hasScopingFilters();

    if (isVisualizationView) {
      setShowScopingWarning(!hasScoping);
    } else {
      setShowScopingWarning(false);
    }
  }, [currentView, selectedDomainIds, selectedBusinessDecisions, selectedFiscalYears, filters.domainId, filters.businessDecision]);

  // Handle deep linking - restore dialog state from URL or close when params removed
  useEffect(() => {
    const editAllocationId = searchParams.get('editAllocationId');

    if (editAllocationId && allocations.length > 0) {
      const allocationId = parseInt(editAllocationId);
      const allocation = allocations.find(a => a.id === allocationId);

      if (allocation && !openDialog) {
        // URL has editAllocationId but dialog is closed - open it
        handleOpenDialog(allocation);
      }
    } else if (!editAllocationId && openDialog && editMode) {
      // URL params cleared but dialog is still open AND we were in edit mode - close it (browser back was clicked)
      // Don't close if we're adding a new allocation (editMode = false)
      setOpenDialog(false);
      setCurrentAllocation({
        allocationPercentage: 50,
        allocationType: 'Shared',
      });
      setSelectedResourceCapabilities([]);
      setSelectedProjectRequirements([]);
      setAvailableProjects([]);
      setMinMatchScore(0);
      setHasUnsavedChanges(false);
    }
  }, [searchParams, allocations, openDialog, editMode]);

  const fetchData = async () => {
    if (!activeScenario?.id) {
      console.warn('No active scenario selected for ResourceAllocation');
      return;
    }

    // For timeline/kanban views, require scoping filters
    const isVisualizationView = currentView === 'timeline' || currentView === 'kanban';
    if (isVisualizationView && !hasScopingFilters()) {
      // Clear allocations when filters are cleared (useEffect will handle showScopingWarning)
      setAllocations([]);
      setTotalCount(0);
      setSummary({
        totalAllocations: 0,
        overAllocatedResources: 0,
        poorMatchAllocations: 0,
        avgMatchScore: 0,
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Check if current view is visualization view
      const isVisualizationView = currentView === 'timeline' || currentView === 'kanban';

      // Build query params with server-side filters
      // For visualization views (timeline/kanban):
      //   - Load top 50 resources, 50 projects, and 50 allocations by default (best performance)
      //   - Load all if user explicitly chooses "Load All"
      // For table view: use pagination
      const visualizationLimit = loadAllResults ? 10000 : 50;
      const resourceLimit = isVisualizationView ? visualizationLimit : 100;
      const projectLimit = isVisualizationView ? (loadAllResults ? 2000 : 50) : 100;

      const allocationParams: any = {
        scenarioId: activeScenario.id,
        page: isVisualizationView ? 1 : page,
        limit: isVisualizationView ? visualizationLimit : pageSize,
      };

      // Add filters to params (only non-empty values)
      if (debouncedResourceFilter) allocationParams.resourceName = debouncedResourceFilter;
      if (filters.matchScore) allocationParams.matchScore = filters.matchScore;

      // Visualization-specific filters (multiselect) - backend supports comma-separated IDs
      if (isVisualizationView && selectedResourceIds.length > 0) {
        allocationParams.resourceId = selectedResourceIds.join(',');
      }
      if (isVisualizationView && selectedProjectIds.length > 0) {
        allocationParams.projectId = selectedProjectIds.join(',');
      }

      // Handle array filters - backend doesn't support multiple projects/types yet, so use first value
      if (filters.allocationType.length > 0) allocationParams.allocationType = filters.allocationType[0];

      // Domain and business decision filters (use global filters from Redux if set, otherwise use local)
      if (selectedDomainIds.length > 0) {
        allocationParams.domainId = selectedDomainIds[0];
      } else if (filters.domainId) {
        allocationParams.domainId = filters.domainId;
      }

      if (selectedBusinessDecisions.length > 0) {
        allocationParams.businessDecision = selectedBusinessDecisions[0];
      } else if (filters.businessDecision) {
        allocationParams.businessDecision = filters.businessDecision;
      }

      // Fiscal year filter (use global filter from Redux)
      if (selectedFiscalYears.length > 0) {
        allocationParams.fiscalYear = selectedFiscalYears[0];
      }

      // SERVER-SIDE FILTERING: All filters applied in database
      // Fetch allocations and summary with same filters in parallel
      // VIEW-SPECIFIC DATA LOADING:
      // - Timeline/Kanban views:
      //   * Server-side search for resources/projects (fetch max 50 results based on search term)
      //   * Selected items are always included even if not in search results
      //   * Fetch 50 allocations by default (or all if "Load All" clicked)
      // - Table view: Load limited resources/projects for dropdowns, paginated allocations for table

      // Build resources params for visualization views with server-side search
      const resourcesParams: any = {
        // Limit to 50 search results for better performance
        limit: isVisualizationView ? 50 : 100
      };

      // Add search term if user is typing (backend uses 'name' parameter)
      if (isVisualizationView && debouncedResourceSearch) {
        resourcesParams.name = debouncedResourceSearch;
      }

      // Build projects params with server-side search
      const projectsParams: any = {
        scenarioId: activeScenario.id,
        // Limit to 50 search results for better performance
        limit: isVisualizationView ? 50 : 100
      };

      // Add search term if user is typing (backend uses 'name' parameter)
      if (isVisualizationView && debouncedProjectSearch) {
        projectsParams.name = debouncedProjectSearch;
      }

      // Apply same filters to projects as allocations for visualization views
      if (isVisualizationView) {
        if (selectedDomainIds.length > 0) {
          projectsParams.domainId = selectedDomainIds[0];
        }
        if (selectedBusinessDecisions.length > 0) {
          projectsParams.businessDecision = selectedBusinessDecisions[0];
        }
        if (selectedFiscalYears.length > 0) {
          projectsParams.fiscalYear = selectedFiscalYears[0];
        }
      }

      const [allocationsRes, summaryRes, resourcesRes, projectsRes, domainsRes] = await Promise.all([
        axios.get(`${API_URL}/allocations`, { ...config, params: allocationParams }),
        axios.get(`${API_URL}/allocations/summary`, { ...config, params: allocationParams }), // Same filters!
        // For timeline/kanban views: load top 50 resources by default, all if "Load All" clicked
        axios.get(`${API_URL}/resources`, { ...config, params: resourcesParams }),
        // For timeline/kanban views: load top 50 projects by default, all if "Load All" clicked
        axios.get(`${API_URL}/projects`, { ...config, params: projectsParams }),
        axios.get(`${API_URL}/domains`, config),
      ]);

      // Backend response structure: { success, data: allocations[], pagination: { total, page, limit, ... } }
      const allocationsData = Array.isArray(allocationsRes.data.data) ? allocationsRes.data.data : [];
      const pagination = allocationsRes.data.pagination;

      setAllocations(allocationsData);

      // Use pagination.total for the ACTUAL total count (not just what's loaded)
      const totalAllocations = pagination?.total || allocationsData.length || 0;
      setTotalCount(totalAllocations);

      setSummary(summaryRes.data.data || {
        totalAllocations: 0,
        overAllocatedResources: 0,
        poorMatchAllocations: 0,
        avgMatchScore: 0,
      });

      // Merge search results with currently selected items (so selected items are always visible)
      const searchedResources = resourcesRes.data.data || [];
      const searchedProjects = projectsRes.data.data || [];

      // Ensure selected resources are included even if not in search results
      const selectedResources = resources.filter(r => selectedResourceIds.includes(r.id));
      const selectedProjects = projects.filter(p => selectedProjectIds.includes(p.id));

      // Merge unique resources (search results + selected)
      const mergedResources = [...searchedResources];
      selectedResources.forEach(selected => {
        if (!mergedResources.find(r => r.id === selected.id)) {
          mergedResources.push(selected);
        }
      });

      // Merge unique projects (search results + selected)
      const mergedProjects = [...searchedProjects];
      selectedProjects.forEach(selected => {
        if (!mergedProjects.find(p => p.id === selected.id)) {
          mergedProjects.push(selected);
        }
      });

      setResources(mergedResources);
      setProjects(mergedProjects);

      // Filter resources and projects for visualization display
      if (isVisualizationView) {
        // If specific resources/projects are selected, show only those
        // Otherwise, show search results (already limited to 50 by server)
        const filteredResources = selectedResourceIds.length > 0
          ? mergedResources.filter(r => selectedResourceIds.includes(r.id))
          : mergedResources;

        const filteredProjects = selectedProjectIds.length > 0
          ? mergedProjects.filter(p => selectedProjectIds.includes(p.id))
          : mergedProjects;

        setDisplayResources(filteredResources);
        setDisplayProjects(filteredProjects);
      } else {
        // Table view - show all
        setDisplayResources(mergedResources);
        setDisplayProjects(mergedProjects);
      }

      setDomains(domainsRes.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (allocation?: Allocation) => {
    if (allocation) {
      setEditMode(true);
      setCurrentAllocation(allocation);

      // Ensure the allocated resource is in the resources list
      if (allocation.resource && !resources.some(r => r.id === allocation.resource!.id)) {
        setResources(prev => [...prev, allocation.resource!]);
      }

      // Ensure the allocated project is in the projects list
      if (allocation.project && !projects.some(p => p.id === allocation.project!.id)) {
        setProjects(prev => [...prev, allocation.project!]);
      }

      // Pre-populate with existing capability/requirement if available
      if (allocation.resourceCapability) {
        setSelectedResourceCapabilities([allocation.resourceCapability]);
      }
      if (allocation.projectRequirement) {
        setSelectedProjectRequirements([allocation.projectRequirement]);
      }

      // Load all capabilities/requirements for the resource/project
      if (allocation.resourceId) {
        loadResourceCapabilities(allocation.resourceId);
        loadAvailableProjects(allocation.resourceId);
      }
      if (allocation.projectId) {
        loadProjectRequirements(allocation.projectId);
      }
    } else {
      setEditMode(false);
      setCurrentAllocation({
        allocationPercentage: 50,
        allocationType: 'Shared',
      });
      setSelectedResourceCapabilities([]);
      setSelectedProjectRequirements([]);
      setAvailableProjects([]);
      setMinMatchScore(0);
    }
    setOpenDialog(true);
    setHasUnsavedChanges(false); // Reset on open

    // Set URL params for edit mode
    if (allocation?.id) {
      setSearchParams({ editAllocationId: allocation.id.toString() });
    }
  };

  const handleCloseDialog = () => {
    // Just clear URL params - the useEffect will handle closing the dialog
    setSearchParams({});
  };

  // Helper to update allocation and mark as unsaved
  const updateAllocation = (updates: Partial<Allocation>) => {
    const updated = { ...currentAllocation, ...updates };
    setCurrentAllocation(updated);
    setHasUnsavedChanges(true);

    // Preserve URL params if editing an existing allocation
    if (updated.id && editMode) {
      setSearchParams({ editAllocationId: updated.id.toString() }, { replace: true });
    }
  };

  const loadResourceCapabilities = async (resourceId: number) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`${API_URL}/resource-capabilities?resourceId=${resourceId}`, config);
      const capabilities = res.data.data || [];

      // Merge with existing capabilities to avoid duplicates
      setSelectedResourceCapabilities((prev) => {
        const existingIds = new Set(prev.map(c => c.id));
        const newCapabilities = capabilities.filter((c: Capability) => !existingIds.has(c.id));
        return [...prev, ...newCapabilities];
      });
    } catch (err) {
      console.error('Error loading resource capabilities:', err);
    }
  };

  const loadProjectRequirements = async (projectId: number) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`${API_URL}/project-requirements/project/${projectId}`, config);
      const requirements = res.data.data || [];

      // Merge with existing requirements to avoid duplicates
      setSelectedProjectRequirements((prev) => {
        const existingIds = new Set(prev.map(r => r.id));
        const newRequirements = requirements.filter((r: Requirement) => !existingIds.has(r.id));
        return [...prev, ...newRequirements];
      });
    } catch (err) {
      console.error('Error loading project requirements:', err);
    }
  };

  // Match score calculation function
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

  const calculateMatchScore = (capability: Capability, requirement: Requirement): number => {
    let score = 0;

    // 1. Exact Match (40 points)
    const appMatch = capability.appId === requirement.appId;
    const techMatch = capability.technologyId === requirement.technologyId;
    const roleMatch = capability.roleId === requirement.roleId;

    if (appMatch && techMatch && roleMatch) {
      score += WEIGHTS.EXACT_MATCH;
    } else {
      // Partial matches reduce the score
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
    // Note: Capability doesn't have yearsOfExperience in this interface, but requirement has minYearsExp
    // We'll give full points for now as this field isn't consistently available
    score += WEIGHTS.EXPERIENCE;

    // 4. Is Primary Capability (10 points)
    if (capability.isPrimary) {
      score += WEIGHTS.IS_PRIMARY;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  };

  const loadAvailableProjects = async (resourceId: number) => {
    if (!resourceId || !activeScenario?.id) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Load resource capabilities and projects in parallel
      // MEMORY OPTIMIZATION: For dialogs, load first 500 projects (not all 2K+)
      const [capRes, projectsRes] = await Promise.all([
        axios.get(`${API_URL}/resource-capabilities?resourceId=${resourceId}`, config),
        axios.get(`${API_URL}/projects`, { ...config, params: { scenarioId: activeScenario.id, limit: 500 } }),
      ]);

      const resourceCapabilities = capRes.data.data || [];
      const allProjects = projectsRes.data.data || [];

      // Load requirements for each project
      const projectsWithRequirements = await Promise.all(
        allProjects.map(async (proj: Project) => {
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
        let bestRequirement: Requirement | undefined;
        let bestCapability: Capability | undefined;

        if (resourceCapabilities.length > 0 && proj.requirements && proj.requirements.length > 0) {
          resourceCapabilities.forEach((cap: Capability) => {
            proj.requirements!.forEach((req: Requirement) => {
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
      setSelectedResourceCapabilities(resourceCapabilities);
    } catch (error) {
      console.error('Error loading projects with match scores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResourceChange = (resourceId: number) => {
    updateAllocation({
      resourceId,
      resourceCapabilityId: undefined,
      projectId: undefined,
      projectRequirementId: undefined,
    });
    setSelectedResourceCapabilities([]); // Clear previous capabilities
    setSelectedProjectRequirements([]); // Clear previous requirements
    setAvailableProjects([]); // Clear previous projects
    loadResourceCapabilities(resourceId);
    // Don't load projects until capability is selected
  };

  const handleCapabilityChange = (capabilityId: number | undefined) => {
    updateAllocation({
      resourceCapabilityId: capabilityId,
      projectId: undefined,
      projectRequirementId: undefined,
    });
    setSelectedProjectRequirements([]); // Clear previous requirements
    setAvailableProjects([]); // Clear previous projects

    if (capabilityId && currentAllocation.resourceId) {
      // Load projects matching this specific capability
      loadProjectsForCapability(capabilityId);
    }
  };

  const loadProjectsForCapability = async (capabilityId: number) => {
    if (!activeScenario?.id) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Get the selected capability
      const selectedCapability = selectedResourceCapabilities.find(c => c.id === capabilityId);
      if (!selectedCapability) return;

      // MEMORY OPTIMIZATION: For dialogs, load first 500 projects (not all 2K+)
      const projectsRes = await axios.get(`${API_URL}/projects`, {
        ...config,
        params: { scenarioId: activeScenario.id, limit: 500 }
      });
      const allProjects = projectsRes.data.data || [];

      // Load requirements for each project and calculate match scores
      const projectsWithRequirements = await Promise.all(
        allProjects.map(async (proj: Project) => {
          try {
            const reqRes = await axios.get(`${API_URL}/project-requirements/project/${proj.id}`, config);
            return { ...proj, requirements: reqRes.data.data || [] };
          } catch (error) {
            return { ...proj, requirements: [] };
          }
        })
      );

      // Calculate match scores for the SELECTED capability against each project's requirements
      const projectsWithScores: ProjectWithScore[] = projectsWithRequirements.map((proj) => {
        let bestScore = 0;
        let bestRequirement: Requirement | undefined;

        if (proj.requirements && proj.requirements.length > 0) {
          proj.requirements.forEach((req: Requirement) => {
            const score = calculateMatchScore(selectedCapability, req);
            if (score > bestScore) {
              bestScore = score;
              bestRequirement = req;
            }
          });
        }

        return {
          ...proj,
          matchScore: bestScore,
          bestRequirement,
          bestCapability: selectedCapability,
        };
      });

      // Sort by match score (highest first) and filter out projects with no requirements
      const sortedProjects = projectsWithScores
        .filter(p => p.requirements && p.requirements.length > 0)
        .sort((a, b) => b.matchScore - a.matchScore);

      setAvailableProjects(sortedProjects);
    } catch (error) {
      console.error('Error loading projects for capability:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectChange = (projectId: number) => {
    const selectedProject = projects.find(p => p.id === projectId) || availableProjects.find(p => p.id === projectId);
    updateAllocation({
      projectId,
      projectRequirementId: undefined,
      startDate: selectedProject?.startDate,
      endDate: selectedProject?.endDate,
    });
    setSelectedProjectRequirements([]); // Clear previous requirements
    loadProjectRequirements(projectId);
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Ensure scenarioId is included in the allocation data
      const allocationData = {
        ...currentAllocation,
        scenarioId: activeScenario?.id,
      };

      if (editMode && currentAllocation.id) {
        await axios.put(`${API_URL}/allocations/${currentAllocation.id}`, allocationData, config);
      } else {
        await axios.post(`${API_URL}/allocations`, allocationData, config);
      }

      fetchData();
      handleCloseDialog();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save allocation');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this allocation?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/allocations/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchData();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete allocation');
      }
    }
  };

  const getMatchScoreColor = (score?: number) => {
    if (!score) return 'default';
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getMatchScoreIcon = (score?: number) => {
    if (!score) return null;
    if (score >= 80) return <CheckCircleIcon fontSize="small" color="success" />;
    if (score >= 60) return <WarningIcon fontSize="small" color="warning" />;
    return <ErrorIcon fontSize="small" color="error" />;
  };

  const getMatchScoreLabel = (score?: number) => {
    if (!score) return 'No Match Data';
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Good Match';
    if (score >= 40) return 'Fair Match';
    return 'Poor Match';
  };

  // SERVER-SIDE FILTERING: Allocations are already filtered by backend
  // No need for client-side filtering anymore!
  // Resources and projects for dropdowns remain unfiltered (for selection purposes)

  // Calculate resource utilization statistics from allocations
  const resourceStats = useMemo(() => {
    if (!Array.isArray(allocations)) return {};
    return allocations.reduce((acc: any, allocation) => {
      const resourceId = allocation.resourceId;
      if (!acc[resourceId]) {
        acc[resourceId] = {
          resource: allocation.resource,
          totalAllocation: 0,
          allocations: [],
          avgMatchScore: 0,
        };
      }
      acc[resourceId].allocations.push(allocation);

      if (allocation.matchScore) {
        const scores = acc[resourceId].allocations
          .filter((a: Allocation) => a.matchScore)
          .map((a: Allocation) => a.matchScore!);
        acc[resourceId].avgMatchScore = scores.length > 0
          ? scores.reduce((sum: number, s: number) => sum + s, 0) / scores.length
          : 0;
      }

      return acc;
    }, {});
  }, [allocations]);

  // Calculate max concurrent allocation for each resource
  Object.keys(resourceStats).forEach(resourceId => {
    resourceStats[resourceId].totalAllocation = calculateMaxConcurrentAllocation(
      resourceStats[resourceId].allocations
    );
  });

  const overAllocatedResources = useMemo(() => {
    return Object.values(resourceStats).filter(
      (stat: any) => stat.totalAllocation > 100
    );
  }, [resourceStats]);

  const poorMatchAllocations = useMemo(() => {
    if (!Array.isArray(allocations)) return [];
    return allocations.filter(
      (a) => a.matchScore && a.matchScore < 60
    );
  }, [allocations]);

  // Calculate cross-domain metrics
  const calculateCrossDomainMetrics = () => {
    if (!Array.isArray(allocations) || filters.domainId === '' && filters.businessDecision === '') {
      return { outboundCrossDomain: 0, inboundCrossDomain: 0 };
    }

    // Resources from selected domain working in other domains (outbound)
    const outboundCrossDomain = allocations.filter((allocation) => {
      const resourceInSelectedDomain = filters.domainId !== '' &&
        allocation.resource?.domainId?.toString() === filters.domainId;
      const projectInDifferentDomain = allocation.project?.domainId?.toString() !== filters.domainId;

      const resourceMatchesBusinessDecision = filters.businessDecision !== '' &&
        allocation.resource?.domainId !== undefined &&
        projects.find(p => p.domainId === allocation.resource?.domainId)?.businessDecision === filters.businessDecision;
      const projectDifferentBusinessDecision = allocation.project?.businessDecision !== filters.businessDecision;

      if (filters.domainId !== '' && filters.businessDecision !== '') {
        return (resourceInSelectedDomain && projectInDifferentDomain) ||
               (resourceMatchesBusinessDecision && projectDifferentBusinessDecision);
      } else if (filters.domainId !== '') {
        return resourceInSelectedDomain && projectInDifferentDomain;
      } else {
        return resourceMatchesBusinessDecision && projectDifferentBusinessDecision;
      }
    });

    // Resources from other domains working in selected domain (inbound)
    const inboundCrossDomain = allocations.filter((allocation) => {
      const projectInSelectedDomain = filters.domainId !== '' &&
        allocation.project?.domainId?.toString() === filters.domainId;
      const resourceFromDifferentDomain = allocation.resource?.domainId?.toString() !== filters.domainId;

      const projectMatchesBusinessDecision = filters.businessDecision !== '' &&
        allocation.project?.businessDecision === filters.businessDecision;
      const resourceFromDifferentBusinessDecision = allocation.resource?.domainId !== undefined &&
        projects.find(p => p.domainId === allocation.resource?.domainId)?.businessDecision !== filters.businessDecision;

      if (filters.domainId !== '' && filters.businessDecision !== '') {
        return (projectInSelectedDomain && resourceFromDifferentDomain) ||
               (projectMatchesBusinessDecision && resourceFromDifferentBusinessDecision);
      } else if (filters.domainId !== '') {
        return projectInSelectedDomain && resourceFromDifferentDomain;
      } else {
        return projectMatchesBusinessDecision && resourceFromDifferentBusinessDecision;
      }
    });

    return {
      outboundCrossDomain: new Set(outboundCrossDomain.map(a => a.resourceId)).size,
      inboundCrossDomain: new Set(inboundCrossDomain.map(a => a.resourceId)).size,
    };
  };

  const { outboundCrossDomain, inboundCrossDomain } = calculateCrossDomainMetrics();

  // Extract unique business decisions and fiscal years for filter options
  const uniqueBusinessDecisions = Array.from(
    new Set(projects.map((p) => p.businessDecision).filter(Boolean))
  ) as string[];

  const uniqueFiscalYears = Array.from(
    new Set(projects.map((p) => p.fiscalYear).filter(Boolean))
  ) as string[];

  if (loading) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="400px" gap={2}>
        <CircularProgress size={60} />
        <Typography variant="body1">Loading allocations...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Resource Allocation Matrix"
        subtitle="Capability-based resource allocation with smart matching scores"
        icon={<TableChartIcon sx={{ fontSize: 32 }} />}
        compact
        actions={
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
            Add Allocation
          </Button>
        }
      />

      <ActionBar elevation={1}>
        <ActionGroup divider>
          <Button
            variant={currentView === 'table' ? 'contained' : 'outlined'}
            startIcon={<TableChartIcon />}
            onClick={() => setCurrentView('table')}
            size="small"
          >
            Table
          </Button>
          <Button
            variant={currentView === 'timeline' ? 'contained' : 'outlined'}
            startIcon={<TimelineIcon />}
            onClick={() => setCurrentView('timeline')}
            size="small"
          >
            Timeline
          </Button>
          <Button
            variant={currentView === 'kanban' ? 'contained' : 'outlined'}
            startIcon={<ViewKanbanIcon />}
            onClick={() => setCurrentView('kanban')}
            size="small"
          >
            Kanban
          </Button>
        </ActionGroup>
      </ActionBar>

      <CompactFilterBar
        domains={domains}
        businessDecisions={uniqueBusinessDecisions}
        fiscalYears={uniqueFiscalYears}
        extraActions={<FilterPresets />}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Scoping warning for visualization views */}
      {showScopingWarning && (currentView === 'timeline' || currentView === 'kanban') && (
        <Card sx={{ mb: 3, bgcolor: 'info.lighter', borderLeft: 4, borderColor: 'info.main' }}>
          <CardContent>
            <Box display="flex" alignItems="flex-start" gap={2}>
              <InfoOutlined sx={{ fontSize: 32, color: 'info.main', mt: 0.5 }} />
              <Box flex={1}>
                <Typography variant="h6" color="info.dark" gutterBottom>
                  Select Filters to View {currentView === 'timeline' ? 'Timeline' : 'Kanban'}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Timeline and Kanban views work best with focused data. Please select at least one scoping filter to continue:
                </Typography>
                <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 1, mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Required: Select at least one
                  </Typography>
                  <Box component="ul" sx={{ pl: 3, mb: 0 }}>
                    <li>
                      <Typography variant="body2">
                        <strong>Domain</strong> - View allocations for a specific domain
                      </Typography>
                    </li>
                    <li>
                      <Typography variant="body2">
                        <strong>Business Decision</strong> - View allocations by business decision type
                      </Typography>
                    </li>
                    <li>
                      <Typography variant="body2">
                        <strong>Fiscal Year</strong> - View allocations for a specific fiscal year
                      </Typography>
                    </li>
                  </Box>
                </Box>
                <Alert severity="info" sx={{ mb: 0 }}>
                  <Typography variant="body2">
                    💡 Tip: Use the filter bar above or the table view to browse all allocations without restrictions.
                    Recommended limit: <strong>500 allocations</strong> for optimal performance.
                  </Typography>
                </Alert>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Visualization-specific filters and load controls */}
      {!showScopingWarning && (currentView === 'timeline' || currentView === 'kanban') && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Box>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Refine Results
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {!loadAllResults ? (
                    <>Showing <strong>50 search results</strong> in dropdowns and timeline. Type to search for specific resources/projects, or load all to see everything.</>
                  ) : (
                    <>Loading <strong>all matching results</strong>. This may impact performance with large datasets.</>
                  )}
                </Typography>
              </Box>
              <Box>
                {!loadAllResults && totalCount > 50 && (
                  <Button
                    variant="outlined"
                    color="warning"
                    size="small"
                    onClick={() => setShowLoadAllWarning(true)}
                    sx={{ mr: 1 }}
                  >
                    Load All ({totalCount.toLocaleString()})
                  </Button>
                )}
                {loadAllResults && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setLoadAllResults(false)}
                  >
                    Load Top 50 Only
                  </Button>
                )}
              </Box>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  multiple
                  limitTags={2}
                  options={resources}
                  filterOptions={(x) => x} // No client-side filtering, all filtering is server-side
                  getOptionLabel={(option) =>
                    option?.firstName && option?.lastName && option?.employeeId
                      ? `${option.firstName} ${option.lastName} (${option.employeeId})`
                      : ''
                  }
                  value={resources.filter(r => selectedResourceIds.includes(r.id))}
                  inputValue={resourceSearchTerm}
                  onChange={(_event, newValue) => {
                    const newIds = newValue.map(r => r.id);
                    // Only clear search if an item was added (not removed)
                    if (newIds.length > selectedResourceIds.length) {
                      setResourceSearchTerm('');
                    }
                    setSelectedResourceIds(newIds);
                  }}
                  onInputChange={(_event, value, reason) => {
                    // Only update search term when user is typing, not when resetting
                    if (reason === 'input') {
                      setResourceSearchTerm(value);
                    } else if (reason === 'clear') {
                      setResourceSearchTerm('');
                    }
                  }}
                  renderOption={(props, option) => (
                    <Box component="li" {...props} key={option.id}>
                      <Box>
                        <Typography variant="body2">
                          {option.firstName} {option.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.employeeId} • {option.domain?.name || 'No domain'}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Filter by Specific Resources"
                      placeholder={selectedResourceIds.length === 0 ? "Type to search by name, ID, or domain..." : ""}
                      size="small"
                      helperText={`${selectedResourceIds.length} selected${resourceSearchTerm && resourceSearchTerm !== debouncedResourceSearch ? ' • Searching...' : ''}`}
                    />
                  )}
                  noOptionsText={resourceSearchTerm ? "No resources found. Try a different search." : "Type to search resources..."}
                  sx={{ bgcolor: 'background.paper' }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  multiple
                  limitTags={2}
                  options={projects}
                  filterOptions={(x) => x} // No client-side filtering, all filtering is server-side
                  getOptionLabel={(option) =>
                    option ? (option.name || `Project #${option.id}`) : ''
                  }
                  value={projects.filter(p => selectedProjectIds.includes(p.id))}
                  inputValue={projectSearchTerm}
                  onChange={(_event, newValue) => {
                    const newIds = newValue.map(p => p.id);
                    // Only clear search if an item was added (not removed)
                    if (newIds.length > selectedProjectIds.length) {
                      setProjectSearchTerm('');
                    }
                    setSelectedProjectIds(newIds);
                  }}
                  onInputChange={(_event, value, reason) => {
                    // Only update search term when user is typing, not when resetting
                    if (reason === 'input') {
                      setProjectSearchTerm(value);
                    } else if (reason === 'clear') {
                      setProjectSearchTerm('');
                    }
                  }}
                  renderOption={(props, option) => (
                    <Box component="li" {...props} key={option.id}>
                      <Box>
                        <Typography variant="body2">
                          {option.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          #{option.id} • {option.fiscalYear || 'No FY'} • {option.status || 'No status'}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Filter by Specific Projects"
                      placeholder={selectedProjectIds.length === 0 ? "Type to search by name, ID, or fiscal year..." : ""}
                      size="small"
                      helperText={`${selectedProjectIds.length} selected${projectSearchTerm && projectSearchTerm !== debouncedProjectSearch ? ' • Searching...' : ''}`}
                    />
                  )}
                  noOptionsText={projectSearchTerm ? "No projects found. Try a different search." : "Type to search projects..."}
                  sx={{ bgcolor: 'background.paper' }}
                />
              </Grid>
            </Grid>

            {(selectedResourceIds.length > 0 || selectedProjectIds.length > 0) && (
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setSelectedResourceIds([]);
                    setSelectedProjectIds([]);
                    setResourceSearchTerm('');
                    setProjectSearchTerm('');
                  }}
                  sx={{ mb: 1 }}
                >
                  Clear Filters
                </Button>
              </Box>
            )}

            {(selectedResourceIds.length > 0 || selectedProjectIds.length > 0) && (
              <Alert severity="info" sx={{ mt: 1 }}>
                <Typography variant="body2">
                  <strong>Note:</strong> Additional filters applied. Showing allocations matching selected resources and/or projects.
                </Typography>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Load All Warning Dialog */}
      <Dialog open={showLoadAllWarning} onClose={() => setShowLoadAllWarning(false)}>
        <DialogTitle>Load All Results?</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="medium" gutterBottom>
              Performance Warning
            </Typography>
            <Typography variant="body2">
              You are about to load <strong>all resources, projects, and allocations</strong> (up to {totalCount.toLocaleString()} total records).
              This may cause performance issues in the timeline/kanban view.
            </Typography>
          </Alert>
          <Typography variant="body2" paragraph>
            <strong>Recommendations:</strong>
          </Typography>
          <Box component="ul" sx={{ pl: 2 }}>
            <li>
              <Typography variant="body2">Use the resource/project filters above to narrow results</Typography>
            </li>
            <li>
              <Typography variant="body2">Apply additional domain, business decision, or fiscal year filters</Typography>
            </li>
            <li>
              <Typography variant="body2">Use table view for browsing large datasets</Typography>
            </li>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLoadAllWarning(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={() => {
              setLoadAllResults(true);
              setShowLoadAllWarning(false);
            }}
          >
            Load All Anyway
          </Button>
        </DialogActions>
      </Dialog>

      {/* Render appropriate view */}
      {currentView === 'timeline' && !showScopingWarning && (
        <>
          <TimelineView
            resources={displayResources}
            projects={displayProjects}
            allocations={allocations}
            scenarioId={activeScenario?.id || 0}
            onRefresh={fetchData}
            onEdit={handleOpenDialog}
            onDelete={handleDelete}
          />
        </>
      )}

      {currentView === 'kanban' && !showScopingWarning && (
        <>
          <KanbanView
            resources={displayResources}
            projects={displayProjects}
            allocations={allocations}
            scenarioId={activeScenario?.id || 0}
            onRefresh={fetchData}
          />
        </>
      )}

      {currentView === 'table' && (
        <>
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={0.5} mb={1}>
                <Typography color="text.secondary" variant="body2">
                  Total Allocations
                </Typography>
                <Tooltip
                  title="Total number of allocation records in the current scenario. This counts each resource-project assignment separately. A single resource can have multiple allocations if assigned to multiple projects."
                  arrow
                >
                  <InfoOutlined sx={{ fontSize: 16, color: 'text.disabled', cursor: 'help' }} />
                </Tooltip>
              </Box>
              <Typography variant="h4">{summary.totalAllocations}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={0.5} mb={1}>
                <Typography color="text.secondary" variant="body2">
                  Over-Allocated Resources
                </Typography>
                <Tooltip
                  title="Number of resources with total allocation percentage exceeding 100%. Calculated by summing all allocation percentages for each resource across all their projects."
                  arrow
                >
                  <InfoOutlined sx={{ fontSize: 16, color: 'text.disabled', cursor: 'help' }} />
                </Tooltip>
              </Box>
              <Typography variant="h4" color="error">
                {summary.overAllocatedResources}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={0.5} mb={1}>
                <Typography color="text.secondary" variant="body2">
                  Poor Match Allocations
                </Typography>
                <Tooltip
                  title="Allocations with match score below 60. Match score compares resource capabilities (app/tech/role/proficiency) against project requirements. Lower scores indicate skill mismatches."
                  arrow
                >
                  <InfoOutlined sx={{ fontSize: 16, color: 'text.disabled', cursor: 'help' }} />
                </Tooltip>
              </Box>
              <Typography variant="h4" color="warning.main">
                {summary.poorMatchAllocations}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Match score &lt; 60
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={0.5} mb={1}>
                <Typography color="text.secondary" variant="body2">
                  Avg Match Score
                </Typography>
                <Tooltip
                  title="Average match score across all allocations that have scores. Calculated as the mean of all match scores. 80+ = Excellent, 60-79 = Good, 40-59 = Fair, <40 = Poor."
                  arrow
                >
                  <InfoOutlined sx={{ fontSize: 16, color: 'text.disabled', cursor: 'help' }} />
                </Tooltip>
              </Box>
              <Typography variant="h4" color="success.main">
                {summary.avgMatchScore > 0 ? summary.avgMatchScore.toFixed(1) : '-'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Cross-Domain Metrics - Only show when domain or business decision filter is active */}
        {(filters.domainId !== '' || filters.businessDecision !== '') && (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'info.lighter' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={0.5} mb={1}>
                    <Typography color="text.secondary" variant="body2">
                      Resources Working Cross-Domain
                    </Typography>
                    <Tooltip
                      title="Unique resources from the filtered domain/decision who are working on projects in OTHER domains/decisions. This shows resource sharing going outbound from your selection."
                      arrow
                    >
                      <InfoOutlined sx={{ fontSize: 16, color: 'text.disabled', cursor: 'help' }} />
                    </Tooltip>
                  </Box>
                  <Typography variant="h4" color="info.main">
                    {outboundCrossDomain}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    From selected filter working in other domains
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'secondary.lighter' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={0.5} mb={1}>
                    <Typography color="text.secondary" variant="body2">
                      External Resources Contributing
                    </Typography>
                    <Tooltip
                      title="Unique resources from OTHER domains/decisions who are working on projects in your filtered selection. This shows resource sharing coming inbound to your selection."
                      arrow
                    >
                      <InfoOutlined sx={{ fontSize: 16, color: 'text.disabled', cursor: 'help' }} />
                    </Tooltip>
                  </Box>
                  <Typography variant="h4" color="secondary.main">
                    {inboundCrossDomain}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    From other domains working in selected filter
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </>
        )}
      </Grid>

      {/* Allocations Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Active Allocations
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell align="right" sx={{ minWidth: 120 }}>Actions</TableCell>
                  <TableCell>Resource</TableCell>
                  <TableCell>Resource Domain</TableCell>
                  <TableCell>Project</TableCell>
                  <TableCell>Project Domain</TableCell>
                  <TableCell>Business Decision</TableCell>
                  <TableCell>Resource Capability</TableCell>
                  <TableCell>Project Requirement</TableCell>
                  <TableCell>Match Score</TableCell>
                  <TableCell>Allocation %</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Timeline</TableCell>
                </TableRow>
                {/* Filter Row */}
                <TableRow>
                  <TableCell />
                  <TableCell>
                    <TextField
                      size="small"
                      placeholder="Filter by name"
                      value={filters.resource}
                      onChange={(e) => setFilters({ ...filters, resource: e.target.value })}
                      fullWidth
                    />
                  </TableCell>
                  <TableCell>
                    <Autocomplete
                      size="small"
                      options={['', ...domains.map(d => d.id.toString())]}
                      value={filters.domainId || ''}
                      onChange={(_, newValue) => setFilters({ ...filters, domainId: newValue || '' })}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="All Domains"
                          size="small"
                        />
                      )}
                      getOptionLabel={(option) => {
                        if (option === '') return 'All Domains';
                        const domain = domains.find(d => d.id.toString() === option);
                        return domain?.name || option;
                      }}
                      fullWidth
                    />
                  </TableCell>
                  <TableCell>
                    <Autocomplete
                      size="small"
                      multiple
                      options={projects.map(p => p.name)}
                      value={filters.project}
                      onChange={(_, newValue) => setFilters({ ...filters, project: newValue })}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder={filters.project.length > 0 ? `${filters.project.length} selected` : 'All Projects'}
                          size="small"
                        />
                      )}
                      fullWidth
                    />
                  </TableCell>
                  <TableCell />
                  <TableCell>
                    <Autocomplete
                      size="small"
                      options={['', ...Array.from(new Set(projects.map(p => p.businessDecision).filter(Boolean))) as string[]]}
                      value={filters.businessDecision || ''}
                      onChange={(_, newValue) => setFilters({ ...filters, businessDecision: newValue || '' })}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="All Decisions"
                          size="small"
                        />
                      )}
                      getOptionLabel={(option) => option === '' ? 'All Decisions' : option}
                      fullWidth
                    />
                  </TableCell>
                  <TableCell />
                  <TableCell />
                  <TableCell>
                    <Autocomplete
                      size="small"
                      options={['', 'excellent', 'good', 'fair', 'poor']}
                      value={filters.matchScore || ''}
                      onChange={(_, newValue) => setFilters({ ...filters, matchScore: newValue || '' })}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="All Match Scores"
                          size="small"
                        />
                      )}
                      getOptionLabel={(option) => {
                        if (option === '') return 'All Match Scores';
                        if (option === 'excellent') return 'Excellent (80+)';
                        if (option === 'good') return 'Good (60-79)';
                        if (option === 'fair') return 'Fair (40-59)';
                        if (option === 'poor') return 'Poor (<40)';
                        return option;
                      }}
                      fullWidth
                    />
                  </TableCell>
                  <TableCell />
                  <TableCell>
                    <Autocomplete
                      size="small"
                      multiple
                      options={['Shared', 'Dedicated', 'On-Demand']}
                      value={filters.allocationType}
                      onChange={(_, newValue) => setFilters({ ...filters, allocationType: newValue })}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder={filters.allocationType.length > 0 ? `${filters.allocationType.length} selected` : 'All Types'}
                          size="small"
                        />
                      )}
                      fullWidth
                    />
                  </TableCell>
                  <TableCell />
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {!Array.isArray(allocations) || allocations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} align="center">
                      <Typography variant="body2" color="text.secondary" py={3}>
                        No allocations found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  allocations.map((allocation) => {
                    // Check if this is a cross-domain allocation
                    const isCrossDomain = allocation.resource?.domainId !== allocation.project?.domainId;

                    return (
                    <TableRow
                      key={allocation.id}
                      hover
                      sx={{
                        bgcolor:
                          allocation.matchScore && allocation.matchScore < 60
                            ? 'error.lighter'
                            : isCrossDomain
                            ? 'info.lighter'
                            : 'inherit',
                      }}
                    >
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(allocation)}
                          color="primary"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(allocation.id)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {allocation.resource?.firstName} {allocation.resource?.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {allocation.resource?.employeeId}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {allocation.resource?.domain?.name || '-'}
                        </Typography>
                        {isCrossDomain && (
                          <Chip
                            label="Cross-Domain"
                            size="small"
                            color="info"
                            variant="outlined"
                            sx={{ mt: 0.5 }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{allocation.project?.name}</Typography>
                        <Chip
                          label={allocation.project?.status}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ mt: 0.5 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {allocation.project?.domain?.name || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {allocation.project?.businessDecision || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {allocation.resourceCapability?.app && allocation.resourceCapability?.technology && allocation.resourceCapability?.role ? (
                          <Box>
                            <Chip
                              label={`${allocation.resourceCapability.app.code}/${allocation.resourceCapability.technology.code}/${allocation.resourceCapability.role.code}`}
                              size="small"
                              color={
                                allocation.resourceCapability.isPrimary ? 'primary' : 'default'
                              }
                            />
                            <Typography variant="caption" display="block" mt={0.5}>
                              {allocation.resourceCapability.proficiencyLevel}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            {allocation.resourceCapability ? 'Capability linked' : 'No capability linked'}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {allocation.projectRequirement?.app && allocation.projectRequirement?.technology && allocation.projectRequirement?.role ? (
                          <Box>
                            <Chip
                              label={`${allocation.projectRequirement.app.code}/${allocation.projectRequirement.technology.code}/${allocation.projectRequirement.role.code}`}
                              size="small"
                              variant="outlined"
                            />
                            <Typography variant="caption" display="block" mt={0.5}>
                              Need: {allocation.projectRequirement.proficiencyLevel} ({allocation.projectRequirement.fulfilledCount}/{allocation.projectRequirement.requiredCount})
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            {allocation.projectRequirement ? 'Requirement linked' : 'No requirement linked'}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {allocation.matchScore ? (
                          <Tooltip title={getMatchScoreLabel(allocation.matchScore)}>
                            <Box display="flex" alignItems="center" gap={1}>
                              {getMatchScoreIcon(allocation.matchScore)}
                              <Box sx={{ width: 60 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={allocation.matchScore}
                                  color={getMatchScoreColor(allocation.matchScore) as any}
                                  sx={{ height: 8, borderRadius: 1 }}
                                />
                              </Box>
                              <Typography variant="caption" fontWeight="medium">
                                {allocation.matchScore}
                              </Typography>
                            </Box>
                          </Tooltip>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${allocation.allocationPercentage}%`}
                          size="small"
                          color="info"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip label={allocation.allocationType} size="small" variant="outlined" />
                      </TableCell>
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
                    </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination Controls */}
          <Pagination
            page={page}
            pageSize={pageSize}
            totalItems={totalCount}
            totalPages={Math.ceil(totalCount / pageSize) || 1}
            startIndex={(page - 1) * pageSize}
            endIndex={Math.min(page * pageSize, totalCount)}
            onPageChange={setPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(1); // Reset to page 1 when page size changes
            }}
            onFirstPage={() => setPage(1)}
            onLastPage={() => setPage(Math.ceil(totalCount / pageSize) || 1)}
            onNextPage={() => setPage(Math.min(page + 1, Math.ceil(totalCount / pageSize) || 1))}
            onPreviousPage={() => setPage(Math.max(page - 1, 1))}
            hasNextPage={page < (Math.ceil(totalCount / pageSize) || 1)}
            hasPreviousPage={page > 1}
          />
        </CardContent>
      </Card>

      {/* Poor Matches Alert */}
      {poorMatchAllocations.length > 0 && (
        <Alert severity="warning" sx={{ mt: 3 }}>
          <Typography variant="body2" fontWeight="medium">
            {poorMatchAllocations.length} allocation(s) have match scores below 60
          </Typography>
          <Typography variant="caption">
            Consider reviewing these allocations to ensure resources have the right capabilities for
            project requirements.
          </Typography>
        </Alert>
      )}

      {/* Over-allocation Alert */}
      {overAllocatedResources.length > 0 && (
        <Alert severity="error" sx={{ mt: 2 }}>
          <Typography variant="body2" fontWeight="medium">
            {overAllocatedResources.length} resource(s) are allocated over 100%
          </Typography>
          <Typography variant="caption">
            {overAllocatedResources
              .map(
                (stat: any) =>
                  `${stat.resource?.firstName} ${stat.resource?.lastName} (${Math.round(stat.totalAllocation)}%)`
              )
              .join(', ')}
          </Typography>
        </Alert>
      )}
        </>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editMode ? 'Edit Allocation' : 'Add Allocation'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Autocomplete
                fullWidth
                options={resources}
                getOptionLabel={(option) =>
                  option?.firstName && option?.lastName && option?.employeeId
                    ? `${option.firstName} ${option.lastName} (${option.employeeId})`
                    : ''
                }
                value={resources.find(r => r.id === currentAllocation.resourceId) || null}
                onChange={(_, newValue) => {
                  console.log('Autocomplete onChange fired! newValue:', newValue);
                  if (newValue) {
                    console.log('newValue exists, proceeding with resource change');
                    // Ensure selected resource is in the resources array for proper value binding
                    if (!resources.some(r => r.id === newValue.id)) {
                      console.log('Adding resource to resources array');
                      setResources(prev => [...prev, newValue]);
                    }
                    handleResourceChange(newValue.id);
                  } else {
                    console.log('newValue is null/undefined');
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Step 1: Select Resource"
                    required
                    placeholder="Who are you allocating to this project?"
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {option.firstName} {option.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.employeeId} • {option.domain?.name || 'No domain'}
                      </Typography>
                    </Box>
                  </li>
                )}
                isOptionEqualToValue={(option, value) => option.id === value.id}
              />
            </Grid>

            {/* Step 2: Select Capability (shows after resource is selected) */}
            <Grid item xs={12}>
              <Autocomplete
                fullWidth
                options={selectedResourceCapabilities}
                getOptionLabel={(option) =>
                  option?.app && option?.technology && option?.role
                    ? `${option.app.name} / ${option.technology.name} / ${option.role.name}`
                    : ''
                }
                value={selectedResourceCapabilities.find(c => c.id === currentAllocation.resourceCapabilityId) || null}
                onChange={(_, newValue) => {
                  handleCapabilityChange(newValue?.id);
                }}
                disabled={!currentAllocation.resourceId}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Step 2: Select Resource Capability"
                    placeholder="What skill should this resource use?"
                    helperText={
                      !currentAllocation.resourceId
                        ? 'Select a resource first'
                        : selectedResourceCapabilities.length === 0
                        ? 'This resource has no capabilities defined'
                        : `${selectedResourceCapabilities.length} skill(s) available`
                    }
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Box sx={{ width: '100%' }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {option.app.code} / {option.technology.code} / {option.role.code}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.proficiencyLevel}
                          </Typography>
                        </Box>
                        {option.isPrimary && (
                          <Chip label="Primary" size="small" color="primary" variant="outlined" />
                        )}
                      </Box>
                    </Box>
                  </li>
                )}
                isOptionEqualToValue={(option, value) => option.id === value.id}
              />
            </Grid>

            {/* Match Score Filter Slider - Only show when capability is selected and projects are loaded */}
            {currentAllocation.resourceCapabilityId && availableProjects.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="body2" gutterBottom>
                  Minimum Match Score: {minMatchScore}% (showing {availableProjects.filter(p => p.matchScore >= minMatchScore).length} of {availableProjects.length} projects)
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

            {/* Step 3: Select Project (shows after capability is selected) */}
            <Grid item xs={12}>
              <Autocomplete
                fullWidth
                options={availableProjects.filter(p => p.matchScore >= minMatchScore)}
                getOptionLabel={(option) =>
                  option?.name && option?.matchScore !== undefined
                    ? `${option.name} (${option.matchScore}% match)`
                    : ''
                }
                value={availableProjects.find(p => p.id === currentAllocation.projectId) || null}
                onChange={(_, newValue) => {
                  if (newValue) {
                    handleProjectChange(newValue.id);
                    // Auto-select the best matching requirement
                    if (newValue.bestRequirement) {
                      setCurrentAllocation(prev => ({
                        ...prev,
                        projectId: newValue.id,
                        projectRequirementId: newValue.bestRequirement!.id,
                        startDate: newValue.startDate,
                        endDate: newValue.endDate,
                      }));
                    }
                  }
                }}
                disabled={!currentAllocation.resourceCapabilityId}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Step 3: Select Project"
                    required
                    placeholder="Which project needs this skill?"
                    helperText={
                      !currentAllocation.resourceCapabilityId
                        ? 'Select a capability first to see matching projects'
                        : availableProjects.length === 0
                        ? 'Loading matching projects...'
                        : `${availableProjects.filter(p => p.matchScore >= minMatchScore).length} project(s) match this capability`
                    }
                  />
                )}
                renderOption={(props, option) => {
                  const matchIcon = option.matchScore >= 80 ? '✓' :
                                   option.matchScore >= 60 ? '⚠' :
                                   option.matchScore >= 40 ? '△' : '✗';
                  const matchColor = option.matchScore >= 80 ? 'success' :
                                   option.matchScore >= 60 ? 'primary' :
                                   option.matchScore >= 40 ? 'warning' : 'error';
                  const matchLabel = option.matchScore >= 80 ? 'Excellent Match' :
                                    option.matchScore >= 60 ? 'Good Match' :
                                    option.matchScore >= 40 ? 'Fair Match' : 'Poor Match';
                  return (
                    <li {...props} key={option.id}>
                      <Box sx={{ width: '100%' }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                          <Box flex={1}>
                            <Typography variant="body2" fontWeight="medium">
                              {matchIcon} {option.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {option.status} • {option.domain?.name || 'No domain'}
                            </Typography>
                          </Box>
                          <Tooltip title={matchLabel}>
                            <Chip label={`${option.matchScore}%`} color={matchColor as any} size="small" />
                          </Tooltip>
                        </Box>
                        {option.bestRequirement && (
                          <Box sx={{ bgcolor: 'action.hover', p: 0.5, borderRadius: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              Requires: {option.bestRequirement.app.code}/{option.bestRequirement.technology.code}/{option.bestRequirement.role.code} - {option.bestRequirement.proficiencyLevel}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Staffed: {option.bestRequirement.fulfilledCount}/{option.bestRequirement.requiredCount}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </li>
                  );
                }}
                isOptionEqualToValue={(option, value) => option.id === value.id}
              />
            </Grid>

            {/* Show auto-matched requirement info */}
            {currentAllocation.projectRequirementId && (
              <Grid item xs={12}>
                <Box sx={{ bgcolor: 'success.lighter', p: 2, borderRadius: 1 }}>
                  <Typography variant="body2" fontWeight="medium" color="success.dark" gutterBottom>
                    ✓ Best Matching Project Requirement (Auto-selected)
                  </Typography>
                  {(() => {
                    const selectedReq = selectedProjectRequirements.find(r => r.id === currentAllocation.projectRequirementId) ||
                      availableProjects.find(p => p.id === currentAllocation.projectId)?.bestRequirement;
                    if (selectedReq && selectedReq.app && selectedReq.technology && selectedReq.role) {
                      return (
                        <Box>
                          <Typography variant="body2">
                            {selectedReq.app.code} / {selectedReq.technology.code} / {selectedReq.role.code}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Required Proficiency: {selectedReq.proficiencyLevel} • Staffed: {selectedReq.fulfilledCount}/{selectedReq.requiredCount}
                          </Typography>
                        </Box>
                      );
                    }
                    return null;
                  })()}
                </Box>
              </Grid>
            )}

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Allocation %"
                value={currentAllocation.allocationPercentage || 50}
                onChange={(e) =>
                  updateAllocation({ allocationPercentage: parseInt(e.target.value) })
                }
                inputProps={{ min: 1, max: 100 }}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Allocation Type"
                value={currentAllocation.allocationType || 'Shared'}
                onChange={(e) =>
                  updateAllocation({ allocationType: e.target.value })
                }
                required
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
                  updateAllocation({ startDate: e.target.value })
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
                  updateAllocation({ endDate: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!currentAllocation.resourceId || !currentAllocation.projectId}
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

export default ResourceAllocation;
