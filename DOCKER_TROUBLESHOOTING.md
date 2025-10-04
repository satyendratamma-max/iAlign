# Docker Issues - Solutions

## Error: "500 Internal Server Error for API route"

This error typically means Docker daemon is having issues. Here are solutions:

---

## Solution 1: Restart Docker Desktop (Quickest)

```bash
# On macOS, restart Docker Desktop:
# 1. Click Docker icon in menu bar
# 2. Select "Restart"
# 3. Wait for Docker to fully restart
# 4. Try again: docker-compose up -d
```

---

## Solution 2: Pull Image Manually First

```bash
# Pull the SQL Server image separately
docker pull mcr.microsoft.com/mssql/server:2022-latest

# If that works, then run:
docker-compose up -d
```

---

## Solution 3: Use Azure SQL Edge (Lighter Alternative)

If SQL Server 2022 doesn't work on your Mac, use Azure SQL Edge instead:

```bash
# Stop current containers
docker-compose down

# Use the alternative compose file
docker-compose -f docker-compose.edge.yml up -d
```

---

## Solution 4: Skip Docker Entirely (Easiest)

**You don't actually need Docker for development!**

Just install SQL Server locally or use a cloud database, then:

```bash
# Start backend with local/cloud database
cd backend
npm install
npm run dev

# Start frontend
cd frontend
npm install
npm run dev
```

Update `backend/.env` with your database connection.

---

## Solution 5: Use SQLite for Development (Simplest)

For local development, you can use SQLite instead of SQL Server.

See instructions in SQLITE_SETUP.md
