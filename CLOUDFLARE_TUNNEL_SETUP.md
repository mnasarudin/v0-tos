# Cloudflare Tunnel Setup Guide 🌐

This guide will help you set up Cloudflare Tunnel to expose your application via a subdomain (e.g., `sanbox02.langkawiport.com.my`).

## What is Cloudflare Tunnel?

Cloudflare Tunnel (formerly Argo Tunnel) allows you to expose your local application to the internet without:
- ❌ Port forwarding
- ❌ Public IP address
- ❌ Firewall configuration
- ❌ SSL certificate management (Cloudflare handles it)

**Perfect for:** Internal VMs, Proxmox servers, or any server behind NAT/firewall.

## Prerequisites

- ✅ Cloudflare account
- ✅ Domain managed by Cloudflare (e.g., `langkawiport.com.my`)
- ✅ VM/server with your application running
- ✅ SSH access to your VM

## Step 1: Install Cloudflared

On your VM, try these methods in order:

### Method 1: Direct Download (Recommended if package repo fails)

```bash
# Download latest cloudflared binary
cd /tmp
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb

# Install the .deb package
sudo dpkg -i cloudflared-linux-amd64.deb

# Fix any dependency issues
sudo apt-get install -f

# Verify installation
cloudflared --version
```

### Method 2: Using Package Repository (If Method 1 doesn't work)

```bash
# Add cloudflare gpg key
sudo mkdir -p --mode=0755 /usr/share/keyrings
curl -fsSL https://pkg.cloudflare.com/cloudflare-public-v2.gpg | sudo tee /usr/share/keyrings/cloudflare-public-v2.gpg >/dev/null

# Add this repo to your apt repositories
echo 'deb [signed-by=/usr/share/keyrings/cloudflare-public-v2.gpg] https://pkg.cloudflare.com/cloudflared any main' | sudo tee /etc/apt/sources.list.d/cloudflared.list

# Install cloudflared
sudo apt-get update && sudo apt-get install cloudflared
```

### Method 3: Manual Binary Installation

```bash
# Download binary directly
cd /tmp
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64

# Make it executable
chmod +x cloudflared-linux-amd64

# Move to system path
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared

# Verify
cloudflared --version
```

### Troubleshooting Package Repository Issues

If you get "failed to fetch" errors:

1. **Check internet connectivity:**
   ```bash
   ping pkg.cloudflare.com
   curl -I https://pkg.cloudflare.com
   ```

2. **Try without SSL verification (temporary):**
   ```bash
   curl -k -fsSL https://pkg.cloudflare.com/cloudflare-public-v2.gpg | sudo tee /usr/share/keyrings/cloudflare-public-v2.gpg >/dev/null
   ```

3. **Use GitHub releases instead (Method 1 above)**

4. **Check DNS resolution:**
   ```bash
   nslookup pkg.cloudflare.com
   dig pkg.cloudflare.com
   ```

5. **Check firewall/proxy:**
   ```bash
   # If behind proxy, set proxy
   export http_proxy=http://your-proxy:port
   export https_proxy=http://your-proxy:port
   ```

## Step 2: Authenticate Cloudflared

```bash
# Login to Cloudflare (opens browser)
cloudflared tunnel login

# This will:
# 1. Open your browser
# 2. Ask you to select your domain
# 3. Authorize Cloudflare Tunnel
# 4. Save credentials to ~/.cloudflared/cert.pem
```

## Step 3: Create a Tunnel

```bash
# Create a new tunnel
cloudflared tunnel create intern-attendance

# This creates a tunnel and saves its UUID
# Note the UUID - you'll need it for configuration
```

## Step 4: Configure the Tunnel

### Important: Service Token vs Manual Setup

**If you used Service Token (what you did):**
- ✅ **No config file needed!** The service token contains all configuration
- ✅ DNS is created automatically
- ✅ Just verify it's working: `sudo systemctl status cloudflared`

**If you need to create config manually:**

Create configuration file in system location (NOT in app directory):

```bash
# Create config directory (system-wide location)
sudo mkdir -p /etc/cloudflared

# Create config file
sudo nano /etc/cloudflared/config.yml
```

Add this configuration:

```yaml
tunnel: <YOUR_TUNNEL_UUID>
credentials-file: /home/<YOUR_USER>/.cloudflared/<TUNNEL_UUID>.json

ingress:
  # Route your subdomain to localhost:3000 (your Next.js app)
  - hostname: sanbox02.langkawiport.com.my
    service: http://localhost:3000
  
  # Catch-all rule (must be last)
  - service: http_status:404
```

**Replace:**
- `<YOUR_TUNNEL_UUID>` - The UUID from `cloudflared tunnel create`
- `<YOUR_USER>` - Your VM username (e.g., `user`)

