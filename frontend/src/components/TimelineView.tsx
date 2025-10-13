import { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Tooltip,
  Card,
  IconButton,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  useDraggable,
  useDroppable,
  DragStartEvent,
} from '@dnd-kit/core';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { startOfMonth, endOfMonth, eachMonthOfInterval, format, differenceInDays } from 'date-fns';
import axios from 'axios';

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

interface Resource {
  id: number;
  employeeId: string;
  firstName?: string;
  lastName?: string;
  domainId?: number;
  capabilities?: Capability[];
  domain?: { id: number; name: string };
}

interface Project {
  id: number;
  name: string;
  status: string;
  startDate?: string;
  endDate?: string;
  domainId?: number;
  businessDecision?: string;
  domain?: { id: number; name: string };
}

interface Allocation {
  id: number;
  projectId: number;
  resourceId: number;
  allocationPercentage: number;
  matchScore?: number;
  startDate?: string;
  endDate?: string;
  resource?: Resource;
  project?: Project;
}

interface TimelineViewProps {
  resources: Resource[];
  projects: Project[];
  allocations: Allocation[];
  scenarioId: number;
  onRefresh: () => void;
  onEdit: (allocation?: Allocation) => void;
  onDelete: (id: number) => void;
}

// Draggable Project Card
const DraggableProject = ({ project }: { project: Project }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `project-${project.id}`,
    data: { project },
  });

  return (
    <Card
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      sx={{
        p: 1.5,
        cursor: 'grab',
        opacity: isDragging ? 0.5 : 1,
        bgcolor: 'primary.lighter',
        border: '1px solid',
        borderColor: 'primary.main',
        '&:hover': {
          bgcolor: 'primary.light',
          transform: 'translateY(-2px)',
          boxShadow: 3,
        },
        transition: 'all 0.2s',
        minWidth: 150,
      }}
    >
      <Typography variant="body2" fontWeight="medium" noWrap>
        {project.name}
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block">
        {project.domain?.name || 'No domain'}
      </Typography>
      {project.startDate && project.endDate && (
        <Typography variant="caption" color="text.secondary" display="block">
          {format(new Date(project.startDate), 'MMM yy')} -{' '}
          {format(new Date(project.endDate), 'MMM yy')}
        </Typography>
      )}
    </Card>
  );
};

// Allocation Bar
const AllocationBar = ({
  allocation,
  timelineStart,
  timelineEnd,
  onEdit,
  onDelete,
}: {
  allocation: Allocation;
  timelineStart: Date;
  timelineEnd: Date;
  onEdit: (allocation?: Allocation) => void;
  onDelete: (id: number) => void;
}) => {
  if (!allocation.startDate || !allocation.endDate) return null;

  const allocationStart = new Date(allocation.startDate);
  const allocationEnd = new Date(allocation.endDate);

  // Calculate position and width as percentage
  const totalDays = differenceInDays(timelineEnd, timelineStart);
  const startOffset = Math.max(0, differenceInDays(allocationStart, timelineStart));
  const duration = differenceInDays(allocationEnd, allocationStart);

  const left = (startOffset / totalDays) * 100;
  const width = (duration / totalDays) * 100;

  const getBarColor = () => {
    if (!allocation.matchScore) return '#9ca3af';
    if (allocation.matchScore >= 80) return '#22c55e';
    if (allocation.matchScore >= 60) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <Tooltip
      title={
        <Box>
          <Typography variant="caption" fontWeight="bold">
            {allocation.project?.name}
          </Typography>
          <Typography variant="caption" display="block">
            {allocation.allocationPercentage}% allocation
          </Typography>
          <Typography variant="caption" display="block">
            {format(allocationStart, 'MMM dd, yyyy')} - {format(allocationEnd, 'MMM dd, yyyy')}
          </Typography>
          {allocation.matchScore && (
            <Typography variant="caption" display="block">
              Match: {allocation.matchScore}%
            </Typography>
          )}
        </Box>
      }
    >
      <Box
        sx={{
          position: 'absolute',
          left: `${left}%`,
          width: `${width}%`,
          height: 32,
          bgcolor: getBarColor(),
          borderRadius: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1,
          color: 'white',
          fontSize: '0.75rem',
          fontWeight: 'medium',
          cursor: 'pointer',
          '&:hover': {
            opacity: 0.9,
            '& .action-buttons': {
              display: 'flex',
            },
          },
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        }}
      >
        <Typography variant="caption" noWrap sx={{ flex: 1, color: 'white' }}>
          {allocation.project?.name} ({allocation.allocationPercentage}%)
        </Typography>
        <Box className="action-buttons" sx={{ display: 'none', gap: 0.5 }}>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(allocation);
            }}
            sx={{ color: 'white', p: 0.25 }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(allocation.id);
            }}
            sx={{ color: 'white', p: 0.25 }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Tooltip>
  );
};

