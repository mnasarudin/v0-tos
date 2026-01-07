# Free Domain Name Setup Guide 🌐

This guide will help you set up a free domain name for your application so you can use HTTPS and enable geolocation features.

## Option 1: DuckDNS (Recommended - Easiest) ✅

DuckDNS provides free subdomains like `yourapp.duckdns.org`.

### Step 1: Create DuckDNS Account

1. Go to [https://www.duckdns.org/](https://www.duckdns.org/)
2. Sign in with your Google, Reddit, or GitHub account
3. Choose a subdomain name (e.g., `lpsp-attendance`)
4. Your domain will be: `lpsp-attendance.duckdns.org`

### Step 2: Install DuckDNS Updater on Your VM

```bash
# SSH into your VM
ssh root@your-vm-ip

# Create directory for DuckDNS
mkdir -p ~/duckdns
cd ~/duckdns

# Create update script
nano duck.sh
```

Add this content (replace `YOUR_TOKEN` and `YOUR_SUBDOMAIN`):

```bash
#!/bin/bash
echo url="https://www.duckdns.org/update?domains=YOUR_SUBDOMAIN&token=YOUR_TOKEN&ip=" | curl -k -o ~/duckdns/duck.log -K -
```

Make it executable:
```bash
chmod +x duck.sh
```

### Step 3: Test DuckDNS Update

```bash
# Run manually to test
./duck.sh

# Check the log
cat ~/duckdns/duck.log
# Should say "OK"
```

### Step 4: Set Up Auto-Update (Cron Job)

```bash
# Edit crontab
crontab -e

# Add this line to update every 5 minutes
*/5 * * * * ~/duckdns/duck.sh >/dev/null 2>&1
```

### Step 5: Update Nginx Configuration

```bash
# Edit Nginx config
sudo nano /etc/nginx/sites-available/intern-attendance
```

Update the `server_name`:

```nginx
server {
    listen 80;
    server_name lpsp-attendance.duckdns.org;  # Your DuckDNS domain
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Step 6: Get SSL Certificate with Certbot

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d lpsp-attendance.duckdns.org

# Follow the prompts:
# - Enter your email
# - Agree to terms
# - Choose whether to redirect HTTP to HTTPS (recommended: Yes)
```

### Step 7: Test Your Domain

Open in browser: `https://lpsp-attendance.duckdns.org`

---

## Option 2: No-IP (Free Subdomain)

No-IP provides free subdomains but requires renewal every 30 days.

### Step 1: Create No-IP Account

1. Go to [https://www.noip.com/](https://www.noip.com/)
2. Sign up for a free account
3. Create a hostname (e.g., `lpsp-attendance.ddns.net`)

### Step 2: Install No-IP Dynamic Update Client

```bash
# Download and install
cd /usr/local/src
sudo wget https://www.noip.com/client/linux/noip-duc-linux.tar.gz
sudo tar xzf noip-duc-linux.tar.gz
cd noip-2.1.9-1/

# Compile and install
sudo make install

# Configure (enter your No-IP credentials)
sudo /usr/local/bin/noip2 -C

# Start the service
sudo /usr/local/bin/noip2
```

### Step 3: Set Up Auto-Start

```bash
# Create systemd service
sudo nano /etc/systemd/system/noip.service
```

Add:

```ini
[Unit]
Description=No-IP Dynamic DNS Update Client
After=network.target

[Service]
Type=forking
ExecStart=/usr/local/bin/noip2

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable noip
sudo systemctl start noip
```

### Step 4: Update Nginx and Get SSL

Follow the same Nginx and Certbot steps as DuckDNS (Option 1, Steps 5-6).

---

## Option 3: Cloudflare Tunnel (Advanced - Free SSL)

If you already have a domain name, Cloudflare provides free SSL and DNS.

### Step 1: Add Domain to Cloudflare

1. Sign up at [https://www.cloudflare.com/](https://www.cloudflare.com/)
2. Add your domain
3. Update nameservers at your domain registrar

### Step 2: Install Cloudflare Tunnel

```bash
# Install cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Authenticate
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create lpsp-attendance

# Configure tunnel
cloudflared tunnel route dns lpsp-attendance yourdomain.com
```

### Step 3: Run Tunnel

```bash
# Create config file
mkdir -p ~/.cloudflared
nano ~/.cloudflared/config.yml
```

Add:

```yaml
tunnel: YOUR_TUNNEL_ID
credentials-file: /home/YOUR_USER/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
  - hostname: yourdomain.com
    service: http://localhost:3000
  - service: http_status:404
```

Run tunnel:

```bash
cloudflared tunnel run lpsp-attendance
```

---

## Quick Comparison

| Service | Domain Format | SSL | Renewal | Difficulty |
|---------|--------------|-----|---------|------------|
| **DuckDNS** | `yourapp.duckdns.org` | ✅ Free (Certbot) | ✅ Auto | ⭐ Easy |
| **No-IP** | `yourapp.ddns.net` | ✅ Free (Certbot) | ⚠️ Every 30 days | ⭐⭐ Medium |
| **Cloudflare** | `yourdomain.com` | ✅ Free (Built-in) | ✅ Auto | ⭐⭐⭐ Advanced |

---

## Recommended: DuckDNS Setup

**Why DuckDNS?**
- ✅ Completely free
- ✅ No renewal needed
- ✅ Easy setup
- ✅ Works with Certbot for free SSL
- ✅ Reliable service

**Quick Setup Commands:**

```bash
# 1. Get your token from duckdns.org
# 2. Create update script
mkdir -p ~/duckdns && cd ~/duckdns
echo 'echo url="https://www.duckdns.org/update?domains=YOUR_SUBDOMAIN&token=YOUR_TOKEN&ip=" | curl -k -o ~/duckdns/duck.log -K -' > duck.sh
chmod +x duck.sh

# 3. Test it
./duck.sh

# 4. Add to crontab (updates every 5 minutes)
(crontab -l 2>/dev/null; echo "*/5 * * * * ~/duckdns/duck.sh >/dev/null 2>&1") | crontab -

# 5. Update Nginx server_name to your DuckDNS domain
sudo nano /etc/nginx/sites-available/intern-attendance

# 6. Get SSL certificate
sudo certbot --nginx -d YOUR_SUBDOMAIN.duckdns.org
```

---

## After Setup: Update Your App

Once you have HTTPS working:

1. ✅ Geolocation will work automatically
2. ✅ Your app will be accessible via `https://yourdomain.duckdns.org`
3. ✅ All features requiring HTTPS will work

## Troubleshooting

### Domain Not Updating
- Check DuckDNS script is running: `cat ~/duckdns/duck.log`
- Verify cron job: `crontab -l`
- Test manually: `~/duckdns/duck.sh`

### SSL Certificate Issues
- Make sure port 80 is open: `sudo ufw allow 80`
- Check Nginx is running: `sudo systemctl status nginx`
- Verify domain points to your IP: `nslookup yourdomain.duckdns.org`

### Can't Access Domain
- Check firewall: `sudo ufw status`
- Verify Nginx config: `sudo nginx -t`
- Check DNS propagation: `dig yourdomain.duckdns.org`

---

**Need Help?** Check the main deployment guide: `DEPLOY_PROXMOX.md`


