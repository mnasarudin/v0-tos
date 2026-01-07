# Fix: "Cannot Determine Default Origin Certificate Path" 🔧

**Error:** `cannot determine default origin certificate path` when running `cloudflared tunnel list`

This happens because cloudflared CLI needs authentication, but you installed it as a service with a token.

## Quick Fix Options

### Option 1: Check Service Status (Easiest)

Since you installed with service token, check the service directly:

```bash
# Check if service is running
sudo systemctl status cloudflared

# View service logs (shows tunnel info)
sudo journalctl -u cloudflared -n 50

# Look for tunnel UUID in the logs
sudo journalctl -u cloudflared | grep -i "tunnel\|uuid\|connection"
```

### Option 2: Login to Cloudflared (For CLI Access)

```bash
# Login to Cloudflare (opens browser)
cloudflared tunnel login

# This will:
# 1. Open browser
# 2. Ask you to select domain: langkawiport.com.my
# 3. Authorize
# 4. Save cert to ~/.cloudflared/cert.pem

# Then try again
cloudflared tunnel list
```

### Option 3: Find Tunnel Info from Service Config

```bash
# Check service config file
sudo cat /etc/cloudflared/config.yml

# Or check systemd service
sudo systemctl cat cloudflared

# Look for tunnel UUID in the output
```

### Option 4: Check Service Logs for Tunnel UUID

```bash
# View recent logs
sudo journalctl -u cloudflared --since "10 minutes ago"

# Look for lines like:
# - "Tunnel ID: <UUID>"
# - "Registered tunnel connection"
# - Connection URLs
```

## Get Tunnel UUID from Logs

```bash
# Extract tunnel UUID from logs
sudo journalctl -u cloudflared | grep -oP 'tunnel/[a-f0-9-]+' | head -1

# Or check all tunnel-related info
sudo journalctl -u cloudflared | grep -i tunnel
```

## Alternative: Use Cloudflare Dashboard

If CLI doesn't work, get tunnel info from dashboard:

1. Go to: https://one.dash.cloudflare.com/
2. Go to **Networks** → **Tunnels**
3. You'll see your tunnel listed with UUID
4. Copy the UUID

## Quick Solution

**Since you're using service token, you don't need CLI access!**

Just get the tunnel UUID from one of these:

1. **Service logs:**
   ```bash
   sudo journalctl -u cloudflared | grep -i tunnel
   ```

2. **Cloudflare Dashboard:**
   - https://one.dash.cloudflare.com/
   - Networks → Tunnels
   - See tunnel UUID there

3. **Service config:**
   ```bash
   sudo cat /etc/cloudflared/config.yml
   ```

Then use that UUID to create your DNS record!

## Create DNS Record (Once You Have UUID)

1. Go to: https://dash.cloudflare.com
2. Select: `langkawiport.com.my`
3. DNS → Records → Add record
4. Set:
   - Type: `CNAME`
   - Name: `intern` (or `sanbox02`)
   - Target: `<TUNNEL_UUID>.cfargotunnel.com`
   - Proxy: Proxied (orange cloud)
5. Save

## Verify Service is Working

```bash
# Check service status
sudo systemctl status cloudflared

# Should show: "active (running)"
# If not, start it:
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

---

**TL;DR:** You don't need `cloudflared tunnel list` if using service token. Just get UUID from logs or dashboard, then create DNS record!


