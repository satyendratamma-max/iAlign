# iAlign - Enterprise Resource Capacity Planning Platform

A comprehensive enterprise resource planning solution for IT portfolio management, resource allocation, pipeline management, and capacity planning with AI-powered insights.

## 🚀 Features

### Core Capabilities
- **Portfolio Management**: Strategic IT project portfolio governance and tracking
- **Resource Management**: Domain-based resource organization with skills management
- **Pipeline Management**: Multi-platform infrastructure capacity management
- **Capacity Planning**: AI-powered forecasting and scenario modeling
- **AI Insights**: Context-aware recommendations and optimization

### Scenario Planning
- **Multiple Scenario Support**: Create and manage multiple planning scenarios
- **Scenario Cloning**: Duplicate scenarios for what-if analysis
- **Published vs Planned**: Separate draft and approved scenarios
- **Scenario Limits**: User-level limits with admin overrides

### Resource Allocation
- **Smart Matching**: AI-powered resource-to-project matching with match scores
- **Dynamic Match Score**: Real-time calculation based on skills, experience, and proficiency
- **Capability Management**: Track resource skills, proficiency levels, and experience
- **Requirement Matching**: Align resources with project requirements
- **Allocation Tracking**: Monitor resource utilization and over-allocation

### Project Management
- **Multiple Views**: List, Gantt, and Kanban views
- **Milestone Tracking**: Project phases with dependencies
- **Requirement Management**: Define and track project skill requirements
- **Resource Visibility**: View allocated resources per project
- **Dependency Management**: Track project and milestone dependencies

### Admin Tools
- **User Management**: Role-based access control and provisioning
- **Data Management**: Database operations and bulk imports
- **Reports**: User activity, resource allocation, and analytics
- **Data Lookup**: Reference tables for IDs and relationships

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- React 18+ with TypeScript
- Material-UI (MUI) for components
- Redux Toolkit for state management
- Recharts for data visualization
- React Router v6 for navigation

**Backend:**
- Node.js 18+ with Express.js
- TypeScript
- Sequelize ORM with MS SQL Server
- JWT authentication with Passport.js
- Swagger for API documentation

**Database:**
- Microsoft SQL Server 2019/2022

**DevOps:**
- Docker & Docker Compose
- GitHub Actions for CI/CD
- Jest for testing

## 📋 Prerequisites

- Node.js 18+ LTS
- Docker & Docker Compose
- MS SQL Server 2019/2022 (or use Docker)
- npm or yarn

## 🛠️ Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd iAlign
```

### 2. Environment Setup

```bash
# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### 3. Using Docker (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Docs: http://localhost:5000/api-docs

### 4. Manual Setup

#### Backend Setup

```bash
cd backend
npm install
npm run build
npm run migrate  # Run database migrations
npm run seed     # Seed initial data
npm run dev      # Start development server
```

#### Frontend Setup

```bash
cd frontend
npm install
npm start        # Start development server
```

## 📁 Project Structure

```
iAlign/
├── backend/                 # Node.js Express API
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Route controllers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Express middleware
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utility functions
│   └── tests/              # Backend tests
│
├── frontend/                # React application
│   ├── public/
│   └── src/
│       ├── components/     # React components
│       ├── pages/          # Page components
│       ├── services/       # API services
│       ├── store/          # Redux store
│       ├── hooks/          # Custom hooks
│       └── types/          # TypeScript types
│
├── database/                # Database scripts
│   ├── migrations/         # Schema migrations
│   ├── seeders/           # Seed data
│   └── init/              # Initial setup
│
├── shared/                  # Shared code
│   └── types/             # Shared TypeScript types
│
└── docker-compose.yml      # Docker configuration
```

## 🔧 Development

### Running Tests

```bash
# Backend tests
cd backend
npm test
npm run test:coverage

# Frontend tests
cd frontend
npm test
npm run test:coverage
```

### Database Migrations

```bash
cd backend

# Create new migration
npm run migration:create -- --name create-users-table

# Run migrations
npm run migrate

# Undo last migration
npm run migrate:undo
```

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run type-check
```

## 🔐 Authentication

The application supports:
- JWT-based authentication
- Active Directory integration (optional)
- Role-based access control (RBAC)

### User Roles

- **Administrator**: Full system access
- **Portfolio Manager**: Portfolio governance
- **Resource Manager**: Resource allocation
- **Pipeline Manager**: Infrastructure management
- **Capacity Planner**: Capacity planning
- **Analyst**: Data analysis and reporting
- **User**: Basic access

## 📊 API Documentation

API documentation is available at `/api-docs` when the backend server is running.

### Main Endpoints

- `/api/v1/auth/*` - Authentication
- `/api/v1/portfolios/*` - Portfolio management
- `/api/v1/projects/*` - Project management
- `/api/v1/resources/*` - Resource management
- `/api/v1/teams/*` - Team management
- `/api/v1/instances/*` - Pipeline management
- `/api/v1/capacity-plans/*` - Capacity planning
- `/api/v1/recommendations/*` - AI recommendations

## 🚢 Deployment

### Production Build

```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
# Serve build folder with nginx or serve
```

### Docker Production

```bash
# Build and run for production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Environment Variables

Ensure all production environment variables are set:
- Set strong `JWT_SECRET`
- Configure production database credentials
- Set `NODE_ENV=production`
- Configure CORS for production domain

## 🧪 Testing Strategy

- **Unit Tests**: Jest + React Testing Library
- **Integration Tests**: Supertest (Backend), React Testing Library (Frontend)
- **E2E Tests**: Cypress (optional)
- **Coverage Target**: 80%+

## 📈 Monitoring & Logging

- Application logs: Winston/Pino
- Error tracking: Sentry (optional)
- Performance monitoring: Application Insights (optional)
- Database monitoring: SQL Server Management Studio

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👥 Team

- Enterprise Architecture Team
- Development Team
- Product Management

## 📞 Support

For support, email: support@ialign.com

## 🗺️ Roadmap

- [x] Phase 1: Foundation & Authentication
- [x] Phase 2: Portfolio Management
- [x] Phase 3: Resource Management
- [x] Phase 4: Pipeline Management
- [x] Phase 5: Capacity Management
- [x] Phase 6: AI & Analytics
- [ ] Phase 7: Mobile App (iOS/Android)
- [ ] Phase 8: Advanced ML Models
- [ ] Phase 9: Multi-tenant Support

## 📚 Documentation

- [Frequently Asked Questions (FAQ)](./FAQ.md) - **Start here for common questions!**
- [Requirements Documentation](./REQUIREMENTS.md)
- [Implementation Plan](./IMPLEMENTATION_PLAN.md)
- [API Documentation](http://localhost:5000/api-docs)
- [Database Schema](./database/schema.md)

---

**Version**: 1.0.0
**Last Updated**: October 2024
