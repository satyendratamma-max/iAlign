import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import passport from './config/passport';
import swaggerSpec from './config/swagger';
import logger from './config/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Import models to set up associations
import './models';

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import adminRoutes from './routes/admin.routes';
import notificationRoutes from './routes/notification.routes';
import segmentFunctionRoutes from './routes/segmentFunction.routes';
import projectRoutes from './routes/project.routes';
import domainRoutes from './routes/domain.routes';
import resourceRoutes from './routes/resource.routes';
import skillRoutes from './routes/skill.routes';
import platformRoutes from './routes/platform.routes';
import instanceRoutes from './routes/instance.routes';
import capacityRequestRoutes from './routes/capacityRequest.routes';
import reservationRoutes from './routes/reservation.routes';
import capacityPlanRoutes from './routes/capacityPlan.routes';
import scenarioRoutes from './routes/scenario.routes';
import recommendationRoutes from './routes/recommendation.routes';
import analyticsRoutes from './routes/analytics.routes';
import milestoneRoutes from './routes/milestone.routes';
import allocationRoutes from './routes/allocation.routes';
// import pipelineRoutes from './routes/pipeline.routes'; // Temporarily disabled
import capacityRoutes from './routes/capacity.routes';
import appRoutes from './routes/app.routes';
import technologyRoutes from './routes/technology.routes';
import roleRoutes from './routes/role.routes';
import resourceCapabilityRoutes from './routes/resourceCapability.routes';
import projectRequirementRoutes from './routes/projectRequirement.routes';
import projectDomainImpactRoutes from './routes/projectDomainImpact.routes';
import projectDependencyRoutes from './routes/projectDependency.routes';
import projectActivityRoutes from './routes/projectActivity.routes';
import defaultRequirementRoutes from './routes/defaultRequirement.routes';

const app: Application = express();

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://surfacepro:3000',
  'http://SurfacePro:3000',
  'http://surfacepro:5173',
  'http://SurfacePro:5173',
];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting (disabled in development for better DX)
if (process.env.NODE_ENV !== 'development') {
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: 'Too many requests from this IP, please try again later.',
  });
  app.use('/api', limiter);
}

// Passport initialization
app.use(passport.initialize());

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
const API_VERSION = process.env.API_VERSION || 'v1';

app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/users`, userRoutes);
app.use(`/api/${API_VERSION}/admin`, adminRoutes);
app.use(`/api/${API_VERSION}/notifications`, notificationRoutes);
app.use(`/api/${API_VERSION}/segment-functions`, segmentFunctionRoutes);
app.use(`/api/${API_VERSION}/projects`, projectRoutes);
app.use(`/api/${API_VERSION}/domains`, domainRoutes);
app.use(`/api/${API_VERSION}/resources`, resourceRoutes);
app.use(`/api/${API_VERSION}/skills`, skillRoutes);
app.use(`/api/${API_VERSION}/platforms`, platformRoutes);
app.use(`/api/${API_VERSION}/instances`, instanceRoutes);
app.use(`/api/${API_VERSION}/capacity-requests`, capacityRequestRoutes);
app.use(`/api/${API_VERSION}/reservations`, reservationRoutes);
app.use(`/api/${API_VERSION}/capacity-plans`, capacityPlanRoutes);
app.use(`/api/${API_VERSION}/scenarios`, scenarioRoutes);
app.use(`/api/${API_VERSION}/recommendations`, recommendationRoutes);
app.use(`/api/${API_VERSION}/analytics`, analyticsRoutes);
app.use(`/api/${API_VERSION}/milestones`, milestoneRoutes);
app.use(`/api/${API_VERSION}/allocations`, allocationRoutes);
// app.use(`/api/${API_VERSION}/pipelines`, pipelineRoutes); // Temporarily disabled
app.use(`/api/${API_VERSION}/capacity`, capacityRoutes);
app.use(`/api/${API_VERSION}/apps`, appRoutes);
app.use(`/api/${API_VERSION}/technologies`, technologyRoutes);
app.use(`/api/${API_VERSION}/roles`, roleRoutes);
app.use(`/api/${API_VERSION}/resource-capabilities`, resourceCapabilityRoutes);
app.use(`/api/${API_VERSION}/project-requirements`, projectRequirementRoutes);
app.use(`/api/${API_VERSION}/project-domain-impacts`, projectDomainImpactRoutes);
app.use(`/api/${API_VERSION}/project-dependencies`, projectDependencyRoutes);
app.use(`/api/${API_VERSION}`, projectActivityRoutes); // ProjectActivity routes include /projects/:id/activities
app.use(`/api/${API_VERSION}/default-requirements`, defaultRequirementRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

logger.info('Express application configured successfully');

export default app;
