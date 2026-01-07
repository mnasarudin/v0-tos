# Fix: Safari Can't Find Server Error 🔧

Error: `Safari can't find server sanbox02.langkawiport.com.my`

This means DNS is not resolving. Let's fix it step by step.

## Step 1: Check if Cloudflared Service is Running

On your VM, run:

```bash
# Check service status
sudo systemctl status cloudflared

# If not running, start it:
sudo systemctl start cloudflared
sudo systemctl enable cloudflared

# Check logs
sudo journalctl -u cloudflared -f
```

**Look for:**
- ✅ "Connection established"
- ✅ "Registered tunnel connection"
- ❌ Any errors

## Step 2: Check DNS Record in Cloudflare

1. Go to: https://dash.cloudflare.com
2. Select your domain: `langkawiport.com.my`
3. Go to **DNS** → **Records**
4. Look for a record named `sanbox02`

**If the record DOES NOT exist:**

### Create DNS Record Manually

1. In Cloudflare Dashboard → DNS → Records
2. Click **Add record**
3. Fill in:
   - **Type**: `CNAME`
   - **Name**: `sanbox02`
   - **Target**: `<YOUR_TUNNEL_UUID>.cfargotunnel.com`
   - **Proxy status**: **Proxied** (orange cloud ☁️) - **IMPORTANT!**
   - **TTL**: Auto
4. Click **Save**

### Find Your Tunnel UUID

On your VM:

```bash
# Method 1: List tunnels
cloudflared tunnel list

# Method 2: Check service config
sudo cat /etc/cloudflared/config.yml | grep tunnel

# Method 3: Check logs
sudo journalctl -u cloudflared | grep -i tunnel
```

The UUID looks like: `a5bd678c-3be6-d70a-fd8e-bd20e54211e`

## Step 3: Verify DNS Resolution

On your VM or local machine:

```bash
# Check DNS
dig sanbox02.langkawiport.com.my

# Or
nslookup sanbox02.langkawiport.com.my

# Should show:
# - CNAME to <UUID>.cfargotunnel.com
# - Or Cloudflare IPs (104.x.x.x or 172.x.x.x)
```

## Step 4: Wait for DNS Propagation

After creating DNS record:
- ⏰ Wait 1-5 minutes for DNS to propagate
- 🔄 Try again: `https://sanbox02.langkawiport.com.my`

## Step 5: Verify Tunnel is Connected

```bash
# Check tunnel status
cloudflared tunnel info <TUNNEL_NAME>

# Or check service logs
sudo journalctl -u cloudflared -n 50
```

## Common Issues & Fixes

### Issue 1: DNS Record Not Created

**Fix:** Create CNAME record in Cloudflare Dashboard (Step 2)

### Issue 2: Proxy Not Enabled

**Fix:** Make sure the orange cloud ☁️ is enabled (Proxied) in DNS record

### Issue 3: Wrong Tunnel UUID

**Fix:** 
1. Get correct UUID: `cloudflared tunnel list`
2. Update DNS record target to: `<UUID>.cfargotunnel.com`

### Issue 4: Cloudflared Not Running

**Fix:**
```bash
sudo systemctl start cloudflared
sudo systemctl status cloudflared
```

### Issue 5: App Not Running

**Fix:**
```bash
# Check PM2
pm2 status

# If not running:
cd /var/www/intern-attendance
pm2 start ecosystem.config.js
pm2 save

# Test locally
curl http://localhost:3000
```

## Quick Checklist

- [ ] Cloudflared service running: `sudo systemctl status cloudflared`
- [ ] DNS record exists in Cloudflare Dashboard
- [ ] DNS record is **Proxied** (orange cloud)
- [ ] DNS record target is `<UUID>.cfargotunnel.com`
- [ ] App running on localhost:3000
- [ ] Waited 1-5 minutes after creating DNS

## Test After Fix

```bash
# Test DNS
dig sanbox02.langkawiport.com.my

# Test website
curl -I https://sanbox02.langkawiport.com.my

# Should return HTTP 200 or 301/302
```

---

**Most likely issue:** DNS record doesn't exist or proxy is not enabled. Check Cloudflare Dashboard first!


