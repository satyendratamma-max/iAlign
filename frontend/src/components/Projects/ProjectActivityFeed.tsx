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
  Tabs,
  Tab,
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
  Assignment as TaskIcon,
  Reply as ReplyIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import {
  getProjectActivities,
  createActivity,
  updateActivity,
  deleteActivity,
  togglePinActivity,
  ProjectActivity,
  searchUsers,
} from '../../services/activityService';
import MentionInput from './MentionInput';
import TasksList from './TasksList';

interface ProjectActivityFeedProps {
  projectId: number;
}

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
      id={`activity-tabpanel-${index}`}
      aria-labelledby={`activity-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const ProjectActivityFeed: React.FC<ProjectActivityFeedProps> = ({ projectId }) => {
  const [tabValue, setTabValue] = useState(0);
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
  const [replyToId, setReplyToId] = useState<number | null>(null);
  const [replyToUser, setReplyToUser] = useState<{ id: number; name: string } | null>(null);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

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

  const handleReply = (activity: ProjectActivity) => {
    if (activity.author) {
      const userName = `${activity.author.firstName} ${activity.author.lastName}`;
      setReplyToId(activity.id);
      setReplyToUser({ id: activity.author.id, name: userName });
      // Pre-fill with @mention
      setNewComment(`@[${userName}](${activity.author.id}) `);
      // Focus on input (scroll to it)
      document.getElementById('comment-input')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      document.getElementById('comment-input')?.focus();
    }
  };

  const handleCancelReply = () => {
    setReplyToId(null);
    setReplyToUser(null);
    setNewComment('');
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    try {
      setSubmitting(true);
      await createActivity(projectId, {
        activityType: 'comment',
        content: newComment.trim(),
        parentActivityId: replyToId || undefined, // Set parent if replying
      });
      setNewComment('');
      setReplyToId(null);
      setReplyToUser(null);
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

  /**
   * Render content with highlighted mentions
   */
  const renderContentWithMentions = (content: string) => {
    // Regex to match @[User Name](userId)
    const mentionRegex = /@\[([^\]]+)\]\((\d+)\)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      // Add text before the mention
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }

      // Add the mention as a chip
      const displayName = match[1];
      const userId = match[2];
      parts.push(
        <Chip
          key={`mention-${userId}-${match.index}`}
          label={`@${displayName}`}
          size="small"
          color="primary"
          variant="outlined"
          sx={{ mx: 0.5, height: 20, fontSize: '0.75rem' }}
        />
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return parts.length > 0 ? parts : content;
  };

  const renderActivityContent = (activity: ProjectActivity) => {
    if (activity.activityType === 'comment') {
      return (
        <Typography variant="body2" sx={{ mt: 1 }} component="div">
          {renderContentWithMentions(activity.content || '')}
        </Typography>
      );
    }

    if (activity.activityType === 'status_change' && activity.changes) {
      const changes = typeof activity.changes === 'string' ? JSON.parse(activity.changes) : activity.changes;
      return (
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2" component="div">
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
            <Typography key={index} variant="body2" component="div" sx={{ mb: 0.5 }}>
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

  const renderActivity = (activity: ProjectActivity, isPinned: boolean = false, depth: number = 0) => {
    const isEditing = editingId === activity.id;
    const canEdit = activity.userId === currentUser.id && activity.activityType === 'comment';
    const isReply = depth > 0;
    const maxDepthReached = depth >= 3; // Max 3 levels of replies

    return (
      <Box key={activity.id}>
        <Card
          sx={{
            mb: 2,
            ml: depth * 6, // Progressive indentation based on depth (0, 6, 12, 18)
            bgcolor: isPinned ? 'action.hover' : 'background.paper',
            border: isPinned ? '1px solid' : undefined,
            borderColor: isPinned ? 'primary.main' : undefined,
            borderLeft: isReply ? '3px solid' : undefined,
            borderLeftColor: isReply ? 'primary.light' : undefined,
          }}
        >
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="flex-start">
              <Avatar sx={{ bgcolor: 'primary.main', width: isReply ? 32 : 40, height: isReply ? 32 : 40 }}>
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
                    <MentionInput
                      value={editContent}
                      onChange={setEditContent}
                      placeholder="Edit comment..."
                      disabled={false}
                      rows={3}
                      onSearchUsers={searchUsers}
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
                  <>
                    {renderActivityContent(activity)}
                    {activity.activityType === 'comment' && !maxDepthReached && (
                      <Box sx={{ mt: 1 }}>
                        <Button
                          size="small"
                          startIcon={<ReplyIcon />}
                          onClick={() => handleReply(activity)}
                          sx={{ textTransform: 'none' }}
                        >
                          Reply
                        </Button>
                      </Box>
                    )}
                  </>
                )}
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Render replies with indentation (max 3 levels) */}
        {activity.replies && activity.replies.length > 0 && (
          <Box>
            {activity.replies.map((reply) => renderActivity(reply, false, depth + 1))}
          </Box>
        )}
      </Box>
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

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="activity tabs">
          <Tab icon={<CommentIcon />} iconPosition="start" label="Activity" />
          <Tab icon={<TaskIcon />} iconPosition="start" label="Tasks" />
        </Tabs>
      </Box>

      {/* Activity Tab */}
      <TabPanel value={tabValue} index={0}>
        {/* Comment Input */}
        <Card sx={{ mb: 3 }} id="comment-input">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Add Comment
            </Typography>
            {replyToUser && (
              <Alert
                severity="info"
                sx={{ mb: 2 }}
                action={
                  <Button color="inherit" size="small" onClick={handleCancelReply}>
                    Cancel
                  </Button>
                }
              >
                Replying to <strong>{replyToUser.name}</strong>
              </Alert>
            )}
            <MentionInput
              value={newComment}
              onChange={setNewComment}
              placeholder="Write a comment... (Type @ to mention someone)"
              disabled={submitting}
              rows={3}
              onSearchUsers={searchUsers}
            />
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Button
                variant="contained"
                endIcon={<SendIcon />}
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || submitting}
              >
                {submitting ? 'Posting...' : 'Post Comment'}
              </Button>
              {replyToUser && (
                <Button
                  variant="outlined"
                  onClick={handleCancelReply}
                >
                  Cancel Reply
                </Button>
              )}
            </Stack>
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
      </TabPanel>

      {/* Tasks Tab */}
      <TabPanel value={tabValue} index={1}>
        <TasksList projectId={projectId} />
      </TabPanel>

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
