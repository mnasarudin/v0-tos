# How to Update Your Deployed Application 🔄

When you make code changes locally, you need to update the VM to see those changes in production.

## Quick Update Process

### Step 1: Push Changes to GitHub

From your **local machine** (where you code):

```bash
# Make your code changes locally
# ... edit files ...

# Commit changes
git add .
git commit -m "Your update message"

# Push to GitHub
git push origin main
```

### Step 2: Update on VM

SSH into your VM and pull the latest changes:

```bash
# Connect to VM
ssh user@192.168.1.113

# Go to app directory
cd /var/www/intern-attendance

# Pull latest changes from GitHub
git pull origin main

# Install any new dependencies (if package.json changed)
npm install

# Rebuild the application
npm run build

# Restart the app
pm2 restart intern-attendance-system

# Check if it's running
pm2 status
```

## Quick Update Script

I've created a script you can use to automate this. Save it on your VM:

```bash
# On your VM, create update script
nano ~/update-app.sh
```

Paste this:

```bash
#!/bin/bash
echo "🔄 Updating application..."

cd /var/www/intern-attendance

echo "📥 Pulling latest changes from GitHub..."
git pull origin main

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building application..."
npm run build

echo "🔄 Restarting application..."
pm2 restart intern-attendance-system

echo "✅ Update complete!"
pm2 status
```

Make it executable:

```bash
chmod +x ~/update-app.sh
```

Then you can update with one command:

```bash
~/update-app.sh
```

## When Do You Need to Update?

### ✅ **Always Update When:**
- You change any code files (`.tsx`, `.ts`, `.js`, etc.)
- You add new features
- You fix bugs
- You update dependencies (`package.json`)

### ⚠️ **You May Need to Restart When:**
- You change `.env` file (environment variables)
- You change Nginx configuration
- You change PM2 configuration

### ❌ **No Update Needed For:**
- Database changes (handled automatically)
- Static files (if using CDN)

## Update Workflow Summary

```
Local Machine                    GitHub                    VM
    │                              │                        │
    │ 1. Make changes              │                        │
    │ 2. git add .                 │                        │
    │ 3. git commit                │                        │
    │ 4. git push ────────────────>│                        │
    │                              │                        │
    │                              │                        │ 5. git pull
    │                              │                        │ 6. npm install
    │                              │                        │ 7. npm run build
    │                              │                        │ 8. pm2 restart
    │                              │                        │
    │                              │                        │ ✅ Live!
```

## Common Update Scenarios

### Scenario 1: Small Code Change

```bash
# On VM
cd /var/www/intern-attendance
git pull
npm run build
pm2 restart intern-attendance-system
```

### Scenario 2: Added New npm Package

```bash
# On VM
cd /var/www/intern-attendance
git pull
npm install          # Install new packages
npm run build
pm2 restart intern-attendance-system
```

### Scenario 3: Changed Environment Variables

```bash
# On VM
cd /var/www/intern-attendance
nano .env            # Edit environment variables
pm2 restart intern-attendance-system
```

### Scenario 4: Changed Nginx Config

```bash
# On VM
sudo nano /etc/nginx/sites-available/intern-attendance
sudo nginx -t        # Test configuration
sudo systemctl restart nginx
```

## Troubleshooting Updates

### Update Failed?

```bash
# Check git status
cd /var/www/intern-attendance
git status

# If there are conflicts, see what changed
git diff

# If you need to reset (careful - loses local changes)
git reset --hard origin/main
```

### Build Failed?

```bash
# Check build errors
npm run build

# Check Node.js version
node --version  # Should be 18.x or higher

# Clear cache and rebuild
rm -rf .next
npm run build
```

### App Not Starting?

```bash
# Check PM2 logs
pm2 logs intern-attendance-system --lines 50

# Check if port is in use
sudo lsof -i :3000

# Restart PM2
pm2 restart intern-attendance-system
pm2 status
```

## Best Practices

1. **Test Locally First** - Always test changes on `localhost` before deploying
2. **Commit Often** - Small, frequent commits are easier to debug
3. **Use Branches** - Create feature branches for major changes
4. **Check Logs** - Always check `pm2 logs` after updating
5. **Backup Database** - Before major updates, backup your database:

```bash
# Backup database
cp /var/www/intern-attendance/data/attendance.db \
   /var/www/intern-attendance/data/attendance.db.backup-$(date +%Y%m%d)
```

## Automated Updates (Advanced)

You can set up automatic updates with a cron job (not recommended for production):

```bash
# Edit crontab
crontab -e

# Add this to check for updates every hour (optional)
0 * * * * cd /var/www/intern-attendance && git pull && npm run build && pm2 restart intern-attendance-system
```

**⚠️ Warning:** Automatic updates can break your app if there are errors. Manual updates are safer.

---

## Quick Reference

```bash
# Full update process
cd /var/www/intern-attendance
git pull origin main
npm install
npm run build
pm2 restart intern-attendance-system
pm2 logs intern-attendance-system --lines 20

# Or use the script
~/update-app.sh
```

**That's it!** Your changes will be live on `http://192.168.1.113` (or your domain) after updating.


