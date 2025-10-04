# 🔍 Frontend Debugging - Data Not Showing

## ✅ Confirmed Working:
- ✅ Backend is running on port 5000
- ✅ Database has 3 portfolios, 8 projects, 10 resources, 7 teams, 3 domains
- ✅ Login API works
- ✅ Portfolios API returns data with authentication
- ✅ API URL is correct: http://localhost:5000/api/v1

## 🐛 Issue: Frontend Not Displaying Data

### Most Common Causes:

1. **Frontend not running or old build**
2. **Not logged in / Token expired**
3. **Browser console errors**
4. **Wrong page navigation**

---

## 🚀 Step-by-Step Fix

### Step 1: Make Sure Frontend is Running

Open a NEW terminal:
```bash
cd /Users/home/stamma/projects/iAlign/frontend
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

**IMPORTANT**: If it says port 3000 is busy, check if you already have it running!

### Step 2: Open Browser

Go to: **http://localhost:3000**

### Step 3: Login

- Email: **admin@ialign.com**
- Password: **Admin@123**

After login, you should be redirected to the Dashboard.

###Step 4: Open Browser DevTools

Press **F12** or **Right-click → Inspect**

### Step 5: Navigate to Portfolio

Click on **Portfolio** in the sidebar → **Portfolio Overview**

### Step 6: Check Console Tab

Look for:
- ❌ **Red errors** - API call failed
- ⚠️ **Yellow warnings** - Something might be wrong
- ✅ **No errors** - API might be working

### Step 7: Check Network Tab

1. Click on **Network** tab in DevTools
2. Filter by "XHR" or "Fetch"
3. You should see a request to `portfolios`
4. Click on it
5. Check:
   - **Status**: Should be `200` (not 401, 404, or 500)
   - **Response** tab: Should show JSON with 3 portfolios

---

## 🔧 Common Problems & Solutions

### Problem 1: Network Tab Shows 401 Unauthorized

**Cause**: Not logged in or token expired

**Solution**:
1. Logout (if there's a logout button)
2. Refresh page (Ctrl+R or Cmd+R)
3. Login again
4. Navigate to Portfolio page

### Problem 2: Network Tab Shows No Request to /portfolios

**Cause**: Page didn't load or wrong page

**Solution**:
1. Make sure you're on the Portfolio Overview page
2. Check URL is: `http://localhost:3000/portfolio/overview` or similar
3. Try refreshing the page

### Problem 3: Console Shows "Failed to fetch"

**Cause**: Backend not running

**Solution**:
```bash
cd backend
npm run dev
```

### Problem 4: CORS Error in Console

**Example Error**:
```
Access to XMLHttpRequest at 'http://localhost:5000/api/v1/portfolios'
from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solution**: Backend should already allow CORS, but if you see this:

Check `backend/.env` has:
```env
CORS_ORIGIN=http://localhost:3000
```

Then restart backend.

### Problem 5: Empty Table (No Data)

**Symptoms**: Page loads, table shows, but no rows

**Debug**:
1. Open Console
2. Type: `localStorage.getItem('token')`
3. You should see a long string starting with "eyJ..."
4. If null, you're not logged in

**Solution**: Login again

### Problem 6: Wrong API URL

**Debug Console**:
```javascript
// In browser console:
console.log(import.meta.env.VITE_API_URL)
```

Should show: `http://localhost:5000/api/v1`

If undefined, frontend `.env` file is wrong.

**Solution**:
1. Check `/frontend/.env` has:
   ```env
   VITE_API_URL=http://localhost:5000/api/v1
   ```
2. **RESTART frontend** (Vite needs restart for env changes!)

---

## 🧪 Manual Test in Browser Console

Open browser console and paste this:

```javascript
// Test if API is accessible
const token = localStorage.getItem('token');
console.log('Token:', token ? 'Found' : 'Not found');

if (token) {
  fetch('http://localhost:5000/api/v1/portfolios', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  .then(res => res.json())
  .then(data => console.log('Portfolios:', data))
  .catch(err => console.error('Error:', err));
}
```

**Expected Output**:
```
Token: Found
Portfolios: {success: true, data: Array(3)}
```

If you see errors, that's the problem!

---

## 📸 What You Should See

### Dashboard Page
- 4 metric cards at top
- Total Portfolio Value: **$12,800,000**
- Active Projects: **6**
- 2 cards below showing Project Status and Health

### Portfolio Overview Page
- "Portfolio Overview" heading
- "Add Portfolio" button (top right)
- Table with 3 rows:
  1. Digital Transformation - $5,500,000 - 22.5% ROI - Risk: 45
  2. Infrastructure Modernization - $3,200,000 - 18.3% ROI - Risk: 32
  3. Customer Experience - $4,100,000 - 25.8% ROI - Risk: 38
- Each row has Edit and Delete buttons

---

## 🆘 Still Not Working?

### Try These:

1. **Hard Refresh**: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. **Clear Storage**:
   - F12 → Application tab → Storage → Clear site data
   - Then login again
3. **Incognito/Private Window**: Test in a fresh session
4. **Different Browser**: Try Chrome/Firefox/Safari
5. **Check Both Running**:
   ```bash
   # Terminal 1:
   cd backend && npm run dev

   # Terminal 2:
   cd frontend && npm run dev
   ```

### Screenshot the Error

If still not working, take a screenshot of:
1. Browser Console tab (showing errors)
2. Network tab (showing the API request)
3. The Portfolio page itself

---

## ✅ Verification Checklist

- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000
- [ ] Logged in with admin@ialign.com / Admin@123
- [ ] On Portfolio Overview page
- [ ] Browser DevTools open
- [ ] No red errors in Console
- [ ] Request to /portfolios shows in Network tab
- [ ] Request status is 200
- [ ] Response shows 3 portfolios

If ALL checked ✅, you should see the data!
