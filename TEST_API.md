# 🧪 API Testing Guide

## Test if Backend is Working

### Step 1: Health Check (No Auth Required)
```bash
curl http://localhost:5000/health
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2025-10-02T..."
}
```

### Step 2: Login and Get Token
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ialign.com",
    "password": "Admin@123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@ialign.com",
      ...
    }
  }
}
```

**Copy the token value for next steps!**

### Step 3: Test Portfolios API (With Auth)
```bash
# Replace YOUR_TOKEN with the token from Step 2
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/v1/portfolios
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Digital Transformation",
      "description": "Enterprise-wide digital transformation initiatives",
      "type": "Strategic",
      "totalValue": "5500000",
      "roiIndex": "22.5",
      "riskScore": 45,
      ...
    },
    ...
  ]
}
```

### Step 4: Test Projects API
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/v1/projects
```

### Step 5: Test Resources API
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/v1/resources
```

---

## Frontend Debugging

### Check Browser Console

1. Open http://localhost:3000
2. Login with admin@ialign.com / Admin@123
3. Go to Portfolio page
4. Open Browser DevTools (F12 or Right-click → Inspect)
5. Go to **Console** tab
6. Look for errors (red text)
7. Go to **Network** tab
8. Refresh the page
9. Look for the API call to `/api/v1/portfolios`
10. Click on it and check:
    - **Headers** tab: Is "Authorization: Bearer ..." present?
    - **Response** tab: What's the response?
    - **Status**: Should be 200, not 401 or 500

### Common Issues

#### Issue 1: 401 Unauthorized
**Cause**: Token not sent or invalid
**Solution**:
- Check if you're logged in
- Try logging out and back in
- Check localStorage for token:
  ```javascript
  // In browser console:
  localStorage.getItem('token')
  ```

#### Issue 2: 404 Not Found
**Cause**: API URL wrong
**Solution**: Check frontend .env has correct URL

#### Issue 3: CORS Error
**Cause**: Backend CORS not configured
**Solution**: Backend should allow http://localhost:3000

#### Issue 4: Empty Array []
**Cause**: No data in database
**Solution**: Run seed script again

---

## Quick Fix Script

Run this to test everything:

```bash
#!/bin/bash

echo "Testing iAlign Backend..."
echo ""

echo "1. Health Check:"
curl -s http://localhost:5000/health | jq
echo ""

echo "2. Login:"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ialign.com","password":"Admin@123"}')

echo $LOGIN_RESPONSE | jq
echo ""

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.token')

if [ "$TOKEN" == "null" ]; then
  echo "❌ Login failed!"
  exit 1
fi

echo "✅ Token obtained: ${TOKEN:0:20}..."
echo ""

echo "3. Fetching Portfolios:"
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/v1/portfolios | jq '.data | length'
echo " portfolios found"
echo ""

echo "4. Fetching Projects:"
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/v1/projects | jq '.data | length'
echo " projects found"
echo ""

echo "5. Fetching Resources:"
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/v1/resources | jq '.data | length'
echo " resources found"
echo ""

echo "✅ All tests passed!"
```

Save as `test-api.sh` and run: `chmod +x test-api.sh && ./test-api.sh`

---

## If Still Not Working

1. **Check backend logs**: Look at the terminal where `npm run dev` is running
2. **Restart backend**: Stop (Ctrl+C) and restart `npm run dev`
3. **Restart frontend**: Stop and restart
4. **Clear browser cache**: Ctrl+Shift+Delete → Clear cache
5. **Try incognito/private window**
6. **Check if port 5000 is accessible**: `curl http://localhost:5000/health`

---

## Environment Variables Check

**Backend (.env)**:
```env
PORT=5000
JWT_SECRET=your-super-secret-jwt-key...
CORS_ORIGIN=http://localhost:3000
```

**Frontend (.env)**:
```env
VITE_API_URL=http://localhost:5000/api/v1
```

**IMPORTANT**: After changing .env files, restart both backend and frontend!
