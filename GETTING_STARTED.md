# iAlign - Getting Started Guide

## 🚀 Quick Start

### Prerequisites

Ensure you have the following installed:
- Node.js 18+ LTS
- npm or yarn
- Docker & Docker Compose (recommended)
- MS SQL Server 2019/2022 (or use Docker)

### Option 1: Docker Setup (Recommended)

The fastest way to get started is using Docker:

```bash
# 1. Clone and navigate to project
cd iAlign

# 2. Copy environment variables
cp .env.example .env

# 3. Start all services
docker-compose up -d

# 4. View logs
docker-compose logs -f
```

**Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Docs: http://localhost:5000/api-docs
- Health Check: http://localhost:5000/health

### Option 2: Manual Setup

#### Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Copy environment variables
cp ../.env.example .env

# Update database credentials in .env
# DB_HOST=localhost
# DB_PASSWORD=your_password

# Run database migrations (optional)
npm run migrate

# Start development server
npm run dev
```

Backend will run on: http://localhost:5000

#### Frontend Setup

```bash
# Navigate to frontend (in new terminal)
cd frontend

# Install dependencies
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:5000/api/v1" > .env

# Start development server
npm run dev
```

Frontend will run on: http://localhost:3000

### Database Setup

#### Using Docker (Included in docker-compose.yml)
SQL Server container is automatically configured and will be available at `localhost:1433`

#### Manual SQL Server Setup

```sql
-- Create database
CREATE DATABASE iAlign;
GO

-- Create login (if needed)
CREATE LOGIN ialignuser WITH PASSWORD = 'YourPassword123!';
GO

-- Create user and grant permissions
USE iAlign;
CREATE USER ialignuser FOR LOGIN ialignuser;
ALTER ROLE db_owner ADD MEMBER ialignuser;
GO
```

Update `.env` with your database credentials:
```
DB_HOST=localhost
DB_PORT=1433
DB_NAME=iAlign
DB_USER=ialignuser
DB_PASSWORD=YourPassword123!
```

## 📦 Project Structure

```
iAlign/
├── backend/                 # Node.js + Express + TypeScript API
│   ├── src/
│   │   ├── config/         # Database, passport, logger, swagger
│   │   ├── controllers/    # Request handlers
│   │   ├── models/         # Sequelize models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Auth, validation, error handling
│   │   ├── services/       # Business logic
│   │   ├── app.ts          # Express app setup
│   │   └── server.ts       # Server entry point
│   └── package.json
│
├── frontend/                # React + TypeScript + MUI
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── store/          # Redux store
│   │   ├── hooks/          # Custom hooks
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
│
├── database/                # Database scripts
├── shared/                  # Shared types
├── docker-compose.yml       # Docker configuration
└── .env.example            # Environment template
```

## 🔑 Default Credentials

For development, you can create a test user:

```bash
# Using the API
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@ialign.com",
    "password": "Admin@123",
    "firstName": "Admin",
    "lastName": "User",
    "role": "Administrator"
  }'
```

Then login with:
- Email: `admin@ialign.com`
- Password: `Admin@123`

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
npm run test:coverage
```

### Frontend Tests
```bash
cd frontend
npm test
npm run test:coverage
```

## 🔧 Development Commands

### Backend
```bash
npm run dev          # Start dev server with hot reload
npm run build        # Build TypeScript
npm start            # Start production server
npm run lint         # Lint code
npm run format       # Format code
```

### Frontend
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Lint code
```

### Docker
```bash
docker-compose up -d              # Start all services
docker-compose down               # Stop all services
docker-compose logs -f            # View logs
docker-compose restart backend    # Restart backend
docker-compose exec backend sh    # Access backend shell
```

## 📝 API Documentation

Once the backend is running, visit:
- Swagger UI: http://localhost:5000/api-docs
- Health Check: http://localhost:5000/health

### Sample API Calls

**Register User:**
```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Login:**
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Get Projects (requires auth):**
```bash
GET /api/v1/projects
Authorization: Bearer <your-token>
```

## 🔒 Security Notes

### Development
- JWT secret is set in `.env` - change for production
- CORS is configured for localhost:3000
- Database password is in `.env` - never commit this file

### Production Checklist
- [ ] Change JWT_SECRET to a strong random value
- [ ] Update CORS_ORIGIN to your production domain
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS/TLS
- [ ] Set NODE_ENV=production
- [ ] Configure proper database credentials
- [ ] Set up database backups
- [ ] Enable rate limiting
- [ ] Configure monitoring and logging

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if port 5000 is in use
lsof -i :5000

# Check database connection
docker-compose logs sqlserver
```

### Frontend won't connect to backend
```bash
# Verify backend is running
curl http://localhost:5000/health

# Check VITE_API_URL in frontend/.env
cat frontend/.env
```

### Database connection errors
```bash
# Check SQL Server is running
docker-compose ps

# Test database connection
docker-compose exec sqlserver /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P 'iAlign@2024!' -Q "SELECT 1"
```

### Docker issues
```bash
# Clean rebuild
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

## 📚 Next Steps

1. **Customize the application**
   - Update branding in frontend/src/theme.ts
   - Add your company logo
   - Configure email settings in backend/.env

2. **Add sample data**
   - Use the seed scripts in database/seeders
   - Or import your existing data via API

3. **Configure CI/CD**
   - Set up GitHub Actions (see .github/workflows)
   - Configure deployment to your cloud provider

4. **Enable monitoring**
   - Set up Application Insights or similar
   - Configure error tracking (Sentry)
   - Set up log aggregation

## 🤝 Support

- **Documentation**: See README.md and other docs
- **Issues**: Create a GitHub issue
- **Questions**: Contact the development team

## 📅 Development Roadmap

- [x] Core authentication and authorization
- [x] Portfolio management module
- [x] Resource management module
- [x] Pipeline management module
- [x] Capacity planning module
- [x] AI insights foundation
- [ ] Advanced AI recommendations
- [ ] Real-time collaboration
- [ ] Mobile applications
- [ ] Advanced analytics

---

**Happy Coding! 🚀**
