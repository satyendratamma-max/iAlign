import { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Card,
  CardContent,
  LinearProgress,
  Avatar,
  Grid,
  Divider,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  useDraggable,
  useDroppable,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
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
  requirements?: Requirement[];
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

interface KanbanViewProps {
  resources: Resource[];
  projects: Project[];
  allocations: Allocation[];
  scenarioId: number;
  onRefresh: () => void;
}

// Draggable Resource Card (also droppable for projects)
const DraggableResourceCard = ({
  resource,
  totalAllocation,
}: {
  resource: Resource;
  totalAllocation: number;
}) => {
  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: `resource-${resource.id}`,
    data: { resource, type: 'resource' },
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `resource-drop-${resource.id}`,
    data: { resource },
  });

  // Combine refs
  const setNodeRef = (node: HTMLElement | null) => {
    setDragRef(node);
    setDropRef(node);
  };

  const availablePercentage = Math.max(0, 100 - totalAllocation);
  const isAvailable = availablePercentage > 0;

  return (
    <Card
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      sx={{
        cursor: 'grab',
        opacity: isDragging ? 0.5 : 1,
        mb: 1,
        bgcolor: isOver ? 'primary.lighter' : (isAvailable ? 'success.lighter' : 'action.hover'),
        border: isOver ? '2px solid' : '1px solid',
        borderColor: isOver ? 'primary.main' : (isAvailable ? 'success.main' : 'divider'),
        boxShadow: isOver ? 4 : 0,
        transform: isOver ? 'scale(1.03)' : 'scale(1)',
        '&:hover': {
          transform: isOver ? 'scale(1.03)' : 'translateY(-2px)',
          boxShadow: isOver ? 4 : 2,
        },
        transition: 'all 0.2s',
        position: 'relative',
      }}
    >
      <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
        <Box display="flex" alignItems="center" gap={0.75} mb={0.5}>
          <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main' }}>
            <PersonIcon sx={{ fontSize: '0.9rem' }} />
          </Avatar>
          <Box flex={1}>
            <Typography variant="caption" fontWeight="bold" fontSize="0.75rem">
              {resource.firstName} {resource.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" fontSize="0.65rem">
              {resource.employeeId}
            </Typography>
          </Box>
        </Box>

        <Chip
          label={resource.domain?.name || 'No domain'}
          size="small"
          sx={{ mb: 0.5, height: 18, fontSize: '0.65rem' }}
          variant="outlined"
        />

        <Box sx={{ mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary" fontSize="0.65rem">
            {availablePercentage}% available
          </Typography>
          <LinearProgress
            variant="determinate"
            value={totalAllocation}
            color={totalAllocation > 100 ? 'error' : totalAllocation > 75 ? 'warning' : 'success'}
            sx={{ height: 4, borderRadius: 0.5, mt: 0.25 }}
          />
        </Box>

        {resource.capabilities && resource.capabilities.length > 0 && (
          <Box display="flex" gap={0.5} flexWrap="wrap">
            {resource.capabilities.slice(0, 3).map((cap) => (
              <Chip
                key={cap.id}
                label={`${cap.role.code}`}
                size="small"
                color={cap.isPrimary ? 'primary' : 'default'}
                sx={{ fontSize: '0.6rem', height: 16 }}
              />
            ))}
          </Box>
        )}
        {isOver && (
          <Chip
            label="Drop Here!"
            color="primary"
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              fontWeight: 'bold',
              animation: 'pulse 1s infinite',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                '50%': { opacity: 0.8, transform: 'scale(1.1)' },
              },
            }}
          />
        )}
      </CardContent>
    </Card>
  );
};