// Resource Row with Drop Zone
const ResourceRow = ({
  resource,
  allocations,
  timelineStart,
  timelineEnd,
  onEdit,
  onDelete,
}: {
  resource: Resource;
  allocations: Allocation[];
  timelineStart: Date;
  timelineEnd: Date;
  onEdit: (allocation?: Allocation) => void;
  onDelete: (id: number) => void;
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `resource-${resource.id}`,
    data: { resource },
  });

  const totalAllocation = allocations.reduce((sum, a) => sum + a.allocationPercentage, 0);
  const isOverAllocated = totalAllocation > 100;
  const availablePercentage = Math.max(0, 100 - totalAllocation);

  return (
    <Box
      ref={setNodeRef}
      sx={{
        display: 'flex',
        ...(isOver
          ? {
              border: '2px solid',
              borderColor: 'primary.main',
            }
          : {
              borderBottom: '1px solid',
              borderColor: 'divider',
            }),
        bgcolor: isOver ? 'primary.lighter' : 'transparent',
        transition: 'all 0.2s',
        boxShadow: isOver ? 4 : 0,
        transform: isOver ? 'scale(1.01)' : 'scale(1)',
      }}
    >
      {/* Resource Info Column */}
      <Box
        sx={{
          width: 250,
          p: 2,
          borderRight: '1px solid',
          borderColor: isOver ? 'primary.main' : 'divider',
          bgcolor: isOver ? 'primary.lighter' : 'background.paper',
          transition: 'all 0.2s',
        }}
      >
        <Typography variant="body2" fontWeight="medium">
          {resource.firstName} {resource.lastName}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          {resource.employeeId}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          {resource.domain?.name || 'No domain'}
        </Typography>
        <Box sx={{ mt: 1 }}>
          <Chip
            label={`${availablePercentage}% Available`}
            size="small"
            color={isOverAllocated ? 'error' : availablePercentage > 50 ? 'success' : 'warning'}
          />
        </Box>
        {resource.capabilities && resource.capabilities.length > 0 && (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
            {resource.capabilities.slice(0, 2).map(c => c.role.code).join(', ')}
          </Typography>
        )}
      </Box>

      {/* Timeline Column */}
      <Box
        sx={{
          flex: 1,
          position: 'relative',
          height: 70,
          p: 2,
          bgcolor: isOver ? 'primary.lighter' : 'transparent',
          transition: 'background-color 0.2s',
        }}
      >
        {allocations.map((allocation) => (
          <AllocationBar
            key={allocation.id}
            allocation={allocation}
            timelineStart={timelineStart}
            timelineEnd={timelineEnd}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
        {isOver && (
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: 'primary.main',
              color: 'white',
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
              fontSize: '0.75rem',
              fontWeight: 'bold',
              animation: 'pulse 1s infinite',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.7 },
              },
            }}
          >
            Drop Here
          </Box>
        )}
      </Box>
    </Box>
  );
};

// Helper function to find best matching capability
const findBestCapabilityMatch = async (resourceId: number, projectId: number) => {
  try {
    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    const [capRes, reqRes] = await Promise.all([
      axios.get(`${API_URL}/resource-capabilities?resourceId=${resourceId}`, config),
      axios.get(`${API_URL}/project-requirements/project/${projectId}`, config),
    ]);

    const capabilities = capRes.data.data || [];
    const requirements = reqRes.data.data || [];

    if (capabilities.length === 0 || requirements.length === 0) {
      return { capabilityId: undefined, requirementId: undefined };
    }

    // Find best match
    const bestMatch = capabilities.find((cap: any) =>
      requirements.some(
        (req: any) =>
          req.appId === cap.appId &&
          req.technologyId === cap.technologyId &&
          req.roleId === cap.roleId
      )
    );

    if (bestMatch) {
      const matchingReq = requirements.find(
        (req: any) =>
          req.appId === bestMatch.appId &&
          req.technologyId === bestMatch.technologyId &&
          req.roleId === bestMatch.roleId
      );
      return { capabilityId: bestMatch.id, requirementId: matchingReq?.id };
    }

    // No perfect match, use primary capability or first available
    const primary = capabilities.find((c: any) => c.isPrimary);
    return {
      capabilityId: primary?.id || capabilities[0]?.id,
      requirementId: requirements[0]?.id,
    };
  } catch (error) {
    console.error('Error finding capability match:', error);
    return { capabilityId: undefined, requirementId: undefined };
  }
};

