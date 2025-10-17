import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  LinearProgress,
  MenuItem,
  Checkbox,
  IconButton,
  Tabs,
  Tab,
  Card,
  CardContent,
  Snackbar,
  Alert,
  Tooltip,
  Divider,
  Menu,
  TableSortLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Description as TemplateIcon,
  People as PeopleIcon,
  ViewList as ViewListIcon,
  Timeline as TimelineIcon,
  Clear as ClearIcon,
  Hub as HubIcon,
  ViewKanban as ViewKanbanIcon,
  Undo as UndoIcon,
  AccountTree as DependencyIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  HourglassEmpty as HourglassEmptyIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  FilterList as FilterListIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Info as InfoIcon,
  CameraAlt as CameraAltIcon,
  Image as ImageIcon,
  PictureAsPdf as PictureAsPdfIcon,
} from '@mui/icons-material';
import axios from 'axios';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { exportToExcel, importFromExcel, generateProjectTemplate } from '../../utils/excelUtils';
import SharedFilters from '../../components/common/SharedFilters';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { useScenario } from '../../contexts/ScenarioContext';
import DependencyDialog, { DependencyFormData } from '../../components/Portfolio/DependencyDialog';
import DependencyManagerDialog from '../../components/Portfolio/DependencyManagerDialog';
import EnhancedRequirementsTab from '../../components/Projects/EnhancedRequirementsTab';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import {
  getAllDependencies,
  createDependency,
  deleteDependency,
  ProjectDependency
} from '../../services/dependencyService';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

interface Project {
  id: number;
  projectNumber?: string;
  segmentFunctionId?: number;
  domainId?: number;
  name: string;
  description?: string;
  businessProcess?: string;
  functionality?: string;
  status: string;
  priority: string;
  businessDecision?: string;
  businessPriority?: string;
  type?: string;
  fiscalYear?: string;
  targetRelease?: string;
  targetSprint?: string;
  progress: number;
  currentPhase?: string;
  budget?: number;
  actualCost?: number;
  forecastedCost?: number;
  plannedOpex?: number;
  plannedCapex?: number;
  totalPlannedCost?: number;
  financialBenefit?: number;
  startDate?: Date;
  endDate?: Date;
  desiredStartDate?: Date;
  desiredCompletionDate?: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  deadline?: Date;
  healthStatus?: string;
  projectManagerId?: number;
  sponsorId?: number;
  needleMover?: string;
  dow?: string;
  investmentClass?: string;
  benefitArea?: string;
  technologyArea?: string;
  enterpriseCategory?: string;
  projectInfrastructureNeeded?: boolean;
  coCreation?: boolean;
  technologyChoice?: string;
  segmentFunction?: string;
  division?: string;
  newOrCarryOver?: string;
  submittedById?: number;
  domainManagerId?: number;
  rank?: number;
  sortOrder?: number;
  isActive: boolean;
  domain?: {
    id: number;
    name: string;
  };
  segmentFunctionData?: {
    id: number;
    name: string;
  };
}

interface Domain {
  id: number;
  name: string;
}

interface SegmentFunction {
  id: number;
  name: string;
}

interface Resource {
  allocationId: number;
  id: number;
  employeeId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  primarySkill?: string;
  allocationPercentage?: number;
  roleOnProject?: string;
}

interface Milestone {
  id: number;
  projectId: number;
  name: string;
  description?: string;
  status: string;
  plannedStartDate?: string;
  plannedEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  owner?: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

interface DomainImpact {
  id?: number;
  projectId?: number;
  domainId: number;
  domainName?: string;
  impactType: 'Primary' | 'Secondary' | 'Tertiary';
  impactLevel: 'High' | 'Medium' | 'Low';
  description?: string;
  domain?: {
    id: number;
    name: string;
  };
}

// Kanban Card Component
interface KanbanCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  projectRisks: Record<number, number>;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ project, onEdit, projectRisks }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Planning': '#2196f3',
      'In Progress': '#ff9800',
      'On Hold': '#9e9e9e',
      'Completed': '#4caf50',
      'Cancelled': '#f44336',
    };
    return colors[status] || '#757575';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'Critical': '#d32f2f',
      'High': '#f57c00',
      'Medium': '#fbc02d',
      'Low': '#388e3c',
    };
    return colors[priority] || '#757575';
  };

  const getHealthColor = (health?: string) => {
    const colors: Record<string, string> = {
      'Green': '#4caf50',
      'Yellow': '#fbc02d',
      'Red': '#f44336',
    };
    return colors[health || 'Green'] || '#757575';
  };

  const getRiskColor = (score: number): string => {
    if (score >= 61) return '#f44336'; // High risk - Red
    if (score >= 31) return '#ff9800'; // Medium risk - Orange
    return '#4caf50'; // Low risk - Green
  };

  const getRiskLevel = (score: number): string => {
    if (score >= 61) return 'High';
    if (score >= 31) return 'Medium';
    return 'Low';
  };

  const projectRisk = projectRisks[project.id];

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      sx={{
        cursor: 'grab',
        '&:active': { cursor: 'grabbing' },
        '&:hover': { boxShadow: 3 },
        bgcolor: 'white',
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, flex: 1, mr: 1 }}>
            {project.name}
          </Typography>
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onEdit(project); }}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Box>

        {project.projectNumber && (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
            #{project.projectNumber}
          </Typography>
        )}

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
          <Chip
            label={project.status}
            size="small"
            sx={{
              bgcolor: getStatusColor(project.status),
              color: 'white',
              fontSize: '0.7rem',
              height: 20,
            }}
          />
          <Chip
            label={project.priority}
            size="small"
            sx={{
              bgcolor: getPriorityColor(project.priority),
              color: 'white',
              fontSize: '0.7rem',
              height: 20,
            }}
          />
          {project.healthStatus && (
            <Chip
              label={project.healthStatus}
              size="small"
              sx={{
                bgcolor: getHealthColor(project.healthStatus),
                color: 'white',
                fontSize: '0.7rem',
                height: 20,
              }}
            />
          )}
          {projectRisk !== undefined && (
            <Chip
              label={`Risk: ${projectRisk}`}
              size="small"
              sx={{
                bgcolor: getRiskColor(projectRisk),
                color: 'white',
                fontSize: '0.7rem',
                height: 20,
              }}
            />
          )}
        </Box>

        {project.currentPhase && (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
            Phase: {project.currentPhase}
          </Typography>
        )}

        {project.fiscalYear && (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
            FY: {project.fiscalYear}
          </Typography>
        )}

        {project.domain && (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
            Domain: {project.domain.name}
          </Typography>
        )}

        <Box sx={{ mt: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              Progress
            </Typography>
            <Typography variant="caption" fontWeight="bold">
              {project.progress}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={project.progress}
            sx={{
              height: 6,
              borderRadius: 1,
              bgcolor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                bgcolor: project.progress >= 75 ? '#4caf50' : project.progress >= 50 ? '#ff9800' : '#2196f3',
              },
            }}
          />
        </Box>

        {project.budget && (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
            Budget: ${project.budget.toLocaleString()}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

// Kanban Column Component
interface KanbanColumnProps {
  groupName: string;
  groupProjects: Project[];
  onEdit: (project: Project) => void;
  projectRisks: Record<number, number>;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ groupName, groupProjects, onEdit, projectRisks }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `kanban-column-${groupName}`,
  });

  return (
    <Paper
      ref={setNodeRef}
      sx={{
        minWidth: 320,
        maxWidth: 320,
        p: 2,
        bgcolor: isOver ? 'primary.lighter' : 'grey.50',
        border: isOver ? '2px solid' : '1px solid',
        borderColor: isOver ? 'primary.main' : 'grey.200',
        flex: '0 0 auto',
        transition: 'all 0.2s',
        minHeight: groupProjects.length === 0 ? 150 : 'auto',
      }}
    >
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle1" fontWeight="bold">
          {groupName}
        </Typography>
        <Chip label={groupProjects.length} size="small" color="primary" />
      </Box>

      {groupProjects.length === 0 ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 100,
            border: '2px dashed',
            borderColor: isOver ? 'primary.main' : 'grey.300',
            borderRadius: 1,
            bgcolor: isOver ? 'primary.lighter' : 'transparent',
            transition: 'all 0.2s',
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {isOver ? 'Drop here' : 'Empty - Drag projects here'}
          </Typography>
        </Box>
      ) : (
        <SortableContext items={groupProjects.map(p => p.id)} strategy={verticalListSortingStrategy}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {groupProjects.map((project) => (
              <KanbanCard key={project.id} project={project} onEdit={onEdit} projectRisks={projectRisks} />
            ))}
          </Box>
        </SortableContext>
      )}
    </Paper>
  );
};

// Sortable Project Row Component for Gantt View - Flat List Mode
interface SortableGanttProjectRowProps {
  project: Project;
  projectMilestones: Milestone[];
  projectStart: Date | string | undefined;
  projectEnd: Date | string | undefined;
  ganttSidebarWidth: number;
  dateRange: { start: Date; end: Date };
  cpmData: any;
  tempPositions: any;
  draggingItem: any;
  setDraggingItem: (item: any) => void;
  calculatePosition: (date: Date, start: Date, end: Date) => number;
  calculateWidth: (start: Date, end: Date, rangeStart: Date, rangeEnd: Date) => number;
  handleMilestoneMouseDown: (e: React.MouseEvent, milestone: Milestone, projectId: number) => void;
  getStatusColor: (status: string) => 'default' | 'primary' | 'success' | 'error' | 'warning';
}

const SortableGanttProjectRow: React.FC<SortableGanttProjectRowProps> = ({
  project,
  projectMilestones,
  projectStart,
  projectEnd,
  ganttSidebarWidth,
  dateRange,
  cpmData,
  tempPositions,
  draggingItem,
  setDraggingItem,
  calculatePosition,
  calculateWidth,
  handleMilestoneMouseDown,
  getStatusColor,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginBottom: '4px',
    paddingBottom: '4px',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Box ref={setNodeRef} style={style} sx={{ borderBottom: '1px dotted', borderColor: 'divider' }}>
      {/* Project Row with Milestones */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box sx={{ width: ganttSidebarWidth, flexShrink: 0, pr: 1, display: 'flex', alignItems: 'center' }}>
          {/* Drag handle */}
          <Box
            {...attributes}
            {...listeners}
            sx={{
              cursor: 'grab',
              display: 'flex',
              alignItems: 'center',
              mr: 0.5,
              '&:active': { cursor: 'grabbing' },
              color: 'action.active',
              '&:hover': { color: 'primary.main' },
            }}
          >
            <Box sx={{ fontSize: '1rem', userSelect: 'none' }}>⋮⋮</Box>
          </Box>
          <Typography
            variant="caption"
            sx={{
              fontSize: '0.7rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'block',
              flex: 1,
            }}
            title={`${project.projectNumber || `PRJ-${project.id}`} - ${project.name}`}
          >
            <Box component="span" sx={{ fontWeight: 600, mr: 0.5 }}>
              {project.projectNumber || `PRJ-${project.id}`}
            </Box>
            <Box component="span" sx={{ color: 'text.secondary' }}>
              {project.name}
            </Box>
          </Typography>
        </Box>
        <Box sx={{ flex: 1, position: 'relative', height: 28 }} id={`timeline-container-${project.id}`}>
          {/* Project Bar */}
          {projectStart && projectEnd && (() => {
            const cpmNode = cpmData.nodes.get(`project-${project.id}`);
            const slackDays = cpmNode?.slack || 0;
            const isOnCriticalPath = cpmData.criticalPath.includes(`project-${project.id}`);
            const tooltipContent = `${project.name}\n${isOnCriticalPath ? '⚡ Critical Path' : `Slack: ${slackDays} days`}`;

            return (
                <Box
                  title={tooltipContent}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (project.status === 'Completed') {
                      return;
                    }
                    const container = document.getElementById(`timeline-container-${project.id}`);
                    if (!container) return;
                    const rect = container.getBoundingClientRect();
                    setDraggingItem({
                      type: 'project',
                      operation: 'move',
                      id: project.id,
                      initialX: e.clientX,
                      dragStarted: false,
                      initialDates: {
                        startDate: new Date(projectStart),
                        endDate: new Date(projectEnd),
                      },
                      dateRange: dateRange,
                      containerWidth: rect.width,
                    });
                  }}
                  sx={{
                    position: 'absolute',
                    left: tempPositions[`project-${project.id}`]?.left || `${calculatePosition(new Date(projectStart), dateRange.start, dateRange.end)}%`,
                    width: tempPositions[`project-${project.id}`]?.width || `${calculateWidth(new Date(projectStart), new Date(projectEnd), dateRange.start, dateRange.end)}%`,
                    height: 18,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    bgcolor: project.healthStatus === 'Green' ? '#4caf50' :
                            project.healthStatus === 'Yellow' ? '#ff9800' :
                            project.healthStatus === 'Red' ? '#f44336' : '#2196f3',
                    borderRadius: 0.5,
                    border: cpmData.criticalPath.includes(`project-${project.id}`) ? '2px solid #fbbf24' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '0.6rem',
                    fontWeight: 600,
                    px: 0.5,
                    boxShadow: cpmData.criticalPath.includes(`project-${project.id}`) ? 3 : 1,
                    zIndex: draggingItem?.type === 'project' && draggingItem.id === project.id ? 10 : 1,
                    cursor: 'grab',
                    opacity: draggingItem?.type === 'project' && draggingItem.id === project.id ? 0.7 : 1,
                    transition: draggingItem ? 'none' : 'all 0.2s',
                    userSelect: 'none',
                    '&:active': {
                      cursor: 'grabbing',
                    },
                    '&:hover': {
                      boxShadow: cpmData.criticalPath.includes(`project-${project.id}`) ? 4 : 2,
                      filter: 'brightness(1.1)',
                    },
                  }}
                >
                  {/* Left Resize Handle */}
                  <Box
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (project.status === 'Completed') {
                        return;
                      }
                      const container = document.getElementById(`timeline-container-${project.id}`);
                      if (!container) return;
                      const rect = container.getBoundingClientRect();
                      setDraggingItem({
                        type: 'project',
                        operation: 'resize-left',
                        id: project.id,
                        initialX: e.clientX,
                        dragStarted: false,
                        initialDates: {
                          startDate: new Date(projectStart),
                          endDate: new Date(projectEnd),
                        },
                        dateRange: dateRange,
                        containerWidth: rect.width,
                      });
                    }}
                    sx={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 6,
                      cursor: 'ew-resize',
                      backgroundColor: 'rgba(255, 255, 255, 0.3)',
                      borderTopLeftRadius: 0.5,
                      borderBottomLeftRadius: 0.5,
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.5)',
                      },
                    }}
                  />

                  {project.progress}%

                  {/* Right Resize Handle */}
                  <Box
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (project.status === 'Completed') {
                        return;
                      }
                      const container = document.getElementById(`timeline-container-${project.id}`);
                      if (!container) return;
                      const rect = container.getBoundingClientRect();
                      setDraggingItem({
                        type: 'project',
                        operation: 'resize-right',
                        id: project.id,
                        initialX: e.clientX,
                        dragStarted: false,
                        initialDates: {
                          startDate: new Date(projectStart),
                          endDate: new Date(projectEnd),
                        },
                        dateRange: dateRange,
                        containerWidth: rect.width,
                      });
                    }}
                    sx={{
                      position: 'absolute',
                      right: 0,
                      top: 0,
                      bottom: 0,
                      width: 6,
                      cursor: 'ew-resize',
                      backgroundColor: 'rgba(255, 255, 255, 0.3)',
                      borderTopRightRadius: 0.5,
                      borderBottomRightRadius: 0.5,
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.5)',
                      },
                    }}
                  />
                </Box>
            );
          })()}

          {/* Milestones */}
          {projectMilestones.map((milestone) => {
            if (!milestone.plannedEndDate) return null;
            const milestoneDate = new Date(milestone.plannedEndDate);
            const milestonePos = tempPositions[`milestone-${milestone.id}`]?.left ||
              calculatePosition(milestoneDate, dateRange.start, dateRange.end);

            return (
              <Box
                key={milestone.id}
                title={`${milestone.name} - ${new Date(milestone.plannedEndDate).toLocaleDateString()}`}
                onMouseDown={(e) => handleMilestoneMouseDown(e, milestone, project.id)}
                sx={{
                    position: 'absolute',
                    left: `${milestonePos}%`,
                    top: '50%',
                    transform: 'translate(-50%, -50%) rotate(45deg)',
                    width: 10,
                    height: 10,
                    bgcolor: milestone.status === 'Completed' ? '#66bb6a' :
                            milestone.status === 'In Progress' ? '#42a5f5' : '#9e9e9e',
                    border: '1px solid white',
                    boxShadow: 1,
                    cursor: 'grab',
                    zIndex: draggingItem?.type === 'milestone' && draggingItem.id === milestone.id ? 10 : 2,
                    opacity: draggingItem?.type === 'milestone' && draggingItem.id === milestone.id ? 0.7 : 1,
                    transition: draggingItem ? 'none' : 'all 0.2s',
                    '&:active': {
                      cursor: 'grabbing',
                    },
                    '&:hover': {
                      filter: 'brightness(1.2)',
                      transform: 'translate(-50%, -50%) scale(1.2)',
                    },
                  }}
                />
            );
          })}
        </Box>

        {/* Status column */}
        <Box sx={{ width: 100, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Chip
            label={project.status}
            size="small"
            color={getStatusColor(project.status)}
            sx={{ fontSize: '0.55rem', height: 18, '& .MuiChip-label': { px: 0.5 } }}
          />
        </Box>
      </Box>
    </Box>
  );
};

// Sortable Project Row Component for Gantt View - Swimlane Mode (Project Name Column)
interface SortableSwimlaneProjectNameProps {
  project: Project;
  ganttSidebarWidth: number;
  borderStyle: string;
}

const SortableSwimlaneProjectName: React.FC<SortableSwimlaneProjectNameProps> = ({
  project,
  ganttSidebarWidth,
  borderStyle,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    height: 32,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        px: 1,
        display: 'flex',
        alignItems: 'center',
        borderBottom: borderStyle,
        position: 'relative',
        zIndex: 10,
        bgcolor: 'background.paper',
      }}
    >
      {/* Drag handle */}
      <Box
        {...attributes}
        {...listeners}
        sx={{
          cursor: 'grab',
          display: 'flex',
          alignItems: 'center',
          mr: 0.5,
          '&:active': { cursor: 'grabbing' },
          color: 'action.active',
          '&:hover': { color: 'primary.main', bgcolor: 'action.hover' },
          zIndex: 100,
          position: 'relative',
          minWidth: '24px',
          minHeight: '24px',
          justifyContent: 'center',
        }}
      >
        <Box sx={{ fontSize: '1rem', userSelect: 'none', pointerEvents: 'none' }}>⋮⋮</Box>
      </Box>
      <Typography
        variant="caption"
        sx={{
          fontSize: '0.7rem',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          display: 'block',
          flex: 1,
        }}
        title={`${project.projectNumber || `PRJ-${project.id}`} - ${project.name}`}
      >
        <Box component="span" sx={{ fontWeight: 600, mr: 0.5 }}>
          {project.projectNumber || `PRJ-${project.id}`}
        </Box>
        <Box component="span" sx={{ color: 'text.secondary' }}>
          {project.name}
        </Box>
      </Typography>
    </Box>
  );
};

