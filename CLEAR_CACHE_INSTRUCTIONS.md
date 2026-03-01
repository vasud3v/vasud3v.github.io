# Clear Browser Cache - Fix for Old JavaScript Bundle

## Problem
Your browser is loading the old JavaScript bundle (`index-DDEZf7qJ.js`) instead of the new one (`index-CzURyOOA.js`). This is why you're still seeing the React Error #310.

## Solution: Clear Browser Cache

### Chrome / Edge:
1. Press `Ctrl + Shift + Delete` (Windows) or `Cmd + Shift + Delete` (Mac)
2. Select "Cached images and files"
3. Select "All time" from the time range dropdown
4. Click "Clear data"
5. Close and reopen the browser
6. Navigate to your site
7. Press `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac) for hard refresh

### Firefox:
1. Press `Ctrl + Shift + Delete` (Windows) or `Cmd + Shift + Delete` (Mac)
2. Select "Cache"
3. Select "Everything" from the time range dropdown
4. Click "Clear Now"
5. Close and reopen the browser
6. Navigate to your site
7. Press `Ctrl + F5` for hard refresh

### Alternative: Incognito/Private Mode
1. Open an incognito/private window
2. Navigate to your site
3. This will load the fresh version without cache

## Quick Test
After clearing cache, open the browser console (F12) and check:
- The JavaScript file should be `index-CzURyOOA.js` (not `index-DDEZf7qJ.js`)
- You should see "[useForumUser] Found existing forum_users record"
- You should NOT see React Error #310

## If Still Not Working

### Option 1: Start Dev Server (Recommended for Development)
```bash
npm run dev
```
Then access the app at `http://localhost:5173`

### Option 2: Serve the Dist Folder
```bash
npm install -g serve
serve -s dist -p 5173
```

### Option 3: Check if Another Server is Running
The old bundle might be served by a different server. Check:
1. What URL are you accessing? (localhost:5173, localhost:3000, GitHub Pages, etc.)
2. Is there a dev server running in another terminal?
3. Are you accessing a deployed version?

## Verification
Once cache is cleared, you should see in the Network tab (F12 → Network):
- `index-CzURyOOA.js` being loaded (NOT `index-DDEZf7qJ.js`)
- Status: 200 (not 304 from cache)
- Size: actual size (not "from disk cache")

## For GitHub Pages Deployment
If you're deploying to GitHub Pages, you need to:
1. Commit the new dist folder
2. Push to GitHub
3. Wait for GitHub Pages to rebuild (can take 1-5 minutes)
4. Clear browser cache
5. Access the site

```bash
git add dist/
git commit -m "Deploy: Updated production build with infinite loop fix"
git push origin master
```
