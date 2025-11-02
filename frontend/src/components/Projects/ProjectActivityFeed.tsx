import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Avatar,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Divider,
  Stack,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import {
  Send as SendIcon,
  PushPin as PinIcon,
  PushPinOutlined as UnpinIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Comment as CommentIcon,
  SwapHoriz as StatusChangeIcon,
  Edit as FieldUpdateIcon,
  Flag as MilestoneIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import {
  getProjectActivities,
  createActivity,
  updateActivity,
  deleteActivity,
  togglePinActivity,
  ProjectActivity,
} from '../../services/activityService';

interface ProjectActivityFeedProps {
  projectId: number;
}

const ProjectActivityFeed: React.FC<ProjectActivityFeedProps> = ({ projectId }) => {
  const [activities, setActivities] = useState<ProjectActivity[]>([]);
  const [pinnedActivities, setPinnedActivities] = useState<ProjectActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedActivity, setSelectedActivity] = useState<ProjectActivity | null>(null);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    loadActivities();
  }, [projectId]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProjectActivities(projectId);
      setActivities(data.activities);
      setPinnedActivities(data.pinned);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    try {
      setSubmitting(true);
      await createActivity(projectId, {
        activityType: 'comment',
        content: newComment.trim(),
      });
      setNewComment('');
      await loadActivities();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditActivity = async (activityId: number) => {
    if (!editContent.trim()) return;

    try {
      await updateActivity(activityId, { content: editContent.trim() });
      setEditingId(null);
      setEditContent('');
      await loadActivities();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update activity');
    }
  };

  const handleDeleteActivity = async (activityId: number) => {
    if (!window.confirm('Are you sure you want to delete this activity?')) return;

    try {
      await deleteActivity(activityId);
      await loadActivities();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete activity');
    }
  };

  const handleTogglePin = async (activityId: number) => {
    try {
      await togglePinActivity(activityId);
      await loadActivities();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to pin/unpin activity');
    }
    handleCloseMenu();
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, activity: ProjectActivity) => {
    setAnchorEl(event.currentTarget);
    setSelectedActivity(activity);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedActivity(null);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'comment':
        return <CommentIcon fontSize="small" />;
      case 'status_change':
        return <StatusChangeIcon fontSize="small" />;
      case 'field_update':
        return <FieldUpdateIcon fontSize="small" />;
      case 'milestone':
        return <MilestoneIcon fontSize="small" />;
      default:
        return <CommentIcon fontSize="small" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'comment':
        return 'primary';
      case 'status_change':
        return 'success';
      case 'field_update':
        return 'info';
      case 'milestone':
        return 'warning';
      default:
        return 'default';
    }
  };

  const renderActivityContent = (activity: ProjectActivity) => {
    if (activity.activityType === 'comment') {
      return (
        <Typography variant="body2" sx={{ mt: 1 }}>
          {activity.content}
        </Typography>
      );
    }

    if (activity.activityType === 'status_change' && activity.changes) {
      const changes = typeof activity.changes === 'string' ? JSON.parse(activity.changes) : activity.changes;
      return (
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2">
            Status changed from{' '}
            <Chip label={changes.oldValue} size="small" sx={{ mx: 0.5 }} /> to{' '}
            <Chip label={changes.newValue} size="small" color="success" sx={{ mx: 0.5 }} />
          </Typography>
        </Box>
      );
    }

    if (activity.activityType === 'field_update' && activity.changes) {
      const changes = typeof activity.changes === 'string' ? JSON.parse(activity.changes) : activity.changes;
      return (
        <Box sx={{ mt: 1 }}>
          {changes.changes?.map((change: any, index: number) => (
            <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
              <strong>{change.field}</strong> changed from{' '}
              <Chip label={String(change.oldValue)} size="small" sx={{ mx: 0.5 }} /> to{' '}
              <Chip label={String(change.newValue)} size="small" color="info" sx={{ mx: 0.5 }} />
            </Typography>
          ))}
        </Box>
      );
    }

    return null;
  };

  const renderActivity = (activity: ProjectActivity, isPinned: boolean = false) => {
    const isEditing = editingId === activity.id;
    const canEdit = activity.userId === currentUser.id && activity.activityType === 'comment';

    return (
      <Card
        key={activity.id}
        sx={{
          mb: 2,
          bgcolor: isPinned ? 'action.hover' : 'background.paper',
          border: isPinned ? '1px solid' : undefined,
          borderColor: isPinned ? 'primary.main' : undefined,
        }}
      >
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              {activity.author?.firstName?.[0] || '?'}
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="subtitle2">
                    {activity.author
                      ? `${activity.author.firstName} ${activity.author.lastName}`
                      : 'System'}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                      icon={getActivityIcon(activity.activityType)}
                      label={activity.activityType.replace('_', ' ')}
                      size="small"
                      color={getActivityColor(activity.activityType) as any}
                      sx={{ textTransform: 'capitalize' }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {formatDistanceToNow(new Date(activity.createdDate), { addSuffix: true })}
                    </Typography>
                    {activity.isEdited && (
                      <Typography variant="caption" color="text.secondary">
                        (edited)
                      </Typography>
                    )}
                    {isPinned && (
                      <Chip icon={<PinIcon />} label="Pinned" size="small" color="primary" />
                    )}
                  </Stack>
                </Box>
                <IconButton size="small" onClick={(e) => handleMenuClick(e, activity)}>
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Stack>

              {isEditing ? (
                <Box sx={{ mt: 2 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    variant="outlined"
                    size="small"
                  />
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => handleEditActivity(activity.id)}
                    >
                      Save
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        setEditingId(null);
                        setEditContent('');
                      }}
                    >
                      Cancel
                    </Button>
                  </Stack>
                </Box>
              ) : (
                renderActivityContent(activity)
              )}
            </Box>
          </Stack>
        </CardContent>
      </Card>
    );
  };

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

      {/* Comment Input */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Add Comment
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            variant="outlined"
            disabled={submitting}
          />
          <Button
            variant="contained"
            endIcon={<SendIcon />}
            onClick={handleSubmitComment}
            disabled={!newComment.trim() || submitting}
            sx={{ mt: 1 }}
          >
            {submitting ? 'Posting...' : 'Post Comment'}
          </Button>
        </CardContent>
      </Card>

      {/* Pinned Activities */}
      {pinnedActivities.length > 0 && (
        <>
          <Typography variant="h6" gutterBottom>
            Pinned Activities
          </Typography>
          {pinnedActivities.map((activity) => renderActivity(activity, true))}
          <Divider sx={{ my: 3 }} />
        </>
      )}

      {/* Activity Feed */}
      <Typography variant="h6" gutterBottom>
        Activity Feed
      </Typography>
      {activities.length === 0 ? (
        <Alert severity="info">No activities yet. Be the first to comment!</Alert>
      ) : (
        activities.map((activity) => renderActivity(activity))
      )}

      {/* Context Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseMenu}>
        <MenuItem onClick={() => selectedActivity && handleTogglePin(selectedActivity.id)}>
          {selectedActivity?.isPinned ? (
            <>
              <UnpinIcon fontSize="small" sx={{ mr: 1 }} />
              Unpin
            </>
          ) : (
            <>
              <PinIcon fontSize="small" sx={{ mr: 1 }} />
              Pin
            </>
          )}
        </MenuItem>
        {selectedActivity?.userId === currentUser.id &&
          selectedActivity?.activityType === 'comment' && (
            <>
              <MenuItem
                onClick={() => {
                  if (selectedActivity) {
                    setEditingId(selectedActivity.id);
                    setEditContent(selectedActivity.content || '');
                  }
                  handleCloseMenu();
                }}
              >
                <EditIcon fontSize="small" sx={{ mr: 1 }} />
                Edit
              </MenuItem>
              <MenuItem
                onClick={() => {
                  if (selectedActivity) {
                    handleDeleteActivity(selectedActivity.id);
                  }
                }}
              >
                <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                Delete
              </MenuItem>
            </>
          )}
      </Menu>
    </Box>
  );
};

export default ProjectActivityFeed;
