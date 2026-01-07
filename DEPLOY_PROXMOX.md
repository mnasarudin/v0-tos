# Deploy to Proxmox VM - Production Guide 🚀

Complete guide to deploy your Intern Attendance System to a Proxmox virtual machine for production use.

## Prerequisites

- ✅ Proxmox VM created and running
- ✅ SSH access to the VM
- ✅ Domain name (optional but recommended for HTTPS)
- ✅ Root or sudo access on the VM

## Step 1: Initial VM Setup

### 1.1 Connect to Your VM

```bash
ssh root@your-vm-ip
# or
ssh your-username@your-vm-ip
```

### 1.2 Update System

```bash
# For Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# For CentOS/RHEL
sudo yum update -y
```

### 1.3 Install Required Software

```bash
# Install Node.js 18.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should be v18.x or higher
npm --version

# Install Git
sudo apt install -y git

# Install Nginx
sudo apt install -y nginx

# Install PM2 globally
sudo npm install -g pm2

# Install Certbot for SSL (if using domain)
sudo apt install -y certbot python3-certbot-nginx

# Install build essentials (for native modules)
sudo apt install -y build-essential python3
```

## Step 2: Clone Your Repository

```bash
# Create app directory
sudo mkdir -p /var/www
cd /var/www

# Clone your repository
sudo git clone https://github.com/your-username/v0-tos.git intern-attendance
# OR if using SSH:
# sudo git clone git@github.com:your-username/v0-tos.git intern-attendance

# Set ownership
sudo chown -R $USER:$USER /var/www/intern-attendance
cd intern-attendance
```

## Step 3: Install Dependencies and Build

```bash
# Install dependencies
npm install

# Build the application for production
npm run build

# Create necessary directories
mkdir -p logs data
```

## Step 4: Configure Environment Variables

```bash
# Create .env file
nano .env
```

Add the following environment variables:

```env
# Application
NODE_ENV=production
PORT=3000
DATABASE_PATH=/var/www/intern-attendance/data/attendance.db

# Email Configuration (Gmail)
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-gmail-app-password

# Optional: Twilio SMS
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=your-twilio-number

# Optional: Resend Email
RESEND_API_KEY=your-resend-key
```

**Important:** 
- For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833)
- Never commit `.env` file to Git

## Step 5: Initialize Database

```bash
# Initialize the database
npm run db:init

# Verify database was created
ls -lh data/attendance.db
```

## Step 6: Configure PM2 for Production

The `ecosystem.config.js` should be updated for production. Run:

```bash
# Start the application with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Follow the instructions shown (usually run a sudo command)
```

## Step 7: Configure Nginx Reverse Proxy

### 7.1 Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/intern-attendance
```

Copy the configuration from `nginx.conf.example` and update:

```nginx
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Redirect all HTTP traffic to HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL Certificate paths (set by Certbot)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Increase body size for file uploads
    client_max_body_size 10M;
    
    # Proxy to Next.js app
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        
        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Cache bypass
        proxy_cache_bypass $http_upgrade;
    }
    
    # Static files caching
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }
}
```

**If you don't have a domain (using IP only):**

```nginx
server {
    listen 80;
    server_name your-vm-ip-address;
    
    client_max_body_size 10M;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }
}
```

### 7.2 Enable the Site

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/intern-attendance /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## Step 8: Setup SSL Certificate (If Using Domain)

```bash
# Get SSL certificate from Let's Encrypt
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

**Note:** Certbot will automatically update your Nginx configuration.

## Step 9: Configure Firewall

```bash
# Install UFW (if not installed)
sudo apt install -y ufw

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP
sudo ufw allow 80/tcp

# Allow HTTPS
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

## Step 10: Verify Deployment

### 10.1 Check PM2 Status

```bash
pm2 status
pm2 logs intern-attendance-system
```

### 10.2 Check Nginx Status

```bash
sudo systemctl status nginx
```

### 10.3 Test Application

- **With domain:** Open `https://your-domain.com`
- **With IP only:** Open `http://your-vm-ip`

## Step 11: Post-Deployment Tasks

### 11.1 Create Admin Account

