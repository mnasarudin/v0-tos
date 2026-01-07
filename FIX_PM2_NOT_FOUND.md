# Fix: PM2 Process Not Found 🔧

If you see `process or namespace intern-attendance-system not found`, it means the app isn't running in PM2.

## Quick Fix

### Step 1: Check PM2 Status

```bash
# On your VM
pm2 status
```

This will show all running PM2 processes. If `intern-attendance-system` is not listed, it's not running.

### Step 2: Start the Application

```bash
# Go to app directory
cd /var/www/intern-attendance

# Make sure you're in the right directory
pwd  # Should show: /var/www/intern-attendance

# Check if ecosystem.config.js exists
ls -la ecosystem.config.js

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Check status
pm2 status
```

### Step 3: Verify It's Running

```bash
# Check status
pm2 status

# Check logs
pm2 logs intern-attendance-system --lines 20

# Test if app is accessible
curl http://localhost:3000
```

## If It Still Doesn't Work

### Check if App is Built

```bash
cd /var/www/intern-attendance

# Check if .next directory exists (build output)
ls -la .next

# If not, build it
npm run build
```

### Check Environment Variables

```bash
# Make sure .env file exists
ls -la .env

# Check if database path is correct
cat .env | grep DATABASE_PATH
```

### Check Port Availability

```bash
# Check if port 3000 is in use
sudo lsof -i :3000

# If something else is using it, kill it
sudo kill -9 <PID>
```

### Check PM2 Logs for Errors

```bash
# View error logs
pm2 logs intern-attendance-system --err --lines 50

# Or check log files directly
tail -f /var/www/intern-attendance/logs/pm2-error.log
```

## Complete Setup (If Never Started Before)

If the app was never started with PM2:

```bash
# 1. Go to app directory
cd /var/www/intern-attendance

# 2. Install dependencies (if not done)
npm install

# 3. Build the application
npm run build

# 4. Create logs directory
mkdir -p logs

# 5. Start with PM2
pm2 start ecosystem.config.js --name intern-attendance-system

# 6. Save PM2 configuration
pm2 save

# 7. Setup PM2 to start on boot
pm2 startup
# Follow the instructions (run the sudo command it shows)

# 8. Check status
pm2 status
```

## Alternative: Start Without PM2 (Testing)

If PM2 isn't working, you can test if the app runs:

```bash
cd /var/www/intern-attendance
npm run build
NODE_ENV=production npm start
```

This will run the app directly (press Ctrl+C to stop). If this works, PM2 should work too.

## Updated Update Script

The update script now checks if the process exists before restarting:

```bash
# If process doesn't exist, it will start it
# If process exists, it will restart it
```

## Common Issues

### Issue 1: Wrong Directory
```bash
# Make sure you're in the right directory
cd /var/www/intern-attendance
pwd  # Should show: /var/www/intern-attendance
```

### Issue 2: Build Not Found
```bash
# Rebuild the app
npm run build
```

### Issue 3: Port Already in Use
```bash
# Find what's using port 3000
sudo lsof -i :3000
# Kill it if needed
sudo kill -9 <PID>
```

### Issue 4: Permission Issues
```bash
# Fix ownership
sudo chown -R $USER:$USER /var/www/intern-attendance
```

## Verify Everything Works

After starting:

```bash
# 1. Check PM2 status
pm2 status
# Should show: intern-attendance-system | online

# 2. Check logs
pm2 logs intern-attendance-system --lines 10

# 3. Test the app
curl http://localhost:3000
# Should return HTML (not error)

# 4. Check from browser
# Open: http://192.168.1.113
```

---

**Once it's running, you can use the update script normally!**