// Allocated Resource Card (in middle column)
const AllocatedResourceCard = ({ resource, allocations }: { resource: Resource; allocations: Allocation[] }) => {
  const totalAllocation = allocations.reduce((sum, a) => sum + a.allocationPercentage, 0);

  return (
    <Card
      sx={{
        mb: 1,
        bgcolor: 'info.lighter',
        border: '1px solid',
        borderColor: 'info.main',
      }}
    >
      <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
        <Box display="flex" alignItems="center" gap={0.75} mb={0.5}>
          <Avatar sx={{ width: 24, height: 24, bgcolor: 'info.main' }}>
            <PersonIcon sx={{ fontSize: '0.9rem' }} />
          </Avatar>
          <Box flex={1}>
            <Typography variant="caption" fontWeight="bold" fontSize="0.75rem">
              {resource.firstName} {resource.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary" fontSize="0.65rem">
              {totalAllocation}% allocated
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 0.5 }} />

        {allocations.map((allocation) => (
          <Box key={allocation.id} sx={{ mb: 0.5 }}>
            <Typography variant="caption" fontWeight="medium" fontSize="0.7rem" noWrap>
              → {allocation.project?.name}
            </Typography>
            <Box display="flex" alignItems="center" gap={0.5}>
              <Chip
                label={`${allocation.allocationPercentage}%`}
                size="small"
                color="info"
                sx={{ fontSize: '0.6rem', height: 16 }}
              />
              {allocation.matchScore && (
                <Chip
                  label={`${allocation.matchScore}%`}
                  size="small"
                  color={allocation.matchScore >= 80 ? 'success' : allocation.matchScore >= 60 ? 'warning' : 'error'}
                  sx={{ fontSize: '0.6rem', height: 16 }}
                />
              )}
            </Box>
          </Box>
        ))}
      </CardContent>
    </Card>
  );
};

// Draggable Project Card (also droppable for resources)
const DraggableProjectCard = ({
  project,
  needsMoreResources,
}: {
  project: Project;
  needsMoreResources: boolean;
}) => {
  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: `project-${project.id}`,
    data: { project, type: 'project' },
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `project-drop-${project.id}`,
    data: { project },
  });

  // Combine refs
  const setNodeRef = (node: HTMLElement | null) => {
    setDragRef(node);
    setDropRef(node);
  };

  return (
    <Card
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      sx={{
        cursor: 'grab',
        opacity: isDragging ? 0.5 : 1,
        mb: 1,
        bgcolor: isOver ? 'primary.lighter' : (needsMoreResources ? 'warning.lighter' : 'success.lighter'),
        border: isOver ? '2px solid' : '1px solid',
        borderColor: isOver ? 'primary.main' : (needsMoreResources ? 'warning.main' : 'success.main'),
        boxShadow: isOver ? 4 : 0,
        transform: isOver ? 'scale(1.03)' : 'scale(1)',
        '&:hover': {
          transform: isOver ? 'scale(1.03)' : 'translateY(-2px)',
          boxShadow: isOver ? 4 : 2,
        },
        transition: 'all 0.2s',
        position: 'relative',
      }}
    >
      <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
        <Box display="flex" alignItems="center" gap={0.75} mb={0.5}>
          <Avatar sx={{ width: 24, height: 24, bgcolor: needsMoreResources ? 'warning.main' : 'success.main' }}>
            <AssignmentIcon sx={{ fontSize: '0.9rem' }} />
          </Avatar>
          <Box flex={1}>
            <Typography variant="caption" fontWeight="bold" noWrap fontSize="0.75rem">
              {project.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" fontSize="0.65rem">
              {project.status}
            </Typography>
          </Box>
        </Box>

        <Chip
          label={project.domain?.name || 'No domain'}
          size="small"
          sx={{ mb: 0.5, height: 18, fontSize: '0.65rem' }}
          variant="outlined"
        />

        {project.requirements && project.requirements.length > 0 && (
          <Box sx={{ mt: 0.5 }}>
            {project.requirements.slice(0, 2).map((req) => (
              <Box key={req.id} display="flex" justifyContent="space-between" alignItems="center" mb={0.25}>
                <Typography variant="caption" fontSize="0.65rem" noWrap sx={{ flex: 1, mr: 0.5 }}>
                  {req.role.code} - {req.proficiencyLevel}
                </Typography>
                <Chip
                  label={`${req.fulfilledCount}/${req.requiredCount}`}
                  size="small"
                  color={req.fulfilledCount >= req.requiredCount ? 'success' : 'error'}
                  sx={{ fontSize: '0.6rem', height: 16 }}
                />
              </Box>
            ))}
          </Box>
        )}

        {project.startDate && project.endDate && (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }} fontSize="0.65rem">
            {new Date(project.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -{' '}
            {new Date(project.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </Typography>
        )}
        {isOver && (
          <Chip
            label="Drop Here!"
            color="primary"
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              fontWeight: 'bold',
              animation: 'pulse 1s infinite',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                '50%': { opacity: 0.8, transform: 'scale(1.1)' },
              },
            }}
          />
        )}
      </CardContent>
    </Card>
  );
};

