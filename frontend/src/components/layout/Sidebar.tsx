import { useState, useEffect } from 'react';
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
  Collapse,
  IconButton,
} from '@mui/material';
import {
  Dashboard,
  Folder,
  People,
  Storage,
  Speed,
  Assignment,
  BusinessCenter,
  Timeline,
  HelpOutline,
  Info,
  ManageAccounts,
  Assessment,
  CloudSync,
  Schema,
  FindInPage,
  Apps,
  Extension,
  WorkOutline,
  Layers,
  ExpandMore,
  ChevronRight,
  Person,
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
      { text: 'My Dashboard', icon: <Person />, path: '/my-dashboard' },
    ],
  },
  {
    title: 'Projects',
    items: [
      { text: 'Domains', icon: <BusinessCenter />, path: '/domains' },
      { text: 'Segment Functions', icon: <Folder />, path: '/portfolio-overview' },
      { text: 'Projects', icon: <Assignment />, path: '/projects' },
      { text: 'Milestones', icon: <Timeline />, path: '/milestones' },
    ],
  },
  {
    title: 'Resources',
    items: [
      { text: 'Resources', icon: <People />, path: '/resource-overview' },
      { text: 'Allocations', icon: <Assignment />, path: '/resources/allocation' },
    ],
  },
  // {
  //   title: 'Pipeline',
  //   items: [
  //     { text: 'Pipeline Overview', icon: <Storage />, path: '/pipeline-overview' },
  //   ],
  // },
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
    { text: 'Apps', icon: <Apps />, path: '/admin/apps' },
    { text: 'Technologies', icon: <Extension />, path: '/admin/technologies' },
    { text: 'Roles', icon: <WorkOutline />, path: '/admin/roles' },
    { text: 'Scenarios', icon: <Layers />, path: '/admin/scenarios' },
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

  // Helper function to find which section contains the current path
  const findSectionForPath = (path: string, sections: typeof menuSections) => {
    for (const section of sections) {
      if (section.items.some(item => item.path === path)) {
        return section.title;
      }
    }
    return null;
  };

  // Initialize collapsed state: collapse all except the section containing current route
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
    const allSections = [...menuSections, ...(isAdmin ? [adminMenuSection] : [])];
    const activeSection = findSectionForPath(location.pathname, allSections);

    // Create initial state with all sections collapsed except active one
    const initialState: Record<string, boolean> = {};
    allSections.forEach(section => {
      // Always keep 'Main' expanded, and expand the section with active route
      initialState[section.title] = section.title !== 'Main' && section.title !== activeSection;
    });

    return initialState;
  });

  // Auto-expand/collapse sections based on navigation
  useEffect(() => {
    const allSections = [...menuSections, ...(isAdmin ? [adminMenuSection] : [])];
    const activeSection = findSectionForPath(location.pathname, allSections);

    if (activeSection) {
      setCollapsedSections(prev => {
        const newState = { ...prev };

        // Collapse all sections except 'Main' and the active section
        allSections.forEach(section => {
          if (section.title !== 'Main') {
            newState[section.title] = section.title !== activeSection;
          }
        });

        return newState;
      });
    }
  }, [location.pathname, isAdmin]);

  const toggleSection = (sectionTitle: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle]
    }));
  };

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
        {[...menuSections, ...(isAdmin ? [adminMenuSection] : [])].map((section, sectionIndex) => {
          const isCollapsed = collapsedSections[section.title] || false;

          return (
            <Box key={section.title}>
              {section.title !== 'Main' && open && (
                <ListItem
                  sx={{
                    pt: 2,
                    pb: 0.5,
                    px: 1,
                    cursor: 'pointer',
                    borderRadius: 1,
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                  onClick={() => toggleSection(section.title)}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      opacity: 0.6,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      fontSize: '0.7rem',
                      flex: 1,
                    }}
                  >
                    {section.title}
                  </Typography>
                  <IconButton
                    size="small"
                    sx={{
                      p: 0.5,
                      opacity: 0.6,
                      '&:hover': {
                        backgroundColor: 'transparent',
                      },
                    }}
                  >
                    {isCollapsed ? <ChevronRight fontSize="small" /> : <ExpandMore fontSize="small" />}
                  </IconButton>
                </ListItem>
              )}
              <Collapse in={!open || !isCollapsed || section.title === 'Main'} timeout="auto" unmountOnExit>
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
              </Collapse>
              {sectionIndex < menuSections.length - 1 && section.title === 'Main' && open && (
                <Divider sx={{ borderColor: 'divider', opacity: 0.1, my: 1.5 }} />
              )}
            </Box>
          );
        })}
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
