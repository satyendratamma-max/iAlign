import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Avatar,
  IconButton,
  CircularProgress,
  Alert,
  Button,
  Menu,
  MenuItem as MenuItemComp,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
} from '@mui/material';
import {
  Assignment as TaskIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as OpenIcon,
  MoreVert as MoreVertIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { formatDistanceToNow, isPast, parseISO } from 'date-fns';
import {
  getProjectActivities,
  createTask,
  updateTaskStatus,
  assignTask,
  updateActivity,
  deleteActivity,
  ProjectActivity,
  searchUsers,
  MentionUser,
} from '../../services/activityService';

interface TasksListProps {
  projectId: number;
}

const TasksList: React.FC<TasksListProps> = ({ projectId }) => {
  const [tasks, setTasks] = useState<ProjectActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTask, setSelectedTask] = useState<ProjectActivity | null>(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [newTaskContent, setNewTaskContent] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [users, setUsers] = useState<MentionUser[]>([]);
  const [newTaskAssignee, setNewTaskAssignee] = useState<MentionUser | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [userSearchInput, setUserSearchInput] = useState('');

  // Edit task state
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editTaskContent, setEditTaskContent] = useState('');
  const [editTaskPriority, setEditTaskPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [editTaskDueDate, setEditTaskDueDate] = useState('');
  const [editTaskAssignee, setEditTaskAssignee] = useState<MentionUser | null>(null);
  const [editUserSearchInput, setEditUserSearchInput] = useState('');

  // View task dialog
  const [showViewDialog, setShowViewDialog] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    loadTasks();
    loadUsers('');
  }, [projectId]);

  // Debounced user search for assignee
  useEffect(() => {
    const timer = setTimeout(() => {
      if (showCreateTask || showEditDialog) {
        loadUsers(userSearchInput || editUserSearchInput);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [userSearchInput, editUserSearchInput, showCreateTask, showEditDialog]);

  const loadUsers = async (query: string) => {
    try {
      setUserSearchLoading(true);
      const userList = await searchUsers(query);
      setUsers(userList);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setUserSearchLoading(false);
    }
  };

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProjectActivities(projectId, { type: 'task' });
      // Filter to only tasks and action items
      const taskActivities = [
        ...data.activities.filter(a => a.activityType === 'task' || a.activityType === 'action_item'),
        ...data.pinned.filter(a => a.activityType === 'task' || a.activityType === 'action_item'),
      ];
      setTasks(taskActivities);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!newTaskContent.trim()) return;

    try {
      setSubmitting(true);
      await createTask(projectId, {
        content: newTaskContent.trim(),
        assigneeId: newTaskAssignee?.id || undefined,
        taskPriority: newTaskPriority,
        dueDate: newTaskDueDate || undefined,
      });
      setNewTaskContent('');
      setNewTaskPriority('medium');
      setNewTaskDueDate('');
      setNewTaskAssignee(null);
      setUserSearchInput('');
      setShowCreateTask(false);
      await loadTasks();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (taskId: number, newStatus: 'open' | 'in_progress' | 'completed' | 'cancelled') => {
    try {
      await updateTaskStatus(taskId, newStatus);
      await loadTasks();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update task status');
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, task: ProjectActivity) => {
    setAnchorEl(event.currentTarget);
    setSelectedTask(task);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedTask(null);
  };

  const handleViewTask = () => {
    if (selectedTask) {
      setShowViewDialog(true);
      setAnchorEl(null); // Close menu but keep selectedTask
    }
  };

  const handleEditTask = () => {
    if (selectedTask) {
      setEditTaskContent(selectedTask.content || '');
      setEditTaskPriority(selectedTask.taskPriority || 'medium');
      setEditTaskDueDate(selectedTask.dueDate ? selectedTask.dueDate.split('T')[0] : '');
      setEditTaskAssignee(selectedTask.assignee ? {
        id: selectedTask.assignee.id,
        username: selectedTask.assignee.email || '',
        email: selectedTask.assignee.email || '',
        firstName: selectedTask.assignee.firstName,
        lastName: selectedTask.assignee.lastName,
        displayName: `${selectedTask.assignee.firstName} ${selectedTask.assignee.lastName}`
      } : null);
      setShowEditDialog(true);
      setAnchorEl(null); // Close menu but keep selectedTask
    }
  };

  const handleSaveEditTask = async () => {
    if (!selectedTask || !editTaskContent.trim()) return;

    try {
      setSubmitting(true);
      await updateActivity(selectedTask.id, {
        content: editTaskContent.trim(),
      });

      // Update task-specific fields using assignTask endpoint if assignee changed
      if (editTaskAssignee && editTaskAssignee.id !== selectedTask.assigneeId) {
        await assignTask(selectedTask.id, editTaskAssignee.id);
      }

      setShowEditDialog(false);
      setEditTaskContent('');
      setEditTaskPriority('medium');
      setEditTaskDueDate('');
      setEditTaskAssignee(null);
      setEditUserSearchInput('');
      setSelectedTask(null);
      await loadTasks();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTask) return;

    if (!window.confirm('Are you sure you want to delete this task?')) {
      handleCloseMenu();
      return;
    }

    try {
      await deleteActivity(selectedTask.id);
      handleCloseMenu();
      await loadTasks();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete task');
      handleCloseMenu();
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon fontSize="small" />;
      case 'in_progress':
        return <TaskIcon fontSize="small" />;
      default:
        return <OpenIcon fontSize="small" />;
    }
  };

  const getStatusColor = (status?: string): 'default' | 'primary' | 'success' | 'error' | 'warning' => {
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

  const isOverdue = (task: ProjectActivity): boolean => {
    if (!task.dueDate || task.taskStatus === 'completed' || task.taskStatus === 'cancelled') {
      return false;
    }
    return isPast(parseISO(task.dueDate));
  };

  const filteredTasks = tasks.filter(task => {
    if (filterStatus !== 'all' && task.taskStatus !== filterStatus) return false;
    if (filterPriority !== 'all' && task.taskPriority !== filterPriority) return false;
    if (filterAssignee !== 'all' && task.assigneeId?.toString() !== filterAssignee) return false;
    return true;
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters and Create Task Button */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select value={filterStatus} label="Status" onChange={(e) => setFilterStatus(e.target.value)}>
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="open">Open</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Priority</InputLabel>
              <Select value={filterPriority} label="Priority" onChange={(e) => setFilterPriority(e.target.value)}>
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Assignee</InputLabel>
              <Select value={filterAssignee} label="Assignee" onChange={(e) => setFilterAssignee(e.target.value)}>
                <MenuItem value="all">All</MenuItem>
                {users.map(user => (
                  <MenuItem key={user.id} value={user.id.toString()}>
                    {user.displayName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ flexGrow: 1 }} />

            <Button
              variant="contained"
              startIcon={<TaskIcon />}
              onClick={() => setShowCreateTask(!showCreateTask)}
            >
              Create Task
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Create Task Form */}
      {showCreateTask && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              New Task
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Task Description"
                  value={newTaskContent}
                  onChange={(e) => setNewTaskContent(e.target.value)}
                  disabled={submitting}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={newTaskPriority}
                    label="Priority"
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    disabled={submitting}
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="urgent">Urgent</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Autocomplete
                  fullWidth
                  options={users}
                  getOptionLabel={(option) => option.displayName}
                  value={newTaskAssignee}
                  onChange={(event, newValue) => setNewTaskAssignee(newValue)}
                  inputValue={userSearchInput}
                  onInputChange={(event, newInputValue) => setUserSearchInput(newInputValue)}
                  loading={userSearchLoading}
                  disabled={submitting}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Assignee"
                      placeholder="Search users..."
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {userSearchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="date"
                  label="Due Date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  disabled={submitting}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    onClick={handleCreateTask}
                    disabled={!newTaskContent.trim() || submitting}
                  >
                    {submitting ? 'Creating...' : 'Create Task'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setShowCreateTask(false);
                      setNewTaskContent('');
                      setNewTaskPriority('medium');
                      setNewTaskDueDate('');
                      setNewTaskAssignee(null);
                      setUserSearchInput('');
                    }}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <Alert severity="info">No tasks found. Create your first task to get started!</Alert>
      ) : (
        filteredTasks.map((task) => {
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
                  <Avatar sx={{ bgcolor: task.assignee ? 'primary.main' : 'grey.400' }}>
                    {task.assignee?.firstName?.[0] || '?'}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                          {task.content}
                        </Typography>

                        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
                          {/* Status Chip with Dropdown */}
                          <FormControl size="small" sx={{ minWidth: 140 }}>
                            <Select
                              value={task.taskStatus || 'open'}
                              onChange={(e) => handleStatusChange(task.id, e.target.value as any)}
                              size="small"
                              sx={{
                                height: 28,
                                '& .MuiSelect-select': {
                                  py: 0.5,
                                  display: 'flex',
                                  alignItems: 'center',
                                },
                              }}
                            >
                              <MenuItem value="open">
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                  {getStatusIcon('open')}
                                  <span>Open</span>
                                </Stack>
                              </MenuItem>
                              <MenuItem value="in_progress">
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                  {getStatusIcon('in_progress')}
                                  <span>In Progress</span>
                                </Stack>
                              </MenuItem>
                              <MenuItem value="completed">
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                  {getStatusIcon('completed')}
                                  <span>Completed</span>
                                </Stack>
                              </MenuItem>
                              <MenuItem value="cancelled">
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                  <span>Cancelled</span>
                                </Stack>
                              </MenuItem>
                            </Select>
                          </FormControl>

                          {task.taskPriority && (
                            <Chip
                              label={task.taskPriority.toUpperCase()}
                              size="small"
                              color={getPriorityColor(task.taskPriority)}
                            />
                          )}

                          {task.dueDate && (
                            <Chip
                              label={`Due: ${new Date(task.dueDate).toLocaleDateString()}`}
                              size="small"
                              color={overdue ? 'error' : 'default'}
                              variant={overdue ? 'filled' : 'outlined'}
                            />
                          )}
                        </Stack>

                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="caption" color="text.secondary">
                            Created by {task.author?.firstName} {task.author?.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            •
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDistanceToNow(new Date(task.createdDate), { addSuffix: true })}
                          </Typography>
                          {task.assignee && (
                            <>
                              <Typography variant="caption" color="text.secondary">
                                •
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Assigned to {task.assignee.firstName} {task.assignee.lastName}
                              </Typography>
                            </>
                          )}
                        </Stack>
                      </Box>
                      <IconButton size="small" onClick={(e) => handleMenuClick(e, task)}>
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          );
        })
      )}

      {/* Context Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseMenu}>
        <MenuItemComp onClick={handleViewTask}>
          <ViewIcon fontSize="small" sx={{ mr: 1 }} />
          View Details
        </MenuItemComp>
        <MenuItemComp onClick={handleEditTask}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit Task
        </MenuItemComp>
        <MenuItemComp onClick={handleDeleteTask}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete Task
        </MenuItemComp>
      </Menu>

      {/* View Task Dialog */}
      <Dialog open={showViewDialog} onClose={() => { setShowViewDialog(false); setSelectedTask(null); }} maxWidth="md" fullWidth>
        <DialogTitle>Task Details</DialogTitle>
        <DialogContent dividers>
          {selectedTask && (
            <Box sx={{ py: 2 }}>
              <Typography variant="h6" gutterBottom>
                Description
              </Typography>
              <Typography variant="body1" component="div" sx={{ mb: 3, whiteSpace: 'pre-wrap' }}>
                {selectedTask.content}
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={selectedTask.taskStatus?.replace('_', ' ').toUpperCase()}
                    size="small"
                    color={getStatusColor(selectedTask.taskStatus)}
                    sx={{ textTransform: 'capitalize' }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Priority
                  </Typography>
                  <Chip
                    label={selectedTask.taskPriority?.toUpperCase()}
                    size="small"
                    color={getPriorityColor(selectedTask.taskPriority)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Assigned To
                  </Typography>
                  <Typography variant="body1">
                    {selectedTask.assignee
                      ? `${selectedTask.assignee.firstName} ${selectedTask.assignee.lastName}`
                      : 'Unassigned'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Due Date
                  </Typography>
                  <Typography variant="body1">
                    {selectedTask.dueDate
                      ? new Date(selectedTask.dueDate).toLocaleDateString()
                      : 'No due date'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Created By
                  </Typography>
                  <Typography variant="body1">
                    {selectedTask.author
                      ? `${selectedTask.author.firstName} ${selectedTask.author.lastName}`
                      : 'Unknown'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Created On
                  </Typography>
                  <Typography variant="body1">
                    {new Date(selectedTask.createdDate).toLocaleString()}
                  </Typography>
                </Grid>
                {selectedTask.completedDate && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Completed On
                    </Typography>
                    <Typography variant="body1">
                      {new Date(selectedTask.completedDate).toLocaleString()}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setShowViewDialog(false); setSelectedTask(null); }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={showEditDialog} onClose={() => { setShowEditDialog(false); setSelectedTask(null); }} maxWidth="md" fullWidth>
        <DialogTitle>Edit Task</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Task Description"
                value={editTaskContent}
                onChange={(e) => setEditTaskContent(e.target.value)}
                disabled={submitting}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={editTaskPriority}
                  label="Priority"
                  onChange={(e) => setEditTaskPriority(e.target.value as any)}
                  disabled={submitting}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Autocomplete
                fullWidth
                options={users}
                getOptionLabel={(option) => option.displayName}
                value={editTaskAssignee}
                onChange={(event, newValue) => setEditTaskAssignee(newValue)}
                inputValue={editUserSearchInput}
                onInputChange={(event, newInputValue) => setEditUserSearchInput(newInputValue)}
                loading={userSearchLoading}
                disabled={submitting}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Assignee"
                    placeholder="Search users..."
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {userSearchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="date"
                label="Due Date"
                value={editTaskDueDate}
                onChange={(e) => setEditTaskDueDate(e.target.value)}
                disabled={submitting}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setShowEditDialog(false); setSelectedTask(null); setEditUserSearchInput(''); }} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveEditTask}
            disabled={!editTaskContent.trim() || submitting}
          >
            {submitting ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TasksList;
