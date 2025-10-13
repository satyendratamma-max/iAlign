# Network Access Configuration Guide

This guide explains how to configure the iAlign application to be accessible from other computers on your local network using the hostname instead of localhost.

## Current System Information

- **Hostname**: `SurfacePro`
- **Frontend Port**: `3000`
- **Backend Port**: `5000`

## Configuration Changes Made

### 1. Frontend (Vite) Configuration

The Vite dev server has been configured to listen on all network interfaces (`0.0.0.0`) instead of just localhost.

**File**: `frontend/vite.config.ts`
```typescript
server: {
  host: '0.0.0.0', // Listen on all network interfaces
  port: 3000,
  // ...
}
```

### 2. Backend (Express) Configuration

The Express server has been configured to listen on all network interfaces and display the hostname in logs.

**File**: `backend/src/server.ts`
```typescript
app.listen(PORT, '0.0.0.0', () => {
  // Logs show both localhost and hostname URLs
});
```

## Setup Instructions

### Option 1: Local Development (Default)

For local-only access, no changes needed. Just run:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Access the application at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api/v1

### Option 2: Network Access (Hostname)

To allow other computers on your network to access the application:

#### Step 1: Update Backend Environment Variables

Create or update `backend/.env`:

```env
# Update CORS to allow requests from network hostname
CORS_ORIGIN=http://localhost:3000,http://SurfacePro:3000

# Other settings...
PORT=5000
NODE_ENV=development
```

#### Step 2: Update Frontend Environment Variables

Create `frontend/.env`:

```env
# Use hostname instead of localhost for API calls
VITE_API_URL=http://SurfacePro:5000/api/v1
```

**OR** keep using localhost if frontend and backend are on the same machine:

```env
VITE_API_URL=http://localhost:5000/api/v1
```

#### Step 3: Start the Servers

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

The console will show:
```
🚀 Server running in development mode on port 5000
📚 API Documentation available at:
   - http://localhost:5000/api-docs
   - http://SurfacePro:5000/api-docs
```

#### Step 4: Access from Other Computers

From any computer on the same network:

- **Frontend**: http://SurfacePro:3000
- **Backend API**: http://SurfacePro:5000/api/v1

## Important Notes

### Firewall Configuration

Make sure Windows Firewall allows incoming connections on ports 3000 and 5000:

1. Open **Windows Defender Firewall with Advanced Security**
2. Click **Inbound Rules** → **New Rule**
3. Select **Port** → Next
4. Enter port numbers: `3000,5000`
5. Select **Allow the connection**
6. Apply to all profiles (Domain, Private, Public)
7. Name the rule: "iAlign Development Server"

### Network Discovery

Ensure network discovery is enabled:
1. Open **Settings** → **Network & Internet**
2. Select your network connection
3. Set network profile to **Private**

### Finding Your Hostname

To find your computer's hostname:

**Windows:**
```bash
hostname
```

**Alternative:** Check in **System Settings** → **About** → **Device name**

### Using IP Address Instead of Hostname

If hostname doesn't work, you can use the IP address:

1. Find your IP address:
   ```bash
   ipconfig
   ```
   Look for "IPv4 Address" under your active network adapter

2. Update environment variables:
   ```env
   VITE_API_URL=http://192.168.1.100:5000/api/v1
   CORS_ORIGIN=http://192.168.1.100:3000
   ```

3. Access from network:
   - http://192.168.1.100:3000

## Troubleshooting

### Issue: "Cannot connect to server"

**Solutions:**
1. Verify both frontend and backend are running
2. Check firewall settings
3. Verify hostname resolution: `ping SurfacePro`
4. Try using IP address instead of hostname

### Issue: "CORS error"

**Solution:**
Update `backend/.env` to include the correct origin:
```env
CORS_ORIGIN=http://localhost:3000,http://SurfacePro:3000,http://192.168.1.100:3000
```

### Issue: "Hostname not resolving"

**Solutions:**
1. Use IP address instead of hostname
2. Add hostname to hosts file on client computers:
   - Windows: `C:\Windows\System32\drivers\etc\hosts`
   - Add line: `192.168.1.100 SurfacePro`

### Issue: "Connection refused"

**Solutions:**
1. Check if servers are listening on 0.0.0.0:
   ```bash
   netstat -an | findstr :3000
   netstat -an | findstr :5000
   ```
2. Restart both servers
3. Check Windows Firewall rules

## Security Considerations

### Development Environment Only

This configuration is intended for **development use only** on trusted networks. For production:

1. Use proper HTTPS certificates
2. Configure production-grade CORS policies
3. Use environment-specific configuration
4. Set up proper authentication
5. Use a reverse proxy (nginx, Apache)

### Network Security

- Only enable network access on trusted networks (home/office)
- Disable network access when on public Wi-Fi
- Use VPN when accessing from remote locations
- Keep firewall rules as restrictive as possible

## Production Deployment

For production deployment:

1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. Serve frontend build from backend or use a dedicated web server

3. Update environment variables for production:
   ```env
   NODE_ENV=production
   CORS_ORIGIN=https://your-domain.com
   ```

4. Use proper domain names and SSL certificates

5. Configure reverse proxy (nginx/Apache)

## Additional Resources

- [Vite Server Options](https://vitejs.dev/config/server-options.html)
- [Express.js Production Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [CORS Configuration](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