**Important:** 
- ❌ **NOT** in `/var/www/intern-attendance` (app directory)
- ❌ **NOT** in `~` (home directory) - unless running as user service
- ✅ **YES** in `/etc/cloudflared/` (system-wide location)

## Step 5: Create DNS Route

```bash
# Create DNS route for your subdomain
cloudflared tunnel route dns intern-attendance sanbox02.langkawiport.com.my

# This creates a CNAME record in Cloudflare DNS
```

## Step 6: Install as System Service

**Option A: Using Service Token (Recommended - What you did)**

```bash
# Install service with token
sudo cloudflared service install <YOUR_SERVICE_TOKEN>

# Start the service
sudo systemctl start cloudflared

# Enable auto-start on boot
sudo systemctl enable cloudflared

# Check status
sudo systemctl status cloudflared
```

**Option B: Manual Service Setup**

```bash
# Create systemd service
sudo nano /etc/systemd/system/cloudflared.service
```

Add:

```ini
[Unit]
Description=Cloudflare Tunnel
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/cloudflared tunnel --config /etc/cloudflared/config.yml run intern-attendance
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
sudo systemctl status cloudflared
```

## Step 7: Verify Your Application

1. **Check Cloudflared logs:**
   ```bash
   sudo journalctl -u cloudflared -f
   ```

2. **Test your subdomain:**
   - Open: `https://sanbox02.langkawiport.com.my`
   - Should show your application

3. **Check DNS:**
   ```bash
   dig sanbox02.langkawiport.com.my
   # Should resolve to Cloudflare IPs
   ```

## Step 8: Update Your Application

Make sure your Next.js app is configured correctly:

### Check `.env` file:

```bash
cd /var/www/intern-attendance
nano .env
```

Ensure these are set:

```env
NODE_ENV=production
PORT=3000
# Your app should listen on localhost:3000
```

### Verify PM2 is running:

```bash
pm2 status
pm2 logs intern-attendance-system --lines 20
```

## Troubleshooting

### Tunnel Not Connecting?

```bash
# Check tunnel status
cloudflared tunnel info intern-attendance

# Check logs
sudo journalctl -u cloudflared -n 50

# Test tunnel manually
cloudflared tunnel --config /etc/cloudflared/config.yml run intern-attendance
```

### Application Not Accessible?

1. **Check if app is running:**
   ```bash
   curl http://localhost:3000
   ```

2. **Check firewall (should allow localhost):**
   ```bash
   sudo ufw status
   # Port 3000 should be accessible locally
   ```

3. **Check Cloudflare DNS:**
   ```bash
   dig sanbox02.langkawiport.com.my
   # Should show CNAME to tunnel
   ```

### SSL/HTTPS Issues?

Cloudflare Tunnel automatically provides HTTPS. If you see SSL errors:

1. Check Cloudflare SSL/TLS settings:
   - Go to Cloudflare Dashboard → SSL/TLS
   - Set to "Full" or "Full (strict)"

2. Verify DNS is proxied (orange cloud):
   - Go to Cloudflare Dashboard → DNS
   - Ensure proxy is enabled (orange cloud icon)

### Service Token Issues?

If using service token (what you did), verify:

```bash
# Check service status
sudo systemctl status cloudflared

# View service logs
sudo journalctl -u cloudflared -f

# Restart service
sudo systemctl restart cloudflared
```

## Benefits of Cloudflare Tunnel

✅ **Automatic HTTPS** - SSL handled by Cloudflare  
✅ **No Port Forwarding** - Works behind NAT/firewall  
✅ **DDoS Protection** - Cloudflare's network protection  
✅ **Free SSL** - Automatic certificate management  
✅ **Easy Setup** - No complex networking configuration  

## Next Steps

1. ✅ Your tunnel is set up and running
2. ✅ Your app is accessible via `https://sanbox02.langkawiport.com.my`
3. ✅ HTTPS works automatically
4. ✅ Geolocation will now work (HTTPS enabled!)

## Update Your App Configuration

Since you now have HTTPS, you can:

1. **Remove HTTP fallback** (optional):
   - Your location code will now use real GPS
   - No need for default location fallback

2. **Update any hardcoded URLs**:
   - Change `http://192.168.1.113` to `https://sanbox02.langkawiport.com.my`
   - Update any API endpoints

3. **Test geolocation**:
   - Open `https://sanbox02.langkawiport.com.my/dashboard/attendance`
   - GPS location should work now!

## Maintenance

### Update Cloudflared:

```bash
sudo apt-get update
sudo apt-get upgrade cloudflared
sudo systemctl restart cloudflared
```

### View Tunnel Logs:

```bash
sudo journalctl -u cloudflared -f
```

### Restart Tunnel:

```bash
sudo systemctl restart cloudflared
```

---

**Your application is now live and accessible via HTTPS! 🎉**

Access it at: `https://sanbox02.langkawiport.com.my`