```bash
cd /var/www/intern-attendance
npm run db:init
# Or use the create-admin script if available
```

### 11.2 Setup Automatic Backups

Create a backup script:

```bash
sudo nano /usr/local/bin/backup-attendance.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/intern-attendance"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup database
cp /var/www/intern-attendance/data/attendance.db $BACKUP_DIR/attendance_$DATE.db

# Keep only last 7 days of backups
find $BACKUP_DIR -name "attendance_*.db" -mtime +7 -delete

echo "Backup completed: attendance_$DATE.db"
```

Make it executable:

```bash
sudo chmod +x /usr/local/bin/backup-attendance.sh
```

Add to crontab (daily at 2 AM):

```bash
sudo crontab -e
# Add this line:
0 2 * * * /usr/local/bin/backup-attendance.sh
```

## Troubleshooting

### Application Not Starting

```bash
# Check PM2 logs
pm2 logs intern-attendance-system --lines 50

# Check if port 3000 is in use
sudo netstat -tulpn | grep 3000

# Restart PM2
pm2 restart intern-attendance-system
```

### Nginx 502 Bad Gateway

```bash
# Check if Next.js is running
pm2 status

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Verify proxy_pass URL
sudo nginx -t
```

### Database Issues

```bash
# Check database file permissions
ls -lh /var/www/intern-attendance/data/attendance.db

# Fix permissions if needed
chmod 664 /var/www/intern-attendance/data/attendance.db
chown $USER:$USER /var/www/intern-attendance/data/attendance.db
```

### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew

# Check Nginx SSL configuration
sudo nginx -t
```

## Useful Commands

```bash
# PM2 Commands
pm2 status                          # Check status
pm2 logs intern-attendance-system   # View logs
pm2 restart intern-attendance-system # Restart app
pm2 stop intern-attendance-system    # Stop app
pm2 delete intern-attendance-system  # Remove from PM2

# Nginx Commands
sudo systemctl status nginx         # Check status
sudo systemctl restart nginx        # Restart Nginx
sudo nginx -t                       # Test configuration
sudo tail -f /var/log/nginx/error.log # View error logs

# Application Commands
cd /var/www/intern-attendance
npm run build                       # Rebuild application
npm run db:status                   # Check database status
```

## Security Checklist

- ✅ Firewall configured (UFW)
- ✅ SSL certificate installed (if using domain)
- ✅ Environment variables secured (.env file)
- ✅ Database file permissions set correctly
- ✅ PM2 running as non-root user
- ✅ Regular backups configured
- ✅ System updates automated
- ✅ Strong passwords for admin accounts

## Performance Optimization

### Enable Nginx Caching

Add to your Nginx config:

```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=10g inactive=60m use_temp_path=off;

# Then in location block:
proxy_cache my_cache;
proxy_cache_valid 200 60m;
```

### PM2 Cluster Mode (Optional)

For better performance, you can run multiple instances:

```javascript
// In ecosystem.config.js
instances: 2,  // or 'max' for all CPU cores
exec_mode: 'cluster'
```

## Next Steps

1. ✅ Monitor application logs regularly
2. ✅ Setup monitoring (optional: PM2 Plus, Uptime Robot)
3. ✅ Configure email notifications for errors
4. ✅ Regular database backups
5. ✅ Keep system and dependencies updated

---

## Alternative: Cloudflare Tunnel (Recommended for Internal Networks)

If your VM is behind a firewall or NAT (like Proxmox), use **Cloudflare Tunnel** instead of Nginx + SSL:

**Benefits:**
- ✅ No port forwarding needed
- ✅ Automatic HTTPS/SSL
- ✅ Works behind firewall
- ✅ Free DDoS protection

**Quick Setup:**
```bash
# Install cloudflared
sudo apt-get install cloudflared

# Install service with token
sudo cloudflared service install <YOUR_SERVICE_TOKEN>

# Start service
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

See `CLOUDFLARE_TUNNEL_SETUP.md` for detailed instructions.

---

**Your application is now production-ready! 🎉**

For updates, simply:
```bash
cd /var/www/intern-attendance
git pull
npm install
npm run build
pm2 restart intern-attendance-system
```