const ProjectManagement = () => {
  // Redux state
  const { selectedDomainIds, selectedBusinessDecisions } = useAppSelector((state) => state.filters);

  // Scenario state
  const { activeScenario } = useScenario();

  const [projects, setProjects] = useState<Project[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [segmentFunctions, setSegmentFunctions] = useState<SegmentFunction[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentProject, setCurrentProject] = useState<Partial<Project>>({});
  const [dialogTab, setDialogTab] = useState(0);
  const [openResourcesDialog, setOpenResourcesDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectResources, setProjectResources] = useState<Resource[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'gantt' | 'kanban'>(() => {
    const saved = localStorage.getItem('projectManagementViewMode');
    return (saved as 'list' | 'gantt' | 'kanban') || 'list';
  });
  const [kanbanGroupBy, setKanbanGroupBy] = useState<'status' | 'domain' | 'fiscalYear' | 'priority' | 'healthStatus' | 'currentPhase'>('status');
  const [activeId, setActiveId] = useState<number | null>(null);
  const [ganttActiveId, setGanttActiveId] = useState<number | null>(null);
  const [ganttSidebarWidth, setGanttSidebarWidth] = useState(300);
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  const [swimlanesExpanded, setSwimlanesExpanded] = useState(true);
  const [showLegend, setShowLegend] = useState(false);
  const [exportViewAnchor, setExportViewAnchor] = useState<null | HTMLElement>(null);
  const [exportingView, setExportingView] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [domainImpacts, setDomainImpacts] = useState<DomainImpact[]>([]);
  const [allDomainImpacts, setAllDomainImpacts] = useState<DomainImpact[]>([]);
  const [filters, setFilters] = useState({
    projectNumber: '',
    name: '',
    segmentFunction: [] as string[],
    type: '',
    fiscalYear: [] as string[],
    targetRelease: [] as string[],
    targetSprint: [] as string[],
    status: [] as string[],
    priority: '',
    currentPhase: '',
    health: [] as string[],
    impactedDomain: [] as string[],
  });

  // Sorting state
  type OrderDirection = 'asc' | 'desc';
  type SortableColumn = 'projectNumber' | 'name' | 'domain' | 'segmentFunction' | 'type' | 'fiscalYear' | 'targetRelease' | 'targetSprint' | 'status' | 'priority' | 'currentPhase' | 'progress' | 'budget' | 'startDate' | 'endDate' | 'healthStatus' | 'risk';
  const [orderBy, setOrderBy] = useState<SortableColumn>('projectNumber');
  const [order, setOrder] = useState<OrderDirection>('asc');
  const [projectRisks, setProjectRisks] = useState<Record<number, number>>({});

  // Swimlane Configuration State
  const [swimlaneConfig, setSwimlaneConfig] = useState<{
    enabled: boolean;
    level1: 'domain' | 'segmentFunction' | 'type' | 'targetRelease' | 'targetSprint';
    level2: 'domain' | 'segmentFunction' | 'type' | 'targetRelease' | 'targetSprint';
    level2Enabled: boolean;
    rotateLevel1: boolean;
    rotateLevel2: boolean;
  }>(() => {
    const saved = localStorage.getItem('ganttSwimlaneConfig');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Add level2Enabled if it doesn't exist (for backward compatibility)
        if (parsed.level2Enabled === undefined) {
          parsed.level2Enabled = true;
        }
        return parsed;
      } catch {
        return { enabled: false, level1: 'domain', level2: 'type', level2Enabled: true, rotateLevel1: true, rotateLevel2: false };
      }
    }
    return { enabled: false, level1: 'domain', level2: 'type', level2Enabled: true, rotateLevel1: true, rotateLevel2: false };
  });

  // Show gridlines option
  const [showGridlines, setShowGridlines] = useState(() => {
    const saved = localStorage.getItem('ganttShowGridlines');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Project Order State (for drag-and-drop reordering)
  const [projectOrder, setProjectOrder] = useState<{ [swimlaneKey: string]: number[] }>({});

  // Drag and Drop State
  const [draggingItem, setDraggingItem] = useState<{
    type: 'project' | 'milestone';
    operation?: 'move' | 'resize-left' | 'resize-right';
    id: number;
    projectId?: number;
    initialX: number;
    dragStarted?: boolean; // Track if drag threshold has been exceeded
    initialDates: {
      startDate?: Date;
      endDate?: Date;
      plannedEndDate?: Date;
    };
    dateRange?: { start: Date; end: Date };
    containerWidth?: number;
  } | null>(null);

  // Drag threshold in pixels - prevent micro-movements from causing jumps
  const DRAG_THRESHOLD = 5;
  const [tempPositions, setTempPositions] = useState<{
    [key: string]: { left: string; width?: string };
  }>({});

  // Undo State
  const [lastAction, setLastAction] = useState<{
    type: 'project-move' | 'project-resize' | 'milestone-move';
    entityId: number;
    entityType: 'project' | 'milestone';
    beforeState: {
      projectDates?: { startDate: Date; endDate: Date };
      milestoneDates?: { [milestoneId: number]: { startDate?: Date; endDate: Date } };
      milestoneDate?: Date;
    };
    afterState: {
      projectDates?: { startDate: Date; endDate: Date };
      milestoneDates?: { [milestoneId: number]: { startDate?: Date; endDate: Date } };
      milestoneDate?: Date;
    };
    description: string;
  } | null>(null);
  const [showUndoSnackbar, setShowUndoSnackbar] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState<string>('');
  const [notificationSeverity, setNotificationSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('success');
  const [showNotification, setShowNotification] = useState(false);

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Dependencies State
  const [dependencies, setDependencies] = useState<ProjectDependency[]>([]);
  const [openDependencyManagerDialog, setOpenDependencyManagerDialog] = useState(false);
  const [openDependencyCreateDialog, setOpenDependencyCreateDialog] = useState(false);
  const [cpmData, setCpmData] = useState<{ nodes: Map<string, any>; criticalPath: string[] }>({ nodes: new Map(), criticalPath: [] });
  const [timelineWidth, setTimelineWidth] = useState<number>(1000);
  const ganttContainerRef = useRef<HTMLDivElement>(null);

  // Helper functions for notifications and confirmations
  const showAlert = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setNotificationMessage(message);
    setNotificationSeverity(severity);
    setShowNotification(true);
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({
      open: true,
      title,
      message,
      onConfirm: () => {
        setConfirmDialog(prev => ({ ...prev, open: false }));
        onConfirm();
      },
    });
  };

  const fetchData = async () => {
    // Guard: Don't fetch data without an active scenario
    if (!activeScenario?.id) {
      console.warn('fetchData called without activeScenario - skipping');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Build query parameters with scenarioId
      const scenarioParam = `?scenarioId=${activeScenario.id}`;

      const [projectsRes, domainsRes, segmentFunctionsRes, milestonesRes, impactsRes] = await Promise.all([
        axios.get(`${API_URL}/projects${scenarioParam}`, config),
        axios.get(`${API_URL}/domains`, config),
        axios.get(`${API_URL}/segment-functions`, config),
        axios.get(`${API_URL}/milestones${scenarioParam}`, config),
        axios.get(`${API_URL}/project-domain-impacts`, config),
      ]);

      // Deduplicate data by id
      const uniqueProjects = Array.from(
        new Map(projectsRes.data.data.map((p: any) => [p.id, p])).values()
      );
      const uniqueMilestones = Array.from(
        new Map((milestonesRes.data.data || []).map((m: any) => [m.id, m])).values()
      );

      setProjects(uniqueProjects);
      setDomains(domainsRes.data.data);
      setSegmentFunctions(segmentFunctionsRes.data.data);
      setMilestones(uniqueMilestones);
      setAllDomainImpacts(impactsRes.data.data || []);

      // Fetch dependencies
      const dependenciesData = await getAllDependencies();
      setDependencies(dependenciesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeScenario) {
      fetchData();
    }
  }, [activeScenario]);

  // Calculate Critical Path when data changes
  useEffect(() => {
    if (projects.length > 0 && dependencies.length > 0) {
      const result = calculateCriticalPath();
      setCpmData(result);
    }
  }, [projects, milestones, dependencies]);

  // Measure timeline width after render using ResizeObserver
  useEffect(() => {
    const measureWidth = () => {
      if (ganttContainerRef.current) {
        const containerWidth = ganttContainerRef.current.offsetWidth || 1000;
        const sidebarWidth = swimlaneConfig.enabled
          ? (swimlaneConfig.rotateLevel1 ? 50 : 120) + (swimlaneConfig.level2Enabled ? (swimlaneConfig.rotateLevel2 ? 50 : 180) : 0) + ganttSidebarWidth
          : ganttSidebarWidth;
        const calculatedWidth = containerWidth - sidebarWidth - 100; // 100 for status column
        if (calculatedWidth > 0) {
          setTimelineWidth(calculatedWidth);
        }
      }
    };

    // Initial measurement with multiple attempts
    const timeouts = [
      setTimeout(measureWidth, 50),
      setTimeout(measureWidth, 150),
      setTimeout(measureWidth, 300),
    ];

    // Use ResizeObserver to track changes
    const resizeObserver = new ResizeObserver(() => {
      measureWidth();
    });

    if (ganttContainerRef.current) {
      resizeObserver.observe(ganttContainerRef.current);
    }

    return () => {
      timeouts.forEach(clearTimeout);
      resizeObserver.disconnect();
    };
  }, [projects, filters, selectedDomainIds, selectedBusinessDecisions, swimlaneConfig, ganttSidebarWidth]);

  // Keyboard listener for undo (Ctrl+Z / Cmd+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && lastAction && viewMode === 'gantt') {
        e.preventDefault();
        handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lastAction, viewMode]);

  // Save view mode to localStorage
  useEffect(() => {
    localStorage.setItem('projectManagementViewMode', viewMode);
  }, [viewMode]);

  // Save swimlane config to localStorage
  useEffect(() => {
    localStorage.setItem('ganttSwimlaneConfig', JSON.stringify(swimlaneConfig));
  }, [swimlaneConfig]);

  // Calculate risk scores for all projects
  useEffect(() => {
    const calculateRisks = async () => {
      const risks: Record<number, number> = {};

      // Use the calculateProjectRisk function from the API
      for (const project of projects) {
        try {
          // Calculate individual project risk
          let riskScore = 0;

          // 1. Health Status Risk (0-15 points) - PRIMARY INDICATOR
          if (project.healthStatus === 'Red') {
            riskScore += 15;
          } else if (project.healthStatus === 'Yellow') {
            riskScore += 8;
          }

          // 2. Budget risk (0-20 points)
          const budget = Number(project.budget) || 0;
          const actualCost = Number(project.actualCost) || 0;
          const forecast = Number(project.forecastedCost) || budget;
          // Use the higher of actualCost or forecastedCost to represent true financial risk
          const costToCompare = Math.max(actualCost, forecast);
          if (budget > 0) {
            const budgetVariance = ((costToCompare - budget) / budget) * 100;
            if (budgetVariance > 30) riskScore += 15;
            else if (budgetVariance > 15) riskScore += 10;
            else if (budgetVariance > 5) riskScore += 5;
          }

          // 3. Schedule risk (0-20 points)
          // Use desiredCompletionDate if available, otherwise fallback to endDate as planned
          const plannedEnd = project.desiredCompletionDate
            ? new Date(project.desiredCompletionDate)
            : (project.endDate ? new Date(project.endDate) : null);

          // Use the later of actualEndDate or endDate, or today if project is ongoing
          const actualEndDate = project.actualEndDate ? new Date(project.actualEndDate) : null;
          const endDate = project.endDate ? new Date(project.endDate) : null;
          const actualEnd = actualEndDate && endDate
            ? (actualEndDate > endDate ? actualEndDate : endDate)
            : (actualEndDate || endDate || new Date());

          if (plannedEnd && actualEnd > plannedEnd) {
            const delayDays = Math.floor((actualEnd.getTime() - plannedEnd.getTime()) / (1000 * 60 * 60 * 24));
            if (delayDays > 90) riskScore += 15;
            else if (delayDays > 30) riskScore += 10;
            else if (delayDays > 7) riskScore += 5;
          }

          risks[project.id] = Math.min(100, riskScore);
        } catch (error) {
          console.error(`Error calculating risk for project ${project.id}:`, error);
        }
      }

      setProjectRisks(risks);
    };

    if (projects.length > 0) {
      calculateRisks();
    }
  }, [projects]);

  // Drag Event Handlers useEffect
  useEffect(() => {
    if (!draggingItem) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingItem.dateRange || !draggingItem.containerWidth) return;

      const deltaX = e.clientX - draggingItem.initialX;

      // Drag threshold: only start dragging after moving at least DRAG_THRESHOLD pixels
      // This prevents micro-movements during click from causing jumps
      if (!draggingItem.dragStarted && Math.abs(deltaX) < DRAG_THRESHOLD) {
        return;
      }

      // Mark drag as started once threshold is exceeded
      // Reset initialX to current position to prevent jump when drag starts
      if (!draggingItem.dragStarted) {
        setDraggingItem({ ...draggingItem, dragStarted: true, initialX: e.clientX });
        return; // Return early so next move event will calculate deltaX from new initialX
      }

      const { dateRange, containerWidth } = draggingItem;

      if (draggingItem.type === 'project') {
        const totalMs = dateRange.end.getTime() - dateRange.start.getTime();
        const pixelPerMs = containerWidth / totalMs;
        const msDelta = deltaX / pixelPerMs;

        if (draggingItem.operation === 'resize-left') {
          // Resize from left - adjust start date only
          const newStartDate = new Date(draggingItem.initialDates.startDate!.getTime() + msDelta);
          const newEndDate = draggingItem.initialDates.endDate!;

          // Prevent start date from going past end date
          if (newStartDate >= newEndDate) return;

          const newLeft = calculatePosition(newStartDate, dateRange.start, dateRange.end);
          const newWidth = calculateWidth(newStartDate, newEndDate, dateRange.start, dateRange.end);

          setTempPositions({
            [`project-${draggingItem.id}`]: { left: `${newLeft}%`, width: `${newWidth}%` }
          });
        } else if (draggingItem.operation === 'resize-right') {
          // Resize from right - adjust end date only
          const newStartDate = draggingItem.initialDates.startDate!;
          const newEndDate = new Date(draggingItem.initialDates.endDate!.getTime() + msDelta);

          // Prevent end date from going before start date
          if (newEndDate <= newStartDate) return;

          const newLeft = calculatePosition(newStartDate, dateRange.start, dateRange.end);
          const newWidth = calculateWidth(newStartDate, newEndDate, dateRange.start, dateRange.end);

          setTempPositions({
            [`project-${draggingItem.id}`]: { left: `${newLeft}%`, width: `${newWidth}%` }
          });
        } else {
          // Move operation - shift both dates
          const newStartDate = new Date(draggingItem.initialDates.startDate!.getTime() + msDelta);
          const newEndDate = new Date(draggingItem.initialDates.endDate!.getTime() + msDelta);

          const newLeft = calculatePosition(newStartDate, dateRange.start, dateRange.end);
          const newWidth = calculateWidth(newStartDate, newEndDate, dateRange.start, dateRange.end);

          setTempPositions({
            [`project-${draggingItem.id}`]: { left: `${newLeft}%`, width: `${newWidth}%` }
          });
        }
      } else if (draggingItem.type === 'milestone') {
        // Calculate new date for milestone
        const totalMs = dateRange.end.getTime() - dateRange.start.getTime();
        const pixelPerMs = containerWidth / totalMs;
        const msDelta = deltaX / pixelPerMs;

        const newDate = new Date(draggingItem.initialDates.plannedEndDate!.getTime() + msDelta);

        // Apply constraints (including project bounds)
        const { previous, next } = getAdjacentMilestones(draggingItem.projectId!, draggingItem.id);
        const constrainedDate = constrainDate(newDate, previous, next, draggingItem.projectId);

        const newLeft = calculatePosition(constrainedDate, dateRange.start, dateRange.end);
        setTempPositions({
          [`milestone-${draggingItem.id}`]: { left: `${newLeft}%` }
        });
      }
    };

    const handleMouseUp = async () => {
      if (!draggingItem || !draggingItem.dateRange || !draggingItem.containerWidth) {
        setDraggingItem(null);
        setTempPositions({});
        return;
      }

      const deltaX = window.event ? (window.event as MouseEvent).clientX - draggingItem.initialX : 0;
      const { dateRange, containerWidth } = draggingItem;
      const totalMs = dateRange.end.getTime() - dateRange.start.getTime();
      const pixelPerMs = containerWidth / totalMs;
      const msDelta = deltaX / pixelPerMs;

      if (draggingItem.type === 'project') {
        if (draggingItem.operation === 'resize-left' || draggingItem.operation === 'resize-right') {
          // Handle resize operation
          let newStartDate: Date;
          let newEndDate: Date;

          if (draggingItem.operation === 'resize-left') {
            newStartDate = new Date(draggingItem.initialDates.startDate!.getTime() + msDelta);
            newEndDate = draggingItem.initialDates.endDate!;

            // Prevent start date from going past end date
            if (newStartDate >= newEndDate) {
              setDraggingItem(null);
              setTempPositions({});
              return;
            }
          } else {
            newStartDate = draggingItem.initialDates.startDate!;
            newEndDate = new Date(draggingItem.initialDates.endDate!.getTime() + msDelta);

            // Prevent end date from going before start date
            if (newEndDate <= newStartDate) {
              setDraggingItem(null);
              setTempPositions({});
              return;
            }
          }

          await updateProjectDatesWithResize(
            draggingItem.id,
            draggingItem.initialDates.startDate!,
            draggingItem.initialDates.endDate!,
            newStartDate,
            newEndDate
          );
        } else {
          // Handle move operation
          const newStartDate = new Date(draggingItem.initialDates.startDate!.getTime() + msDelta);
          const newEndDate = new Date(draggingItem.initialDates.endDate!.getTime() + msDelta);
          const daysDelta = getTimeDeltaDays(draggingItem.initialDates.startDate!, newStartDate);

          if (Math.abs(daysDelta) > 0) {
            await updateProjectDates(draggingItem.id, newStartDate, newEndDate, daysDelta);
          }
        }
      } else if (draggingItem.type === 'milestone') {
        const newDate = new Date(draggingItem.initialDates.plannedEndDate!.getTime() + msDelta);
        const { previous, next } = getAdjacentMilestones(draggingItem.projectId!, draggingItem.id);
        const constrainedDate = constrainDate(newDate, previous, next, draggingItem.projectId);
        const daysDelta = getTimeDeltaDays(draggingItem.initialDates.plannedEndDate!, constrainedDate);

        if (Math.abs(daysDelta) > 0) {
          await updateMilestoneDate(draggingItem.id, constrainedDate);
        }
      }

      setDraggingItem(null);
      setTempPositions({});

      // Re-fetch all data to update UI with latest changes
      await fetchData();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingItem, milestones]);

  const handleOpenDialog = async (project?: Project) => {
    if (project) {
      setEditMode(true);
      setCurrentProject(project);

      // Fetch domain impacts for this project
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/project-domain-impacts?projectId=${project.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const impacts = response.data.data.map((impact: any) => ({
          id: impact.id,
          domainId: impact.domainId,
          domainName: impact.domain?.name,
          impactType: impact.impactType,
          impactLevel: impact.impactLevel,
          description: impact.description,
        }));

        setDomainImpacts(impacts);
      } catch (error) {
        console.error('Error fetching domain impacts:', error);
        setDomainImpacts([]);
      }
    } else {
      setEditMode(false);
      setCurrentProject({ progress: 0, status: 'Planning', priority: 'Medium' });
      setDomainImpacts([]);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentProject({});
    setDomainImpacts([]);
    setDialogTab(0);
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Validate domain impacts for duplicates
      const domainIds = domainImpacts.map(impact => impact.domainId);
      const uniqueDomainIds = new Set(domainIds);
      if (domainIds.length !== uniqueDomainIds.size) {
        showAlert('You have selected the same domain multiple times. Each domain can only be added once.', 'error');
        return;
      }

      // Validate all domain impacts have a valid domain selected
      const hasInvalidDomain = domainImpacts.some(impact => !impact.domainId || impact.domainId === 0);
      if (hasInvalidDomain) {
        showAlert('Please select a domain for all impact entries or remove empty entries.', 'error');
        return;
      }

      let projectId = currentProject.id;

      if (editMode && currentProject.id) {
        await axios.put(`${API_URL}/projects/${currentProject.id}`, currentProject, config);
      } else {
        const response = await axios.post(`${API_URL}/projects`, currentProject, config);
        projectId = response.data.data.id;
      }

      // Save domain impacts if project ID exists
      if (projectId && domainImpacts.length > 0) {
        // Filter out invalid entries
        const validImpacts = domainImpacts.filter(impact => impact.domainId && impact.domainId !== 0);

        if (validImpacts.length > 0) {
          await axios.post(
            `${API_URL}/project-domain-impacts/bulk-upsert`,
            {
              projectId,
              impacts: validImpacts.map(impact => ({
                domainId: impact.domainId,
                impactType: impact.impactType,
                impactLevel: impact.impactLevel,
                description: impact.description,
              })),
            },
            config
          );
        }
      }

      fetchData();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving project:', error);
      showAlert('Error saving project: ' + ((error as any).response?.data?.message || 'An unexpected error occurred'), 'error');
    }
  };

  const handleDelete = async (id: number) => {
    showConfirm(
      'Delete Project',
      'Are you sure you want to delete this project? This action cannot be undone.',
      async () => {
        try {
          const token = localStorage.getItem('token');
          await axios.delete(`${API_URL}/projects/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          fetchData();
        } catch (error) {
          console.error('Error deleting project:', error);
          showAlert('Error deleting project', 'error');
        }
      }
    );
  };

  // Dependency Dialog Handlers
  const handleOpenDependencyManagerDialog = () => {
    setOpenDependencyManagerDialog(true);
  };

  const handleCloseDependencyManagerDialog = () => {
    setOpenDependencyManagerDialog(false);
  };

  const handleOpenDependencyCreateDialog = () => {
    setOpenDependencyCreateDialog(true);
  };

  const handleCloseDependencyCreateDialog = () => {
    setOpenDependencyCreateDialog(false);
  };

  const handleSaveDependency = async (dependencyData: DependencyFormData) => {
    try {
      await createDependency(dependencyData);

      // Refresh dependencies list
      const updatedDependencies = await getAllDependencies();
      setDependencies(updatedDependencies);

      setNotificationMessage('Dependency created successfully!');
      setNotificationSeverity('success');
    } catch (error: any) {
      console.error('Error creating dependency:', error);
      throw error; // Re-throw to let dialog handle it
    }
  };

  const handleDeleteDependency = async (dependencyId: number) => {
    showConfirm(
      'Delete Dependency',
      'Are you sure you want to delete this dependency?',
      async () => {
        try {
          await deleteDependency(dependencyId);

          // Refresh dependencies list
          const updatedDependencies = await getAllDependencies();
          setDependencies(updatedDependencies);

          showAlert('Dependency deleted successfully!', 'success');
        } catch (error) {
          console.error('Error deleting dependency:', error);
          showAlert('Failed to delete dependency. Please try again.', 'error');
        }
      }
    );
  };

  const handleViewResources = async (project: Project) => {
    setSelectedProject(project);
    setOpenResourcesDialog(true);
    setLoadingResources(true);

    try {
      const token = localStorage.getItem('token');
      const scenarioParam = activeScenario?.id ? `?scenarioId=${activeScenario.id}` : '';
      const response = await axios.get(`${API_URL}/allocations${scenarioParam}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Deduplicate allocations by ID first (in case of SQL join duplicates)
      const uniqueAllocations = Array.from(
        new Map(response.data.data.map((a: any) => [a.id, a])).values()
      );

      // Filter allocations by project ID
      const projectAllocations = uniqueAllocations.filter(
        (allocation: any) => allocation.projectId === project.id
      );

      // Group allocations by resource ID to avoid duplicates
      const resourceMap = new Map();
      projectAllocations.forEach((allocation: any) => {
        const resourceId = allocation.resource?.id;
        if (!resourceId) return;

        if (resourceMap.has(resourceId)) {
          // Resource already exists, sum allocation percentage
          const existing = resourceMap.get(resourceId);
          existing.allocationPercentage += allocation.allocationPercentage || 0;

          // Collect multiple roles if different
          if (allocation.roleOnProject && !existing.roleOnProject.includes(allocation.roleOnProject)) {
            existing.roleOnProject += `, ${allocation.roleOnProject}`;
          }
        } else {
          // First time seeing this resource
          resourceMap.set(resourceId, {
            allocationId: allocation.id,
            id: allocation.resource?.id,
            employeeId: allocation.resource?.employeeId,
            firstName: allocation.resource?.firstName,
            lastName: allocation.resource?.lastName,
            email: allocation.resource?.email,
            role: allocation.resource?.role,
            primarySkill: allocation.resource?.primarySkill,
            allocationPercentage: allocation.allocationPercentage || 0,
            roleOnProject: allocation.roleOnProject || '-',
          });
        }
      });

      const resources = Array.from(resourceMap.values());
      setProjectResources(resources);
    } catch (error) {
      console.error('Error fetching project resources:', error);
    } finally {
      setLoadingResources(false);
    }
  };

  const handleCloseResourcesDialog = () => {
    setOpenResourcesDialog(false);
    setSelectedProject(null);
    setProjectResources([]);
  };

  const handleExport = () => {
    exportToExcel(projects, 'projects_export');
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

          // Bulk create projects
          for (const project of data) {
            await axios.post(`${API_URL}/projects`, project, config);
          }

          showAlert(`Successfully imported ${data.length} projects`, 'success');
          fetchData();
        } catch (error) {
          console.error('Error importing projects:', error);
          showAlert('Error importing some projects. Check console for details.', 'error');
        }
      },
      (error) => {
        showAlert(`Import error: ${error}`, 'error');
      }
    );

    // Reset input
    event.target.value = '';
  };

  const handleViewExport = async (format: 'png' | 'pdf') => {
    if (!contentRef.current) return;

    try {
      setExportingView(true);
      setExportViewAnchor(null);

      // Longer delay to ensure SVG dependency lines and all elements are fully rendered
      await new Promise(resolve => setTimeout(resolve, 300));

      // Clone SVG elements and render them inline with all styles
      const svgElements = contentRef.current.querySelectorAll('svg');
      const svgClones: { original: SVGElement; clone: HTMLCanvasElement; parent: HTMLElement }[] = [];

      // Pre-render SVGs to canvas with improved handling
      for (const svg of Array.from(svgElements)) {
        const svgRect = svg.getBoundingClientRect();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (ctx && svgRect.width > 0 && svgRect.height > 0) {
          canvas.width = svgRect.width * 2; // 2x for high resolution
          canvas.height = svgRect.height * 2;
          canvas.style.width = `${svgRect.width}px`;
          canvas.style.height = `${svgRect.height}px`;
          canvas.style.position = svg.style.position || 'absolute';

          // Copy computed position styles
          const computedStyle = window.getComputedStyle(svg);
          canvas.style.top = computedStyle.top;
          canvas.style.left = computedStyle.left;
          canvas.style.right = computedStyle.right;
          canvas.style.bottom = computedStyle.bottom;
          canvas.style.transform = computedStyle.transform;

          // Clone SVG and inline all styles
          const svgClone = svg.cloneNode(true) as SVGElement;

          // Set explicit dimensions on the cloned SVG
          svgClone.setAttribute('width', String(svgRect.width));
          svgClone.setAttribute('height', String(svgRect.height));

          // Get all computed styles and apply them inline
          const allElements = svgClone.querySelectorAll('*');
          allElements.forEach((el) => {
            const element = el as HTMLElement;
            const originalElement = svg.querySelector(`[data-id="${element.getAttribute('data-id')}"]`) ||
                                   Array.from(svg.querySelectorAll(element.tagName)).find(e => {
                                     return e.getAttribute('d') === element.getAttribute('d');
                                   });

            if (originalElement) {
              const styles = window.getComputedStyle(originalElement as Element);
              let styleString = '';

              // Copy critical SVG presentation attributes
              ['fill', 'stroke', 'stroke-width', 'opacity', 'stroke-linecap', 'stroke-linejoin', 'marker-end'].forEach(prop => {
                const value = originalElement.getAttribute(prop) || styles.getPropertyValue(prop);
                if (value && value !== 'none' && value !== '') {
                  element.setAttribute(prop, value);
                }
              });
            }
          });

          // Serialize the styled SVG
          const svgData = new XMLSerializer().serializeToString(svgClone);

          // Wrap in proper SVG with namespace
          const svgWithNamespace = `<?xml version="1.0" encoding="UTF-8"?>
            <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
                 width="${svgRect.width}" height="${svgRect.height}">
              ${svgData.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '')}
            </svg>`;

          const svgBlob = new Blob([svgWithNamespace], { type: 'image/svg+xml;charset=utf-8' });
          const svgUrl = URL.createObjectURL(svgBlob);

          // Load and draw SVG
          const img = new Image();
          await new Promise<void>((resolve) => {
            img.onload = () => {
              ctx.scale(2, 2); // Scale for high resolution
              ctx.drawImage(img, 0, 0, svgRect.width, svgRect.height);
              URL.revokeObjectURL(svgUrl);
              resolve();
            };
            img.onerror = (e) => {
              console.error('SVG rendering error:', e);
              URL.revokeObjectURL(svgUrl);
              resolve(); // Continue even if this fails
            };
            img.src = svgUrl;
          });

          // Replace SVG with canvas temporarily
          if (svg.parentElement) {
            svgClones.push({
              original: svg as SVGElement,
              clone: canvas,
              parent: svg.parentElement
            });
            svg.style.display = 'none';
            svg.parentElement.appendChild(canvas);
          }
        }
      }

      // Small delay to ensure canvas replacements are rendered
      await new Promise(resolve => setTimeout(resolve, 100));

      const mainCanvas = await html2canvas(contentRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: false,
      });

      // Restore original SVG elements
      for (const { original, clone, parent } of svgClones) {
        parent.removeChild(clone);
        original.style.display = '';
      }

      const viewName = viewMode === 'list' ? 'list' : viewMode === 'gantt' ? 'timeline' : 'kanban';
      const fileName = `projects-${viewName}-${activeScenario?.name || 'view'}-${new Date().toISOString().split('T')[0]}`;

      if (format === 'png') {
        const link = document.createElement('a');
        link.download = `${fileName}.png`;
        link.href = mainCanvas.toDataURL('image/png');
        link.click();
      } else {
        const imgData = mainCanvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: mainCanvas.width > mainCanvas.height ? 'landscape' : 'portrait',
          unit: 'px',
          format: [mainCanvas.width, mainCanvas.height]
        });
        pdf.addImage(imgData, 'PNG', 0, 0, mainCanvas.width, mainCanvas.height);
        pdf.save(`${fileName}.pdf`);
      }

      setExportingView(false);
    } catch (error) {
      console.error('Error exporting view:', error);
      showAlert('Error exporting view. Please try again.', 'error');
      setExportingView(false);
    }
  };

  const formatCurrency = (value?: number) => {
    if (!value) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, 'default' | 'primary' | 'success' | 'error' | 'warning'> = {
      'Planning': 'default',
      'In Progress': 'primary',
      'Completed': 'success',
      'On Hold': 'warning',
      'Cancelled': 'error',
    };
    return colors[status] || 'default';
  };

  const getBusinessDecisionIcon = (businessDecision?: string) => {
    if (!businessDecision) return null;

    switch (businessDecision) {
      case 'Above Cutline':
        return (
          <Tooltip title="Above Cutline - Approved" arrow placement="top">
            <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main', ml: 0.5 }} />
          </Tooltip>
        );
      case 'Below Cutline':
        return (
          <Tooltip title="Below Cutline - Not Approved" arrow placement="top">
            <CancelIcon sx={{ fontSize: 16, color: 'error.main', ml: 0.5 }} />
          </Tooltip>
        );
      case 'Pending':
        return (
          <Tooltip title="Pending Decision" arrow placement="top">
            <HourglassEmptyIcon sx={{ fontSize: 16, color: 'warning.main', ml: 0.5 }} />
          </Tooltip>
        );
      default:
        return null;
    }
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.projectNumber) count++;
    if (filters.name) count++;
    if (filters.segmentFunction.length > 0) count++;
    if (filters.type) count++;
    if (filters.fiscalYear.length > 0) count++;
    if (filters.status.length > 0) count++;
    if (filters.priority) count++;
    if (filters.currentPhase) count++;
    if (filters.health.length > 0) count++;
    if (filters.impactedDomain.length > 0) count++;
    return count;
  };

  const getActiveFilterChips = () => {
    const chips: Array<{ label: string; onDelete: () => void }> = [];

    if (filters.projectNumber) {
      chips.push({
        label: `Project #: ${filters.projectNumber}`,
        onDelete: () => setFilters({ ...filters, projectNumber: '' })
      });
    }
    if (filters.name) {
      chips.push({
        label: `Name: ${filters.name}`,
        onDelete: () => setFilters({ ...filters, name: '' })
      });
    }
    if (filters.segmentFunction.length > 0) {
      filters.segmentFunction.forEach(sf => {
        chips.push({
          label: `SF: ${sf}`,
          onDelete: () => setFilters({ ...filters, segmentFunction: filters.segmentFunction.filter(x => x !== sf) })
        });
      });
    }
    if (filters.type) {
      chips.push({
        label: `Type: ${filters.type}`,
        onDelete: () => setFilters({ ...filters, type: '' })
      });
    }
    if (filters.fiscalYear.length > 0) {
      filters.fiscalYear.forEach(year => {
        chips.push({
          label: `FY: ${year}`,
          onDelete: () => setFilters({ ...filters, fiscalYear: filters.fiscalYear.filter(x => x !== year) })
        });
      });
    }
    if (filters.status.length > 0) {
      filters.status.forEach(status => {
        chips.push({
          label: `Status: ${status}`,
          onDelete: () => setFilters({ ...filters, status: filters.status.filter(x => x !== status) })
        });
      });
    }
    if (filters.priority) {
      chips.push({
        label: `Priority: ${filters.priority}`,
        onDelete: () => setFilters({ ...filters, priority: '' })
      });
    }
    if (filters.currentPhase) {
      chips.push({
        label: `Phase: ${filters.currentPhase}`,
        onDelete: () => setFilters({ ...filters, currentPhase: '' })
      });
    }
    if (filters.health.length > 0) {
      filters.health.forEach(health => {
        chips.push({
          label: `Health: ${health}`,
          onDelete: () => setFilters({ ...filters, health: filters.health.filter(x => x !== health) })
        });
      });
    }

    return chips;
  };

  const getHealthColor = (health?: string) => {
    const colors: Record<string, 'success' | 'warning' | 'error'> = {
      'Green': 'success',
      'Yellow': 'warning',
      'Red': 'error',
    };
    return colors[health || ''] || 'default';
  };

  const getRiskColor = (score: number): string => {
    if (score >= 61) return '#f44336'; // High risk - Red
    if (score >= 31) return '#ff9800'; // Medium risk - Orange
    return '#4caf50'; // Low risk - Green
  };

  const getRiskLevel = (score: number): string => {
    if (score >= 61) return 'High';
    if (score >= 31) return 'Medium';
    return 'Low';
  };

  const getCrossDomainCount = (projectId: number) => {
    return allDomainImpacts.filter(impact => impact.projectId === projectId).length;
  };

  const getLevel1Color = (key: string): string => {
    const colors = ['#1976d2', '#616161', '#f57c00', '#388e3c', '#7b1fa2', '#c62828'];
    const hash = key.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const getImpactedDomains = (projectId: number) => {
    return allDomainImpacts
      .filter(impact => impact.projectId === projectId)
      .map(impact => impact.domain?.name)
      .filter(Boolean) as string[];
  };

  // Get dependency counts for a project
  const getDependencyCounts = (projectId: number) => {
    const impacting = dependencies.filter(dep =>
      (dep.predecessorType === 'project' && dep.predecessorId === projectId) ||
      (dep.predecessorType === 'milestone' && milestones.find(m => m.id === dep.predecessorId && m.projectId === projectId))
    ).length;

    const impactedBy = dependencies.filter(dep =>
      (dep.successorType === 'project' && dep.successorId === projectId) ||
      (dep.successorType === 'milestone' && milestones.find(m => m.id === dep.successorId && m.projectId === projectId))
    ).length;

    return { impacting, impactedBy };
  };

  // Get unique fiscal years, target releases, and target sprints from projects
  const uniqueFiscalYears = Array.from(new Set(projects.map(p => p.fiscalYear).filter(Boolean))) as string[];
  const uniqueTargetReleases = Array.from(new Set(projects.map(p => p.targetRelease).filter(Boolean))) as string[];
  const uniqueTargetSprints = Array.from(new Set(projects.map(p => p.targetSprint).filter(Boolean))) as string[];

  // Sorting handler
  const handleRequestSort = (property: SortableColumn) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Filter projects based on current filters
  const filteredProjects = projects.filter((project) => {
    const impactedDomains = getImpactedDomains(project.id);
    const matchesImpactedDomain = filters.impactedDomain.length === 0 ||
      filters.impactedDomain.some(domain => impactedDomains.includes(domain));

    return (
      (project.projectNumber || '').toLowerCase().includes(filters.projectNumber.toLowerCase()) &&
      project.name.toLowerCase().includes(filters.name.toLowerCase()) &&
      (selectedDomainIds.length === 0 || selectedDomainIds.includes(project.domainId || 0)) &&
      (filters.segmentFunction.length === 0 || filters.segmentFunction.includes(project.segmentFunctionData?.name || '')) &&
      (filters.type === '' || (project.type || '').toLowerCase().includes(filters.type.toLowerCase())) &&
      (filters.fiscalYear.length === 0 || filters.fiscalYear.includes(project.fiscalYear || '')) &&
      (filters.targetRelease.length === 0 || filters.targetRelease.includes(project.targetRelease || '')) &&
      (filters.targetSprint.length === 0 || filters.targetSprint.includes(project.targetSprint || '')) &&
      (filters.status.length === 0 || filters.status.includes(project.status)) &&
      (filters.priority === '' || project.priority === filters.priority) &&
      (selectedBusinessDecisions.length === 0 || selectedBusinessDecisions.includes(project.businessDecision || '')) &&
      (filters.currentPhase === '' || (project.currentPhase || '').toLowerCase().includes(filters.currentPhase.toLowerCase())) &&
      (filters.health.length === 0 || filters.health.includes(project.healthStatus || '')) &&
      matchesImpactedDomain
    );
  }).sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (orderBy) {
      case 'projectNumber':
        aValue = a.projectNumber?.toLowerCase() || '';
        bValue = b.projectNumber?.toLowerCase() || '';
        break;
      case 'name':
        aValue = a.name?.toLowerCase() || '';
        bValue = b.name?.toLowerCase() || '';
        break;
      case 'domain':
        aValue = a.domain?.name?.toLowerCase() || '';
        bValue = b.domain?.name?.toLowerCase() || '';
        break;
      case 'segmentFunction':
        aValue = a.segmentFunctionData?.name?.toLowerCase() || '';
        bValue = b.segmentFunctionData?.name?.toLowerCase() || '';
        break;
      case 'type':
        aValue = a.type?.toLowerCase() || '';
        bValue = b.type?.toLowerCase() || '';
        break;
      case 'fiscalYear':
        aValue = a.fiscalYear?.toLowerCase() || '';
        bValue = b.fiscalYear?.toLowerCase() || '';
        break;
      case 'targetRelease':
        aValue = a.targetRelease?.toLowerCase() || '';
        bValue = b.targetRelease?.toLowerCase() || '';
        break;
      case 'targetSprint':
        aValue = a.targetSprint?.toLowerCase() || '';
        bValue = b.targetSprint?.toLowerCase() || '';
        break;
      case 'status':
        aValue = a.status?.toLowerCase() || '';
        bValue = b.status?.toLowerCase() || '';
        break;
      case 'priority':
        const priorityOrder: Record<string, number> = {
          'Critical': 4,
          'High': 3,
          'Medium': 2,
          'Low': 1,
        };
        aValue = priorityOrder[a.priority] || 0;
        bValue = priorityOrder[b.priority] || 0;
        break;
      case 'currentPhase':
        aValue = a.currentPhase?.toLowerCase() || '';
        bValue = b.currentPhase?.toLowerCase() || '';
        break;
      case 'progress':
        aValue = a.progress || 0;
        bValue = b.progress || 0;
        break;
      case 'budget':
        aValue = a.budget || 0;
        bValue = b.budget || 0;
        break;
      case 'startDate':
        aValue = a.startDate ? new Date(a.startDate).getTime() : 0;
        bValue = b.startDate ? new Date(b.startDate).getTime() : 0;
        break;
      case 'endDate':
        aValue = a.endDate ? new Date(a.endDate).getTime() : 0;
        bValue = b.endDate ? new Date(b.endDate).getTime() : 0;
        break;
      case 'healthStatus':
        const healthOrder: Record<string, number> = {
          'Red': 3,
          'Yellow': 2,
          'Green': 1,
        };
        aValue = healthOrder[a.healthStatus || ''] || 0;
        bValue = healthOrder[b.healthStatus || ''] || 0;
        break;
      case 'risk':
        aValue = projectRisks[a.id] || 0;
        bValue = projectRisks[b.id] || 0;
        break;
      default:
        // Fallback to sortOrder then createdDate
        const aSortOrder = a.sortOrder ?? 999999;
        const bSortOrder = b.sortOrder ?? 999999;
        if (aSortOrder !== bSortOrder) {
          return aSortOrder - bSortOrder;
        }
        const aDate = a.createdDate ? new Date(a.createdDate).getTime() : 0;
        const bDate = b.createdDate ? new Date(b.createdDate).getTime() : 0;
        return bDate - aDate;
    }

    if (aValue < bValue) {
      return order === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return order === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // Swimlane grouping helper functions
  const getGroupKey = (project: Project, groupBy: 'domain' | 'segmentFunction' | 'type' | 'targetRelease' | 'targetSprint'): string => {
    switch (groupBy) {
      case 'domain':
        return project.domain?.name || 'Unassigned';
      case 'segmentFunction':
        return project.segmentFunctionData?.name || 'Unassigned';
      case 'type':
        return project.type || 'Unassigned';
      case 'targetRelease':
        return project.targetRelease || 'Unassigned';
      case 'targetSprint':
        return project.targetSprint || 'Unassigned';
      default:
        return 'Unassigned';
    }
  };

  const getGroupLabel = (groupBy: 'domain' | 'segmentFunction' | 'type' | 'targetRelease' | 'targetSprint'): string => {
    switch (groupBy) {
      case 'domain':
        return 'Domain';
      case 'segmentFunction':
        return 'Segment Function';
      case 'type':
        return 'Type';
      case 'targetRelease':
        return 'Target Release';
      case 'targetSprint':
        return 'Target Sprint';
      default:
        return '';
    }
  };

  // Swimlane structure: Level 1 > Level 2 > Projects
  interface SwimlaneStructure {
    [level1Key: string]: {
      [level2Key: string]: Project[];
    };
  }

  const groupProjectsForSwimlanes = (): SwimlaneStructure => {
    const structure: SwimlaneStructure = {};

    filteredProjects.forEach((project) => {
      const level1Key = getGroupKey(project, swimlaneConfig.level1);
      // If level2 is disabled, use 'all' as a single group
      const level2Key = swimlaneConfig.level2Enabled ? getGroupKey(project, swimlaneConfig.level2) : 'all';

      if (!structure[level1Key]) {
        structure[level1Key] = {};
      }
      if (!structure[level1Key][level2Key]) {
        structure[level1Key][level2Key] = [];
      }

      structure[level1Key][level2Key].push(project);
    });

    // Sort projects within each swimlane by sortOrder
    Object.keys(structure).forEach((level1Key) => {
      Object.keys(structure[level1Key]).forEach((level2Key) => {
        const projects = structure[level1Key][level2Key];

        // Sort by sortOrder (with fallback to createdDate DESC, matching backend)
        structure[level1Key][level2Key] = projects.sort((a, b) => {
          const aSortOrder = a.sortOrder ?? 999999;
          const bSortOrder = b.sortOrder ?? 999999;
          if (aSortOrder !== bSortOrder) {
            return aSortOrder - bSortOrder;
          }
          // Fallback to createdDate DESC (matching backend and filteredProjects)
          const aDate = a.createdDate ? new Date(a.createdDate).getTime() : 0;
          const bDate = b.createdDate ? new Date(b.createdDate).getTime() : 0;
          return bDate - aDate;
        });
      });
    });

    return structure;
  };

  // Memoize swimlane structure so it's consistent across rendering and arrow positioning
  const swimlaneStructure = useMemo(() => {
    return swimlaneConfig.enabled ? groupProjectsForSwimlanes() : null;
  }, [swimlaneConfig.enabled, swimlaneConfig.level1, swimlaneConfig.level2, swimlaneConfig.level2Enabled, filteredProjects]);

  // Memoize the row index map to ensure consistency
  const projectRowIndexMap = useMemo(() => {
    const map = new Map<number, number>();

    if (!swimlaneConfig.enabled || !swimlaneStructure) {
      // Flat list mode: row index = position in filteredProjects array
      filteredProjects.forEach((project, index) => {
        map.set(project.id, index);
      });
    } else {
      // Swimlane mode: cumulative row indices across all swimlane groups
      // CRITICAL: Must iterate in EXACTLY the same order as rendering (line 3715)
      let absoluteRowIndex = 0;

      Object.entries(swimlaneStructure).forEach(([level1Key, level2Groups]) => {
        Object.entries(level2Groups).forEach(([level2Key, projects]) => {
          projects.forEach((project) => {
            map.set(project.id, absoluteRowIndex);
            absoluteRowIndex++;
          });
        });
      });
    }

    return map;
  }, [swimlaneConfig.enabled, swimlaneStructure, filteredProjects]);

  // Calculate total row count for swimlane layout (count all projects, not groups)
  const getTotalSwimlaneRows = (): number => {
    if (!swimlaneStructure) return 0;
    let totalRows = 0;
    Object.values(swimlaneStructure).forEach((level2Groups) => {
      Object.values(level2Groups).forEach((projects) => {
        totalRows += projects.length;
      });
    });
    return totalRows;
  };

  // Gantt Chart Helper Functions
  const getDateRange = () => {
    const allDates: Date[] = [];

    // Only consider filtered projects and their milestones
    const filteredProjectIds = filteredProjects.map(p => p.id);
    const relevantMilestones = milestones.filter(m => filteredProjectIds.includes(m.projectId));

    filteredProjects.forEach(project => {
      // Only use actual dates, not desired dates, to avoid empty timeline space
      const projectStart = project.startDate || project.desiredStartDate;
      const projectEnd = project.endDate || project.desiredCompletionDate;
      if (projectStart) allDates.push(new Date(projectStart));
      if (projectEnd) allDates.push(new Date(projectEnd));
    });

    relevantMilestones.forEach(milestone => {
      if (milestone.plannedStartDate) allDates.push(new Date(milestone.plannedStartDate));
      if (milestone.plannedEndDate) allDates.push(new Date(milestone.plannedEndDate));
    });

    if (allDates.length === 0) {
      const now = new Date();
      return {
        start: new Date(now.getFullYear(), 0, 1),
        end: new Date(now.getFullYear(), 11, 31)
      };
    }

    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));

    // Calculate dynamic padding based on date range
    const rangeInDays = (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);

    // Smart padding: smaller padding for shorter ranges, larger for longer ranges
    let paddingMonths = 1;
    if (rangeInDays < 90) {
      paddingMonths = 0.5; // 2 weeks for ranges under 3 months
    } else if (rangeInDays < 180) {
      paddingMonths = 1; // 1 month for ranges under 6 months
    } else if (rangeInDays > 730) {
      paddingMonths = 2; // 2 months for ranges over 2 years
    }

    // Apply padding
    const startPadded = new Date(minDate);
    const endPadded = new Date(maxDate);
    startPadded.setDate(startPadded.getDate() - (paddingMonths * 30));
    endPadded.setDate(endPadded.getDate() + (paddingMonths * 30));

    return { start: startPadded, end: endPadded };
  };

  const calculatePosition = (date: Date | undefined, rangeStart: Date, rangeEnd: Date) => {
    if (!date) return 0;
    const d = new Date(date);
    const totalRange = rangeEnd.getTime() - rangeStart.getTime();
    const position = ((d.getTime() - rangeStart.getTime()) / totalRange) * 100;
    return Math.max(0, Math.min(100, position));
  };

  const calculateWidth = (start: Date | undefined, end: Date | undefined, rangeStart: Date, rangeEnd: Date) => {
    if (!start || !end) return 0;
    const startPos = calculatePosition(start, rangeStart, rangeEnd);
    const endPos = calculatePosition(end, rangeStart, rangeEnd);
    return Math.max(1, endPos - startPos);
  };

  const getMonthMarkers = (rangeStart: Date, rangeEnd: Date) => {
    const markers: { position: number; label: string; isQuarter?: boolean }[] = [];
    const current = new Date(rangeStart);
    current.setDate(1);

    // Calculate total months in range
    const totalMonths = (rangeEnd.getFullYear() - rangeStart.getFullYear()) * 12 +
                        (rangeEnd.getMonth() - rangeStart.getMonth());

    // Determine interval based on range
    let interval = 1; // Show every month
    if (totalMonths > 24) interval = 3; // Show quarters if more than 2 years
    if (totalMonths > 60) interval = 6; // Show half-years if more than 5 years

    let monthCount = 0;
    while (current <= rangeEnd) {
      if (monthCount % interval === 0) {
        const position = calculatePosition(current, rangeStart, rangeEnd);
        const label = interval >= 3
          ? current.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
          : current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        markers.push({ position, label, isQuarter: interval >= 3 });
      }
      current.setMonth(current.getMonth() + 1);
      monthCount++;
    }

    return markers;
  };

  // Drag and Drop Helper Functions
  const pixelToDate = (pixelX: number, containerWidth: number, dateRange: { start: Date; end: Date }) => {
    const percentage = (pixelX / containerWidth) * 100;
    const totalMs = dateRange.end.getTime() - dateRange.start.getTime();
    return new Date(dateRange.start.getTime() + (percentage / 100) * totalMs);
  };

  const getTimeDeltaDays = (originalDate: Date, newDate: Date) => {
    return Math.round((newDate.getTime() - originalDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getAdjacentMilestones = (projectId: number, milestoneId: number) => {
    const projectMilestones = milestones
      .filter(m => m.projectId === projectId && m.plannedEndDate)
      .sort((a, b) => new Date(a.plannedEndDate!).getTime() - new Date(b.plannedEndDate!).getTime());

    const index = projectMilestones.findIndex(m => m.id === milestoneId);
    return {
      previous: index > 0 ? projectMilestones[index - 1] : null,
      next: index < projectMilestones.length - 1 ? projectMilestones[index + 1] : null,
    };
  };

  const constrainDate = (
    date: Date,
    previousMilestone: Milestone | null,
    nextMilestone: Milestone | null,
    projectId?: number
  ) => {
    let constrainedDate = new Date(date);

    // Constrain within project bounds
    if (projectId) {
      const project = projects.find(p => p.id === projectId);
      if (project) {
        const projectStart = project.startDate || project.desiredStartDate;
        const projectEnd = project.endDate || project.desiredCompletionDate;

        if (projectStart) {
          const startDate = new Date(projectStart);
          if (constrainedDate < startDate) {
            constrainedDate = new Date(startDate);
          }
        }

        if (projectEnd) {
          const endDate = new Date(projectEnd);
          if (constrainedDate > endDate) {
            constrainedDate = new Date(endDate);
          }
        }
      }
    }

    // Constrain based on adjacent milestones (prevent order changes)
    if (previousMilestone && previousMilestone.plannedEndDate) {
      const prevDate = new Date(previousMilestone.plannedEndDate);
      // Milestone must be after previous milestone
      if (constrainedDate <= prevDate) {
        constrainedDate = new Date(prevDate.getTime() + 24 * 60 * 60 * 1000);
      }
    }

    if (nextMilestone && nextMilestone.plannedEndDate) {
      const nextDate = new Date(nextMilestone.plannedEndDate);
      // Milestone must be before next milestone
      if (constrainedDate >= nextDate) {
        constrainedDate = new Date(nextDate.getTime() - 24 * 60 * 60 * 1000);
      }
    }

    return constrainedDate;
  };

  const handleUndo = async () => {
    if (!lastAction) return;

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (lastAction.type === 'project-move' || lastAction.type === 'project-resize') {
        // Undo project changes
        const { startDate, endDate } = lastAction.beforeState.projectDates!;
        await axios.put(`${API_URL}/projects/${lastAction.entityId}`, {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }, config);

        // Undo milestone changes if any
        if (lastAction.beforeState.milestoneDates) {
          await Promise.all(Object.entries(lastAction.beforeState.milestoneDates).map(([milestoneId, dates]) => {
            return axios.put(`${API_URL}/milestones/${milestoneId}`, {
              plannedEndDate: dates.endDate.toISOString(),
              plannedStartDate: dates.startDate ? dates.startDate.toISOString() : undefined,
            }, config);
          }));
        }
      } else if (lastAction.type === 'milestone-move') {
        // Undo milestone change
        await axios.put(`${API_URL}/milestones/${lastAction.entityId}`, {
          plannedEndDate: lastAction.beforeState.milestoneDate!.toISOString(),
        }, config);
      }

      setLastAction(null);
      setShowUndoSnackbar(false);
      await fetchData();
    } catch (error) {
      console.error('Error undoing action:', error);
      showAlert('Failed to undo action. Please try again.', 'error');
    }
  };

  const updateProjectDates = async (projectId: number, startDate: Date, endDate: Date, daysDelta: number) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Get old dates before update
      const project = projects.find(p => p.id === projectId);

      // Check if project is completed
      if (project && project.status === 'Completed') {
        showAlert('Cannot modify dates for completed projects. Please change the project status first.', 'warning');
        return;
      }

      const oldStartDate = project ? new Date(project.startDate || project.desiredStartDate || new Date()) : new Date();
      const oldEndDate = project ? new Date(project.endDate || project.desiredCompletionDate || new Date()) : new Date();

      // Update project
      await axios.put(`${API_URL}/projects/${projectId}`, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      }, config);

      // Update all milestones for this project
      const projectMilestones = milestones.filter(m => m.projectId === projectId && m.plannedEndDate);
      await Promise.all(projectMilestones.map(milestone => {
        const newMilestoneDate = new Date(
          new Date(milestone.plannedEndDate!).getTime() + daysDelta * 24 * 60 * 60 * 1000
        );
        return axios.put(`${API_URL}/milestones/${milestone.id}`, {
          plannedEndDate: newMilestoneDate.toISOString(),
          plannedStartDate: milestone.plannedStartDate
            ? new Date(new Date(milestone.plannedStartDate).getTime() + daysDelta * 24 * 60 * 60 * 1000).toISOString()
            : undefined,
        }, config);
      }));

      // Store undo action
      const milestoneDates: { [key: number]: { startDate?: Date; endDate: Date } } = {};
      projectMilestones.forEach(m => {
        milestoneDates[m.id] = {
          startDate: m.plannedStartDate ? new Date(m.plannedStartDate) : undefined,
          endDate: new Date(m.plannedEndDate!),
        };
      });

      setLastAction({
        type: 'project-move',
        entityId: projectId,
        entityType: 'project',
        beforeState: {
          projectDates: { startDate: oldStartDate, endDate: oldEndDate },
          milestoneDates,
        },
        afterState: {
          projectDates: { startDate, endDate },
          milestoneDates: Object.fromEntries(
            projectMilestones.map(m => [
              m.id,
              {
                startDate: m.plannedStartDate ? new Date(new Date(m.plannedStartDate).getTime() + daysDelta * 24 * 60 * 60 * 1000) : undefined,
                endDate: new Date(new Date(m.plannedEndDate!).getTime() + daysDelta * 24 * 60 * 60 * 1000),
              }
            ])
          ),
        },
        description: `Moved project timeline`,
      });
      setShowUndoSnackbar(true);

      // Adjust dependent projects based on start point change
      await adjustDependentProjects('project', projectId, oldStartDate, startDate, 'start');

      // Adjust dependent projects based on end point change
      await adjustDependentProjects('project', projectId, oldEndDate, endDate, 'end');

      // Refresh data
      await fetchData();
    } catch (error) {
      console.error('Error updating project dates:', error);
      showAlert('Failed to update project dates. Please try again.', 'error');
    }
  };

  const updateMilestoneDate = async (milestoneId: number, newDate: Date) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Get old date before update
      const milestone = milestones.find(m => m.id === milestoneId);

      // Check if parent project is completed
      if (milestone) {
        const project = projects.find(p => p.id === milestone.projectId);
        if (project && project.status === 'Completed') {
          showAlert('Cannot modify milestone dates for completed projects. Please change the project status first.', 'warning');
          return;
        }
      }

      const oldDate = milestone ? new Date(milestone.plannedEndDate || milestone.actualEndDate || new Date()) : new Date();

      await axios.put(`${API_URL}/milestones/${milestoneId}`, {
        plannedEndDate: newDate.toISOString(),
      }, config);

      // Store undo action
      if (milestone) {
        setLastAction({
          type: 'milestone-move',
          entityId: milestoneId,
          entityType: 'milestone',
          beforeState: {
            milestoneDate: oldDate,
          },
          afterState: {
            milestoneDate: newDate,
          },
          description: `Moved milestone "${milestone.name}"`,
        });
        setShowUndoSnackbar(true);
      }

      // Adjust dependent projects/milestones
      await adjustDependentProjects('milestone', milestoneId, oldDate, newDate, 'end');

      // Refresh data
      await fetchData();
    } catch (error) {
      console.error('Error updating milestone date:', error);
      showAlert('Failed to update milestone date. Please try again.', 'error');
    }
  };

  const updateProjectDatesWithResize = async (
    projectId: number,
    oldStartDate: Date,
    oldEndDate: Date,
    newStartDate: Date,
    newEndDate: Date
  ) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Check if project is completed
      const project = projects.find(p => p.id === projectId);
      if (project && project.status === 'Completed') {
        showAlert('Cannot modify dates for completed projects. Please change the project status first.', 'warning');
        return;
      }

      // Update project dates
      await axios.put(`${API_URL}/projects/${projectId}`, {
        startDate: newStartDate.toISOString(),
        endDate: newEndDate.toISOString(),
      }, config);

      // Calculate proportional milestone positions
      const projectMilestones = milestones.filter(m => m.projectId === projectId && m.plannedEndDate);
      const oldDuration = oldEndDate.getTime() - oldStartDate.getTime();
      const newDuration = newEndDate.getTime() - newStartDate.getTime();

      // Update each milestone proportionally
      await Promise.all(projectMilestones.map(milestone => {
        const oldMilestoneDate = new Date(milestone.plannedEndDate!);

        // Calculate relative position (0 to 1) in old timeline
        const relativePosition = (oldMilestoneDate.getTime() - oldStartDate.getTime()) / oldDuration;

        // Apply same relative position to new timeline
        const newMilestoneDate = new Date(newStartDate.getTime() + (relativePosition * newDuration));

        // Also update start date if it exists
        let newMilestoneStartDate;
        if (milestone.plannedStartDate) {
          const oldMilestoneStartDate = new Date(milestone.plannedStartDate);
          const relativeStartPosition = (oldMilestoneStartDate.getTime() - oldStartDate.getTime()) / oldDuration;
          newMilestoneStartDate = new Date(newStartDate.getTime() + (relativeStartPosition * newDuration));
        }

        return axios.put(`${API_URL}/milestones/${milestone.id}`, {
          plannedEndDate: newMilestoneDate.toISOString(),
          plannedStartDate: newMilestoneStartDate ? newMilestoneStartDate.toISOString() : milestone.plannedStartDate,
        }, config);
      }));

      // Store undo action
      const beforeMilestoneDates: { [key: number]: { startDate?: Date; endDate: Date } } = {};
      const afterMilestoneDates: { [key: number]: { startDate?: Date; endDate: Date } } = {};

      projectMilestones.forEach(m => {
        const oldDate = new Date(m.plannedEndDate!);
        const relativePosition = (oldDate.getTime() - oldStartDate.getTime()) / (oldEndDate.getTime() - oldStartDate.getTime());
        const newDate = new Date(newStartDate.getTime() + (relativePosition * (newEndDate.getTime() - newStartDate.getTime())));

        beforeMilestoneDates[m.id] = {
          startDate: m.plannedStartDate ? new Date(m.plannedStartDate) : undefined,
          endDate: oldDate,
        };
        afterMilestoneDates[m.id] = {
          startDate: m.plannedStartDate ? new Date(newStartDate.getTime() + ((new Date(m.plannedStartDate).getTime() - oldStartDate.getTime()) / (oldEndDate.getTime() - oldStartDate.getTime())) * (newEndDate.getTime() - newStartDate.getTime())) : undefined,
          endDate: newDate,
        };
      });

      setLastAction({
        type: 'project-resize',
        entityId: projectId,
        entityType: 'project',
        beforeState: {
          projectDates: { startDate: oldStartDate, endDate: oldEndDate },
          milestoneDates: beforeMilestoneDates,
        },
        afterState: {
          projectDates: { startDate: newStartDate, endDate: newEndDate },
          milestoneDates: afterMilestoneDates,
        },
        description: `Resized project timeline`,
      });
      setShowUndoSnackbar(true);

      // Adjust dependent projects based on start point change (if it changed)
      if (oldStartDate.getTime() !== newStartDate.getTime()) {
        await adjustDependentProjects('project', projectId, oldStartDate, newStartDate, 'start');
      }

      // Adjust dependent projects based on end point change (if it changed)
      if (oldEndDate.getTime() !== newEndDate.getTime()) {
        await adjustDependentProjects('project', projectId, oldEndDate, newEndDate, 'end');
      }

      // Refresh data
      await fetchData();
    } catch (error) {
      console.error('Error resizing project:', error);
      showAlert('Failed to resize project. Please try again.', 'error');
    }
  };

  // Dependency Arrow Helper Functions
  const getEntityPosition = (
    type: 'project' | 'milestone',
    id: number,
    point: 'start' | 'end',
    dateRange: { start: Date; end: Date }
  ): { x: number; y: number; rowIndex: number } | null => {

    if (type === 'project') {
      const project = filteredProjects.find(p => p.id === id);
      if (!project) return null;

      const projectStart = project.startDate || project.desiredStartDate;
      const projectEnd = project.endDate || project.desiredCompletionDate;

      if (!projectStart || !projectEnd) return null;

      const date = point === 'start' ? new Date(projectStart) : new Date(projectEnd);
      const x = calculatePosition(date, dateRange.start, dateRange.end);
      const rowIndex = projectRowIndexMap.get(id) ?? 0;

      // In flat list mode: each row has height:28 + marginBottom:4 + paddingBottom:4 + border:1 = 37px total
      // Bar is centered at top:50% of 28px container = 14px
      // In swimlane mode: each row has height 32px, bars are wrapped in containers positioned at projectIdx * 32
      // Bars are centered within their 32px wrapper at top:50% with transform: translateY(-50%)
      // Center is at: 32px / 2 = 16px from the top of the row
      const y = swimlaneConfig.enabled ? 16 : 14;
      return { x, y, rowIndex };
    } else if (type === 'milestone') {
      const milestone = milestones.find(m => m.id === id);
      if (!milestone) return null;

      const rowIndex = projectRowIndexMap.get(milestone.projectId);
      if (rowIndex === undefined) return null;

      const milestoneDate = milestone.actualEndDate || milestone.plannedEndDate;
      if (!milestoneDate) return null;

      const x = calculatePosition(new Date(milestoneDate), dateRange.start, dateRange.end);
      // Use same y-position as projects for consistency
      const y = swimlaneConfig.enabled ? 16 : 14;
      return { x, y, rowIndex };
    }

    return null;
  };

  const getDependencyColor = (type: string): string => {
    const colors: Record<string, string> = {
      FS: '#1976d2', // Blue
      SS: '#388e3c', // Green
      FF: '#f57c00', // Orange
      SF: '#d32f2f', // Red
    };
    return colors[type] || '#757575';
  };

  const getEntityName = (type: 'project' | 'milestone', id: number): string => {
    if (type === 'project') {
      const project = filteredProjects.find(p => p.id === id);
      return project ? `${project.projectNumber || `PRJ-${project.id}`}` : 'Unknown';
    } else {
      const milestone = milestones.find(m => m.id === id);
      return milestone ? milestone.name : 'Unknown';
    }
  };

  // Critical Path Method (CPM) Calculation
  interface CPMNode {
    id: string;
    type: 'project' | 'milestone';
    entityId: number;
    earliestStart: Date;
    earliestFinish: Date;
    latestStart: Date;
    latestFinish: Date;
    slack: number; // in days
  }

  const calculateCriticalPath = (): { nodes: Map<string, CPMNode>; criticalPath: string[] } => {
    const nodes = new Map<string, CPMNode>();

    // Initialize nodes for all projects
    projects.forEach(project => {
      const startDate = new Date(project.startDate || project.desiredStartDate || new Date());
      const endDate = new Date(project.endDate || project.desiredCompletionDate || new Date());

      nodes.set(`project-${project.id}`, {
        id: `project-${project.id}`,
        type: 'project',
        entityId: project.id,
        earliestStart: new Date(startDate),
        earliestFinish: new Date(endDate),
        latestStart: new Date(startDate),
        latestFinish: new Date(endDate),
        slack: 0,
      });
    });

    // Initialize nodes for all milestones
    milestones.forEach(milestone => {
      const date = new Date(milestone.plannedEndDate || milestone.actualEndDate || new Date());

      nodes.set(`milestone-${milestone.id}`, {
        id: `milestone-${milestone.id}`,
        type: 'milestone',
        entityId: milestone.id,
        earliestStart: new Date(date),
        earliestFinish: new Date(date),
        latestStart: new Date(date),
        latestFinish: new Date(date),
        slack: 0,
      });
    });

    // Forward pass: Calculate earliest start/finish
    dependencies.forEach(dep => {
      const predKey = `${dep.predecessorType}-${dep.predecessorId}`;
      const succKey = `${dep.successorType}-${dep.successorId}`;

      const predNode = nodes.get(predKey);
      const succNode = nodes.get(succKey);

      if (!predNode || !succNode) return;

      // Get predecessor date based on point
      const predDate = dep.predecessorPoint === 'start'
        ? new Date(predNode.earliestStart)
        : new Date(predNode.earliestFinish);

      // Apply lag
      predDate.setDate(predDate.getDate() + dep.lagDays);

      // Update successor's earliest start if this dependency requires a later start
      if (dep.successorPoint === 'start') {
        if (predDate.getTime() > succNode.earliestStart.getTime()) {
          const duration = succNode.earliestFinish.getTime() - succNode.earliestStart.getTime();
          succNode.earliestStart = new Date(predDate);
          succNode.earliestFinish = new Date(predDate.getTime() + duration);
        }
      } else {
        if (predDate.getTime() > succNode.earliestFinish.getTime()) {
          succNode.earliestFinish = new Date(predDate);
        }
      }
    });

    // Find project end date (maximum earliest finish)
    let projectEndDate = new Date(0);
    nodes.forEach(node => {
      if (node.earliestFinish.getTime() > projectEndDate.getTime()) {
        projectEndDate = new Date(node.earliestFinish);
      }
    });

    // Initialize all latest dates to project end date
    nodes.forEach(node => {
      node.latestFinish = new Date(projectEndDate);
      const duration = node.earliestFinish.getTime() - node.earliestStart.getTime();
      node.latestStart = new Date(node.latestFinish.getTime() - duration);
    });

    // Backward pass: Calculate latest start/finish
    const reversedDeps = [...dependencies].reverse();
    reversedDeps.forEach(dep => {
      const predKey = `${dep.predecessorType}-${dep.predecessorId}`;
      const succKey = `${dep.successorType}-${dep.successorId}`;

      const predNode = nodes.get(predKey);
      const succNode = nodes.get(succKey);

      if (!predNode || !succNode) return;

      // Get successor date based on point
      const succDate = dep.successorPoint === 'start'
        ? new Date(succNode.latestStart)
        : new Date(succNode.latestFinish);

      // Apply lag (subtract for backward pass)
      succDate.setDate(succDate.getDate() - dep.lagDays);

      // Update predecessor's latest finish if this dependency requires an earlier finish
      if (dep.predecessorPoint === 'end') {
        if (succDate.getTime() < predNode.latestFinish.getTime()) {
          const duration = predNode.earliestFinish.getTime() - predNode.earliestStart.getTime();
          predNode.latestFinish = new Date(succDate);
          predNode.latestStart = new Date(predNode.latestFinish.getTime() - duration);
        }
      } else {
        if (succDate.getTime() < predNode.latestStart.getTime()) {
          predNode.latestStart = new Date(succDate);
        }
      }
    });

    // Calculate slack for each node
    nodes.forEach(node => {
      const slackMs = node.latestStart.getTime() - node.earliestStart.getTime();
      node.slack = Math.round(slackMs / (1000 * 60 * 60 * 24));
    });

    // Identify critical path (nodes with zero or near-zero slack)
    const criticalPath: string[] = [];
    nodes.forEach(node => {
      if (node.slack <= 0) {
        criticalPath.push(node.id);
      }
    });

    return { nodes, criticalPath };
  };

  // Dependency Violation Detection
  const isDependencyViolated = (dependency: ProjectDependency): boolean => {
    let predecessorDate: Date | null = null;
    let successorDate: Date | null = null;

    // Get predecessor date
    if (dependency.predecessorType === 'project') {
      const project = projects.find(p => p.id === dependency.predecessorId);
      if (project) {
        predecessorDate = dependency.predecessorPoint === 'start'
          ? new Date(project.startDate || project.desiredStartDate || '')
          : new Date(project.endDate || project.desiredCompletionDate || '');
      }
    } else {
      const milestone = milestones.find(m => m.id === dependency.predecessorId);
      if (milestone) {
        predecessorDate = new Date(milestone.actualEndDate || milestone.plannedEndDate || '');
      }
    }

    // Get successor date
    if (dependency.successorType === 'project') {
      const project = projects.find(p => p.id === dependency.successorId);
      if (project) {
        successorDate = dependency.successorPoint === 'start'
          ? new Date(project.startDate || project.desiredStartDate || '')
          : new Date(project.endDate || project.desiredCompletionDate || '');
      }
    } else {
      const milestone = milestones.find(m => m.id === dependency.successorId);
      if (milestone) {
        successorDate = new Date(milestone.actualEndDate || milestone.plannedEndDate || '');
      }
    }

    if (!predecessorDate || !successorDate || isNaN(predecessorDate.getTime()) || isNaN(successorDate.getTime())) {
      return false;
    }

    // Apply lag days to predecessor date
    const adjustedPredecessorDate = new Date(predecessorDate);
    adjustedPredecessorDate.setDate(adjustedPredecessorDate.getDate() + dependency.lagDays);

    // Check for violation based on dependency type
    switch (dependency.dependencyType) {
      case 'FS': // Finish-to-Start: successor should start after predecessor finishes
        return successorDate.getTime() < adjustedPredecessorDate.getTime();
      case 'SS': // Start-to-Start: successor should start after predecessor starts
        return successorDate.getTime() < adjustedPredecessorDate.getTime();
      case 'FF': // Finish-to-Finish: successor should finish after predecessor finishes
        return successorDate.getTime() < adjustedPredecessorDate.getTime();
      case 'SF': // Start-to-Finish: successor should finish after predecessor starts
        return successorDate.getTime() < adjustedPredecessorDate.getTime();
      default:
        return false;
    }
  };

  // Dependency Auto-Adjustment Helper Functions
  const calculateDependentDate = (
    predecessorDate: Date,
    dependencyType: string,
    lagDays: number,
    isPredecessorStart: boolean
  ): Date => {
    const newDate = new Date(predecessorDate);

    // Apply lag time
    newDate.setDate(newDate.getDate() + lagDays);

    // For FS and SS, if predecessor is END, we already have the right date
    // For FF and SF, we might need adjustments based on project duration

    return newDate;
  };

  const findDependentEntities = (
    entityType: 'project' | 'milestone',
    entityId: number
  ): Array<{
    dependency: ProjectDependency;
    successorEntity: Project | Milestone;
    successorType: 'project' | 'milestone';
  }> => {
    return dependencies
      .filter(dep =>
        dep.predecessorType === entityType &&
        dep.predecessorId === entityId
      )
      .map(dep => {
        const successorEntity = dep.successorType === 'project'
          ? projects.find(p => p.id === dep.successorId)
          : milestones.find(m => m.id === dep.successorId);

        return {
          dependency: dep,
          successorEntity: successorEntity as Project | Milestone,
          successorType: dep.successorType,
        };
      })
      .filter(item => item.successorEntity !== undefined);
  };

  const adjustDependentProjects = async (
    movedEntityType: 'project' | 'milestone',
    movedEntityId: number,
    oldDate: Date,
    newDate: Date,
    pointMoved: 'start' | 'end'
  ): Promise<void> => {
    const dependents = findDependentEntities(movedEntityType, movedEntityId);

    if (dependents.length === 0) return;

    const dateDiffDays = Math.round((newDate.getTime() - oldDate.getTime()) / (1000 * 60 * 60 * 24));

    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    for (const { dependency, successorEntity, successorType } of dependents) {
      // Only adjust if the moved point matches the dependency's predecessor point
      if (dependency.predecessorPoint !== pointMoved) continue;

      try {
        if (successorType === 'project') {
          const project = successorEntity as Project;
          const currentStart = new Date(project.startDate || project.desiredStartDate || new Date());
          const currentEnd = new Date(project.endDate || project.desiredCompletionDate || new Date());

          let newStart = new Date(currentStart);
          let newEnd = new Date(currentEnd);

          // Apply adjustment based on dependency type
          switch (dependency.dependencyType) {
            case 'FS': // Finish-to-Start
              // Successor start should be after predecessor end + lag
              newStart = new Date(newDate);
              newStart.setDate(newStart.getDate() + dependency.lagDays);
              const duration = Math.round((currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24));
              newEnd = new Date(newStart);
              newEnd.setDate(newEnd.getDate() + duration);
              break;

            case 'SS': // Start-to-Start
              // Successor start should align with predecessor start + lag
              newStart.setDate(newStart.getDate() + dateDiffDays + dependency.lagDays);
              newEnd.setDate(newEnd.getDate() + dateDiffDays);
              break;

            case 'FF': // Finish-to-Finish
              // Successor end should align with predecessor end + lag
              newEnd.setDate(newEnd.getDate() + dateDiffDays + dependency.lagDays);
              break;

            case 'SF': // Start-to-Finish
              // Successor end should be after predecessor start + lag
              newEnd = new Date(newDate);
              newEnd.setDate(newEnd.getDate() + dependency.lagDays);
              break;
          }

          // Update the project
          await axios.put(
            `${API_URL}/projects/${project.id}`,
            {
              ...project,
              startDate: newStart,
              endDate: newEnd,
            },
            config
          );

          // Adjust milestones within the project
          const projectMilestones = milestones.filter(m => m.projectId === project.id);
          const startShiftDays = Math.round((newStart.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24));

          for (const milestone of projectMilestones) {
            try {
              const currentMilestoneDate = new Date(milestone.actualEndDate || milestone.plannedEndDate || new Date());
              const newMilestoneDate = new Date(currentMilestoneDate);
              newMilestoneDate.setDate(newMilestoneDate.getDate() + startShiftDays);

              await axios.put(
                `${API_URL}/milestones/${milestone.id}`,
                {
                  ...milestone,
                  plannedEndDate: newMilestoneDate,
                },
                config
              );
            } catch (error) {
              console.error(`Error adjusting milestone ${milestone.id}:`, error);
            }
          }

          // Recursively adjust projects that depend on this one
          await adjustDependentProjects(
            'project',
            project.id,
            dependency.dependencyType === 'FS' || dependency.dependencyType === 'FF'
              ? currentEnd
              : currentStart,
            dependency.dependencyType === 'FS' || dependency.dependencyType === 'FF'
              ? newEnd
              : newStart,
            dependency.successorPoint
          );

        } else {
          // Handle milestone adjustment
          const milestone = successorEntity as Milestone;
          const currentDate = new Date(milestone.actualEndDate || milestone.plannedEndDate || new Date());

          let newMilestoneDate = new Date(currentDate);
          newMilestoneDate.setDate(newMilestoneDate.getDate() + dateDiffDays + dependency.lagDays);

          await axios.put(
            `${API_URL}/milestones/${milestone.id}`,
            {
              ...milestone,
              plannedEndDate: newMilestoneDate,
            },
            config
          );
        }
      } catch (error) {
        console.error(`Error adjusting dependent ${successorType}:`, error);
      }
    }
  };

  // Kanban Helper Functions
  const getKanbanGroupValue = (project: Project): string => {
    switch (kanbanGroupBy) {
      case 'status':
        return project.status || 'No Status';
      case 'domain':
        return project.domain?.name || 'No Domain';
      case 'fiscalYear':
        return project.fiscalYear || 'No Fiscal Year';
      case 'targetRelease':
        return project.targetRelease || 'No Target Release';
      case 'targetSprint':
        return project.targetSprint || 'No Target Sprint';
      case 'priority':
        return project.priority || 'No Priority';
      case 'healthStatus':
        return project.healthStatus || 'No Health Status';
      case 'currentPhase':
        return project.currentPhase || 'No Phase';
      default:
        return 'Ungrouped';
    }
  };

  // Define all possible values for each grouping type
  const getAllPossibleGroups = (): string[] => {
    switch (kanbanGroupBy) {
      case 'status':
        return ['Planning', 'In Progress', 'On Hold', 'Completed', 'Cancelled'];
      case 'priority':
        return ['Critical', 'High', 'Medium', 'Low'];
      case 'healthStatus':
        return ['Green', 'Yellow', 'Red'];
      case 'currentPhase':
        return ['Initiation', 'Planning', 'Execution', 'Monitoring', 'Closure'];
      case 'domain':
        // Get unique domain names from all projects
        return Array.from(new Set(projects.map(p => p.domain?.name).filter(Boolean))) as string[];
      case 'fiscalYear':
        // Get unique fiscal years from all projects
        return Array.from(new Set(projects.map(p => p.fiscalYear).filter(Boolean))) as string[];
      case 'targetRelease':
        // Get unique target releases from all projects
        return Array.from(new Set(projects.map(p => p.targetRelease).filter(Boolean))) as string[];
      case 'targetSprint':
        // Get unique target sprints from all projects
        return Array.from(new Set(projects.map(p => p.targetSprint).filter(Boolean))) as string[];
      default:
        return [];
    }
  };

  // Initialize groupedProjects with all possible columns (including empty ones)
  const groupedProjects = (() => {
    const allGroups = getAllPossibleGroups();

    // Initialize with empty arrays for all possible groups
    const initialGroups: Record<string, Project[]> = {};
    allGroups.forEach(group => {
      initialGroups[group] = [];
    });

    // Populate with actual projects
    filteredProjects.forEach(project => {
      const groupValue = getKanbanGroupValue(project);

      // If the group doesn't exist in our predefined list, add it
      if (!initialGroups[groupValue]) {
        initialGroups[groupValue] = [];
      }

      initialGroups[groupValue].push(project);
    });

    return initialGroups;
  })();

  // Sort projects within each group by rank
  Object.keys(groupedProjects).forEach(group => {
    groupedProjects[group].sort((a, b) => (a.rank || 0) - (b.rank || 0));
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as number;
    const overId = over.id;

    if (activeId === overId) return;

    const activeProject = projects.find(p => p.id === activeId);
    if (!activeProject) return;

    const activeGroup = getKanbanGroupValue(activeProject);
    let overGroup: string;
    let overIndex: number;

    // Check if dropped on another project or on a column
    if (typeof overId === 'string' && overId.startsWith('kanban-column-')) {
      // Dropped on an empty column
      overGroup = overId.replace('kanban-column-', '');
      overIndex = -1; // Add to end of column
    } else {
      // Dropped on another project
      const overProject = projects.find(p => p.id === overId as number);
      if (!overProject) return;
      overGroup = getKanbanGroupValue(overProject);
      overIndex = projects.findIndex(p => p.id === overId);
    }

    // Reorder projects
    const updatedProjects = [...projects];
    const activeIndex = updatedProjects.findIndex(p => p.id === activeId);

    const [removed] = updatedProjects.splice(activeIndex, 1);

    // If moving to different group, update the project's group field
    if (activeGroup !== overGroup) {
      switch (kanbanGroupBy) {
        case 'status':
          removed.status = overGroup;
          break;
        case 'priority':
          removed.priority = overGroup;
          break;
        case 'healthStatus':
          removed.healthStatus = overGroup;
          break;
        case 'currentPhase':
          removed.currentPhase = overGroup;
          break;
        // domain and fiscalYear are typically not changed via drag-and-drop
      }
    }

    // Insert at the appropriate position
    if (overIndex === -1) {
      // Dropped on empty column - add to end
      updatedProjects.push(removed);
    } else {
      // Dropped on another project - insert at that position
      updatedProjects.splice(overIndex, 0, removed);
    }

    // Update ranks based on new positions within the group
    const groupProjects = updatedProjects.filter(p => getKanbanGroupValue(p) === overGroup);
    const rankedProjects = groupProjects.map((project, index) => ({
      id: project.id,
      rank: index,
    }));

    setProjects(updatedProjects);

    // Persist changes to backend
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Update rank
      await axios.put(`${API_URL}/projects/bulk-update-ranks`, { projects: rankedProjects }, config);

      // Update group field if changed
      if (activeGroup !== overGroup) {
        await axios.put(`${API_URL}/projects/${activeId}`, removed, config);
      }
    } catch (error) {
      console.error('Error updating project:', error);
      // Revert on error
      fetchData();
    }
  };

  // Gantt drag and drop handlers for reordering
  const handleGanttDragStart = (event: DragStartEvent) => {
    setGanttActiveId(event.active.id as number);
  };

  const handleGanttDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setGanttActiveId(null);

    if (!over) return;

    const activeId = active.id as number;
    const overId = over.id as number;

    if (activeId === overId) return;

    const activeProject = filteredProjects.find(p => p.id === activeId);
    const overProject = filteredProjects.find(p => p.id === overId);

    if (!activeProject || !overProject) return;

    // Helper function to get group keys for a project
    const getGroupKeys = (project: Project) => {
      if (!swimlaneConfig.enabled) {
        return { level1: 'all', level2: 'all' };
      }
      return {
        level1: getGroupKey(project, swimlaneConfig.level1),
        level2: swimlaneConfig.level2Enabled ? getGroupKey(project, swimlaneConfig.level2) : 'all',
      };
    };

    const activeKeys = getGroupKeys(activeProject);
    const overKeys = getGroupKeys(overProject);

    // Only allow reordering within the same level2 group
    if (activeKeys.level1 !== overKeys.level1 || activeKeys.level2 !== overKeys.level2) {
      return;
    }

    // Get all projects in the same group
    const groupKey = `${activeKeys.level1}-${activeKeys.level2}`;
    const groupProjects = filteredProjects.filter(p => {
      const keys = getGroupKeys(p);
      return keys.level1 === activeKeys.level1 && keys.level2 === activeKeys.level2;
    });

    // Find indices within the group
    const activeIndex = groupProjects.findIndex(p => p.id === activeId);
    const overIndex = groupProjects.findIndex(p => p.id === overId);

    // Reorder within the group
    const reorderedGroup = [...groupProjects];
    const [removed] = reorderedGroup.splice(activeIndex, 1);
    reorderedGroup.splice(overIndex, 0, removed);

    // Assign new sortOrder values
    const updatedSortOrders = reorderedGroup.map((project, index) => ({
      id: project.id,
      sortOrder: index,
    }));

    // Update local state optimistically
    const updatedProjects = projects.map(project => {
      const update = updatedSortOrders.find(u => u.id === project.id);
      if (update) {
        return { ...project, sortOrder: update.sortOrder };
      }
      return project;
    });

    setProjects(updatedProjects);

    // Persist changes to backend
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.put(
        `${API_URL}/projects/bulk-update-sort-orders`,
        { projects: updatedSortOrders },
        config
      );
    } catch (error) {
      console.error('Error updating project sort orders:', error);
      // Revert on error
      fetchData();
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: '100%', overflowX: 'hidden' }}>
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
            Project Management
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
          >
            Manage and track all enterprise projects
          </Typography>
        </Box>
        <Box
          display="flex"
          flexWrap="wrap"
          gap={1}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          <Button
            variant={viewMode === 'list' ? 'contained' : 'outlined'}
            startIcon={<ViewListIcon sx={{ display: { xs: 'none', sm: 'inline' } }} />}
            onClick={() => setViewMode('list')}
            size="small"
            sx={{ flex: { xs: '1 1 auto', sm: '0 0 auto' } }}
          >
            List
          </Button>
          <Button
            variant={viewMode === 'gantt' ? 'contained' : 'outlined'}
            startIcon={<TimelineIcon sx={{ display: { xs: 'none', sm: 'inline' } }} />}
            onClick={() => setViewMode('gantt')}
            size="small"
            sx={{ flex: { xs: '1 1 auto', sm: '0 0 auto' } }}
          >
            Gantt
          </Button>
          <Button
            variant={viewMode === 'kanban' ? 'contained' : 'outlined'}
            startIcon={<ViewKanbanIcon sx={{ display: { xs: 'none', sm: 'inline' } }} />}
            onClick={() => setViewMode('kanban')}
            size="small"
            sx={{ flex: { xs: '1 1 auto', sm: '0 0 auto' } }}
          >
            Kanban
          </Button>
          <Button
            variant="outlined"
            startIcon={<TemplateIcon sx={{ display: { xs: 'none', sm: 'inline' } }} />}
            onClick={generateProjectTemplate}
            size="small"
            sx={{ flex: { xs: '1 1 auto', sm: '0 0 auto' } }}
          >
            Template
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon sx={{ display: { xs: 'none', sm: 'inline' } }} />}
            onClick={handleExport}
            size="small"
            sx={{ flex: { xs: '1 1 auto', sm: '0 0 auto' } }}
          >
            <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>Export to </Box>Excel
          </Button>
          <Button
            variant="outlined"
            component="label"
            startIcon={<UploadIcon sx={{ display: { xs: 'none', sm: 'inline' } }} />}
            size="small"
            sx={{ flex: { xs: '1 1 auto', sm: '0 0 auto' } }}
          >
            <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>Import from </Box>Excel
            <input
              type="file"
              hidden
              accept=".csv,.xlsx,.xls"
              onChange={handleImport}
            />
          </Button>
          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
          <Button
            variant="contained"
            startIcon={<CameraAltIcon sx={{ display: { xs: 'none', sm: 'inline' } }} />}
            endIcon={<ExpandMoreIcon />}
            onClick={(e) => setExportViewAnchor(e.currentTarget)}
            size="small"
            disabled={exportingView}
            sx={{ flex: { xs: '1 1 auto', sm: '0 0 auto' } }}
          >
            {exportingView ? 'Exporting...' : 'Export View'}
          </Button>
          <Menu
            anchorEl={exportViewAnchor}
            open={Boolean(exportViewAnchor)}
            onClose={() => setExportViewAnchor(null)}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem onClick={() => handleViewExport('png')}>
              <ImageIcon sx={{ mr: 1, fontSize: 20 }} />
              Export as PNG
            </MenuItem>
            <MenuItem onClick={() => handleViewExport('pdf')}>
              <PictureAsPdfIcon sx={{ mr: 1, fontSize: 20 }} />
              Export as PDF
            </MenuItem>
          </Menu>
          <Button
            variant="outlined"
            startIcon={<DependencyIcon sx={{ display: { xs: 'none', sm: 'inline' } }} />}
            onClick={handleOpenDependencyManagerDialog}
            size="small"
            sx={{ flex: { xs: '1 1 auto', sm: '0 0 auto' } }}
          >
            Dependencies
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            size="small"
            sx={{ flex: { xs: '1 1 100%', sm: '0 0 auto' } }}
          >
            Add Project
          </Button>
        </Box>
      </Box>

      <Box ref={contentRef}>
      {viewMode === 'list' && (
        <>
          <SharedFilters />
          <TableContainer component={Paper} sx={{ overflowX: 'auto', mt: 2 }}>
          <Table sx={{ minWidth: { xs: 800, md: 1200 } }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 100 }}>
                <TableSortLabel
                  active={orderBy === 'projectNumber'}
                  direction={orderBy === 'projectNumber' ? order : 'asc'}
                  onClick={() => handleRequestSort('projectNumber')}
                >
                  Project #
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ minWidth: 180 }}>
                <TableSortLabel
                  active={orderBy === 'name'}
                  direction={orderBy === 'name' ? order : 'asc'}
                  onClick={() => handleRequestSort('name')}
                >
                  Project Name
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ minWidth: 120 }}>
                <TableSortLabel
                  active={orderBy === 'domain'}
                  direction={orderBy === 'domain' ? order : 'asc'}
                  onClick={() => handleRequestSort('domain')}
                >
                  Domain
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ minWidth: 120 }}>
                <TableSortLabel
                  active={orderBy === 'segmentFunction'}
                  direction={orderBy === 'segmentFunction' ? order : 'asc'}
                  onClick={() => handleRequestSort('segmentFunction')}
                >
                  Segment Function
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ minWidth: 100 }}>
                <TableSortLabel
                  active={orderBy === 'type'}
                  direction={orderBy === 'type' ? order : 'asc'}
                  onClick={() => handleRequestSort('type')}
                >
                  Type
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ minWidth: 100 }}>
                <TableSortLabel
                  active={orderBy === 'fiscalYear'}
                  direction={orderBy === 'fiscalYear' ? order : 'asc'}
                  onClick={() => handleRequestSort('fiscalYear')}
                >
                  Fiscal Year
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ minWidth: 100 }}>
                <TableSortLabel
                  active={orderBy === 'targetRelease'}
                  direction={orderBy === 'targetRelease' ? order : 'asc'}
                  onClick={() => handleRequestSort('targetRelease')}
                >
                  Target Release
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ minWidth: 100 }}>
                <TableSortLabel
                  active={orderBy === 'targetSprint'}
                  direction={orderBy === 'targetSprint' ? order : 'asc'}
                  onClick={() => handleRequestSort('targetSprint')}
                >
                  Target Sprint
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ minWidth: 110 }}>
                <TableSortLabel
                  active={orderBy === 'status'}
                  direction={orderBy === 'status' ? order : 'asc'}
                  onClick={() => handleRequestSort('status')}
                >
                  Status
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ minWidth: 100 }}>
                <TableSortLabel
                  active={orderBy === 'priority'}
                  direction={orderBy === 'priority' ? order : 'asc'}
                  onClick={() => handleRequestSort('priority')}
                >
                  Priority
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ minWidth: 120 }}>
                <TableSortLabel
                  active={orderBy === 'currentPhase'}
                  direction={orderBy === 'currentPhase' ? order : 'asc'}
                  onClick={() => handleRequestSort('currentPhase')}
                >
                  Current Phase
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ minWidth: 100 }}>
                <TableSortLabel
                  active={orderBy === 'progress'}
                  direction={orderBy === 'progress' ? order : 'asc'}
                  onClick={() => handleRequestSort('progress')}
                >
                  Progress
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ minWidth: 120 }}>
                <TableSortLabel
                  active={orderBy === 'budget'}
                  direction={orderBy === 'budget' ? order : 'asc'}
                  onClick={() => handleRequestSort('budget')}
                >
                  Budget
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ minWidth: 110 }}>
                <TableSortLabel
                  active={orderBy === 'startDate'}
                  direction={orderBy === 'startDate' ? order : 'asc'}
                  onClick={() => handleRequestSort('startDate')}
                >
                  Start Date
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ minWidth: 110 }}>
                <TableSortLabel
                  active={orderBy === 'endDate'}
                  direction={orderBy === 'endDate' ? order : 'asc'}
                  onClick={() => handleRequestSort('endDate')}
                >
                  End Date
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ minWidth: 90 }}>
                <TableSortLabel
                  active={orderBy === 'healthStatus'}
                  direction={orderBy === 'healthStatus' ? order : 'asc'}
                  onClick={() => handleRequestSort('healthStatus')}
                >
                  Health
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ minWidth: 80 }}>
                <TableSortLabel
                  active={orderBy === 'risk'}
                  direction={orderBy === 'risk' ? order : 'asc'}
                  onClick={() => handleRequestSort('risk')}
                >
                  Risk
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ minWidth: 180 }}>Dependencies & Impact</TableCell>
              <TableCell align="right" sx={{ minWidth: 140 }}>Actions</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <TextField
                  size="small"
                  placeholder="Filter by #"
                  value={filters.projectNumber}
                  onChange={(e) => setFilters({ ...filters, projectNumber: e.target.value })}
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
                <TextField
                  size="small"
                  select
                  placeholder="All"
                  value={filters.segmentFunction}
                  onChange={(e) => setFilters({ ...filters, segmentFunction: e.target.value as unknown as string[] })}
                  SelectProps={{
                    multiple: true,
                    renderValue: (selected) =>
                      (selected as string[]).length > 0 ? `${(selected as string[]).length} selected` : 'All'
                  }}
                  fullWidth
                >
                  {segmentFunctions.map((segmentFunction) => (
                    <MenuItem key={segmentFunction.id} value={segmentFunction.name}>
                      <Checkbox checked={filters.segmentFunction.indexOf(segmentFunction.name) > -1} size="small" />
                      {segmentFunction.name}
                    </MenuItem>
                  ))}
                </TextField>
              </TableCell>
              <TableCell>
                <TextField
                  size="small"
                  placeholder="Filter by type"
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  fullWidth
                />
              </TableCell>
              <TableCell>
                <TextField
                  size="small"
                  select
                  placeholder="All"
                  value={filters.fiscalYear}
                  onChange={(e) => setFilters({ ...filters, fiscalYear: e.target.value as unknown as string[] })}
                  SelectProps={{
                    multiple: true,
                    renderValue: (selected) =>
                      (selected as string[]).length > 0 ? `${(selected as string[]).length} selected` : 'All'
                  }}
                  fullWidth
                >
                  {uniqueFiscalYears.map((year) => (
                    <MenuItem key={year} value={year}>
                      <Checkbox checked={filters.fiscalYear.indexOf(year) > -1} size="small" />
                      {year}
                    </MenuItem>
                  ))}
                </TextField>
              </TableCell>
              <TableCell>
                <TextField
                  size="small"
                  select
                  placeholder="All"
                  value={filters.targetRelease}
                  onChange={(e) => setFilters({ ...filters, targetRelease: e.target.value as unknown as string[] })}
                  SelectProps={{
                    multiple: true,
                    renderValue: (selected) =>
                      (selected as string[]).length > 0 ? `${(selected as string[]).length} selected` : 'All'
                  }}
                  fullWidth
                >
                  {uniqueTargetReleases.map((release) => (
                    <MenuItem key={release} value={release}>
                      <Checkbox checked={filters.targetRelease.indexOf(release) > -1} size="small" />
                      {release}
                    </MenuItem>
                  ))}
                </TextField>
              </TableCell>
              <TableCell>
                <TextField
                  size="small"
                  select
                  placeholder="All"
                  value={filters.targetSprint}
                  onChange={(e) => setFilters({ ...filters, targetSprint: e.target.value as unknown as string[] })}
                  SelectProps={{
                    multiple: true,
                    renderValue: (selected) =>
                      (selected as string[]).length > 0 ? `${(selected as string[]).length} selected` : 'All'
                  }}
                  fullWidth
                >
                  {uniqueTargetSprints.map((sprint) => (
                    <MenuItem key={sprint} value={sprint}>
                      <Checkbox checked={filters.targetSprint.indexOf(sprint) > -1} size="small" />
                      {sprint}
                    </MenuItem>
                  ))}
                </TextField>
              </TableCell>
              <TableCell>
                <TextField
                  size="small"
                  select
                  placeholder="All"
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value as unknown as string[] })}
                  SelectProps={{
                    multiple: true,
                    renderValue: (selected) =>
                      (selected as string[]).length > 0 ? `${(selected as string[]).length} selected` : 'All'
                  }}
                  fullWidth
                >
                  <MenuItem value="Planning">
                    <Checkbox checked={filters.status.indexOf('Planning') > -1} size="small" />
                    Planning
                  </MenuItem>
                  <MenuItem value="In Progress">
                    <Checkbox checked={filters.status.indexOf('In Progress') > -1} size="small" />
                    In Progress
                  </MenuItem>
                  <MenuItem value="On Hold">
                    <Checkbox checked={filters.status.indexOf('On Hold') > -1} size="small" />
                    On Hold
                  </MenuItem>
                  <MenuItem value="Completed">
                    <Checkbox checked={filters.status.indexOf('Completed') > -1} size="small" />
                    Completed
                  </MenuItem>
                  <MenuItem value="Cancelled">
                    <Checkbox checked={filters.status.indexOf('Cancelled') > -1} size="small" />
                    Cancelled
                  </MenuItem>
                </TextField>
              </TableCell>
              <TableCell>
                <TextField
                  size="small"
                  select
                  placeholder="All"
                  value={filters.priority}
                  onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                  fullWidth
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="Low">Low</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                  <MenuItem value="Critical">Critical</MenuItem>
                </TextField>
              </TableCell>
              <TableCell>
                <TextField
                  size="small"
                  placeholder="Filter by phase"
                  value={filters.currentPhase}
                  onChange={(e) => setFilters({ ...filters, currentPhase: e.target.value })}
                  fullWidth
                />
              </TableCell>
              <TableCell />
              <TableCell />
              <TableCell />
              <TableCell />
              <TableCell>
                <TextField
                  size="small"
                  select
                  placeholder="All"
                  value={filters.health}
                  onChange={(e) => setFilters({ ...filters, health: e.target.value as unknown as string[] })}
                  SelectProps={{
                    multiple: true,
                    renderValue: (selected) =>
                      (selected as string[]).length > 0 ? `${(selected as string[]).length} selected` : 'All'
                  }}
                  fullWidth
                >
                  <MenuItem value="Green">
                    <Checkbox checked={filters.health.indexOf('Green') > -1} size="small" />
                    Green
                  </MenuItem>
                  <MenuItem value="Yellow">
                    <Checkbox checked={filters.health.indexOf('Yellow') > -1} size="small" />
                    Yellow
                  </MenuItem>
                  <MenuItem value="Red">
                    <Checkbox checked={filters.health.indexOf('Red') > -1} size="small" />
                    Red
                  </MenuItem>
                </TextField>
              </TableCell>
              <TableCell />
              <TableCell>
                <TextField
                  size="small"
                  select
                  placeholder="All"
                  value={filters.impactedDomain}
                  onChange={(e) => setFilters({ ...filters, impactedDomain: e.target.value as unknown as string[] })}
                  SelectProps={{
                    multiple: true,
                    renderValue: (selected) =>
                      (selected as string[]).length > 0 ? `${(selected as string[]).length} selected` : 'All'
                  }}
                  fullWidth
                >
                  {domains.map((domain) => (
                    <MenuItem key={domain.id} value={domain.name}>
                      <Checkbox checked={filters.impactedDomain.indexOf(domain.name) > -1} size="small" />
                      {domain.name}
                    </MenuItem>
                  ))}
                </TextField>
              </TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProjects.map((project) => (
              <TableRow key={project.id}>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <Typography variant="body2" fontWeight="medium">
                      {project.projectNumber || '-'}
                    </Typography>
                    {getBusinessDecisionIcon(project.businessDecision)}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box flex={1}>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <Typography variant="body1" fontWeight="medium">
                          {project.name}
                        </Typography>
                        {getCrossDomainCount(project.id) > 0 && (
                          <Chip
                            icon={<HubIcon sx={{ fontSize: 14 }} />}
                            label={`${getCrossDomainCount(project.id)} domains`}
                            size="small"
                            color="info"
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        )}
                      </Box>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {project.description}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  {project.domain?.name || '-'}
                </TableCell>
                <TableCell>
                  {project.segmentFunctionData?.name || '-'}
                </TableCell>
                <TableCell>{project.type || '-'}</TableCell>
                <TableCell>{project.fiscalYear || '-'}</TableCell>
                <TableCell>{project.targetRelease || '-'}</TableCell>
                <TableCell>{project.targetSprint || '-'}</TableCell>
                <TableCell>
                  <Chip label={project.status} size="small" color={getStatusColor(project.status)} />
                </TableCell>
                <TableCell>
                  <Chip label={project.priority} size="small" variant="outlined" />
                </TableCell>
                <TableCell>{project.currentPhase || '-'}</TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <LinearProgress
                      variant="determinate"
                      value={project.progress}
                      sx={{ width: 100, height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="body2">{project.progress}%</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{formatCurrency(project.budget)}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Spent: {formatCurrency(project.actualCost)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {project.startDate ? new Date(project.startDate).toLocaleDateString() : '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {project.endDate ? new Date(project.endDate).toLocaleDateString() : '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={project.healthStatus || 'N/A'}
                    size="small"
                    color={getHealthColor(project.healthStatus) as any}
                  />
                </TableCell>
                <TableCell>
                  {projectRisks[project.id] !== undefined ? (
                    <Tooltip
                      title={`Risk Score: ${projectRisks[project.id]} (${getRiskLevel(projectRisks[project.id])})`}
                      arrow
                    >
                      <Chip
                        label={projectRisks[project.id]}
                        size="small"
                        sx={{
                          bgcolor: getRiskColor(projectRisks[project.id]),
                          color: 'white',
                          fontWeight: 'bold',
                        }}
                      />
                    </Tooltip>
                  ) : (
                    <Chip label="..." size="small" />
                  )}
                </TableCell>
                <TableCell>
                  {(() => {
                    const { impacting, impactedBy } = getDependencyCounts(project.id);
                    const impactedDomains = getImpactedDomains(project.id);

                    return (
                      <Box>
                        <Box display="flex" gap={1} mb={0.5}>
                          <Chip
                            label={`↑ ${impacting}`}
                            size="small"
                            color={impacting > 0 ? 'primary' : 'default'}
                            variant="outlined"
                            sx={{ fontSize: '0.7rem', minWidth: 45 }}
                            title="This project impacts"
                          />
                          <Chip
                            label={`↓ ${impactedBy}`}
                            size="small"
                            color={impactedBy > 0 ? 'warning' : 'default'}
                            variant="outlined"
                            sx={{ fontSize: '0.7rem', minWidth: 45 }}
                            title="This project is impacted by"
                          />
                        </Box>
                        {impactedDomains.length > 0 && (
                          <Box display="flex" flexWrap="wrap" gap={0.5}>
                            {impactedDomains.map((domainName, index) => (
                              <Chip
                                key={index}
                                label={domainName}
                                size="small"
                                color="info"
                                variant="outlined"
                                sx={{ fontSize: '0.65rem' }}
                              />
                            ))}
                          </Box>
                        )}
                      </Box>
                    );
                  })()}
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => handleViewResources(project)}
                    title="View Resources"
                  >
                    <PeopleIcon />
                  </IconButton>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => handleOpenDialog(project)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDelete(project.id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
        </>
      )}

      {viewMode === 'kanban' && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <Box>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Kanban Board</Typography>
              <TextField
                select
                size="small"
                label="Group By"
                value={kanbanGroupBy}
                onChange={(e) => setKanbanGroupBy(e.target.value as any)}
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="status">Status</MenuItem>
                <MenuItem value="domain">Domain</MenuItem>
                <MenuItem value="fiscalYear">Fiscal Year</MenuItem>
                <MenuItem value="targetRelease">Target Release</MenuItem>
                <MenuItem value="targetSprint">Target Sprint</MenuItem>
                <MenuItem value="priority">Priority</MenuItem>
                <MenuItem value="healthStatus">Health Status</MenuItem>
                <MenuItem value="currentPhase">Current Phase</MenuItem>
              </TextField>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2 }}>
              {Object.entries(groupedProjects).map(([groupName, groupProjects]) => (
                <KanbanColumn
                  key={groupName}
                  groupName={groupName}
                  groupProjects={groupProjects}
                  onEdit={handleOpenDialog}
                  projectRisks={projectRisks}
                />
              ))}
            </Box>
          </Box>

          <DragOverlay>
            {activeId ? (
              <Box sx={{ opacity: 0.8 }}>
                <KanbanCard project={projects.find(p => p.id === activeId)!} onEdit={handleOpenDialog} projectRisks={projectRisks} />
              </Box>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {viewMode === 'gantt' && (
        <Paper sx={{ p: 2, overflow: 'hidden' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Project Timeline
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Sidebar Width:
              </Typography>
              <Button
                size="small"
                variant={ganttSidebarWidth === 200 ? 'contained' : 'outlined'}
                onClick={() => setGanttSidebarWidth(200)}
                sx={{ minWidth: 60, px: 1, py: 0.5 }}
              >
                Compact
              </Button>
              <Button
                size="small"
                variant={ganttSidebarWidth === 300 ? 'contained' : 'outlined'}
                onClick={() => setGanttSidebarWidth(300)}
                sx={{ minWidth: 60, px: 1, py: 0.5 }}
              >
                Normal
              </Button>
              <Button
                size="small"
                variant={ganttSidebarWidth === 400 ? 'contained' : 'outlined'}
                onClick={() => setGanttSidebarWidth(400)}
                sx={{ minWidth: 60, px: 1, py: 0.5 }}
              >
                Wide
              </Button>

              <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

              <Typography variant="caption" color="text.secondary">
                Gridlines:
              </Typography>
              <Button
                size="small"
                variant={showGridlines ? 'contained' : 'outlined'}
                onClick={() => {
                  const newValue = !showGridlines;
                  setShowGridlines(newValue);
                  localStorage.setItem('ganttShowGridlines', JSON.stringify(newValue));
                }}
                sx={{ minWidth: 60, px: 1, py: 0.5 }}
              >
                {showGridlines ? 'ON' : 'OFF'}
              </Button>
            </Box>
          </Box>

          {/* Gantt Filters */}
          <Box sx={{ mb: 2, bgcolor: 'action.hover', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
            {/* Filter Header */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 1.5,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.selected' },
                borderRadius: '4px 4px 0 0',
              }}
              onClick={() => setFiltersExpanded(!filtersExpanded)}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <FilterListIcon fontSize="small" color="primary" />
                <Typography variant="subtitle2" fontWeight="600">
                  Filters
                </Typography>
                {getActiveFilterCount() > 0 && (
                  <Chip
                    label={`${getActiveFilterCount()} active`}
                    size="small"
                    color="primary"
                    sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                  />
                )}
              </Box>
              <IconButton size="small">
                {filtersExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>

            {/* Filter Content */}
            {filtersExpanded && (
              <Box sx={{ p: 1.5, pt: 0 }}>
                <Grid container spacing={1.5}>
                  <Grid item xs={12}>
                    <SharedFilters />
                  </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  size="small"
                  fullWidth
                  label="Project #"
                  placeholder="Search..."
                  value={filters.projectNumber}
                  onChange={(e) => setFilters({ ...filters, projectNumber: e.target.value })}
                  sx={{ bgcolor: 'background.paper' }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  size="small"
                  fullWidth
                  label="Project Name"
                  placeholder="Search..."
                  value={filters.name}
                  onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                  sx={{ bgcolor: 'background.paper' }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  size="small"
                  select
                  fullWidth
                  label="Segment Function"
                  value={filters.segmentFunction}
                  onChange={(e) => setFilters({ ...filters, segmentFunction: e.target.value as unknown as string[] })}
                  SelectProps={{
                    multiple: true,
                    renderValue: (selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected as string[]).map((value) => (
                          <Chip key={value} label={value} size="small" sx={{ height: 20 }} />
                        ))}
                      </Box>
                    ),
                  }}
                  sx={{ bgcolor: 'background.paper' }}
                >
                  {segmentFunctions.map((sf) => (
                    <MenuItem key={sf.id} value={sf.name}>
                      <Checkbox checked={filters.segmentFunction.indexOf(sf.name) > -1} size="small" />
                      {sf.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  size="small"
                  select
                  fullWidth
                  label="Status"
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value as unknown as string[] })}
                  SelectProps={{
                    multiple: true,
                    renderValue: (selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected as string[]).map((value) => (
                          <Chip key={value} label={value} size="small" sx={{ height: 20 }} />
                        ))}
                      </Box>
                    ),
                  }}
                  sx={{ bgcolor: 'background.paper' }}
                >
                  <MenuItem value="Planning">
                    <Checkbox checked={filters.status.indexOf('Planning') > -1} size="small" />
                    Planning
                  </MenuItem>
                  <MenuItem value="In Progress">
                    <Checkbox checked={filters.status.indexOf('In Progress') > -1} size="small" />
                    In Progress
                  </MenuItem>
                  <MenuItem value="Completed">
                    <Checkbox checked={filters.status.indexOf('Completed') > -1} size="small" />
                    Completed
                  </MenuItem>
                  <MenuItem value="On Hold">
                    <Checkbox checked={filters.status.indexOf('On Hold') > -1} size="small" />
                    On Hold
                  </MenuItem>
                  <MenuItem value="Cancelled">
                    <Checkbox checked={filters.status.indexOf('Cancelled') > -1} size="small" />
                    Cancelled
                  </MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  size="small"
                  select
                  fullWidth
                  label="Health Status"
                  value={filters.health}
                  onChange={(e) => setFilters({ ...filters, health: e.target.value as unknown as string[] })}
                  SelectProps={{
                    multiple: true,
                    renderValue: (selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected as string[]).map((value) => (
                          <Chip key={value} label={value} size="small" sx={{ height: 20 }} />
                        ))}
                      </Box>
                    ),
                  }}
                  sx={{ bgcolor: 'background.paper' }}
                >
                  <MenuItem value="Green">
                    <Checkbox checked={filters.health.indexOf('Green') > -1} size="small" />
                    Green
                  </MenuItem>
                  <MenuItem value="Yellow">
                    <Checkbox checked={filters.health.indexOf('Yellow') > -1} size="small" />
                    Yellow
                  </MenuItem>
                  <MenuItem value="Red">
                    <Checkbox checked={filters.health.indexOf('Red') > -1} size="small" />
                    Red
                  </MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  size="small"
                  select
                  fullWidth
                  label="Fiscal Year"
                  value={filters.fiscalYear}
                  onChange={(e) => setFilters({ ...filters, fiscalYear: e.target.value as unknown as string[] })}
                  SelectProps={{
                    multiple: true,
                    renderValue: (selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected as string[]).map((value) => (
                          <Chip key={value} label={value} size="small" sx={{ height: 20 }} />
                        ))}
                      </Box>
                    ),
                  }}
                  sx={{ bgcolor: 'background.paper' }}
                >
                  {uniqueFiscalYears.map((year) => (
                    <MenuItem key={year} value={year}>
                      <Checkbox checked={filters.fiscalYear.indexOf(year) > -1} size="small" />
                      {year}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  size="small"
                  select
                  fullWidth
                  label="Target Release"
                  value={filters.targetRelease}
                  onChange={(e) => setFilters({ ...filters, targetRelease: e.target.value as unknown as string[] })}
                  SelectProps={{
                    multiple: true,
                    renderValue: (selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected as string[]).map((value) => (
                          <Chip key={value} label={value} size="small" sx={{ height: 20 }} />
                        ))}
                      </Box>
                    ),
                  }}
                  sx={{ bgcolor: 'background.paper' }}
                >
                  {uniqueTargetReleases.map((release) => (
                    <MenuItem key={release} value={release}>
                      <Checkbox checked={filters.targetRelease.indexOf(release) > -1} size="small" />
                      {release}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  size="small"
                  select
                  fullWidth
                  label="Target Sprint"
                  value={filters.targetSprint}
                  onChange={(e) => setFilters({ ...filters, targetSprint: e.target.value as unknown as string[] })}
                  SelectProps={{
                    multiple: true,
                    renderValue: (selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected as string[]).map((value) => (
                          <Chip key={value} label={value} size="small" sx={{ height: 20 }} />
                        ))}
                      </Box>
                    ),
                  }}
                  sx={{ bgcolor: 'background.paper' }}
                >
                  {uniqueTargetSprints.map((sprint) => (
                    <MenuItem key={sprint} value={sprint}>
                      <Checkbox checked={filters.targetSprint.indexOf(sprint) > -1} size="small" />
                      {sprint}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  size="small"
                  onClick={() => setFilters({
                    projectNumber: '',
                    name: '',
                    segmentFunction: [],
                    type: '',
                    fiscalYear: [],
                    targetRelease: [],
                    targetSprint: [],
                    status: [],
                    priority: '',
                    currentPhase: '',
                    health: [],
                    impactedDomain: [],
                  })}
                  sx={{ height: '40px' }}
                >
                  Clear All
                </Button>
              </Grid>
            </Grid>
              </Box>
            )}
          </Box>

          {/* Swimlane Configuration */}
          <Box sx={{ mb: 2, bgcolor: 'action.hover', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
            {/* Swimlane Header */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 1.5,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.selected' },
                borderRadius: '4px 4px 0 0',
              }}
              onClick={() => setSwimlanesExpanded(!swimlanesExpanded)}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <ViewKanbanIcon fontSize="small" color="primary" />
                <Typography variant="subtitle2" fontWeight="600">
                  Swimlane Configuration
                </Typography>
                {swimlaneConfig.enabled && (
                  <Chip
                    label="ON"
                    size="small"
                    color="success"
                    sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                  />
                )}
              </Box>
              <IconButton size="small">
                {swimlanesExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>

            {/* Swimlane Content */}
            {swimlanesExpanded && (
              <Box sx={{ p: 1.5, pt: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle2" fontWeight="600">
                      Enable:
                    </Typography>
                    <Button
                      size="small"
                      variant={swimlaneConfig.enabled ? 'contained' : 'outlined'}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSwimlaneConfig({ ...swimlaneConfig, enabled: !swimlaneConfig.enabled });
                      }}
                      sx={{ minWidth: 70 }}
                    >
                      {swimlaneConfig.enabled ? 'ON' : 'OFF'}
                    </Button>
                  </Box>

                  {swimlaneConfig.enabled && (
                    <>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Level 1:
                        </Typography>
                        <TextField
                          size="small"
                          select
                          value={swimlaneConfig.level1}
                          onChange={(e) => setSwimlaneConfig({ ...swimlaneConfig, level1: e.target.value as any })}
                          onClick={(e) => e.stopPropagation()}
                          sx={{ minWidth: 150 }}
                        >
                          <MenuItem value="domain">Domain</MenuItem>
                          <MenuItem value="segmentFunction">Segment Function</MenuItem>
                          <MenuItem value="type">Type</MenuItem>
                          <MenuItem value="targetRelease">Target Release</MenuItem>
                          <MenuItem value="targetSprint">Target Sprint</MenuItem>
                        </TextField>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Level 2:
                        </Typography>
                        <TextField
                          size="small"
                          select
                          value={swimlaneConfig.level2}
                          onChange={(e) => setSwimlaneConfig({ ...swimlaneConfig, level2: e.target.value as any })}
                          onClick={(e) => e.stopPropagation()}
                          sx={{ minWidth: 150 }}
                          disabled={swimlaneConfig.level1 === swimlaneConfig.level2}
                        >
                          <MenuItem value="domain" disabled={swimlaneConfig.level1 === 'domain'}>Domain</MenuItem>
                          <MenuItem value="segmentFunction" disabled={swimlaneConfig.level1 === 'segmentFunction'}>Segment Function</MenuItem>
                          <MenuItem value="type" disabled={swimlaneConfig.level1 === 'type'}>Type</MenuItem>
                          <MenuItem value="targetRelease" disabled={swimlaneConfig.level1 === 'targetRelease'}>Target Release</MenuItem>
                          <MenuItem value="targetSprint" disabled={swimlaneConfig.level1 === 'targetSprint'}>Target Sprint</MenuItem>
                        </TextField>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Checkbox
                          size="small"
                          checked={swimlaneConfig.rotateLevel1}
                          onChange={(e) => setSwimlaneConfig({ ...swimlaneConfig, rotateLevel1: e.target.checked })}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Typography variant="caption" color="text.secondary">
                          Rotate Level 1
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Checkbox
                          size="small"
                          checked={swimlaneConfig.level2Enabled}
                          onChange={(e) => setSwimlaneConfig({ ...swimlaneConfig, level2Enabled: e.target.checked })}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          Enable Level 2
                        </Typography>
                      </Box>

                      {swimlaneConfig.level2Enabled && (
                        <>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Checkbox
                              size="small"
                              checked={swimlaneConfig.rotateLevel2}
                              onChange={(e) => setSwimlaneConfig({ ...swimlaneConfig, rotateLevel2: e.target.checked })}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <Typography variant="caption" color="text.secondary">
                              Rotate Level 2
                            </Typography>
                          </Box>
                        </>
                      )}

                      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        {swimlaneConfig.level2Enabled ? 'Level 3: Projects (fixed)' : 'Level 2: Projects (fixed)'}
                      </Typography>
                    </>
                  )}
                </Box>
              </Box>
            )}
          </Box>

          {(() => {
            const dateRange = getDateRange();
            const monthMarkers = getMonthMarkers(dateRange.start, dateRange.end);

            return (
              <Box>
                {/* Timeline Header */}
                <Box sx={{ display: 'flex' }}>
                  <Box sx={{
                    width: swimlaneConfig.enabled
                      ? (swimlaneConfig.rotateLevel1 ? 50 : 120) + (swimlaneConfig.level2Enabled ? (swimlaneConfig.rotateLevel2 ? 50 : 180) : 0) + ganttSidebarWidth
                      : ganttSidebarWidth,
                    flexShrink: 0,
                    pr: 1
                  }} />
                  <Box sx={{ flex: 1, position: 'relative', height: 35, mb: 1, borderBottom: '2px dotted', borderColor: 'divider' }}>
                    {monthMarkers.map((marker, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          position: 'absolute',
                          left: `${marker.position}%`,
                          transform: 'translateX(-50%)',
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          color: 'text.secondary',
                          textAlign: 'left',
                          transformOrigin: 'left center',
                        }}
                      >
                        <Box
                          sx={{
                            transform: 'rotate(-45deg) translateY(-4px)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {marker.label}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                  <Box sx={{ width: 100, flexShrink: 0 }} />
                </Box>

                {/* Gantt Chart Container with Relative Positioning for SVG Overlay */}
                <Box ref={ganttContainerRef} sx={{ position: 'relative' }}>
                  {/* Vertical Gridlines */}
                  {showGridlines && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: swimlaneConfig.enabled
                          ? (swimlaneConfig.rotateLevel1 ? 50 : 120) + (swimlaneConfig.level2Enabled ? (swimlaneConfig.rotateLevel2 ? 50 : 180) : 0) + ganttSidebarWidth
                          : ganttSidebarWidth,
                        right: swimlaneConfig.enabled ? 100 : 100,
                        height: '100%',
                        pointerEvents: 'none',
                        zIndex: 1,
                      }}
                    >
                      {monthMarkers.map((marker, idx) => (
                        <Box
                          key={idx}
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: `${marker.position}%`,
                            width: 0,
                            height: '100%',
                            borderLeft: '1px dotted',
                            borderColor: 'divider',
                            pointerEvents: 'none',
                          }}
                        />
                      ))}
                    </Box>
                  )}

                  {/* Projects and Milestones */}
                  {!swimlaneConfig.enabled ? (
                    // Flat list rendering when swimlanes are disabled - with drag and drop reordering
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragStart={handleGanttDragStart}
                      onDragEnd={handleGanttDragEnd}
                    >
                      <SortableContext items={filteredProjects.map(p => p.id)} strategy={verticalListSortingStrategy}>
                        {filteredProjects.map((project) => {
                          const projectMilestones = milestones.filter(m => m.projectId === project.id);
                          const projectStart = project.startDate || project.desiredStartDate;
                          const projectEnd = project.endDate || project.desiredCompletionDate;

                          return (
                            <SortableGanttProjectRow
                              key={project.id}
                              project={project}
                              projectMilestones={projectMilestones}
                              projectStart={projectStart}
                              projectEnd={projectEnd}
                              ganttSidebarWidth={ganttSidebarWidth}
                              dateRange={dateRange}
                              cpmData={cpmData}
                              tempPositions={tempPositions}
                              draggingItem={draggingItem}
                              setDraggingItem={setDraggingItem}
                              calculatePosition={calculatePosition}
                              calculateWidth={calculateWidth}
                              handleMilestoneMouseDown={(e, milestone, projectId) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const parentProject = projects.find(p => p.id === projectId);
                                if (parentProject && parentProject.status === 'Completed') {
                                  return;
                                }
                                const container = document.getElementById(`timeline-container-${projectId}`);
                                if (!container) return;
                                const rect = container.getBoundingClientRect();
                                setDraggingItem({
                                  type: 'milestone',
                                  id: milestone.id,
                                  projectId: projectId,
                                  initialX: e.clientX,
                                  dragStarted: false,
                                  initialDates: {
                                    plannedEndDate: new Date(milestone.plannedEndDate!),
                                  },
                                  dateRange: dateRange,
                                  containerWidth: rect.width,
                                });
                              }}
                              getStatusColor={getStatusColor}
                            />
                          );
                        })}
                      </SortableContext>
                    </DndContext>
                  ) : (
                    // Swimlane layout
                    true ? (
                    // Traditional swimlane layout with vertical Level 1 and horizontal Level 2 (with sortable project names)
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragStart={handleGanttDragStart}
                      onDragEnd={handleGanttDragEnd}
                    >
                    <Box sx={{ display: 'flex' }}>
                      {/* Level 1 Vertical Column */}
                      <Box sx={{ width: swimlaneConfig.rotateLevel1 ? 50 : 120, flexShrink: 0, borderRight: '2px solid #ccc' }}>
                        {Object.entries(swimlaneStructure || {}).map(([level1Key, level2Groups]) => {
                          // Calculate total height for this Level 1 group
                          const totalHeight = Object.values(level2Groups).reduce((sum, projects) => {
                            return sum + (projects.length * 32);
                          }, 0);

                          return (
                            <Box
                              key={level1Key}
                              sx={{
                                height: totalHeight,
                                bgcolor: getLevel1Color(level1Key),
                                borderBottom: '2px solid #fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Typography
                                sx={{
                                  ...(swimlaneConfig.rotateLevel1 ? {
                                    writingMode: 'vertical-lr',
                                    transform: 'rotate(180deg)',
                                  } : {}),
                                  fontSize: swimlaneConfig.rotateLevel1 ? '0.9rem' : '0.75rem',
                                  fontWeight: 700,
                                  color: 'white',
                                  textTransform: 'uppercase',
                                  letterSpacing: 1,
                                }}
                              >
                                {level1Key}
                              </Typography>
                            </Box>
                          );
                        })}
                      </Box>

                      {/* Level 2 Column + Timeline */}
                      <Box sx={{ flex: 1 }}>
                        {Object.entries(swimlaneStructure || {}).flatMap(([level1Key, level2Groups]) => {
                          const level2Entries = Object.entries(level2Groups);
                          return level2Entries.map(([level2Key, projects], level2Index) => {
                            const rowKey = `${level1Key}-${level2Key}`;
                            const isLastLevel2InGroup = level2Index === level2Entries.length - 1;

                            return (
                              <Box key={rowKey} sx={{ display: 'flex', height: projects.length * 32 }}>
                                {/* Level 2 Label - Only show if Level 2 is enabled */}
                                {swimlaneConfig.level2Enabled && (
                                  <Box sx={{
                                    width: swimlaneConfig.rotateLevel2 ? 50 : 180,
                                    flexShrink: 0,
                                    bgcolor: '#f5f5f5',
                                    px: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: swimlaneConfig.rotateLevel2 ? 'center' : 'flex-start',
                                    borderRight: '1px solid #e0e0e0',
                                    borderBottom: isLastLevel2InGroup ? '2px solid #9e9e9e' : '1px dotted #bdbdbd',
                                    position: 'relative',
                                  }}>
                                    <Typography
                                      variant="caption"
                                      fontWeight={500}
                                      sx={{
                                        ...(swimlaneConfig.rotateLevel2 ? {
                                          writingMode: 'vertical-lr',
                                          transform: 'rotate(180deg)',
                                        } : {}),
                                        fontSize: '0.7rem',
                                      }}
                                    >
                                      {level2Key}
                                    </Typography>

                                    {/* Grid line overlays to match project rows */}
                                    {projects.slice(0, -1).map((_, idx) => (
                                      <Box
                                      key={`level2-grid-${idx}`}
                                      sx={{
                                        position: 'absolute',
                                        left: 0,
                                        right: 0,
                                        top: (idx + 1) * 32,
                                        height: 0,
                                        borderTop: '1px dotted #e0e0e0',
                                      }}
                                    />
                                  ))}
                                  </Box>
                                )}

                                {/* Level 3 Project Names Column */}
                                  <SortableContext items={projects.map(p => p.id)} strategy={verticalListSortingStrategy}>
                                    <Box sx={{
                                      width: ganttSidebarWidth,
                                      flexShrink: 0,
                                      display: 'flex',
                                      flexDirection: 'column',
                                      borderRight: '1px solid #e0e0e0',
                                      bgcolor: 'background.paper',
                                      position: 'relative',
                                      zIndex: 10,
                                      overflow: 'visible',
                                      pointerEvents: 'auto',
                                    }}>
                                      {projects.map((project, idx) => {
                                        const isLastProject = idx === projects.length - 1;
                                        // Determine border style based on hierarchy
                                        let borderStyle = '1px dotted #e0e0e0'; // Default: thin dotted line between projects
                                        if (isLastProject) {
                                          if (isLastLevel2InGroup) {
                                            borderStyle = '2px solid #9e9e9e'; // Thick solid line between Level 1 groups
                                          } else {
                                            borderStyle = '1px dotted #bdbdbd'; // Medium dotted line between Level 2 groups
                                          }
                                        }
                                        return (
                                          <SortableSwimlaneProjectName
                                            key={project.id}
                                            project={project}
                                            ganttSidebarWidth={ganttSidebarWidth}
                                            borderStyle={borderStyle}
                                          />
                                        );
                                      })}
                                    </Box>
                                  </SortableContext>

                                {/* Timeline Container for ALL projects in this row */}
                                <Box sx={{ flex: 1, position: 'relative', height: projects.length * 32 }}>
                                  {/* Grid lines to match project rows */}
                                  {projects.map((_, idx) => {
                                    const isLastProject = idx === projects.length - 1;
                                    let borderStyle = '1px dotted #e0e0e0'; // Thin dotted line between projects
                                    if (isLastProject) {
                                      if (isLastLevel2InGroup) {
                                        borderStyle = '2px solid #9e9e9e'; // Thick solid line between Level 1 groups
                                      } else {
                                        borderStyle = '1px dotted #bdbdbd'; // Medium dotted line between Level 2 groups
                                      }
                                    }
                                    return (
                                      <Box
                                        key={`timeline-grid-${idx}`}
                                        sx={{
                                          position: 'absolute',
                                          left: 0,
                                          right: 0,
                                          top: (idx + 1) * 32,
                                          height: 0,
                                          borderTop: borderStyle,
                                          zIndex: 0,
                                        }}
                                      />
                                    );
                                  })}

                                  {projects.map((project, projectIdx) => {
                                    const projectMilestones = milestones.filter(m => m.projectId === project.id);
                                    const projectStart = project.startDate || project.desiredStartDate;
                                    const projectEnd = project.endDate || project.desiredCompletionDate;

                                    return (
                                      <Box
                                        key={project.id}
                                        id={`timeline-container-${project.id}`}
                                        sx={{
                                          position: 'absolute',
                                          left: 0,
                                          right: 0,
                                          top: projectIdx * 32,
                                          height: 32,
                                          pointerEvents: 'none',
                                        }}
                                      >
                                        {/* Project Bar */}
                                        {projectStart && projectEnd && (() => {
                                          const cpmNode = cpmData.nodes.get(`project-${project.id}`);
                                          const slackDays = cpmNode?.slack || 0;
                                          const isOnCriticalPath = cpmData.criticalPath.includes(`project-${project.id}`);
                                          const tooltipContent = `${project.name}\n${isOnCriticalPath ? '⚡ Critical Path' : `Slack: ${slackDays} days`}`;

                                          return (
                                            <Box
                                              title={tooltipContent}
                                              onMouseDown={(e) => {
                                                  e.preventDefault();
                                                  if (project.status === 'Completed') {
                                                    return;
                                                  }
                                                  const container = document.getElementById(`timeline-container-${project.id}`);
                                                  if (!container) return;
                                                  const rect = container.getBoundingClientRect();
                                                  setDraggingItem({
                                                    type: 'project',
                                                    operation: 'move',
                                                    id: project.id,
                                                    initialX: e.clientX,
                                                    dragStarted: false,
                                                    initialDates: {
                                                      startDate: new Date(projectStart),
                                                      endDate: new Date(projectEnd),
                                                    },
                                                    dateRange: dateRange,
                                                    containerWidth: rect.width,
                                                  });
                                                }}
                                                data-project-id={project.id}
                                                data-project-bar="true"
                                                sx={{
                                                  position: 'absolute',
                                                  left: tempPositions[`project-${project.id}`]?.left || `${calculatePosition(new Date(projectStart), dateRange.start, dateRange.end)}%`,
                                                  width: tempPositions[`project-${project.id}`]?.width || `${calculateWidth(new Date(projectStart), new Date(projectEnd), dateRange.start, dateRange.end)}%`,
                                                  height: 18,
                                                  top: '50%',
                                                  transform: 'translateY(-50%)',
                                                  bgcolor: project.healthStatus === 'Green' ? '#4caf50' :
                                                          project.healthStatus === 'Yellow' ? '#ff9800' :
                                                          project.healthStatus === 'Red' ? '#f44336' : '#2196f3',
                                                  borderRadius: 0.5,
                                                  border: cpmData.criticalPath.includes(`project-${project.id}`) ? '2px solid #fbbf24' : 'none',
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  justifyContent: 'center',
                                                  color: 'white',
                                                  fontSize: '0.6rem',
                                                  fontWeight: 600,
                                                  px: 0.5,
                                                  boxShadow: cpmData.criticalPath.includes(`project-${project.id}`) ? 3 : 1,
                                                  zIndex: draggingItem?.type === 'project' && draggingItem.id === project.id ? 10 : 1,
                                                  cursor: 'grab',
                                                  opacity: draggingItem?.type === 'project' && draggingItem.id === project.id ? 0.7 : 1,
                                                  transition: draggingItem ? 'none' : 'all 0.2s',
                                                  userSelect: 'none',
                                                  pointerEvents: 'auto',
                                                  '&:active': {
                                                    cursor: 'grabbing',
                                                  },
                                                  '&:hover': {
                                                    boxShadow: cpmData.criticalPath.includes(`project-${project.id}`) ? 4 : 2,
                                                    filter: 'brightness(1.1)',
                                                  },
                                                }}
                                              >
                                                {/* Left Resize Handle */}
                                                <Box
                                                  onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    if (project.status === 'Completed') {
                                                      return;
                                                    }
                                                    const container = document.getElementById(`timeline-container-${project.id}`);
                                                    if (!container) return;
                                                    const rect = container.getBoundingClientRect();
                                                    setDraggingItem({
                                                      type: 'project',
                                                      operation: 'resize-left',
                                                      id: project.id,
                                                      initialX: e.clientX,
                                                      dragStarted: false,
                                                      initialDates: {
                                                        startDate: new Date(projectStart),
                                                        endDate: new Date(projectEnd),
                                                      },
                                                      dateRange: dateRange,
                                                      containerWidth: rect.width,
                                                    });
                                                  }}
                                                  sx={{
                                                    position: 'absolute',
                                                    left: 0,
                                                    top: 0,
                                                    bottom: 0,
                                                    width: 6,
                                                    cursor: 'ew-resize',
                                                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                                                    borderTopLeftRadius: 0.5,
                                                    borderBottomLeftRadius: 0.5,
                                                    '&:hover': {
                                                      backgroundColor: 'rgba(255, 255, 255, 0.5)',
                                                    },
                                                  }}
                                                />

                                                {project.progress}%

                                                {/* Right Resize Handle */}
                                                <Box
                                                  onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    if (project.status === 'Completed') {
                                                      return;
                                                    }
                                                    const container = document.getElementById(`timeline-container-${project.id}`);
                                                    if (!container) return;
                                                    const rect = container.getBoundingClientRect();
                                                    setDraggingItem({
                                                      type: 'project',
                                                      operation: 'resize-right',
                                                      id: project.id,
                                                      initialX: e.clientX,
                                                      dragStarted: false,
                                                      initialDates: {
                                                        startDate: new Date(projectStart),
                                                        endDate: new Date(projectEnd),
                                                      },
                                                      dateRange: dateRange,
                                                      containerWidth: rect.width,
                                                    });
                                                  }}
                                                  sx={{
                                                    position: 'absolute',
                                                    right: 0,
                                                    top: 0,
                                                    bottom: 0,
                                                    width: 6,
                                                    cursor: 'ew-resize',
                                                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                                                    borderTopRightRadius: 0.5,
                                                    borderBottomRightRadius: 0.5,
                                                    '&:hover': {
                                                      backgroundColor: 'rgba(255, 255, 255, 0.5)',
                                                    },
                                                  }}
                                                />
                                              </Box>
                                          );
                                        })()}

                            {/* Milestone Markers */}
                            {projectMilestones.map((milestone) => {
                              const milestoneDate = milestone.plannedEndDate;
                              if (!milestoneDate) return null;

                              const formattedDate = new Date(milestoneDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              });

                              return (
                                <Box
                                  key={milestone.id}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation(); // Prevent project bar drag
                                    if (project.status === 'Completed') {
                                      return;
                                    }
                                    // Get the timeline container (go up two levels: milestone -> wrapper -> timeline container)
                                    const wrapper = e.currentTarget.parentElement;
                                    if (!wrapper) return;
                                    const timelineContainer = wrapper.parentElement;
                                    if (!timelineContainer) return;
                                    const rect = timelineContainer.getBoundingClientRect();
                                    setDraggingItem({
                                      type: 'milestone',
                                      id: milestone.id,
                                      projectId: project.id,
                                      initialX: e.clientX,
                                      dragStarted: false,
                                      initialDates: {
                                        plannedEndDate: new Date(milestoneDate),
                                      },
                                      dateRange: dateRange,
                                      containerWidth: rect.width,
                                    });
                                  }}
                                  sx={{
                                    position: 'absolute',
                                    left: tempPositions[`milestone-${milestone.id}`]?.left || `${calculatePosition(new Date(milestoneDate), dateRange.start, dateRange.end)}%`,
                                    top: '50%',
                                    transform: 'translate(-50%, -50%) rotate(45deg)',
                                    width: 10,
                                    height: 10,
                                    bgcolor: milestone.status === 'Completed' ? '#66bb6a' :
                                            milestone.status === 'In Progress' ? '#42a5f5' : '#9e9e9e',
                                    border: '1px solid white',
                                    boxShadow: 1,
                                    zIndex: draggingItem?.type === 'milestone' && draggingItem.id === milestone.id ? 10 : 2,
                                    cursor: 'grab',
                                    opacity: draggingItem?.type === 'milestone' && draggingItem.id === milestone.id ? 0.7 : 1,
                                    transition: draggingItem ? 'none' : 'all 0.2s',
                                    userSelect: 'none',
                                    pointerEvents: 'auto',
                                    '&:active': {
                                      cursor: 'grabbing',
                                    },
                                    '&:hover': {
                                      transform: 'translate(-50%, -50%) rotate(45deg) scale(1.5)',
                                      zIndex: 3,
                                      filter: 'brightness(1.2)',
                                    },
                                  }}
                                  title={`${milestone.name} - ${formattedDate}`}
                                />
                              );
                            })}
                                      </Box>
                                    );
                                  })}
                                </Box>

                                {/* Status column */}
                                <Box sx={{ width: 100, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
                                  {projects.map((project, idx) => {
                                    const isLastProject = idx === projects.length - 1;
                                    let borderStyle = '1px dotted #e0e0e0'; // Thin dotted line between projects
                                    if (isLastProject) {
                                      if (isLastLevel2InGroup) {
                                        borderStyle = '2px solid #9e9e9e'; // Thick solid line between Level 1 groups
                                      } else {
                                        borderStyle = '1px dotted #bdbdbd'; // Medium dotted line between Level 2 groups
                                      }
                                    }
                                    return (
                                      <Box
                                        key={project.id}
                                        sx={{
                                          height: 32,
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          borderBottom: borderStyle,
                                        }}
                                      >
                                        <Chip
                                          label={project.status}
                                          size="small"
                                          color={getStatusColor(project.status)}
                                          sx={{ fontSize: '0.55rem', height: 18, '& .MuiChip-label': { px: 0.5 } }}
                                        />
                                      </Box>
                                    );
                                  })}
                                </Box>
                              </Box>
                            );
                          });
                        })}
                      </Box>
                    </Box>
                    </DndContext>
                  ) : (
                    // Traditional swimlane layout with vertical Level 1 and horizontal Level 2
                    <Box sx={{ display: 'flex' }}>
                      {/* Level 1 Vertical Column */}
                      <Box sx={{ width: swimlaneConfig.rotateLevel1 ? 50 : 120, flexShrink: 0, borderRight: '2px solid #ccc' }}>
                        {Object.entries(swimlaneStructure || {}).map(([level1Key, level2Groups]) => {
                          // Calculate total height for this Level 1 group
                          const totalHeight = Object.values(level2Groups).reduce((sum, projects) => {
                            return sum + (projects.length * 32);
                          }, 0);

                          return (
                            <Box
                              key={level1Key}
                              sx={{
                                height: totalHeight,
                                bgcolor: getLevel1Color(level1Key),
                                borderBottom: '2px solid #fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Typography
                                sx={{
                                  ...(swimlaneConfig.rotateLevel1 ? {
                                    writingMode: 'vertical-lr',
                                    transform: 'rotate(180deg)',
                                  } : {}),
                                  fontSize: swimlaneConfig.rotateLevel1 ? '0.9rem' : '0.75rem',
                                  fontWeight: 700,
                                  color: 'white',
                                  textTransform: 'uppercase',
                                  letterSpacing: 1,
                                }}
                              >
                                {level1Key}
                              </Typography>
                            </Box>
                          );
                        })}
                      </Box>

                      {/* Level 2 Column + Timeline */}
                      <Box sx={{ flex: 1 }}>
                        {Object.entries(swimlaneStructure || {}).flatMap(([level1Key, level2Groups]) => {
                          const level2Entries = Object.entries(level2Groups);
                          return level2Entries.map(([level2Key, projects], level2Index) => {
                            const rowKey = `${level1Key}-${level2Key}`;
                            const isLastLevel2InGroup = level2Index === level2Entries.length - 1;

                            return (
                              <Box key={rowKey} sx={{ display: 'flex', height: projects.length * 32 }}>
                                {/* Level 2 Label - Only show if Level 2 is enabled */}
                                {swimlaneConfig.level2Enabled && (
                                  <Box sx={{
                                    width: swimlaneConfig.rotateLevel2 ? 50 : 180,
                                    flexShrink: 0,
                                    bgcolor: '#f5f5f5',
                                    px: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: swimlaneConfig.rotateLevel2 ? 'center' : 'flex-start',
                                    borderRight: '1px solid #e0e0e0',
                                    borderBottom: isLastLevel2InGroup ? '2px solid #9e9e9e' : '1px dotted #bdbdbd',
                                    position: 'relative',
                                  }}>
                                    <Typography
                                      variant="caption"
                                      fontWeight={500}
                                      sx={{
                                        ...(swimlaneConfig.rotateLevel2 ? {
                                          writingMode: 'vertical-lr',
                                          transform: 'rotate(180deg)',
                                        } : {}),
                                        fontSize: '0.7rem',
                                      }}
                                    >
                                      {level2Key}
                                    </Typography>

                                    {/* Grid line overlays to match project rows */}
                                    {projects.slice(0, -1).map((_, idx) => (
                                      <Box
                                      key={`level2-grid-${idx}`}
                                      sx={{
                                        position: 'absolute',
                                        left: 0,
                                        right: 0,
                                        top: (idx + 1) * 32,
                                        height: 0,
                                        borderTop: '1px dotted #e0e0e0',
                                      }}
                                    />
                                  ))}
                                  </Box>
                                )}

                                {/* Level 3 Project Names Column */}
                                <Box sx={{
                                  width: ganttSidebarWidth,
                                  flexShrink: 0,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  borderRight: '1px solid #e0e0e0',
                                  bgcolor: 'background.paper',
                                }}>
                                  {projects.map((project, idx) => {
                                    const isLastProject = idx === projects.length - 1;
                                    // Determine border style based on hierarchy
                                    let borderStyle = '1px dotted #e0e0e0'; // Default: thin dotted line between projects
                                    if (isLastProject) {
                                      if (isLastLevel2InGroup) {
                                        borderStyle = '2px solid #9e9e9e'; // Thick solid line between Level 1 groups
                                      } else {
                                        borderStyle = '1px dotted #bdbdbd'; // Medium dotted line between Level 2 groups
                                      }
                                    }
                                    return (
                                      <Box
                                        key={project.id}
                                        sx={{
                                          height: 32,
                                          px: 1,
                                          display: 'flex',
                                          alignItems: 'center',
                                          borderBottom: borderStyle,
                                        }}
                                      >
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          fontSize: '0.7rem',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap',
                                          display: 'block',
                                        }}
                                        title={`${project.projectNumber || `PRJ-${project.id}`} - ${project.name}`}
                                      >
                                        <Box component="span" sx={{ fontWeight: 600, mr: 0.5 }}>
                                          {project.projectNumber || `PRJ-${project.id}`}
                                        </Box>
                                        <Box component="span" sx={{ color: 'text.secondary' }}>
                                          {project.name}
                                        </Box>
                                      </Typography>
                                    </Box>
                                  );
                                  })}
                                </Box>

                                {/* Timeline Container for ALL projects in this row */}
                                <Box sx={{ flex: 1, position: 'relative', height: projects.length * 32 }}>
                                  {/* Grid lines to match project rows */}
                                  {projects.map((_, idx) => {
                                    const isLastProject = idx === projects.length - 1;
                                    let borderStyle = '1px dotted #e0e0e0'; // Thin dotted line between projects
                                    if (isLastProject) {
                                      if (isLastLevel2InGroup) {
                                        borderStyle = '2px solid #9e9e9e'; // Thick solid line between Level 1 groups
                                      } else {
                                        borderStyle = '1px dotted #bdbdbd'; // Medium dotted line between Level 2 groups
                                      }
                                    }
                                    return (
                                      <Box
                                        key={`timeline-grid-${idx}`}
                                        sx={{
                                          position: 'absolute',
                                          left: 0,
                                          right: 0,
                                          top: (idx + 1) * 32,
                                          height: 0,
                                          borderTop: borderStyle,
                                          zIndex: 0,
                                        }}
                                      />
                                    );
                                  })}

                                  {projects.map((project, projectIdx) => {
                                    const projectMilestones = milestones.filter(m => m.projectId === project.id);
                                    const projectStart = project.startDate || project.desiredStartDate;
                                    const projectEnd = project.endDate || project.desiredCompletionDate;

                                    return (
                                      <Box
                                        key={project.id}
                                        id={`timeline-container-${project.id}`}
                                        sx={{
                                          position: 'absolute',
                                          left: 0,
                                          right: 0,
                                          top: projectIdx * 32,
                                          height: 32,
                                          pointerEvents: 'none',
                                        }}
                                      >
                                        {/* Project Bar */}
                                        {projectStart && projectEnd && (() => {
                                          const cpmNode = cpmData.nodes.get(`project-${project.id}`);
                                          const slackDays = cpmNode?.slack || 0;
                                          const isOnCriticalPath = cpmData.criticalPath.includes(`project-${project.id}`);
                                          const tooltipContent = `${project.name}\n${isOnCriticalPath ? '⚡ Critical Path' : `Slack: ${slackDays} days`}`;

                                          return (
                                            <Box
                                              key={`bar-${project.id}`}
                                              title={tooltipContent}
                                              onMouseDown={(e) => {
                                                  e.preventDefault();
                                                  if (project.status === 'Completed') {
                                                    return;
                                                  }
                                                  const timelineContainer = e.currentTarget.parentElement;
                                                  if (!timelineContainer) return;
                                                  const rect = timelineContainer.getBoundingClientRect();
                                                  setDraggingItem({
                                                    type: 'project',
                                                    operation: 'move',
                                                    id: project.id,
                                                    initialX: e.clientX,
                                                    dragStarted: false,
                                                    initialDates: {
                                                      startDate: new Date(projectStart),
                                                      endDate: new Date(projectEnd),
                                                    },
                                                    dateRange: dateRange,
                                                    containerWidth: rect.width,
                                                  });
                                                }}
                                                sx={{
                                                  position: 'absolute',
                                                  left: tempPositions[`project-${project.id}`]?.left || `${calculatePosition(new Date(projectStart), dateRange.start, dateRange.end)}%`,
                                                  width: tempPositions[`project-${project.id}`]?.width || `${calculateWidth(new Date(projectStart), new Date(projectEnd), dateRange.start, dateRange.end)}%`,
                                                  height: 18,
                                                  top: '50%',
                                                  transform: 'translateY(-50%)',
                                                  bgcolor: project.healthStatus === 'Green' ? '#4caf50' :
                                                          project.healthStatus === 'Yellow' ? '#ff9800' :
                                                          project.healthStatus === 'Red' ? '#f44336' : '#2196f3',
                                                  borderRadius: 0.5,
                                                  border: cpmData.criticalPath.includes(`project-${project.id}`) ? '2px solid #fbbf24' : 'none',
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  justifyContent: 'center',
                                                  color: 'white',
                                                  fontSize: '0.6rem',
                                                  fontWeight: 600,
                                                  px: 0.5,
                                                  boxShadow: cpmData.criticalPath.includes(`project-${project.id}`) ? 3 : 1,
                                                  zIndex: draggingItem?.type === 'project' && draggingItem.id === project.id ? 10 : 1,
                                                  cursor: 'grab',
                                                  opacity: draggingItem?.type === 'project' && draggingItem.id === project.id ? 0.7 : 1,
                                                  transition: draggingItem ? 'none' : 'all 0.2s',
                                                  userSelect: 'none',
                                                  pointerEvents: 'auto',
                                                  '&:active': {
                                                    cursor: 'grabbing',
                                                  },
                                                  '&:hover': {
                                                    boxShadow: cpmData.criticalPath.includes(`project-${project.id}`) ? 4 : 2,
                                                    filter: 'brightness(1.1)',
                                                  },
                                                }}
                                              >
                                                {/* Left Resize Handle */}
                                                <Box
                                                  onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    if (project.status === 'Completed') {
                                                      return;
                                                    }
                                                    const timelineContainer = e.currentTarget.parentElement?.parentElement;
                                                    if (!timelineContainer) return;
                                                    const rect = timelineContainer.getBoundingClientRect();
                                                    setDraggingItem({
                                                      type: 'project',
                                                      operation: 'resize-left',
                                                      id: project.id,
                                                      initialX: e.clientX,
                                                      dragStarted: false,
                                                      initialDates: {
                                                        startDate: new Date(projectStart),
                                                        endDate: new Date(projectEnd),
                                                      },
                                                      dateRange: dateRange,
                                                      containerWidth: rect.width,
                                                    });
                                                  }}
                                                  sx={{
                                                    position: 'absolute',
                                                    left: 0,
                                                    top: 0,
                                                    bottom: 0,
                                                    width: 6,
                                                    cursor: 'ew-resize',
                                                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                                                    borderTopLeftRadius: 0.5,
                                                    borderBottomLeftRadius: 0.5,
                                                    '&:hover': {
                                                      backgroundColor: 'rgba(255, 255, 255, 0.5)',
                                                    },
                                                  }}
                                                />

                                                {project.progress}%

                                                {/* Right Resize Handle */}
                                                <Box
                                                  onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    if (project.status === 'Completed') {
                                                      return;
                                                    }
                                                    const timelineContainer = e.currentTarget.parentElement?.parentElement;
                                                    if (!timelineContainer) return;
                                                    const rect = timelineContainer.getBoundingClientRect();
                                                    setDraggingItem({
                                                      type: 'project',
                                                      operation: 'resize-right',
                                                      id: project.id,
                                                      initialX: e.clientX,
                                                      dragStarted: false,
                                                      initialDates: {
                                                        startDate: new Date(projectStart),
                                                        endDate: new Date(projectEnd),
                                                      },
                                                      dateRange: dateRange,
                                                      containerWidth: rect.width,
                                                    });
                                                  }}
                                                  sx={{
                                                    position: 'absolute',
                                                    right: 0,
                                                    top: 0,
                                                    bottom: 0,
                                                    width: 6,
                                                    cursor: 'ew-resize',
                                                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                                                    borderTopRightRadius: 0.5,
                                                    borderBottomRightRadius: 0.5,
                                                    '&:hover': {
                                                      backgroundColor: 'rgba(255, 255, 255, 0.5)',
                                                    },
                                                  }}
                                                />
                                              </Box>
                                          );
                                        })()}

                                        {/* Milestone Markers */}
                                        {projectMilestones.map((milestone) => {
                                          const milestoneDate = milestone.plannedEndDate;
                                          if (!milestoneDate) return null;

                                          const formattedDate = new Date(milestoneDate).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                          });

                                          return (
                                            <Box
                                              key={milestone.id}
                                              onMouseDown={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation(); // Prevent project bar drag
                                                if (project.status === 'Completed') {
                                                  return;
                                                }
                                                // Get the timeline container (go up two levels: milestone -> wrapper -> timeline container)
                                                const wrapper = e.currentTarget.parentElement;
                                                if (!wrapper) return;
                                                const timelineContainer = wrapper.parentElement;
                                                if (!timelineContainer) return;
                                                const rect = timelineContainer.getBoundingClientRect();
                                                setDraggingItem({
                                                  type: 'milestone',
                                                  id: milestone.id,
                                                  projectId: project.id,
                                                  initialX: e.clientX,
                                                  dragStarted: false,
                                                  initialDates: {
                                                    plannedEndDate: new Date(milestoneDate),
                                                  },
                                                  dateRange: dateRange,
                                                  containerWidth: rect.width,
                                                });
                                              }}
                                              sx={{
                                                position: 'absolute',
                                                left: tempPositions[`milestone-${milestone.id}`]?.left || `${calculatePosition(new Date(milestoneDate), dateRange.start, dateRange.end)}%`,
                                                top: '50%',
                                                transform: 'translate(-50%, -50%) rotate(45deg)',
                                                width: 10,
                                                height: 10,
                                                bgcolor: milestone.status === 'Completed' ? '#66bb6a' :
                                                        milestone.status === 'In Progress' ? '#42a5f5' : '#9e9e9e',
                                                border: '1px solid white',
                                                boxShadow: 1,
                                                zIndex: draggingItem?.type === 'milestone' && draggingItem.id === milestone.id ? 10 : 2,
                                                cursor: 'grab',
                                                opacity: draggingItem?.type === 'milestone' && draggingItem.id === milestone.id ? 0.7 : 1,
                                                transition: draggingItem ? 'none' : 'all 0.2s',
                                                userSelect: 'none',
                                                pointerEvents: 'auto',
                                                '&:active': {
                                                  cursor: 'grabbing',
                                                },
                                                '&:hover': {
                                                  transform: 'translate(-50%, -50%) rotate(45deg) scale(1.5)',
                                                  zIndex: 3,
                                                  filter: 'brightness(1.2)',
                                                },
                                              }}
                                              title={`${milestone.name} - ${formattedDate}`}
                                            />
                                          );
                                        })}
                                      </Box>
                                    );
                                  })}
                                </Box>

                                {/* Status column */}
                                <Box sx={{ width: 100, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
                                  {projects.map((project, idx) => {
                                    const isLastProject = idx === projects.length - 1;
                                    let borderStyle = '1px dotted #e0e0e0'; // Thin dotted line between projects
                                    if (isLastProject) {
                                      if (isLastLevel2InGroup) {
                                        borderStyle = '2px solid #9e9e9e'; // Thick solid line between Level 1 groups
                                      } else {
                                        borderStyle = '1px dotted #bdbdbd'; // Medium dotted line between Level 2 groups
                                      }
                                    }
                                    return (
                                      <Box
                                        key={project.id}
                                        sx={{
                                          height: 32,
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          borderBottom: borderStyle,
                                        }}
                                      >
                                        <Chip
                                          label={project.status}
                                          size="small"
                                          color={getStatusColor(project.status)}
                                          sx={{ fontSize: '0.55rem', height: 18, '& .MuiChip-label': { px: 0.5 } }}
                                        />
                                      </Box>
                                    );
                                  })}
                                </Box>
                              </Box>
                            );
                          });
                        })}
                      </Box>
                    </Box>
                    )
                  )}

                  {/* Dependency Arrows Overlay */}
                  <svg
                    viewBox={`0 0 ${timelineWidth} ${swimlaneConfig.enabled ? getTotalSwimlaneRows() * 32 : filteredProjects.length * 37}`}
                    preserveAspectRatio="none"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: swimlaneConfig.enabled
                        ? (swimlaneConfig.rotateLevel1 ? 50 : 120) + (swimlaneConfig.level2Enabled ? (swimlaneConfig.rotateLevel2 ? 50 : 180) : 0) + ganttSidebarWidth
                        : ganttSidebarWidth,
                      width: swimlaneConfig.enabled
                        ? `calc(100% - ${(swimlaneConfig.rotateLevel1 ? 50 : 120) + (swimlaneConfig.level2Enabled ? (swimlaneConfig.rotateLevel2 ? 50 : 180) : 0) + ganttSidebarWidth}px - 100px)`
                        : `calc(100% - ${ganttSidebarWidth}px - 100px)`,
                      height: swimlaneConfig.enabled ? getTotalSwimlaneRows() * 32 : filteredProjects.length * 37,
                      pointerEvents: 'none',
                      zIndex: 5,
                      overflow: 'visible',
                    }}
                  >
                    <defs>
                      {/* Define multiple arrowhead markers for different colors */}
                      {[
                        { id: 'arrow-1976d2', color: '#1976d2' }, // FS Blue
                        { id: 'arrow-388e3c', color: '#388e3c' }, // SS Green
                        { id: 'arrow-f57c00', color: '#f57c00' }, // FF Orange
                        { id: 'arrow-d32f2f', color: '#d32f2f' }, // SF Red
                        { id: 'arrow-dc2626', color: '#dc2626' }, // Violated Red
                      ].map(({ id, color: markerColor }) => (
                        <marker
                          key={id}
                          id={id}
                          viewBox="0 0 10 10"
                          refX="10"
                          refY="5"
                          markerWidth="5.6"
                          markerHeight="5.6"
                          orient="auto"
                          markerUnits="strokeWidth"
                        >
                          <path
                            d="M 0 0 L 10 5 L 0 10 z"
                            fill={markerColor}
                          />
                        </marker>
                      ))}
                    </defs>
                    {dependencies
                      .filter((dep) => {
                        // Only show dependencies between visible projects
                        const predInView = dep.predecessorType === 'project'
                          ? filteredProjects.some(p => p.id === dep.predecessorId)
                          : milestones.some(m => m.id === dep.predecessorId && filteredProjects.some(p => p.id === m.projectId));
                        const succInView = dep.successorType === 'project'
                          ? filteredProjects.some(p => p.id === dep.successorId)
                          : milestones.some(m => m.id === dep.successorId && filteredProjects.some(p => p.id === m.projectId));
                        return predInView && succInView;
                      })
                      .map((dep) => {
                        const predPos = getEntityPosition(dep.predecessorType, dep.predecessorId, dep.predecessorPoint, dateRange);
                        const succPos = getEntityPosition(dep.successorType, dep.successorId, dep.successorPoint, dateRange);

                        if (!predPos || !succPos) return null;

                        // Check if dependency is violated
                        const isViolated = isDependencyViolated(dep);
                        const color = isViolated ? '#dc2626' : getDependencyColor(dep.dependencyType);

                        // Map color to marker ID
                        const markerColor = color.replace('#', '');
                        const markerId = `arrow-${markerColor}`;

                        // Convert percentage coordinates to pixels (viewBox now uses timelineWidth in pixels)
                        // In flat view: 28px + 4px marginBottom + 4px paddingBottom + 1px border = 37px per row
                        // In swimlane: 32px per row + 1px border (but swimlane borders overlap, no extra accumulation)
                        const rowHeight = swimlaneConfig.enabled ? 32 : 37;
                        const x1 = (predPos.x / 100) * timelineWidth;
                        const y1 = predPos.rowIndex * rowHeight + predPos.y;
                        const x2 = (succPos.x / 100) * timelineWidth;
                        const y2 = succPos.rowIndex * rowHeight + succPos.y;

                        // MS Project style routing: All paths terminate horizontally towards the target
                        // Exit horizontally from predecessor, always enter target horizontally
                        const horizontalExit = Math.max(20, timelineWidth * 0.02); // 2% of timeline width, min 20px
                        const horizontalEnter = Math.max(20, timelineWidth * 0.02); // Min 20px horizontal line before arrow for visual clarity
                        const verticalClearance = 14; // Vertical clearance between rows (pixels)
                        const minHorizontalSpace = timelineWidth * 0.03; // 3% of timeline width in pixels

                        let pathD: string;
                        const horizontalGap = x2 - x1;

                        if (x2 > x1) {
                          // Forward dependency (left to right) - ALWAYS terminate horizontally pointing RIGHT (→)
                          const startX = x1 + horizontalExit; // Exit point from predecessor
                          const enterX = x2 - horizontalEnter; // Entry point before target (approaches from left)

                          if (Math.abs(y2 - y1) < 5) {
                            // Same row - ensure horizontal termination by using entry point
                            pathD = `M ${x1} ${y1} L ${enterX} ${y2} L ${x2} ${y2}`;
                          } else {
                            // Different rows - check if enough space for L-shaped routing
                            if (horizontalGap > minHorizontalSpace) {
                              // Enough space - L-shaped with horizontal termination pointing RIGHT
                              pathD = `M ${x1} ${y1} L ${startX} ${y1} L ${startX} ${y2} L ${enterX} ${y2} L ${x2} ${y2}`;
                            } else {
                              // Not enough space - U-shaped with horizontal termination pointing RIGHT
                              if (y1 < y2) {
                                // Going down - route above
                                const clearanceY = y1 - verticalClearance;
                                pathD = `M ${x1} ${y1} L ${startX} ${y1} L ${startX} ${clearanceY} L ${enterX} ${clearanceY} L ${enterX} ${y2} L ${x2} ${y2}`;
                              } else {
                                // Going up - route below
                                const clearanceY = y1 + verticalClearance;
                                pathD = `M ${x1} ${y1} L ${startX} ${y1} L ${startX} ${clearanceY} L ${enterX} ${clearanceY} L ${enterX} ${y2} L ${x2} ${y2}`;
                              }
                            }
                          }
                        } else if (x2 === x1) {
                          // Same position - U-shaped routing with horizontal termination pointing LEFT
                          const offsetX = x1 + horizontalExit;
                          const enterX = x2 - horizontalEnter;
                          const clearanceY = y1 < y2 ? y1 - verticalClearance : y1 + verticalClearance;
                          pathD = `M ${x1} ${y1} L ${offsetX} ${y1} L ${offsetX} ${clearanceY} L ${enterX} ${clearanceY} L ${enterX} ${y2} L ${x2} ${y2}`;
                        } else {
                          // Backward dependency (right to left) - ALWAYS terminate horizontally pointing LEFT (←)
                          const startX = x1 + horizontalExit; // Exit point from predecessor
                          const enterX = x2 + horizontalEnter; // Entry point before target (approaches from right)

                          // Route with proper clearance to avoid overlapping bars
                          // ALWAYS end with horizontal segment pointing LEFT towards target
                          if (y1 < y2) {
                            // Going down and back - route above predecessor, horizontal termination pointing LEFT
                            const clearanceY = y1 - verticalClearance;
                            pathD = `M ${x1} ${y1} L ${startX} ${y1} L ${startX} ${clearanceY} L ${enterX} ${clearanceY} L ${enterX} ${y2} L ${x2} ${y2}`;
                          } else if (y1 > y2) {
                            // Going up and back - route below predecessor, horizontal termination pointing LEFT
                            const clearanceY = y1 + verticalClearance;
                            pathD = `M ${x1} ${y1} L ${startX} ${y1} L ${startX} ${clearanceY} L ${enterX} ${clearanceY} L ${enterX} ${y2} L ${x2} ${y2}`;
                          } else {
                            // Same row going backward - route above, horizontal termination pointing LEFT
                            const clearanceY = y1 - verticalClearance;
                            pathD = `M ${x1} ${y1} L ${startX} ${y1} L ${startX} ${clearanceY} L ${enterX} ${clearanceY} L ${enterX} ${y2} L ${x2} ${y2}`;
                          }
                        }

                        return (
                          <g key={dep.id}>
                            <path
                              d={pathD}
                              stroke={color}
                              strokeWidth={isViolated ? "2.5" : "2"}
                              fill="none"
                              markerEnd={`url(#${markerId})`}
                              opacity="1"
                              vectorEffect="non-scaling-stroke"
                              strokeLinejoin="miter"
                              strokeLinecap="square"
                            />
                            <title>
                              {`${getEntityName(dep.predecessorType, dep.predecessorId)} (${dep.predecessorPoint}) → ${getEntityName(dep.successorType, dep.successorId)} (${dep.successorPoint})\nType: ${dep.dependencyType}${dep.lagDays !== 0 ? `\nLag: ${dep.lagDays} days` : ''}${isViolated ? '\n⚠️ CONSTRAINT VIOLATED' : ''}`}
                            </title>
                          </g>
                        );
                      })}
                  </svg>
                </Box>

                {/* Legend */}
                <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid #e0e0e0', display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem', mb: 0.5, display: 'block' }}>
                      Project Health:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 16, height: 12, bgcolor: '#4caf50', borderRadius: 0.5 }} />
                        <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>Healthy</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 16, height: 12, bgcolor: '#ff9800', borderRadius: 0.5 }} />
                        <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>At Risk</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 16, height: 12, bgcolor: '#f44336', borderRadius: 0.5 }} />
                        <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>Critical</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 16, height: 12, bgcolor: '#2196f3', borderRadius: 0.5 }} />
                        <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>No Status</Typography>
                      </Box>
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem', mb: 0.5, display: 'block' }}>
                      Milestones:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 10, height: 10, bgcolor: '#66bb6a', transform: 'rotate(45deg)', border: '1px solid white', boxShadow: 1 }} />
                        <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>Completed</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 10, height: 10, bgcolor: '#42a5f5', transform: 'rotate(45deg)', border: '1px solid white', boxShadow: 1 }} />
                        <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>In Progress</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 10, height: 10, bgcolor: '#9e9e9e', transform: 'rotate(45deg)', border: '1px solid white', boxShadow: 1 }} />
                        <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>Pending</Typography>
                      </Box>
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem', mb: 0.5, display: 'block' }}>
                      Dependencies:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 20, height: 2, bgcolor: '#1976d2' }} />
                        <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>FS (Finish→Start)</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 20, height: 2, bgcolor: '#388e3c' }} />
                        <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>SS (Start→Start)</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 20, height: 2, bgcolor: '#f57c00' }} />
                        <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>FF (Finish→Finish)</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 20, height: 2, bgcolor: '#d32f2f' }} />
                        <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>SF (Start→Finish)</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 20, height: 3, bgcolor: '#dc2626' }} />
                        <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>⚠️ Violated</Typography>
                      </Box>
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem', mb: 0.5, display: 'block' }}>
                      Critical Path:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 16, height: 12, bgcolor: '#4caf50', borderRadius: 0.5, border: '2px solid #fbbf24' }} />
                        <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>⚡ On Critical Path (Zero Slack)</Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>
            );
          })()}
        </Paper>
      )}
      </Box>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
        <DialogTitle>{editMode ? 'Edit Project' : 'Add Project'}</DialogTitle>
        <Tabs value={dialogTab} onChange={(_e, newValue) => setDialogTab(newValue)} sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
          <Tab label="Basic Info" />
          <Tab label="Business Details" />
          <Tab label="Financial" />
          <Tab label="Dates & Timeline" />
          <Tab label="Management" />
          <Tab label="Cross-Domain Impact" />
          {editMode && currentProject.id && <Tab label="Requirements" />}
        </Tabs>
        <DialogContent>
          {/* Tab 0: Basic Info */}
          {dialogTab === 0 && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Project Name"
                  value={currentProject.name || ''}
                  onChange={(e) =>
                    setCurrentProject({ ...currentProject, name: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Project Number"
                  value={currentProject.projectNumber || ''}
                  onChange={(e) =>
                    setCurrentProject({ ...currentProject, projectNumber: e.target.value })
                  }
                  helperText="Unique project identifier"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={currentProject.description || ''}
                  onChange={(e) =>
                    setCurrentProject({ ...currentProject, description: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Domain"
                  value={currentProject.domainId || ''}
                  onChange={(e) =>
                    setCurrentProject({ ...currentProject, domainId: e.target.value ? Number(e.target.value) : undefined })
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
                  value={currentProject.segmentFunctionId || ''}
                  onChange={(e) =>
                    setCurrentProject({ ...currentProject, segmentFunctionId: e.target.value ? Number(e.target.value) : undefined })
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
                  select
                  fullWidth
                  label="Status"
                  value={currentProject.status || 'Planning'}
                  onChange={(e) =>
                    setCurrentProject({ ...currentProject, status: e.target.value })
                  }
                >
                  <MenuItem value="Planning">Planning</MenuItem>
                  <MenuItem value="In Progress">In Progress</MenuItem>
                  <MenuItem value="On Hold">On Hold</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                  <MenuItem value="Cancelled">Cancelled</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Priority"
                  value={currentProject.priority || 'Medium'}
                  onChange={(e) =>
                    setCurrentProject({ ...currentProject, priority: e.target.value })
                  }
                >
                  <MenuItem value="Low">Low</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                  <MenuItem value="Critical">Critical</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  fullWidth
                  label="Fiscal Year"
                  value={currentProject.fiscalYear || ''}
                  onChange={(e) =>
                    setCurrentProject({ ...currentProject, fiscalYear: e.target.value })
                  }
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="FY24">FY24</MenuItem>
                  <MenuItem value="FY25">FY25</MenuItem>
                  <MenuItem value="FY26">FY26</MenuItem>
                  <MenuItem value="FY27">FY27</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  fullWidth
                  label="Target Release"
                  value={currentProject.targetRelease || ''}
                  onChange={(e) =>
                    setCurrentProject({ ...currentProject, targetRelease: e.target.value })
                  }
                >
                  <MenuItem value="">None</MenuItem>
                  {uniqueTargetReleases.map((release) => (
                    <MenuItem key={release} value={release}>{release}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  fullWidth
                  label="Target Sprint"
                  value={currentProject.targetSprint || ''}
                  onChange={(e) =>
                    setCurrentProject({ ...currentProject, targetSprint: e.target.value })
                  }
                >
                  <MenuItem value="">None</MenuItem>
                  {uniqueTargetSprints.map((sprint) => (
                    <MenuItem key={sprint} value={sprint}>{sprint}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Progress (%)"
                  type="number"
                  value={currentProject.progress || 0}
                  onChange={(e) =>
                    setCurrentProject({
                      ...currentProject,
                      progress: parseInt(e.target.value) || 0,
                    })
                  }
                  inputProps={{ min: 0, max: 100 }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  fullWidth
                  label="Health Status"
                  value={currentProject.healthStatus || 'Green'}
                  onChange={(e) =>
                    setCurrentProject({ ...currentProject, healthStatus: e.target.value })
                  }
                >
                  <MenuItem value="Green">Green</MenuItem>
                  <MenuItem value="Yellow">Yellow</MenuItem>
                  <MenuItem value="Red">Red</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Current Phase"
                  value={currentProject.currentPhase || 'Requirements'}
                  onChange={(e) =>
                    setCurrentProject({ ...currentProject, currentPhase: e.target.value })
                  }
                >
                  <MenuItem value="Requirements">Requirements</MenuItem>
                  <MenuItem value="Design">Design</MenuItem>
                  <MenuItem value="Build">Build</MenuItem>
                  <MenuItem value="Test">Test</MenuItem>
                  <MenuItem value="UAT">UAT</MenuItem>
                  <MenuItem value="Go-Live">Go-Live</MenuItem>
                  <MenuItem value="Hypercare">Hypercare</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Project Type"
                  value={currentProject.type || ''}
                  onChange={(e) =>
                    setCurrentProject({ ...currentProject, type: e.target.value })
                  }
                  placeholder="e.g., Infrastructure, Application, Enhancement"
                />
              </Grid>
            </Grid>
          )}

          {/* Tab 1: Business Details */}
          {dialogTab === 1 && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Business Process"
                  value={currentProject.businessProcess || ''}
                  onChange={(e) =>
                    setCurrentProject({ ...currentProject, businessProcess: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Division"
                  value={currentProject.division || ''}
                  onChange={(e) =>
                    setCurrentProject({ ...currentProject, division: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Functionality"
                  multiline
                  rows={3}
                  value={currentProject.functionality || ''}
                  onChange={(e) =>
                    setCurrentProject({ ...currentProject, functionality: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Business Decision"
                  value={currentProject.businessDecision || ''}
                  onChange={(e) =>
                    setCurrentProject({ ...currentProject, businessDecision: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Business Priority"
                  value={currentProject.businessPriority || ''}
                  onChange={(e) =>
                    setCurrentProject({ ...currentProject, businessPriority: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Needle Mover"
                  value={currentProject.needleMover || ''}
                  onChange={(e) =>
                    setCurrentProject({ ...currentProject, needleMover: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="DOW"
                  value={currentProject.dow || ''}
                  onChange={(e) =>
                    setCurrentProject({ ...currentProject, dow: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="New or Carry Over"
                  value={currentProject.newOrCarryOver || ''}
                  onChange={(e) =>
                    setCurrentProject({ ...currentProject, newOrCarryOver: e.target.value })
                  }
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="New">New</MenuItem>
                  <MenuItem value="Carry Over">Carry Over</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Technology Choice"
                  value={currentProject.technologyChoice || ''}
                  onChange={(e) =>
                    setCurrentProject({ ...currentProject, technologyChoice: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Project Infrastructure Needed"
                  value={currentProject.projectInfrastructureNeeded !== undefined ? (currentProject.projectInfrastructureNeeded ? 'true' : 'false') : 'false'}
                  onChange={(e) =>
                    setCurrentProject({ ...currentProject, projectInfrastructureNeeded: e.target.value === 'true' })
                  }
                >
                  <MenuItem value="false">No</MenuItem>
                  <MenuItem value="true">Yes</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Co-Creation"
                  value={currentProject.coCreation !== undefined ? (currentProject.coCreation ? 'true' : 'false') : 'false'}
                  onChange={(e) =>
                    setCurrentProject({ ...currentProject, coCreation: e.target.value === 'true' })
                  }
                >
                  <MenuItem value="false">No</MenuItem>
                  <MenuItem value="true">Yes</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          )}

          {/* Tab 2: Financial */}
          {dialogTab === 2 && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Budget"
                  type="number"
                  value={currentProject.budget || ''}
                  onChange={(e) =>
                    setCurrentProject({
                      ...currentProject,
                      budget: parseFloat(e.target.value) || 0,
                    })
                  }
                  InputProps={{ startAdornment: '$' }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Actual Cost"
                  type="number"
                  value={currentProject.actualCost || ''}
                  onChange={(e) =>
                    setCurrentProject({
                      ...currentProject,
                      actualCost: parseFloat(e.target.value) || 0,
                    })
                  }
                  InputProps={{ startAdornment: '$' }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Forecasted Cost"
                  type="number"
                  value={currentProject.forecastedCost || ''}
                  onChange={(e) =>
                    setCurrentProject({
                      ...currentProject,
                      forecastedCost: parseFloat(e.target.value) || 0,
                    })
                  }
                  InputProps={{ startAdornment: '$' }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Financial Benefit"
                  type="number"
                  value={currentProject.financialBenefit || ''}
                  onChange={(e) =>
                    setCurrentProject({
                      ...currentProject,
                      financialBenefit: parseFloat(e.target.value) || 0,
                    })
                  }
                  InputProps={{ startAdornment: '$' }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Planned OPEX"
                  type="number"
                  value={currentProject.plannedOpex || ''}
                  onChange={(e) =>
                    setCurrentProject({
                      ...currentProject,
                      plannedOpex: parseFloat(e.target.value) || 0,
                    })
                  }
                  InputProps={{ startAdornment: '$' }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Planned CAPEX"
                  type="number"
                  value={currentProject.plannedCapex || ''}
                  onChange={(e) =>
                    setCurrentProject({
                      ...currentProject,
                      plannedCapex: parseFloat(e.target.value) || 0,
                    })
                  }
                  InputProps={{ startAdornment: '$' }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Total Planned Cost"
                  type="number"
                  value={currentProject.totalPlannedCost || ''}
                  onChange={(e) =>
                    setCurrentProject({
                      ...currentProject,
                      totalPlannedCost: parseFloat(e.target.value) || 0,
                    })
                  }
                  InputProps={{ startAdornment: '$' }}
                />
              </Grid>
            </Grid>
          )}

          {/* Tab 3: Dates & Timeline */}
          {dialogTab === 3 && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={currentProject.startDate ? new Date(currentProject.startDate).toISOString().split('T')[0] : ''}
                  onChange={(e) =>
                    setCurrentProject({
                      ...currentProject,
                      startDate: e.target.value ? new Date(e.target.value) as any : undefined,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  value={currentProject.endDate ? new Date(currentProject.endDate).toISOString().split('T')[0] : ''}
                  onChange={(e) =>
                    setCurrentProject({
                      ...currentProject,
                      endDate: e.target.value ? new Date(e.target.value) as any : undefined,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Desired Start Date"
                  type="date"
                  value={currentProject.desiredStartDate ? new Date(currentProject.desiredStartDate).toISOString().split('T')[0] : ''}
                  onChange={(e) =>
                    setCurrentProject({
                      ...currentProject,
                      desiredStartDate: e.target.value ? new Date(e.target.value) as any : undefined,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Desired Completion Date"
                  type="date"
                  value={currentProject.desiredCompletionDate ? new Date(currentProject.desiredCompletionDate).toISOString().split('T')[0] : ''}
                  onChange={(e) =>
                    setCurrentProject({
                      ...currentProject,
                      desiredCompletionDate: e.target.value ? new Date(e.target.value) as any : undefined,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Actual Start Date"
                  type="date"
                  value={currentProject.actualStartDate ? new Date(currentProject.actualStartDate).toISOString().split('T')[0] : ''}
                  onChange={(e) =>
                    setCurrentProject({
                      ...currentProject,
                      actualStartDate: e.target.value ? new Date(e.target.value) as any : undefined,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Actual End Date"
                  type="date"
                  value={currentProject.actualEndDate ? new Date(currentProject.actualEndDate).toISOString().split('T')[0] : ''}
                  onChange={(e) =>
                    setCurrentProject({
                      ...currentProject,
                      actualEndDate: e.target.value ? new Date(e.target.value) as any : undefined,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Deadline"
                  type="date"
                  value={currentProject.deadline ? new Date(currentProject.deadline).toISOString().split('T')[0] : ''}
                  onChange={(e) =>
                    setCurrentProject({
                      ...currentProject,
                      deadline: e.target.value ? new Date(e.target.value) as any : undefined,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          )}

          {/* Tab 4: Management & Classification */}
          {dialogTab === 4 && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Investment Class"
                  value={currentProject.investmentClass || ''}
                  onChange={(e) =>
                    setCurrentProject({ ...currentProject, investmentClass: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Benefit Area"
                  value={currentProject.benefitArea || ''}
                  onChange={(e) =>
                    setCurrentProject({ ...currentProject, benefitArea: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Technology Area"
                  value={currentProject.technologyArea || ''}
                  onChange={(e) =>
                    setCurrentProject({ ...currentProject, technologyArea: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Enterprise Category"
                  value={currentProject.enterpriseCategory || ''}
                  onChange={(e) =>
                    setCurrentProject({ ...currentProject, enterpriseCategory: e.target.value })
                  }
                />
              </Grid>
            </Grid>
          )}

          {/* Tab 5: Cross-Domain Impact */}
          {dialogTab === 5 && (
            <Box sx={{ mt: 1 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Additional Domain Impacts
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setDomainImpacts([
                      ...domainImpacts,
                      {
                        domainId: 0,
                        impactType: 'Secondary',
                        impactLevel: 'Medium',
                        description: '',
                      },
                    ]);
                  }}
                  size="small"
                >
                  Add Domain Impact
                </Button>
              </Box>

              {domainImpacts.length === 0 ? (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 200,
                    bgcolor: 'action.hover',
                    borderRadius: 1,
                    border: '1px dashed',
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    No additional domain impacts specified
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Add domain impacts to track cross-domain project dependencies
                  </Typography>
                </Box>
              ) : (
                <Box>
                  {domainImpacts.map((impact, index) => (
                    <Paper
                      key={index}
                      elevation={0}
                      sx={{
                        p: 2,
                        mb: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                      }}
                    >
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          Domain Impact #{index + 1}
                        </Typography>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            setDomainImpacts(domainImpacts.filter((_, i) => i !== index));
                          }}
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            select
                            fullWidth
                            required
                            label="Domain"
                            value={impact.domainId || ''}
                            onChange={(e) => {
                              const newImpacts = [...domainImpacts];
                              const selectedDomain = domains.find(d => d.id === Number(e.target.value));
                              newImpacts[index] = {
                                ...newImpacts[index],
                                domainId: Number(e.target.value),
                                domainName: selectedDomain?.name,
                              };
                              setDomainImpacts(newImpacts);
                            }}
                          >
                            <MenuItem value={0} disabled>
                              Select a domain
                            </MenuItem>
                            {domains
                              .filter(domain => {
                                // Exclude the primary domain
                                if (domain.id === currentProject.domainId) return false;

                                // Exclude domains that are already selected in other impacts
                                // (but allow the current impact's selected domain to remain visible)
                                const isAlreadySelected = domainImpacts.some((imp, impIndex) =>
                                  impIndex !== index && imp.domainId === domain.id
                                );

                                return !isAlreadySelected;
                              })
                              .map((domain) => (
                                <MenuItem key={domain.id} value={domain.id}>
                                  {domain.name}
                                </MenuItem>
                              ))}
                          </TextField>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <TextField
                            select
                            fullWidth
                            label="Impact Type"
                            value={impact.impactType}
                            onChange={(e) => {
                              const newImpacts = [...domainImpacts];
                              newImpacts[index] = {
                                ...newImpacts[index],
                                impactType: e.target.value as 'Primary' | 'Secondary' | 'Tertiary',
                              };
                              setDomainImpacts(newImpacts);
                            }}
                          >
                            <MenuItem value="Primary">Primary</MenuItem>
                            <MenuItem value="Secondary">Secondary</MenuItem>
                            <MenuItem value="Tertiary">Tertiary</MenuItem>
                          </TextField>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <TextField
                            select
                            fullWidth
                            label="Impact Level"
                            value={impact.impactLevel}
                            onChange={(e) => {
                              const newImpacts = [...domainImpacts];
                              newImpacts[index] = {
                                ...newImpacts[index],
                                impactLevel: e.target.value as 'High' | 'Medium' | 'Low',
                              };
                              setDomainImpacts(newImpacts);
                            }}
                          >
                            <MenuItem value="High">High</MenuItem>
                            <MenuItem value="Medium">Medium</MenuItem>
                            <MenuItem value="Low">Low</MenuItem>
                          </TextField>
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            multiline
                            rows={2}
                            label="Description"
                            placeholder="Describe the impact on this domain..."
                            value={impact.description || ''}
                            onChange={(e) => {
                              const newImpacts = [...domainImpacts];
                              newImpacts[index] = {
                                ...newImpacts[index],
                                description: e.target.value,
                              };
                              setDomainImpacts(newImpacts);
                            }}
                          />
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                </Box>
              )}

              <Box
                sx={{
                  mt: 2,
                  p: 1.5,
                  bgcolor: 'info.lighter',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'info.light',
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  <strong>Note:</strong> The primary domain for this project is set in the Basic Info tab.
                  Use this section to track additional domains that are impacted by or involved in this project.
                </Typography>
              </Box>
            </Box>
          )}

          {/* Tab 6: Requirements */}
          {dialogTab === 6 && editMode && currentProject.id && (
            <Box sx={{ mt: 1 }}>
              <EnhancedRequirementsTab
                projectId={currentProject.id}
                project={{
                  id: currentProject.id,
                  name: currentProject.name || '',
                  status: currentProject.status || '',
                  startDate: currentProject.startDate instanceof Date
                    ? currentProject.startDate.toISOString()
                    : currentProject.startDate,
                  endDate: currentProject.endDate instanceof Date
                    ? currentProject.endDate.toISOString()
                    : currentProject.endDate,
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openResourcesDialog}
        onClose={handleCloseResourcesDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {selectedProject?.name} - Allocated Resources ({projectResources.length})
        </DialogTitle>
        <DialogContent>
          {loadingResources ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress />
            </Box>
          ) : projectResources.length === 0 ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <Typography color="text.secondary">
                No resources allocated to this project
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Employee ID</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Primary Skill</TableCell>
                    <TableCell>Role on Project</TableCell>
                    <TableCell>Allocation %</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {projectResources.map((resource) => (
                    <TableRow key={resource.allocationId}>
                      <TableCell>{resource.employeeId}</TableCell>
                      <TableCell>
                        {resource.firstName} {resource.lastName}
                      </TableCell>
                      <TableCell>{resource.email || '-'}</TableCell>
                      <TableCell>
                        <Chip label={resource.primarySkill || 'N/A'} size="small" />
                      </TableCell>
                      <TableCell>{resource.roleOnProject || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={`${resource.allocationPercentage || 0}%`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResourcesDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Undo Snackbar */}
      <Snackbar
        open={showUndoSnackbar}
        autoHideDuration={10000}
        onClose={() => setShowUndoSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setShowUndoSnackbar(false)}
          severity="info"
          sx={{ width: '100%' }}
          action={
            <Button color="inherit" size="small" onClick={handleUndo} startIcon={<UndoIcon />}>
              UNDO
            </Button>
          }
        >
          {lastAction?.description} - Press Ctrl+Z to undo
        </Alert>
      </Snackbar>

      {/* Notification Snackbar */}
      <Snackbar
        open={showNotification}
        autoHideDuration={4000}
        onClose={() => setShowNotification(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setShowNotification(false)}
          severity={notificationSeverity}
          sx={{ width: '100%' }}
        >
          {notificationMessage}
        </Alert>
      </Snackbar>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
        confirmText="Delete"
        confirmColor="error"
      />

      {/* Dependency Manager Dialog */}
      <DependencyManagerDialog
        open={openDependencyManagerDialog}
        onClose={handleCloseDependencyManagerDialog}
        dependencies={dependencies}
        projects={filteredProjects}
        milestones={milestones.filter(m => filteredProjects.some(p => p.id === m.projectId))}
        onDelete={handleDeleteDependency}
        onAddNew={handleOpenDependencyCreateDialog}
      />

      {/* Dependency Create Dialog */}
      <DependencyDialog
        open={openDependencyCreateDialog}
        onClose={handleCloseDependencyCreateDialog}
        onSave={handleSaveDependency}
        projects={filteredProjects}
        milestones={milestones.filter(m => filteredProjects.some(p => p.id === m.projectId))}
      />
    </Box>
  );
};

export default ProjectManagement;