// Droppable Column
const DroppableColumn = ({
  id,
  title,
  icon,
  children,
}: {
  id: string;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <Paper
      ref={setNodeRef}
      sx={{
        p: 1.5,
        height: '100%',
        minHeight: 400,
        bgcolor: isOver ? 'primary.lighter' : 'action.hover',
        border: isOver ? '2px dashed' : '1px dashed',
        borderColor: isOver ? 'primary.main' : 'divider',
        boxShadow: isOver ? 3 : 0,
        transform: isOver ? 'scale(1.01)' : 'scale(1)',
        transition: 'all 0.2s',
        position: 'relative',
      }}
    >
      <Box display="flex" alignItems="center" gap={0.75} mb={1.5}>
        {icon}
        <Typography variant="subtitle1" fontWeight="bold" fontSize="0.9rem">
          {title}
        </Typography>
      </Box>
      <Box sx={{ maxHeight: 'calc(100vh - 400px)', overflowY: 'auto' }}>
        {children}
      </Box>
      {isOver && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: 'primary.main',
            color: 'white',
            px: 2,
            py: 1,
            borderRadius: 1,
            fontSize: '0.85rem',
            fontWeight: 'bold',
            boxShadow: 4,
            zIndex: 10,
            animation: 'bounce 0.5s infinite',
            '@keyframes bounce': {
              '0%, 100%': { transform: 'translate(-50%, -50%) scale(1)' },
              '50%': { transform: 'translate(-50%, -50%) scale(1.05)' },
            },
          }}
        >
          Drop Here!
        </Box>
      )}
    </Paper>
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

