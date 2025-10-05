# Windows Installation Guide

This guide helps you set up iAlign on Windows 11, especially in corporate environments with proxy/firewall restrictions.

## Prerequisites

1. **Node.js** (v18 or higher)
   - Download from: https://nodejs.org/
   - Verify: `node --version` and `npm --version`

2. **Git** (optional, for cloning)
   - Download from: https://git-scm.com/download/win

## Installation Steps

### Step 1: Clone the Repository

```powershell
cd C:\Users\YourUsername\projects
git clone https://github.com/satyendratamma-max/iAlign.git
cd iAlign
```

### Step 2: Install Backend Dependencies

```powershell
cd backend

# Install dependencies
npm install
```

**If you get SSL certificate errors**, the `.npmrc` file in the backend folder will automatically handle this for corporate networks.

### Step 3: Install Frontend Dependencies

```powershell
cd ..\frontend
npm install
```

### Step 4: Run the Application

**Terminal 1 - Backend:**
```powershell
cd C:\Users\YourUsername\projects\iAlign\backend
npm run dev
```

Wait for:
```
✅ Database synced successfully
🚀 Server running in development mode on port 5000
```

**Terminal 2 - Frontend:**
```powershell
cd C:\Users\YourUsername\projects\iAlign\frontend
npm run dev
```

Wait for:
```
VITE v5.4.20  ready in XXX ms
➜  Local:   http://localhost:3000/
```

### Step 5: Access the Application

1. Open browser: http://localhost:3000
2. Login with:
   - **Email**: `admin@ialign.com`
   - **Password**: `Admin@123`

---

## Troubleshooting

### Issue 1: SSL Certificate Errors

**Error**: `unable to get local issuer certificate`

**Solution**: The `.npmrc` file should handle this automatically. If not:

```powershell
# Set npm config (run in backend folder)
npm config set strict-ssl false
npm config set registry https://registry.npmjs.org/
```

### Issue 2: Port Already in Use

**Error**: `EADDRINUSE: address already in use :::5000`

**Solution**:
```powershell
# Find and kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Issue 3: Node/npm Not Recognized

**Solution**:
- Restart PowerShell/Command Prompt after installing Node.js
- Add Node.js to PATH manually if needed

### Issue 4: PowerShell Execution Policy

**Error**: `cannot be loaded because running scripts is disabled`

**Solution** (run PowerShell as Administrator):
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Issue 5: Python/Build Tools Errors

If you get `MSB3428` or Python errors:

**Solution**:
```powershell
npm install --global windows-build-tools
```

---

## Corporate Network Configuration

If your company uses a proxy, you may need:

```powershell
# Set proxy (replace with your proxy URL)
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080

# Set registry
npm config set registry https://registry.npmjs.org/
```

---

## Features Available

✅ Admin Tools (Administrator role only)
✅ Portfolio & Resource Management
✅ Notifications System
✅ Pipeline & Capacity Planning
✅ Help & Documentation

---

## Support

For issues, check:
- Backend logs in Terminal 1
- Frontend errors in browser console (F12)
- GitHub Issues: https://github.com/satyendratamma-max/iAlign/issues
