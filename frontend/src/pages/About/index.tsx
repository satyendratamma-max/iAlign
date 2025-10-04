import {
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  CheckCircle,
  Speed,
  Security,
  CloudQueue,
  TrendingUp,
  Groups,
  Assessment,
} from '@mui/icons-material';

const About = () => {
  const features = [
    {
      icon: <Assessment />,
      title: 'Portfolio Management',
      description: 'Comprehensive portfolio and project tracking across domains',
    },
    {
      icon: <Groups />,
      title: 'Resource Planning',
      description: 'Efficient resource allocation and utilization management',
    },
    {
      icon: <TrendingUp />,
      title: 'Analytics & Insights',
      description: 'Real-time dashboards and performance metrics',
    },
    {
      icon: <Speed />,
      title: 'Capacity Planning',
      description: 'Strategic resource capacity and demand forecasting',
    },
    {
      icon: <CloudQueue />,
      title: 'Pipeline Management',
      description: 'Track project pipeline and prioritization',
    },
    {
      icon: <Security />,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security and data protection',
    },
  ];

  const techStack = [
    'React 18',
    'TypeScript',
    'Material-UI',
    'Node.js',
    'Express',
    'Sequelize ORM',
    'SQLite',
    'Redux Toolkit',
  ];

  const capabilities = [
    'Multi-domain portfolio management',
    'Resource allocation matrix',
    'Project milestone tracking',
    'Domain team organization',
    'Budget and cost tracking',
    'Health status monitoring',
    'Import/Export functionality',
    'Dark mode support',
    'Responsive design',
    'Real-time analytics',
  ];

  return (
    <Box>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Box
          sx={{
            width: 80,
            height: 80,
            margin: '0 auto 2rem',
            borderRadius: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.5rem',
            color: 'white',
            fontWeight: 'bold',
          }}
        >
          iA
        </Box>
        <Typography variant="h3" fontWeight="bold" gutterBottom>
          iAlign
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Intelligent Resource Planning & Portfolio Management
        </Typography>
        <Chip
          label="Version 1.0.0"
          color="primary"
          sx={{ mt: 2 }}
        />
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                About iAlign
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                iAlign is a comprehensive resource planning and portfolio management platform
                designed to help organizations optimize their resource allocation, track project
                milestones, and make data-driven decisions across multiple domains and portfolios.
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Built with modern technologies and best practices, iAlign provides intuitive
                interfaces for managing complex organizational structures, from domains and
                portfolios to individual resources and project milestones.
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Whether you're managing a small team or a large enterprise portfolio, iAlign
                adapts to your needs with flexible configuration, powerful analytics, and
                seamless data import/export capabilities.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Key Features
          </Typography>
        </Grid>
        {features.map((feature, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card
              sx={{
                height: '100%',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: 2,
                    bgcolor: 'primary.lighter',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                    color: 'primary.main',
                  }}
                >
                  {feature.icon}
                </Box>
                <Typography variant="h6" fontWeight="600" gutterBottom>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Capabilities
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <List dense>
                {capabilities.map((capability, index) => (
                  <ListItem key={index}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <CheckCircle color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={capability} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Technology Stack
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                {techStack.map((tech, index) => (
                  <Chip
                    key={index}
                    label={tech}
                    variant="outlined"
                    color="primary"
                    sx={{ fontWeight: 500 }}
                  />
                ))}
              </Box>
              <Box sx={{ mt: 4 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Frontend:</strong> React with TypeScript, Material-UI for modern,
                  responsive interfaces
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Backend:</strong> Node.js with Express for robust API services
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Database:</strong> SQLite with Sequelize ORM for flexible data
                  management
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Built for Modern Organizations
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: 600, mx: 'auto' }}>
                iAlign combines powerful features with an intuitive interface to help your
                organization achieve better resource utilization, improved project visibility,
                and data-driven decision making.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" align="center">
                © 2025 iAlign. All rights reserved. | Version 1.0.0
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default About;
