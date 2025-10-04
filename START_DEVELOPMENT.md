# 🚀 Quick Development Setup

## The Docker Issue

The error you encountered is because:
1. The `version` field is deprecated in newer Docker Compose
2. Building images requires Dockerfiles which need dependencies installed first

## ✅ Recommended Development Setup

**Run only the database in Docker, and run backend/frontend locally for better development experience.**

### Step 1: Start SQL Server in Docker

```bash
cd /Users/home/stamma/projects/iAlign

# Start only the database
docker-compose up -d

# Check it's running
docker-compose ps
```

### Step 2: Install Backend Dependencies

```bash
cd backend

# Install dependencies
npm install

# Start backend (runs on port 5000)
npm run dev
```

Keep this terminal open - you'll see logs here.

### Step 3: Install Frontend Dependencies (New Terminal)

```bash
cd frontend

# Install dependencies
npm install

# Start frontend (runs on port 3000)
npm run dev
```

Keep this terminal open too.

### Step 4: Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Docs**: http://localhost:5000/api-docs
- **Health Check**: http://localhost:5000/health

---

## 🎯 Quick Commands

### Start Everything (3 Terminals)

**Terminal 1 - Database:**
```bash
docker-compose up -d
```

**Terminal 2 - Backend:**
```bash
cd backend && npm run dev
```

**Terminal 3 - Frontend:**
```bash
cd frontend && npm run dev
```

### Stop Everything

**Stop backend and frontend:**
- Press `Ctrl+C` in each terminal

**Stop database:**
```bash
docker-compose down
```

---

## 🔧 Troubleshooting

### "Cannot connect to database"

**Check if SQL Server is running:**
```bash
docker-compose ps
```

**Should show:**
```
NAME                 IMAGE                                    STATUS
ialign-sqlserver     mcr.microsoft.com/mssql/server:2022...   Up (healthy)
```

**If not healthy, check logs:**
```bash
docker-compose logs sqlserver
```

**Restart if needed:**
```bash
docker-compose restart sqlserver
```

### "Port 1433/5000/3000 already in use"

**Find and kill the process:**
```bash
# For port 1433 (database)
lsof -ti:1433 | xargs kill -9

# For port 5000 (backend)
lsof -ti:5000 | xargs kill -9

# For port 3000 (frontend)
lsof -ti:3000 | xargs kill -9
```

### Backend won't start - "Module not found"

```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

### Frontend won't start - Dependencies error

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Database connection keeps failing

**Test the connection:**
```bash
docker exec -it ialign-sqlserver /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P "iAlign@2024!" -Q "SELECT 1"
```

**If that works, check backend .env file has correct credentials:**
```
DB_HOST=localhost
DB_PASSWORD=iAlign@2024!
```

---

## 📝 First Time Setup

### 1. Create Test User

Once backend is running, create a user via API:

```bash
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

### 2. Login

Go to http://localhost:3000 and login with:
- **Email**: admin@ialign.com
- **Password**: Admin@123

---

## 🎨 Development Workflow

### Making Backend Changes

1. Edit files in `backend/src/`
2. Server auto-restarts (nodemon)
3. Refresh browser or API client

### Making Frontend Changes

1. Edit files in `frontend/src/`
2. Browser auto-refreshes (Vite HMR)
3. See changes instantly

### Making Database Changes

1. Edit models in `backend/src/models/`
2. Restart backend server
3. Sequelize auto-syncs in development mode

---

## 🐳 Alternative: Full Docker Setup (Advanced)

If you really want to run everything in Docker, you need to build the images first:

```bash
# Build backend image
cd backend
docker build -t ialign-backend .

# Build frontend image
cd ../frontend
docker build -t ialign-frontend .

# Then use the full docker-compose
cd ..
docker-compose -f docker-compose.full.yml up -d
```

But for development, **local setup is recommended** for:
- Faster hot reload
- Better debugging
- Easier log access
- No Docker overhead

---

## ✅ Recommended Setup Summary

```bash
# Terminal 1: Database
docker-compose up -d

# Terminal 2: Backend
cd backend
npm install  # First time only
npm run dev

# Terminal 3: Frontend
cd frontend
npm install  # First time only
npm run dev

# Access: http://localhost:3000
```

**This is the best development experience!** 🚀

---

## 🆘 Still Having Issues?

1. **Make sure Docker Desktop is running**
2. **Check all ports are free** (1433, 5000, 3000)
3. **Ensure Node.js 18+ is installed**: `node --version`
4. **Check npm is working**: `npm --version`
5. **Review logs** in each terminal for specific errors

If you see specific error messages, share them and I can help troubleshoot!