const TimelineView = ({
  resources,
  projects,
  allocations,
  scenarioId,
  onRefresh,
  onEdit,
  onDelete,
}: TimelineViewProps) => {
  const [draggedProject, setDraggedProject] = useState<Project | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  // Calculate timeline range (12 months from now)
  const timelineStart = useMemo(() => startOfMonth(new Date()), []);
  const timelineEnd = useMemo(() => endOfMonth(new Date(new Date().setMonth(new Date().getMonth() + 11))), []);
  const months = useMemo(() => eachMonthOfInterval({ start: timelineStart, end: timelineEnd }), [timelineStart, timelineEnd]);

  // Get unallocated projects (projects with no allocations or not fully staffed)
  const unallocatedProjects = useMemo(() => {
    return projects.filter(project => {
      const projectAllocations = allocations.filter(a => a.projectId === project.id);
      return projectAllocations.length === 0 || projectAllocations.length < 3; // Arbitrary threshold
    });
  }, [projects, allocations]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.project) {
      setDraggedProject(active.data.current.project);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.data.current?.project && over.data.current?.resource) {
      const project = active.data.current.project as Project;
      const resource = over.data.current.resource as Resource;

      // Create allocation automatically with smart defaults
      await createAllocation(resource, project);
    }

    setDraggedProject(null);
  };

  const createAllocation = async (resource: Resource, project: Project) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Find best matching capability/requirement
      const { capabilityId, requirementId } = await findBestCapabilityMatch(resource.id, project.id);

      const allocationData = {
        resourceId: resource.id,
        projectId: project.id,
        scenarioId,
        allocationPercentage: 100, // Default 100%
        allocationType: 'Shared', // Default Shared
        startDate: project.startDate,
        endDate: project.endDate,
        resourceCapabilityId: capabilityId,
        projectRequirementId: requirementId,
        isActive: true,
      };

      await axios.post(`${API_URL}/allocations`, allocationData, config);

      setSnackbarMessage(`Successfully allocated ${resource.firstName} ${resource.lastName} to ${project.name}`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

      // Refresh data
      onRefresh();
    } catch (error: any) {
      console.error('Error creating allocation:', error);
      setSnackbarMessage(`Failed to create allocation: ${error.response?.data?.message || error.message}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  // Group allocations by resource
  const allocationsByResource = useMemo(() => {
    return resources.reduce((acc, resource) => {
      acc[resource.id] = allocations.filter(a => a.resourceId === resource.id);
      return acc;
    }, {} as Record<number, Allocation[]>);
  }, [resources, allocations]);

  return (
    <Box>
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {/* Timeline Header */}
        <Box sx={{ display: 'flex', borderBottom: 2, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Box sx={{ width: 250, p: 2, borderRight: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" fontWeight="bold">
              Resources
            </Typography>
          </Box>
          <Box sx={{ flex: 1, display: 'flex' }}>
            {months.map((month, index) => (
              <Box
                key={index}
                sx={{
                  flex: 1,
                  p: 1,
                  textAlign: 'center',
                  borderRight: index < months.length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="caption" fontWeight="medium">
                  {format(month, 'MMM yyyy')}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Resource Rows */}
        <Box sx={{ maxHeight: 'calc(100vh - 500px)', overflowY: 'auto' }}>
          {resources.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No resources available
              </Typography>
            </Box>
          ) : (
            resources.map((resource) => (
              <ResourceRow
                key={resource.id}
                resource={resource}
                allocations={allocationsByResource[resource.id] || []}
                timelineStart={timelineStart}
                timelineEnd={timelineEnd}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          )}
        </Box>

        {/* Unallocated Projects Pool */}
        <Paper sx={{ p: 2, mt: 2, bgcolor: 'grey.50' }}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            Available Projects (Drag to allocate)
          </Typography>
          {unallocatedProjects.length === 0 ? (
            <Alert severity="success">All projects are allocated!</Alert>
          ) : (
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
              {unallocatedProjects.map((project) => (
                <DraggableProject key={project.id} project={project} />
              ))}
            </Box>
          )}
        </Paper>

        {/* Drag Overlay */}
        <DragOverlay>
          {draggedProject && (
            <Card sx={{ p: 1.5, bgcolor: 'primary.main', color: 'white', minWidth: 150, opacity: 0.9 }}>
              <Typography variant="body2" fontWeight="medium">
                {draggedProject.name}
              </Typography>
            </Card>
          )}
        </DragOverlay>
      </DndContext>

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbarSeverity} onClose={() => setSnackbarOpen(false)}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TimelineView;
