import {
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Box,
  Chip,
  Tooltip,
  Badge,
  useTheme,
  Typography,
  Divider,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Notifications,
  AccountCircle,
  Menu as MenuIcon,
  Brightness4,
  Brightness7,
  CheckCircle,
  Info,
  Warning,
  Error as ErrorIcon,
  DoneAll,
} from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { logout } from '../../store/slices/authSlice';
import { useThemeMode } from '../../contexts/ThemeContext';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdDate: string;
}

interface HeaderProps {
  onMenuClick: () => void;
  sidebarOpen: boolean;
}

const Header = ({ onMenuClick, sidebarOpen }: HeaderProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { mode, toggleColorMode } = useThemeMode();
  const theme = useTheme();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(`${API_URL}/notifications`, config);
      setNotifications(response.data.data || []);
    } catch (error: any) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsAnchorEl(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchorEl(null);
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`${API_URL}/notifications/${notificationId}/read`, {}, config);
      await fetchNotifications();
    } catch (error: any) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`${API_URL}/notifications/read-all`, {}, config);
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    handleClose();
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle sx={{ color: 'success.main' }} />;
      case 'warning':
        return <Warning sx={{ color: 'warning.main' }} />;
      case 'error':
        return <ErrorIcon sx={{ color: 'error.main' }} />;
      default:
        return <Info sx={{ color: 'info.main' }} />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <AppBar
      position="static"
      color="default"
      elevation={0}
      sx={{
        backgroundColor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        backdropFilter: 'blur(8px)',
      }}
    >
      <Toolbar sx={{ gap: { xs: 1, sm: 2 }, minHeight: { xs: 56, sm: 64 } }}>
        <IconButton
          edge="start"
          onClick={onMenuClick}
          sx={{
            mr: { xs: 1, sm: 2 },
            color: 'text.primary',
          }}
        >
          <MenuIcon />
        </IconButton>

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
          <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
            <IconButton
              onClick={toggleColorMode}
              sx={{
                color: 'text.primary',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Notifications">
            <IconButton
              onClick={handleNotificationsOpen}
              sx={{
                color: 'text.primary',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <Badge badgeContent={unreadCount} color="error">
                <Notifications />
              </Badge>
            </IconButton>
          </Tooltip>

          <Tooltip title="Account">
            <IconButton
              onClick={handleMenu}
              sx={{
                p: 0.5,
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              {user?.firstName ? (
                <Avatar
                  sx={{
                    width: { xs: 32, sm: 38 },
                    height: { xs: 32, sm: 38 },
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    fontWeight: 600,
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                  }}
                >
                  {user.firstName[0]}
                  {user.lastName?.[0]}
                </Avatar>
              ) : (
                <AccountCircle sx={{ width: { xs: 32, sm: 38 }, height: { xs: 32, sm: 38 } }} />
              )}
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={notificationsAnchorEl}
            open={Boolean(notificationsAnchorEl)}
            onClose={handleNotificationsClose}
            PaperProps={{
              elevation: 3,
              sx: {
                mt: 1.5,
                minWidth: 360,
                maxWidth: 400,
                maxHeight: 500,
                borderRadius: 2,
              },
            }}
          >
            <Box
              sx={{
                px: 2,
                py: 1.5,
                borderBottom: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant="h6" fontWeight="bold">
                Notifications
              </Typography>
              {unreadCount > 0 && (
                <Tooltip title="Mark all as read">
                  <IconButton size="small" onClick={handleMarkAllAsRead}>
                    <DoneAll fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            {notifications.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No notifications
                </Typography>
              </Box>
            ) : (
              <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                {notifications.map((notification) => (
                  <MenuItem
                    key={notification.id}
                    onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                    sx={{
                      py: 1.5,
                      px: 2,
                      backgroundColor: notification.isRead ? 'transparent' : 'action.hover',
                      '&:hover': {
                        backgroundColor: notification.isRead ? 'action.hover' : 'action.selected',
                      },
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      display: 'block',
                      whiteSpace: 'normal',
                      cursor: notification.isRead ? 'default' : 'pointer',
                    }}
                  >
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                      <Box sx={{ mt: 0.5 }}>{getNotificationIcon(notification.type)}</Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={notification.isRead ? 400 : 600}>
                          {notification.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                          {formatTime(notification.createdDate)}
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Box>
            )}
          </Menu>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            PaperProps={{
              elevation: 3,
              sx: {
                mt: 1.5,
                minWidth: 200,
                borderRadius: 2,
                '& .MuiMenuItem-root': {
                  borderRadius: 1,
                  mx: 1,
                  my: 0.5,
                },
              },
            }}
          >
            <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ fontWeight: 600, mb: 0.5 }}>
                {user?.firstName} {user?.lastName}
              </Box>
              <Chip
                label={user?.role || 'User'}
                size="small"
                color="primary"
                sx={{ height: 20, fontSize: '0.7rem' }}
              />
            </Box>
            <MenuItem onClick={handleLogout} sx={{ mt: 1, color: 'error.main' }}>
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
