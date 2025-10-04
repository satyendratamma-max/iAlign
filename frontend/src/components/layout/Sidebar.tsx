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
  Collapse,
} from '@mui/material';
import {
  Dashboard,
  Folder,
  People,
  Storage,
  Speed,
  Assessment,
  Assignment,
  Timeline,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';

const drawerWidth = 260;

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
      { text: 'Domains', icon: <Folder />, path: '/domains' },
      { text: 'Portfolio Overview', icon: <Folder />, path: '/portfolio-overview' },
      { text: 'Projects', icon: <Folder />, path: '/projects' },
    ],
  },
  {
    title: 'Resources',
    items: [
      { text: 'Resource Overview', icon: <People />, path: '/resource-overview' },
      { text: 'Domain Teams', icon: <People />, path: '/resources' },
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
    title: 'Analytics',
    items: [
      { text: 'Analytics', icon: <Assessment />, path: '/analytics' },
    ],
  },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: '#1e293b',
          color: 'white',
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h5" fontWeight="bold" color="white">
          iAlign
        </Typography>
        <Typography variant="body2" color="rgba(255,255,255,0.7)">
          Resource Planning
        </Typography>
      </Box>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />
      <List sx={{ pt: 1 }}>
        {menuSections.map((section, sectionIndex) => (
          <Box key={section.title}>
            {section.title !== 'Main' && (
              <ListItem sx={{ pt: 2, pb: 0.5 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'rgba(255,255,255,0.5)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  {section.title}
                </Typography>
              </ListItem>
            )}
            {section.items.map((item) => (
              <ListItem key={item.path} disablePadding>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => navigate(item.path)}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(99, 102, 241, 0.2)',
                      '&:hover': {
                        backgroundColor: 'rgba(99, 102, 241, 0.3)',
                      },
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.08)',
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
            {sectionIndex < menuSections.length - 1 && section.title === 'Main' && (
              <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)', my: 1 }} />
            )}
          </Box>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;
