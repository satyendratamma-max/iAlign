import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Divider,
  useTheme,
  useMediaQuery,
  Tooltip,
} from '@mui/material';
import {
  Dashboard,
  Folder,
  People,
  Storage,
  Speed,
  Assignment,
  BusinessCenter,
  Groups,
  Timeline,
  HelpOutline,
  Info,
  AdminPanelSettings,
  ManageAccounts,
  Assessment,
  CloudSync,
  Schema,
  FindInPage,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../hooks/redux';

const drawerWidth = 260;
const miniDrawerWidth = 72;

const menuSections = [
  {
    title: 'Main',
    items: [
      { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    ],
  },
  {
    title: 'Portfolio',
    items: [
      { text: 'Domains', icon: <BusinessCenter />, path: '/domains' },
      { text: 'Portfolio Overview', icon: <Folder />, path: '/portfolio-overview' },
      { text: 'Projects', icon: <Assignment />, path: '/projects' },
      { text: 'Milestones', icon: <Timeline />, path: '/milestones' },
    ],
  },
  {
    title: 'Resources',
    items: [
      { text: 'Resource Overview', icon: <People />, path: '/resource-overview' },
      { text: 'Domain Teams', icon: <Groups />, path: '/resources' },
      { text: 'Allocation Matrix', icon: <Assignment />, path: '/resources/allocation' },
    ],
  },
  {
    title: 'Pipeline',
    items: [
      { text: 'Pipeline Overview', icon: <Storage />, path: '/pipeline-overview' },
    ],
  },
  {
    title: 'Capacity',
    items: [
      { text: 'Capacity Dashboard', icon: <Speed />, path: '/capacity-overview' },
    ],
  },
  {
    title: 'Support',
    items: [
      { text: 'Help', icon: <HelpOutline />, path: '/help' },
      { text: 'About', icon: <Info />, path: '/about' },
    ],
  },
];

const adminMenuSection = {
  title: 'Admin Tools',
  items: [
    { text: 'Access Provisioning', icon: <ManageAccounts />, path: '/admin/access-provisioning' },
    { text: 'Reports', icon: <Assessment />, path: '/admin/reports' },
    { text: 'Data Management', icon: <CloudSync />, path: '/admin/data-management' },
    { text: 'Data Lookup', icon: <FindInPage />, path: '/admin/data-lookup' },
    { text: 'Data Model', icon: <Schema />, path: '/admin/data-model' },
  ],
};

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const Sidebar = ({ open, onClose }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAppSelector((state) => state.auth);
  const isAdmin = user?.role === 'Administrator';

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      onClose();
    }
  };

  const drawerContent = (
    <>
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            color: 'white',
            fontSize: '1.2rem',
          }}
        >
          iA
        </Box>
        {open && (
          <Box>
            <Typography variant="h6" fontWeight="bold">
              iAlign
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              Resource Planning
            </Typography>
          </Box>
        )}
      </Box>
      <Divider sx={{ borderColor: 'divider', opacity: 0.1 }} />
      <List sx={{ pt: 1, px: 1 }}>
        {[...menuSections, ...(isAdmin ? [adminMenuSection] : [])].map((section, sectionIndex) => (
          <Box key={section.title}>
            {section.title !== 'Main' && open && (
              <ListItem sx={{ pt: 2, pb: 0.5, px: 2 }}>
                <Typography
                  variant="caption"
                  sx={{
                    opacity: 0.6,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontSize: '0.7rem',
                  }}
                >
                  {section.title}
                </Typography>
              </ListItem>
            )}
            {section.items.map((item) => (
              <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                <Tooltip title={!open ? item.text : ''} placement="right" arrow>
                  <ListItemButton
                    selected={location.pathname === item.path}
                    onClick={() => handleNavigation(item.path)}
                    sx={{
                      borderRadius: 2,
                      minHeight: 48,
                      justifyContent: open ? 'initial' : 'center',
                      px: 2,
                      '&.Mui-selected': {
                        backgroundColor: 'primary.main',
                        color: 'primary.contrastText',
                        '&:hover': {
                          backgroundColor: 'primary.dark',
                        },
                        '& .MuiListItemIcon-root': {
                          color: 'primary.contrastText',
                        },
                      },
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        mr: open ? 2 : 'auto',
                        justifyContent: 'center',
                        color: 'inherit',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    {open && (
                      <ListItemText
                        primary={item.text}
                        primaryTypographyProps={{
                          fontSize: '0.875rem',
                          fontWeight: 500,
                        }}
                      />
                    )}
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            ))}
            {sectionIndex < menuSections.length - 1 && section.title === 'Main' && open && (
              <Divider sx={{ borderColor: 'divider', opacity: 0.1, my: 1.5 }} />
            )}
          </Box>
        ))}
      </List>
    </>
  );

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'permanent'}
      open={isMobile ? open : true}
      onClose={onClose}
      sx={{
        width: open ? drawerWidth : miniDrawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: open ? drawerWidth : miniDrawerWidth,
          boxSizing: 'border-box',
          backgroundColor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider',
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          overflowX: 'hidden',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;
