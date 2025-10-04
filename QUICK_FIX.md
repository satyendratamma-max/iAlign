# 🚀 QUICK FIX - Skip Docker Issues!

## The Docker error you're seeing is common on macOS. Here's the fastest solution:

---

## ✅ RECOMMENDED: Skip Docker & Use SQLite

**This is the FASTEST way to get started right now:**

### Step 1: Install SQLite dependency

```bash
cd backend
npm install sqlite3
```

### Step 2: Switch to SQLite database

```bash
# Rename the current config
mv src/config/database.ts src/config/database.mssql.ts

# Use SQLite config instead
mv src/config/database.sqlite.ts src/config/database.ts
```

### Step 3: Update backend package.json

Add to `backend/package.json` dependencies:
```json
"sqlite3": "^5.1.6"
```

### Step 4: Start Backend (No Docker needed!)

```bash
cd backend
npm install
npm run dev
```

✅ **Backend will create a local SQLite database automatically!**

### Step 5: Start Frontend

```bash
cd frontend
npm install
npm run dev
```

### Step 6: Access Application

- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- API Docs: http://localhost:5000/api-docs

---

## 🎯 Alternative: Try Azure SQL Edge

If you really want Docker but SQL Server 2022 won't work:

```bash
cd /Users/home/stamma/projects/iAlign

# Use Azure SQL Edge instead (lighter, works better on macOS)
docker-compose -f docker-compose.edge.yml up -d
```

---

## 🔧 Alternative: Fix Docker (if you have time)

### Try these in order:

1. **Restart Docker Desktop completely**
   - Quit Docker Desktop
   - Reopen Docker Desktop
   - Wait for it to fully start
   - Try: `docker ps`
   - Then: `docker-compose up -d`

2. **Clear Docker cache**
   ```bash
   docker system prune -a
   docker-compose up -d
   ```

3. **Update Docker Desktop**
   - Check for updates in Docker Desktop
   - Install latest version
   - Restart and try again

4. **Check Docker settings**
   - Open Docker Desktop
   - Go to Settings > Resources
   - Ensure you have enough memory allocated (4GB+)

---

## 💡 What I Recommend

**For development, use SQLite (Option 1).** It's:
- ✨ Zero configuration
- ✨ No Docker needed
- ✨ Fast and simple
- ✨ Perfect for development
- ✨ Can switch to SQL Server for production later

You can always switch to SQL Server or Docker later when you deploy to production.

---

## 🎯 Quick Summary

**To get started NOW without Docker issues:**

```bash
# Terminal 1 - Backend
cd backend
npm install sqlite3
npm install
npm run dev

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev

# Access: http://localhost:3000
```

**No Docker required! Everything works!** 🎉

---

## Need Help?

If you still have issues, let me know the specific error message and I'll help troubleshoot!
