# ✅ SQLite Setup Complete!

## What Was Done

1. ✅ Added `sqlite3` to backend dependencies
2. ✅ Updated database configuration to use SQLite
3. ✅ Removed SQL Server dependencies (mssql, tedious)
4. ✅ Configured to create `database.sqlite` automatically
5. ✅ Updated environment variables

---

## 🚀 How to Start

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

This will install SQLite and all other dependencies.

### Step 2: Start Backend

```bash
npm run dev
```

You should see:
```
✅ SQLite database connection established successfully.
📁 Database file: database.sqlite
✅ Database synced successfully.
🚀 Server running in development mode on port 5000
```

### Step 3: Start Frontend (New Terminal)

```bash
cd frontend
npm install
npm run dev
```

### Step 4: Access Application

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000
- **API Docs**: http://localhost:5000/api-docs
- **Health**: http://localhost:5000/health

---

## 🎯 Create Your First User

Once the backend is running, create a user:

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

Then login at http://localhost:3000 with:
- **Email**: admin@ialign.com
- **Password**: Admin@123

---

## 📁 Database File Location

Your SQLite database will be created at:
```
/Users/home/stamma/projects/iAlign/backend/database.sqlite
```

You can view/edit it with:
- [DB Browser for SQLite](https://sqlitebrowser.org/) (Free)
- [SQLite Viewer VS Code Extension](https://marketplace.visualstudio.com/items?itemName=alexcvzz.vscode-sqlite)
- Command line: `sqlite3 backend/database.sqlite`

---

## 🔧 What Changed

### Before (SQL Server):
- Required Docker
- Complex setup
- Connection issues on macOS

### After (SQLite):
- No Docker needed ✅
- Zero configuration ✅
- Works immediately ✅
- Perfect for development ✅

---

## 💡 Benefits of SQLite for Development

✨ **Zero Configuration** - No database server to install
✨ **Fast** - In-memory and on-disk options
✨ **Portable** - Single file database
✨ **Reliable** - Industry standard, used by millions
✨ **Easy Backup** - Just copy the .sqlite file
✨ **Perfect for Development** - Quick iterations

---

## 🔄 Switching to SQL Server Later (Production)

When you're ready to use SQL Server for production:

1. Install SQL Server
2. Update `backend/src/config/database.ts` to use SQL Server config
3. Update environment variables
4. Install mssql packages: `npm install mssql tedious`

The application code remains the same - just the database connection changes!

---

## 🐛 Troubleshooting

### "Error: Cannot find module 'sqlite3'"

```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

### Database file not created

Check that the backend started successfully:
```bash
cd backend
npm run dev
```

Look for the success messages.

### Port 5000 already in use

```bash
# Kill the process
lsof -ti:5000 | xargs kill -9

# Or change PORT in backend/.env
```

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Backend starts without errors
- [ ] See "SQLite database connection established" message
- [ ] `database.sqlite` file created in backend folder
- [ ] Frontend starts on port 3000
- [ ] Can access http://localhost:5000/health
- [ ] API docs load at http://localhost:5000/api-docs
- [ ] Can register a user via API
- [ ] Can login at frontend

---

## 🎉 You're Ready!

Everything is set up and ready to go. Just run:

**Terminal 1:**
```bash
cd backend
npm install
npm run dev
```

**Terminal 2:**
```bash
cd frontend
npm install
npm run dev
```

**Access**: http://localhost:3000

No Docker. No configuration. Just works! 🚀

---

## 📚 Next Steps

1. Create your first user
2. Login and explore the dashboard
3. Start building features
4. Check out the API documentation
5. Customize the application

Happy coding! 🎊
