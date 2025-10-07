# iAlign - Windows IIS Deployment Guide

This guide walks you through deploying the iAlign application on Windows Server with IIS and MS SQL Server.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Part 1: MS SQL Server Setup](#part-1-ms-sql-server-setup)
- [Part 2: Backend Deployment](#part-2-backend-deployment)
- [Part 3: Frontend Deployment](#part-3-frontend-deployment)
- [Part 4: IIS Configuration](#part-4-iis-configuration)
- [Part 5: Testing & Troubleshooting](#part-5-testing--troubleshooting)

---

## Prerequisites

### Required Software
1. **Windows Server 2016 or later** (or Windows 10/11 Pro)
2. **IIS 10.0+** with the following features:
   - Static Content
   - Default Document
   - Directory Browsing
   - HTTP Errors
   - Application Request Routing (ARR) 3.0
   - URL Rewrite Module 2.1
3. **Node.js 18.x or later** (LTS version recommended)
4. **MS SQL Server 2019 or later** (Express, Standard, or Enterprise)
5. **Git for Windows** (optional, for cloning repository)

### Install IIS
```powershell
# Open PowerShell as Administrator
Install-WindowsFeature -name Web-Server -IncludeManagementTools
```

### Install URL Rewrite Module
Download and install from: https://www.iis.net/downloads/microsoft/url-rewrite

### Install Application Request Routing (ARR)
Download and install from: https://www.iis.net/downloads/microsoft/application-request-routing

### Install Node.js
Download and install from: https://nodejs.org/en/download/

### Install iisnode (for Node.js on IIS)
Download and install from: https://github.com/Azure/iisnode/releases

---

## Part 1: MS SQL Server Setup

### 1.1 Install MS SQL Server
1. Download SQL Server Express (free) from Microsoft
2. Run the installer and choose "Basic" installation
3. Note the server name (usually `localhost` or `DESKTOP-XXXXX\SQLEXPRESS`)

### 1.2 Enable SQL Server Authentication
```sql
-- Open SQL Server Management Studio (SSMS)
-- Connect to your SQL Server instance
-- Run this query:

USE master;
GO
EXEC xp_instance_regwrite
    N'HKEY_LOCAL_MACHINE',
    N'Software\Microsoft\MSSQLServer\MSSQLServer',
    N'LoginMode',
    REG_DWORD,
    2;
GO

-- Restart SQL Server service after this change
```

### 1.3 Create Database and Login
```sql
-- Create database
CREATE DATABASE iAlign;
GO

-- Create login (change password!)
CREATE LOGIN iAlignUser WITH PASSWORD = 'YourStrongPassword123!';
GO

-- Grant permissions
USE iAlign;
GO
CREATE USER iAlignUser FOR LOGIN iAlignUser;
ALTER ROLE db_owner ADD MEMBER iAlignUser;
GO
```

### 1.4 Configure SQL Server Network Settings
1. Open **SQL Server Configuration Manager**
2. Expand **SQL Server Network Configuration**
3. Click **Protocols for SQLEXPRESS** (or your instance name)
4. Enable **TCP/IP**
5. Right-click **TCP/IP** → Properties → IP Addresses tab
6. Scroll to **IPAll** section
7. Set **TCP Port** to `1433`
8. Restart SQL Server service

---

## Part 2: Backend Deployment

### 2.1 Prepare Application Files
```powershell
# Create deployment directory
New-Item -Path "C:\inetpub\iAlign" -ItemType Directory
New-Item -Path "C:\inetpub\iAlign\backend" -ItemType Directory
New-Item -Path "C:\inetpub\iAlign\frontend" -ItemType Directory

# Clone or copy repository
cd C:\inetpub\iAlign
git clone https://github.com/satyendratamma-max/iAlign.git temp
Move-Item -Path temp\backend\* -Destination backend\
Move-Item -Path temp\frontend\* -Destination frontend\
Remove-Item -Path temp -Recurse -Force
```

### 2.2 Configure Backend Environment
```powershell
# Navigate to backend
cd C:\inetpub\iAlign\backend

# Create .env file (copy from example)
Copy-Item .env.mssql.example .env

# Edit .env file with actual values
notepad .env
```

Edit `.env` with your SQL Server details:
```env
# Database Type
DB_TYPE=mssql

# MS SQL Server Connection Settings
DB_HOST=localhost
DB_PORT=1433
DB_NAME=iAlign
DB_USER=iAlignUser
DB_PASSWORD=YourStrongPassword123!

# Security Settings
DB_ENCRYPT=false
DB_TRUST_CERT=true

# Application Settings
NODE_ENV=production
PORT=5000

# JWT Secret (MUST change this!)
JWT_SECRET=your-super-secret-production-key-change-this-to-random-value
JWT_EXPIRES_IN=24h

# CORS Settings (update with your frontend URL)
CORS_ORIGIN=http://yourserver.com
```

### 2.3 Install Dependencies and Build
```powershell
cd C:\inetpub\iAlign\backend

# Install dependencies
npm install --production

# Run database migrations and seed
npm run seed:dev
```

### 2.4 Create web.config for Backend (iisnode)
Create `C:\inetpub\iAlign\backend\web.config`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <!-- Indicates that the server.js file is a Node.js application -->
      <add name="iisnode" path="dist/server.js" verb="*" modules="iisnode" />
    </handlers>

    <!-- iisnode configuration -->
    <iisnode
      nodeProcessCommandLine="&quot;C:\Program Files\nodejs\node.exe&quot;"
      loggingEnabled="true"
      logDirectory="iisnode"
      debuggingEnabled="false"
      devErrorsEnabled="false"
      node_env="production"
      watchedFiles="*.js;iisnode.yml"
    />

    <rewrite>
      <rules>
        <!-- Don't interfere with requests for node-inspector debugging -->
        <rule name="NodeInspector" patternSyntax="ECMAScript" stopProcessing="true">
          <match url="^dist/server.js\/debug[\/]?" />
        </rule>

        <!-- All other URLs are mapped to the Node.js application entry point -->
        <rule name="DynamicContent">
          <conditions>
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="True"/>
          </conditions>
          <action type="Rewrite" url="dist/server.js"/>
        </rule>
      </rules>
    </rewrite>

    <!-- Disable caching for node responses -->
    <staticContent>
      <clientCache cacheControlMode="DisableCache" />
    </staticContent>

    <!-- Make sure error responses are left untouched -->
    <httpErrors existingResponse="PassThrough" />

    <!-- Security settings -->
    <security>
      <requestFiltering>
        <hiddenSegments>
          <add segment="node_modules" />
          <add segment="iisnode" />
        </hiddenSegments>
      </requestFiltering>
    </security>
  </system.webServer>
</configuration>
```

### 2.5 Build TypeScript
```powershell
cd C:\inetpub\iAlign\backend
npm run build
```

---

## Part 3: Frontend Deployment

### 3.1 Configure Frontend Environment
```powershell
cd C:\inetpub\iAlign\frontend

# Create .env file
notepad .env
```

Add to `.env`:
```env
VITE_API_URL=http://yourserver.com/api/v1
```

### 3.2 Build Frontend
```powershell
cd C:\inetpub\iAlign\frontend

# Install dependencies
npm install

# Build for production
npm run build
```

This creates a `dist` folder with static files.

### 3.3 Create web.config for Frontend
Create `C:\inetpub\iAlign\frontend\dist\web.config`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <!-- Redirect HTTP to HTTPS (optional, uncomment if using SSL) -->
        <!--
        <rule name="HTTP to HTTPS" stopProcessing="true">
          <match url="(.*)" />
          <conditions>
            <add input="{HTTPS}" pattern="off" ignoreCase="true" />
          </conditions>
          <action type="Redirect" url="https://{HTTP_HOST}/{R:1}" redirectType="Permanent" />
        </rule>
        -->

        <!-- React Router: redirect all requests to index.html -->
        <rule name="React Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/index.html" />
        </rule>
      </rules>
    </rewrite>

    <!-- Compression for better performance -->
    <urlCompression doStaticCompression="true" doDynamicCompression="true" />

    <!-- Static file caching -->
    <staticContent>
      <clientCache cacheControlMode="UseMaxAge" cacheControlMaxAge="7.00:00:00" />
      <!-- Add MIME types if needed -->
      <mimeMap fileExtension=".json" mimeType="application/json" />
      <mimeMap fileExtension=".woff" mimeType="application/font-woff" />
      <mimeMap fileExtension=".woff2" mimeType="application/font-woff2" />
    </staticContent>

    <!-- Security headers -->
    <httpProtocol>
      <customHeaders>
        <add name="X-Content-Type-Options" value="nosniff" />
        <add name="X-Frame-Options" value="SAMEORIGIN" />
        <add name="X-XSS-Protection" value="1; mode=block" />
      </customHeaders>
    </httpProtocol>
  </system.webServer>
</configuration>
```

---

## Part 4: IIS Configuration

### 4.1 Create IIS Application Pool
```powershell
# Open IIS Manager or use PowerShell
Import-Module WebAdministration

# Create Application Pool for Backend
New-WebAppPool -Name "iAlign_Backend"
Set-ItemProperty IIS:\AppPools\iAlign_Backend -Name managedRuntimeVersion -Value ""
Set-ItemProperty IIS:\AppPools\iAlign_Backend -Name startMode -Value "AlwaysRunning"

# Create Application Pool for Frontend
New-WebAppPool -Name "iAlign_Frontend"
Set-ItemProperty IIS:\AppPools\iAlign_Frontend -Name managedRuntimeVersion -Value ""
```

### 4.2 Create IIS Websites

#### Option A: Single Website (Recommended)
```powershell
# Create main website
New-Website -Name "iAlign" `
  -PhysicalPath "C:\inetpub\iAlign\frontend\dist" `
  -ApplicationPool "iAlign_Frontend" `
  -Port 80

# Create backend application under main site
New-WebApplication -Name "api" `
  -Site "iAlign" `
  -PhysicalPath "C:\inetpub\iAlign\backend" `
  -ApplicationPool "iAlign_Backend"
```

This setup gives you:
- Frontend: `http://yourserver.com/`
- Backend API: `http://yourserver.com/api/`

#### Option B: Separate Websites
```powershell
# Create Frontend website
New-Website -Name "iAlign_Frontend" `
  -PhysicalPath "C:\inetpub\iAlign\frontend\dist" `
  -ApplicationPool "iAlign_Frontend" `
  -Port 80

# Create Backend website
New-Website -Name "iAlign_Backend" `
  -PhysicalPath "C:\inetpub\iAlign\backend" `
  -ApplicationPool "iAlign_Backend" `
  -Port 5000
```

### 4.3 Set Permissions
```powershell
# Grant IIS_IUSRS read access to application files
icacls "C:\inetpub\iAlign" /grant "IIS_IUSRS:(OI)(CI)RX" /T

# Grant write access to logs directory
New-Item -Path "C:\inetpub\iAlign\backend\logs" -ItemType Directory -Force
icacls "C:\inetpub\iAlign\backend\logs" /grant "IIS_IUSRS:(OI)(CI)M" /T

# Grant write access to iisnode directory
icacls "C:\inetpub\iAlign\backend\iisnode" /grant "IIS_IUSRS:(OI)(CI)M" /T
```

### 4.4 Configure Application Request Routing (ARR)

If using Option A (Single Website):

1. Open IIS Manager
2. Select the main "iAlign" site
3. Double-click **URL Rewrite**
4. Add a new rule:
   - Name: "API Proxy"
   - Pattern: `^api/(.*)`
   - Action: Rewrite
   - Rewrite URL: `http://localhost:5000/api/v1/{R:1}`
   - Stop processing: Yes

### 4.5 Enable ARR Proxy
```powershell
# Enable proxy in ARR
Set-WebConfigurationProperty -PSPath 'MACHINE/WEBROOT/APPHOST' `
  -Filter "system.webServer/proxy" `
  -Name "enabled" `
  -Value "True"
```

---

## Part 5: Testing & Troubleshooting

### 5.1 Test Backend
```powershell
# Test health endpoint
Invoke-WebRequest http://localhost:5000/health

# Or use browser
Start-Process "http://localhost:5000/health"
```

Expected response:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2025-10-06T..."
}
```

### 5.2 Test Frontend
```powershell
# Open in browser
Start-Process "http://localhost"
```

### 5.3 Check Logs

**Backend Logs:**
- IIS logs: `C:\inetpub\logs\LogFiles\`
- Application logs: `C:\inetpub\iAlign\backend\logs\`
- iisnode logs: `C:\inetpub\iAlign\backend\iisnode\`

**View iisnode logs:**
```powershell
Get-Content "C:\inetpub\iAlign\backend\iisnode\*.log" -Tail 50
```

### 5.4 Common Issues

#### Issue: "Cannot connect to database"
**Solution:**
1. Verify SQL Server is running: `Services.msc` → SQL Server (instance)
2. Check connection string in `.env`
3. Verify TCP/IP is enabled in SQL Configuration Manager
4. Check firewall allows port 1433

#### Issue: "404 Not Found" for backend routes
**Solution:**
1. Verify iisnode is installed
2. Check `web.config` exists in backend folder
3. Restart IIS: `iisreset`
4. Check application pool is running

#### Issue: "Module not found" errors
**Solution:**
```powershell
cd C:\inetpub\iAlign\backend
npm install --production
npm run build
```

#### Issue: Frontend routes return 404
**Solution:**
1. Verify `web.config` exists in `frontend\dist`
2. URL Rewrite module is installed
3. Check the React Routes rewrite rule

### 5.5 Enable Detailed Error Messages (Development Only)
Edit `backend\web.config`:
```xml
<iisnode
  devErrorsEnabled="true"
  debuggingEnabled="true"
/>
```

**Remember to disable in production!**

---

## SSL/HTTPS Configuration (Optional but Recommended)

### Generate Self-Signed Certificate (Development)
```powershell
New-SelfSignedCertificate -DnsName "yourserver.com" `
  -CertStoreLocation "cert:\LocalMachine\My"
```

### Bind Certificate to Website
```powershell
# Get certificate thumbprint
$cert = Get-ChildItem -Path Cert:\LocalMachine\My |
  Where-Object {$_.Subject -match "yourserver.com"}

# Bind to HTTPS (port 443)
New-WebBinding -Name "iAlign" -Protocol https -Port 443
```

---

## Monitoring and Maintenance

### Restart Application Pool
```powershell
Restart-WebAppPool -Name "iAlign_Backend"
Restart-WebAppPool -Name "iAlign_Frontend"
```

### View Running Node Processes
```powershell
Get-Process node
```

### Update Application
```powershell
# Stop application pools
Stop-WebAppPool -Name "iAlign_Backend"
Stop-WebAppPool -Name "iAlign_Frontend"

# Pull latest code
cd C:\inetpub\iAlign
git pull

# Update backend
cd backend
npm install --production
npm run build

# Update frontend
cd ..\frontend
npm install
npm run build

# Start application pools
Start-WebAppPool -Name "iAlign_Backend"
Start-WebAppPool -Name "iAlign_Frontend"
```

---

## Production Checklist

- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Set `NODE_ENV=production` in `.env`
- [ ] Use strong database password
- [ ] Disable `devErrorsEnabled` and `debuggingEnabled` in `web.config`
- [ ] Configure HTTPS/SSL
- [ ] Set up database backups
- [ ] Configure Windows Firewall
- [ ] Enable IIS logging
- [ ] Set up monitoring (Application Insights, etc.)
- [ ] Test disaster recovery procedure

---

## Support

For issues and questions:
- GitHub Issues: https://github.com/satyendratamma-max/iAlign/issues
- Review logs in `C:\inetpub\iAlign\backend\logs\`
- Check iisnode logs in `C:\inetpub\iAlign\backend\iisnode\`

---

**Generated with [Claude Code](https://claude.com/claude-code)**
