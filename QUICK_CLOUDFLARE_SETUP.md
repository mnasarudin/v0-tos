# Quick Cloudflare Tunnel Setup - Step by Step 🚀

For domain: `intern-langkawiport.com`

## Current Status
- ✅ Domain created: `intern-langkawiport.com`
- ⏳ Need to activate/configure DNS

## Step-by-Step Setup

### Step 1: Install Cloudflared (if not already installed)

```bash
# Download and install
cd /tmp
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
sudo apt-get install -f -y

# Verify
cloudflared --version
```

### Step 2: Get Your Service Token

You need a Cloudflare Tunnel service token. You can get it from:

**Option A: From Cloudflare Dashboard (Recommended)**
1. Go to [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/)
2. Go to **Networks** → **Tunnels**
3. Click **Create a tunnel**
4. Select **Cloudflared**
5. Give it a name (e.g., `intern-attendance`)
6. Copy the **service token** that appears

**Option B: If you already have a token**
- Use the token you got from your colleague/encik nasa

### Step 3: Install Service with Token

```bash
# Replace <YOUR_SERVICE_TOKEN> with your actual token
sudo cloudflared service install <YOUR_SERVICE_TOKEN>

# Example (don't use this, use your own):
# sudo cloudflared service install eyJhIjoiYTViZDY3NzhjM2JlNmQ3MGFmZDhlYmQyMGU1NDIxMWUiLCJ0IjoiYmRjZjcyMDktYzFkNi00MTAwLWFkYTYtNDJkZjU1Mzc4MzAwIiwicyI6Ik56ZGxaREppWVdZdFl6UmpPQzAwWW1GakxUbG1NbVl0WXpneFpHSTBZbUl5TnpZMCJ9
```

### Step 4: Start the Service

```bash
# Start cloudflared service
sudo systemctl start cloudflared

# Enable auto-start on boot
sudo systemctl enable cloudflared

# Check status
sudo systemctl status cloudflared
```

### Step 5: Verify Your App is Running

```bash
# Check PM2 status
pm2 status

# Test if app responds locally
curl http://localhost:3000

# If not running, start it:
cd /var/www/intern-attendance
pm2 start ecosystem.config.js
pm2 save
```

### Step 6: Check Cloudflared Logs

```bash
# View logs to see if tunnel is connecting
sudo journalctl -u cloudflared -f

# Look for:
# - "Connection established"
# - "Registered tunnel connection"
# - No errors
```

### Step 7: Verify DNS (Check if Created Automatically)

```bash
# Check DNS resolution
dig intern-langkawiport.com

# Or
nslookup intern-langkawiport.com
```

**If DNS is NOT created automatically:**

Go to Cloudflare Dashboard:
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your domain: `langkawiport.com.my` (or whatever your root domain is)
3. Go to **DNS** → **Records**
4. Click **Add record**
5. Set:
   - **Type**: `CNAME`
   - **Name**: `intern-langkawiport` (or just `intern` if root is `langkawiport.com.my`)
   - **Target**: `<YOUR_TUNNEL_UUID>.cfargotunnel.com`
   - **Proxy status**: Proxied (orange cloud ☁️)
6. Click **Save**

**To find your tunnel UUID:**
```bash
# List tunnels
cloudflared tunnel list

# Or check service config
sudo cat /etc/cloudflared/config.yml
```

### Step 8: Test Your Domain

```bash
# Test from command line
curl -I https://intern-langkawiport.com

# Or open in browser:
# https://intern-langkawiport.com
```

### Step 9: If DNS Activation is Required

If Cloudflare is asking you to "continue to activation" and you don't have DNS:

**This usually means:**
1. Your domain needs to be added to Cloudflare first
2. Or DNS nameservers need to be updated

**Solution:**

1. **If domain is new:**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Click **Add a Site**
   - Enter: `intern-langkawiport.com`
   - Follow the setup wizard
   - Update nameservers at your domain registrar

2. **If using subdomain:**
   - Make sure root domain (`langkawiport.com.my`) is in Cloudflare
   - Create CNAME record as shown in Step 7

## Troubleshooting

### Service Not Starting?

```bash
# Check status
sudo systemctl status cloudflared

# View detailed logs
sudo journalctl -u cloudflared -n 50

# Restart service
sudo systemctl restart cloudflared
```

### App Not Accessible?

```bash
# Check if app is running
pm2 status
curl http://localhost:3000

# Check if port 3000 is listening
sudo netstat -tlnp | grep 3000
```

### DNS Not Resolving?

1. Wait 5-10 minutes for DNS propagation
2. Check Cloudflare Dashboard → DNS → Records
3. Verify CNAME record exists
4. Check if proxy is enabled (orange cloud)

## Quick Checklist

- [ ] Cloudflared installed
- [ ] Service token obtained
- [ ] Service installed with token
- [ ] Service started and enabled
- [ ] App running on localhost:3000
- [ ] DNS record created (CNAME)
- [ ] Domain accessible via HTTPS

## Expected Result

After setup, you should be able to:
- ✅ Access: `https://intern-langkawiport.com`
- ✅ See your application
- ✅ HTTPS works automatically
- ✅ Geolocation works (real GPS)

---

**Need help?** Check the logs: `sudo journalctl -u cloudflared -f`


