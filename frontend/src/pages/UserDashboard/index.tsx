import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  Button,
  IconButton,
  Tabs,
  Tab,
  Stack,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Select,
  MenuItem,
  FormControl,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@mui/material';
import {
  Assignment as TaskIcon,
  CheckCircle as CompletedIcon,
  PlayArrow as InProgressIcon,
  RadioButtonUnchecked as OpenIcon,
  ExpandMore as ExpandMoreIcon,
  Comment as MentionIcon,
  Timeline as ActivityIcon,
  Warning as WarningIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  OpenInNew as OpenInNewIcon,
  ViewList as TableViewIcon,
  ViewModule as CardViewIcon,
} from '@mui/icons-material';
import { formatDistanceToNow, isPast, parseISO, isThisWeek } from 'date-fns';
import PageHeader from '../../components/common/PageHeader';
import {
  getUserTasks,
  getUserMentions,
  getUserActivityFeed,
  updateTaskStatus,
  ProjectActivity,
  TasksResponse,
  MentionsResponse,
  ActivityFeedResponse,
} from '../../services/activityService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const UserDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View mode state
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  // Tasks state
  const [tasksData, setTasksData] = useState<TasksResponse | null>(null);
  const [taskFilter, setTaskFilter] = useState<string>('all');

  // Mentions state
  const [mentionsData, setMentionsData] = useState<MentionsResponse | null>(null);

  // Activity feed state
  const [activityData, setActivityData] = useState<ActivityFeedResponse | null>(null);
  const [activityFilter, setActivityFilter] = useState<string>('all');

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = currentUser.id;

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [tasks, mentions, activity] = await Promise.all([
        getUserTasks(userId, { status: 'all' }),
        getUserMentions(userId),
        getUserActivityFeed(userId),
      ]);

      setTasksData(tasks);
      setMentionsData(mentions);
      setActivityData(activity);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleQuickStatusUpdate = async (taskId: number, newStatus: 'open' | 'in_progress' | 'completed' | 'cancelled') => {
    try {
      await updateTaskStatus(taskId, newStatus);
      await loadDashboardData(); // Reload to update counts
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update task status');
    }
  };

  const handleNavigateToProject = (projectId: number) => {
    // Navigate to projects page with a query param to open the specific project in edit mode
    navigate(`/projects?editProjectId=${projectId}&tab=8`); // tab=8 is the Activity tab
  };

  const isOverdue = (task: ProjectActivity): boolean => {
    if (!task.dueDate || task.taskStatus === 'completed' || task.taskStatus === 'cancelled') {
      return false;
    }
    return isPast(parseISO(task.dueDate));
  };

  const isDueThisWeek = (task: ProjectActivity): boolean => {
    if (!task.dueDate || task.taskStatus === 'completed' || task.taskStatus === 'cancelled') {
      return false;
    }
    return isThisWeek(parseISO(task.dueDate));
  };

  const getFilteredTasks = () => {
    if (!tasksData) return [];

    switch (taskFilter) {
      case 'overdue':
        return tasksData.tasks.filter(isOverdue);
      case 'this_week':
        return tasksData.tasks.filter(isDueThisWeek);
      case 'high_priority':
        return tasksData.tasks.filter(t => t.taskPriority === 'high' || t.taskPriority === 'urgent');
      default:
        return tasksData.tasks;
    }
  };

  const getFilteredActivities = () => {
    if (!activityData) return [];

    switch (activityFilter) {
      case 'tasks':
        return activityData.activities.filter(a => a.activityType === 'task' || a.activityType === 'action_item');
      case 'mentions':
        return activityData.activities.filter(a => a.activityType === 'comment');
      default:
        return activityData.activities;
    }
  };

  const getPriorityColor = (priority?: string): 'default' | 'warning' | 'error' => {
    switch (priority) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status?: string): 'default' | 'primary' | 'success' | 'error' => {
    switch (status) {
      case 'open':
        return 'default';
      case 'in_progress':
        return 'primary';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const renderTaskCard = (task: ProjectActivity) => {
    const overdue = isOverdue(task);

    return (
      <Card
        key={task.id}
        sx={{
          mb: 2,
          border: overdue ? '2px solid' : undefined,
          borderColor: overdue ? 'error.main' : undefined,
        }}
      >
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
              <TaskIcon fontSize="small" />
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body1" sx={{ mb: 1 }}>
                {task.content}
              </Typography>

              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
                <Chip
                  label={task.taskStatus?.replace('_', ' ').toUpperCase() || 'OPEN'}
                  size="small"
                  color={getStatusColor(task.taskStatus)}
                />
                {task.taskPriority && (
                  <Chip
                    label={task.taskPriority.toUpperCase()}
                    size="small"
                    color={getPriorityColor(task.taskPriority)}
                  />
                )}
                {task.dueDate && (
                  <Chip
                    icon={<CalendarIcon fontSize="small" />}
                    label={new Date(task.dueDate).toLocaleDateString()}
                    size="small"
                    color={overdue ? 'error' : 'default'}
                    variant={overdue ? 'filled' : 'outlined'}
                  />
                )}
                {task.project && (
                  <Chip
                    label={task.project.name}
                    size="small"
                    variant="outlined"
                    onClick={() => handleNavigateToProject(task.project!.id)}
                    sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                  />
                )}
              </Stack>

              <Stack direction="row" spacing={1} flexWrap="wrap">
                {task.taskStatus !== 'in_progress' && task.taskStatus !== 'completed' && (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<InProgressIcon />}
                    onClick={() => handleQuickStatusUpdate(task.id, 'in_progress')}
                  >
                    Start
                  </Button>
                )}
                {task.taskStatus !== 'completed' && (
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    startIcon={<CompletedIcon />}
                    onClick={() => handleQuickStatusUpdate(task.id, 'completed')}
                  >
                    Complete
                  </Button>
                )}
                {task.project && (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<OpenInNewIcon />}
                    onClick={() => handleNavigateToProject(task.project!.id)}
                  >
                    View in Project
                  </Button>
                )}
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    );
  };

  const renderMentionCard = (mention: ProjectActivity) => {
    return (
      <Card key={mention.id} sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
              {mention.author?.firstName?.[0] || '?'}
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                {mention.author?.firstName} {mention.author?.lastName} mentioned you
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {mention.content}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                {mention.project && (
                  <Chip
                    label={mention.project.name}
                    size="small"
                    variant="outlined"
                    onClick={() => handleNavigateToProject(mention.project!.id)}
                    sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                  />
                )}
                <Typography variant="caption" color="text.secondary">
                  {formatDistanceToNow(new Date(mention.createdDate), { addSuffix: true })}
                </Typography>
                {mention.project && (
                  <Button
                    size="small"
                    variant="text"
                    startIcon={<OpenInNewIcon />}
                    onClick={() => handleNavigateToProject(mention.project!.id)}
                    sx={{ ml: 'auto' }}
                  >
                    View in Project
                  </Button>
                )}
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    );
  };

  const renderTasksTable = (tasks: ProjectActivity[]) => {
    if (tasks.length === 0) {
      return <Alert severity="info">No tasks found</Alert>;
    }

    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Task</TableCell>
              <TableCell>Project</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.map((task) => {
              const overdue = isOverdue(task);
              return (
                <TableRow
                  key={task.id}
                  sx={{
                    bgcolor: overdue ? 'error.lighter' : 'inherit',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <TableCell>
                    <Typography variant="body2">{task.content}</Typography>
                  </TableCell>
                  <TableCell>
                    {task.project && (
                      <Chip
                        label={task.project.name}
                        size="small"
                        variant="outlined"
                        onClick={() => handleNavigateToProject(task.project!.id)}
                        sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={task.taskStatus?.replace('_', ' ').toUpperCase() || 'OPEN'}
                      size="small"
                      color={getStatusColor(task.taskStatus)}
                    />
                  </TableCell>
                  <TableCell>
                    {task.taskPriority && (
                      <Chip
                        label={task.taskPriority.toUpperCase()}
                        size="small"
                        color={getPriorityColor(task.taskPriority)}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {task.dueDate ? (
                      <Chip
                        icon={<CalendarIcon fontSize="small" />}
                        label={new Date(task.dueDate).toLocaleDateString()}
                        size="small"
                        color={overdue ? 'error' : 'default'}
                        variant={overdue ? 'filled' : 'outlined'}
                      />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      {task.taskStatus !== 'in_progress' && task.taskStatus !== 'completed' && (
                        <Tooltip title="Start">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleQuickStatusUpdate(task.id, 'in_progress')}
                          >
                            <InProgressIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {task.taskStatus !== 'completed' && (
                        <Tooltip title="Complete">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleQuickStatusUpdate(task.id, 'completed')}
                          >
                            <CompletedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {task.project && (
                        <Tooltip title="View in Project">
                          <IconButton
                            size="small"
                            onClick={() => handleNavigateToProject(task.project!.id)}
                          >
                            <OpenInNewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const overdueCount = tasksData?.tasks.filter(isOverdue).length || 0;
  const dueThisWeekCount = tasksData?.tasks.filter(isDueThisWeek).length || 0;
  const unreadMentions = mentionsData?.mentions.length || 0;

  return (
    <Box>
      <PageHeader
        title="My Dashboard"
        subtitle="Your tasks, mentions, and activity in one place"
        icon={<PersonIcon />}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="text.secondary" variant="caption">
                    Total Tasks
                  </Typography>
                  <Typography variant="h4">
                    {tasksData?.tasks.length || 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <TaskIcon />
                </Avatar>
              </Stack>
              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                <Chip label={`${tasksData?.statusCounts.open || 0} Open`} size="small" />
                <Chip label={`${tasksData?.statusCounts.in_progress || 0} In Progress`} size="small" color="primary" />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="text.secondary" variant="caption">
                    Overdue Tasks
                  </Typography>
                  <Typography variant="h4" color={overdueCount > 0 ? 'error.main' : 'inherit'}>
                    {overdueCount}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: overdueCount > 0 ? 'error.main' : 'grey.400' }}>
                  <WarningIcon />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="text.secondary" variant="caption">
                    Due This Week
                  </Typography>
                  <Typography variant="h4">
                    {dueThisWeekCount}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <CalendarIcon />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="text.secondary" variant="caption">
                    Mentions
                  </Typography>
                  <Typography variant="h4">
                    {unreadMentions}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                  <MentionIcon />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="dashboard tabs">
          <Tab
            icon={<TaskIcon />}
            iconPosition="start"
            label={
              <Badge badgeContent={tasksData?.tasks.length || 0} color="primary">
                My Tasks
              </Badge>
            }
          />
          <Tab
            icon={<MentionIcon />}
            iconPosition="start"
            label={
              <Badge badgeContent={unreadMentions} color="secondary">
                Mentions
              </Badge>
            }
          />
          <Tab
            icon={<ActivityIcon />}
            iconPosition="start"
            label="Activity Feed"
          />
        </Tabs>
      </Box>

      {/* My Tasks Tab */}
      <TabPanel value={tabValue} index={0}>
        <Stack direction="row" spacing={2} justifyContent="space-between" sx={{ mb: 3 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select value={taskFilter} onChange={(e) => setTaskFilter(e.target.value)}>
              <MenuItem value="all">All Tasks</MenuItem>
              <MenuItem value="overdue">Overdue</MenuItem>
              <MenuItem value="this_week">Due This Week</MenuItem>
              <MenuItem value="high_priority">High Priority</MenuItem>
            </Select>
          </FormControl>

          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, newMode) => newMode && setViewMode(newMode)}
            size="small"
            aria-label="view mode"
          >
            <ToggleButton value="card" aria-label="card view">
              <Tooltip title="Card View">
                <CardViewIcon fontSize="small" />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="table" aria-label="table view">
              <Tooltip title="Table View">
                <TableViewIcon fontSize="small" />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        {/* Table View */}
        {viewMode === 'table' && renderTasksTable(getFilteredTasks())}

        {/* Card View - Tasks grouped by status */}
        {viewMode === 'card' && (
          <>
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <OpenIcon color="action" />
                  <Typography>Open ({tasksData?.statusCounts.open || 0})</Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                {getFilteredTasks().filter(t => t.taskStatus === 'open').length === 0 ? (
                  <Alert severity="info">No open tasks</Alert>
                ) : (
                  getFilteredTasks().filter(t => t.taskStatus === 'open').map(renderTaskCard)
                )}
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <InProgressIcon color="primary" />
                  <Typography>In Progress ({tasksData?.statusCounts.in_progress || 0})</Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                {getFilteredTasks().filter(t => t.taskStatus === 'in_progress').length === 0 ? (
                  <Alert severity="info">No tasks in progress</Alert>
                ) : (
                  getFilteredTasks().filter(t => t.taskStatus === 'in_progress').map(renderTaskCard)
                )}
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <CompletedIcon color="success" />
                  <Typography>Completed ({tasksData?.statusCounts.completed || 0})</Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                {getFilteredTasks().filter(t => t.taskStatus === 'completed').length === 0 ? (
                  <Alert severity="info">No completed tasks</Alert>
                ) : (
                  getFilteredTasks().filter(t => t.taskStatus === 'completed').map(renderTaskCard)
                )}
              </AccordionDetails>
            </Accordion>
          </>
        )}
      </TabPanel>

      {/* Mentions Tab */}
      <TabPanel value={tabValue} index={1}>
        {mentionsData?.mentions.length === 0 ? (
          <Alert severity="info">No mentions yet</Alert>
        ) : (
          mentionsData?.mentions.map(renderMentionCard)
        )}
      </TabPanel>

      {/* Activity Feed Tab */}
      <TabPanel value={tabValue} index={2}>
        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select value={activityFilter} onChange={(e) => setActivityFilter(e.target.value)}>
              <MenuItem value="all">All Activity</MenuItem>
              <MenuItem value="tasks">Tasks Only</MenuItem>
              <MenuItem value="mentions">Mentions Only</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {getFilteredActivities().length === 0 ? (
          <Alert severity="info">No activity yet</Alert>
        ) : (
          getFilteredActivities().map(activity => {
            if (activity.activityType === 'task' || activity.activityType === 'action_item') {
              return renderTaskCard(activity);
            } else {
              return renderMentionCard(activity);
            }
          })
        )}
      </TabPanel>
    </Box>
  );
};

export default UserDashboard;