const KanbanView = ({ resources, projects, allocations, scenarioId, onRefresh }: KanbanViewProps) => {
  const [draggedItem, setDraggedItem] = useState<{ resource?: Resource; project?: Project } | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  // Calculate allocation totals per resource
  const allocationsByResource = useMemo(() => {
    return resources.reduce((acc, resource) => {
      acc[resource.id] = allocations.filter(a => a.resourceId === resource.id);
      return acc;
    }, {} as Record<number, Allocation[]>);
  }, [resources, allocations]);

  // Categorize resources
  const { availableResources, allocatedResources } = useMemo(() => {
    const available: Resource[] = [];
    const allocated: Resource[] = [];

    resources.forEach(resource => {
      const resourceAllocations = allocationsByResource[resource.id] || [];
      const totalAllocation = resourceAllocations.reduce((sum, a) => sum + a.allocationPercentage, 0);

      if (totalAllocation === 0 || totalAllocation < 75) {
        available.push(resource);
      }
      if (resourceAllocations.length > 0) {
        allocated.push(resource);
      }
    });

    return { availableResources: available, allocatedResources: allocated };
  }, [resources, allocationsByResource]);

  // Projects needing more resources
  const projectsNeedingResources = useMemo(() => {
    return projects.map(project => {
      const projectAllocations = allocations.filter(a => a.projectId === project.id);
      const requirements = project.requirements || [];

      const needsMore = requirements.some(req => req.fulfilledCount < req.requiredCount);

      return { project, needsMore, allocations: projectAllocations };
    });
  }, [projects, allocations]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const data = active.data.current;

    if (data?.resource) {
      setDraggedItem({ resource: data.resource });
    } else if (data?.project) {
      setDraggedItem({ project: data.project });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setDraggedItem(null);
      return;
    }

    const activeData = active.data.current;
    let resource: Resource | null = null;
    let project: Project | null = null;

    // Determine resource and project from the drag action
    if (activeData?.resource && over.data.current?.project) {
      // Resource dropped on project card
      resource = activeData.resource;
      project = over.data.current.project;
    } else if (activeData?.project && over.data.current?.resource) {
      // Project dropped on resource card
      project = activeData.project;
      resource = over.data.current.resource;
    } else if (activeData?.resource && over.id === 'projects-column') {
      // Resource dropped on projects column - need to pick first available project
      resource = activeData.resource;
      project = projectsNeedingResources[0]?.project || null;
    } else if (activeData?.project && (over.id === 'available-column' || over.id === 'allocated-column')) {
      // Project dropped on resources column - need to pick first available resource
      project = activeData.project;
      resource = availableResources[0] || null;
    }

    // Create allocation if both resource and project are identified
    if (resource && project) {
      await createAllocation(resource, project);
    }

    setDraggedItem(null);
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

  const getTotalAllocation = (resourceId: number) => {
    return (allocationsByResource[resourceId] || []).reduce((sum, a) => sum + a.allocationPercentage, 0);
  };

  return (
    <Box>
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <Grid container spacing={2}>
          {/* Available Resources Column */}
          <Grid item xs={12} md={4}>
            <DroppableColumn
              id="available-column"
              title="Available Resources"
              icon={<CheckCircleIcon color="success" />}
            >
              {availableResources.length === 0 ? (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                  No available resources
                </Typography>
              ) : (
                availableResources.map((resource) => (
                  <DraggableResourceCard
                    key={resource.id}
                    resource={resource}
                    totalAllocation={getTotalAllocation(resource.id)}
                  />
                ))
              )}
            </DroppableColumn>
          </Grid>

          {/* Allocated Resources Column */}
          <Grid item xs={12} md={4}>
            <DroppableColumn
              id="allocated-column"
              title="Allocated Resources"
              icon={<PersonIcon color="info" />}
            >
              {allocatedResources.length === 0 ? (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                  No allocated resources
                </Typography>
              ) : (
                allocatedResources.map((resource) => (
                  <AllocatedResourceCard
                    key={resource.id}
                    resource={resource}
                    allocations={allocationsByResource[resource.id] || []}
                  />
                ))
              )}
            </DroppableColumn>
          </Grid>

          {/* Projects Needing Resources Column */}
          <Grid item xs={12} md={4}>
            <DroppableColumn
              id="projects-column"
              title="Projects Needing Resources"
              icon={<AssignmentIcon color="warning" />}
            >
              {projectsNeedingResources.length === 0 ? (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                  No projects available
                </Typography>
              ) : (
                projectsNeedingResources.map(({ project, needsMore }) => (
                  <DraggableProjectCard
                    key={project.id}
                    project={project}
                    needsMoreResources={needsMore}
                  />
                ))
              )}
            </DroppableColumn>
          </Grid>
        </Grid>

        {/* Drag Overlay */}
        <DragOverlay>
          {draggedItem?.resource && (
            <Card sx={{ p: 1, bgcolor: 'success.main', color: 'white', minWidth: 150, opacity: 0.9 }}>
              <Typography variant="caption" fontWeight="bold" fontSize="0.75rem">
                {draggedItem.resource.firstName} {draggedItem.resource.lastName}
              </Typography>
            </Card>
          )}
          {draggedItem?.project && (
            <Card sx={{ p: 1, bgcolor: 'warning.main', color: 'white', minWidth: 150, opacity: 0.9 }}>
              <Typography variant="caption" fontWeight="bold" fontSize="0.75rem">
                {draggedItem.project.name}
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

export default KanbanView;
