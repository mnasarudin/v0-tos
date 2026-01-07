# Create Cloudflare Tunnel Manually 🔧

**Issue:** No tunnel found

Let's create a tunnel manually and set it up properly.

## Step 1: Login to Cloudflared

```bash
# Login to Cloudflare (opens browser)
cloudflared tunnel login

# This will:
# 1. Open browser
# 2. Ask you to select domain: langkawiport.com.my
# 3. Authorize Cloudflare Tunnel
# 4. Save credentials to ~/.cloudflared/cert.pem
```

## Step 2: Create a Tunnel

```bash
# Create a new tunnel
cloudflared tunnel create intern-attendance

# This will:
# - Create tunnel named "intern-attendance"
# - Show you the tunnel UUID
# - Save credentials to ~/.cloudflared/<UUID>.json
```

**Note the UUID** - it looks like: `a5bd678c-3be6-d70a-fd8e-bd20e54211e`

## Step 3: Create Configuration File

```bash
# Create config directory
sudo mkdir -p /etc/cloudflared

# Create config file
sudo nano /etc/cloudflared/config.yml
```

Add this content (replace with your actual UUID and username):

```yaml
tunnel: <YOUR_TUNNEL_UUID>
credentials-file: /home/<YOUR_USERNAME>/.cloudflared/<TUNNEL_UUID>.json

ingress:
  # Route subdomain to your app
  - hostname: intern.langkawiport.com.my
    service: http://localhost:3000
  
  # Catch-all rule (must be last)
  - service: http_status:404
```

**Replace:**
- `<YOUR_TUNNEL_UUID>` - The UUID from Step 2
- `<YOUR_USERNAME>` - Your VM username (e.g., `user`)

**Example:**
```yaml
tunnel: a5bd678c-3be6-d70a-fd8e-bd20e54211e
credentials-file: /home/user/.cloudflared/a5bd678c-3be6-d70a-fd8e-bd20e54211e.json

ingress:
  - hostname: intern.langkawiport.com.my
    service: http://localhost:3000
  - service: http_status:404
```

Save: `Ctrl+X`, then `Y`, then `Enter`

## Step 4: Create DNS Route

```bash
# Create DNS route
cloudflared tunnel route dns intern-attendance intern.langkawiport.com.my

# This creates CNAME record in Cloudflare automatically
```

## Step 5: Test Tunnel Manually

```bash
# Test tunnel (runs in foreground)
cloudflared tunnel --config /etc/cloudflared/config.yml run intern-attendance

# You should see:
# - "Connection established"
# - "Registered tunnel connection"
# - No errors

# Press Ctrl+C to stop
```

## Step 6: Install as System Service

```bash
# Stop the old service if running
sudo systemctl stop cloudflared

# Create systemd service
sudo nano /etc/systemd/system/cloudflared.service
```

Add this:

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

Save and enable:

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable service
sudo systemctl enable cloudflared

# Start service
sudo systemctl start cloudflared

# Check status
sudo systemctl status cloudflared
```

## Step 7: Verify Everything

```bash
# Check service is running
sudo systemctl status cloudflared

# Check logs
sudo journalctl -u cloudflared -f

# Test DNS
dig intern.langkawiport.com.my

# Test website (wait 1-2 minutes)
curl -I https://intern.langkawiport.com.my
```

## Alternative: If Service Token Was Used

If you installed with service token but tunnel isn't showing:

```bash
# Check if service is running
sudo systemctl status cloudflared

# Check logs for errors
sudo journalctl -u cloudflared -n 100

# If service token installation failed, remove and reinstall:
sudo systemctl stop cloudflared
sudo systemctl disable cloudflared
sudo cloudflared service uninstall

# Then follow steps above to create tunnel manually
```

## Quick Checklist

- [ ] Logged in: `cloudflared tunnel login`
- [ ] Created tunnel: `cloudflared tunnel create intern-attendance`
- [ ] Created config: `/etc/cloudflared/config.yml`
- [ ] Created DNS route: `cloudflared tunnel route dns`
- [ ] Tested manually: `cloudflared tunnel run`
- [ ] Installed service: systemd service created
- [ ] Service running: `sudo systemctl status cloudflared`
- [ ] DNS working: `dig intern.langkawiport.com.my`
- [ ] Website accessible: `https://intern.langkawiport.com.my`

---

**Start with Step 1** - Login to cloudflared, then create the tunnel!


