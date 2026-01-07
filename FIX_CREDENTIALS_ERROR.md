# Fix: Tunnel Credentials Doesn't Exist Error 🔧

**Error:** `tunnel credentials doesn't exist or isn't a file`

This means the config file is pointing to the wrong credentials file path.

## Step 1: Find Where Credentials Actually Are

```bash
# Check where credentials were saved
ls -la ~/.cloudflared/

# Look for files like:
# - cert.pem
# - <UUID>.json
# - credentials.json
```

## Step 2: Check What Files Exist

```bash
# List all cloudflared files
find ~/.cloudflared -type f

# Or check home directory
ls -la ~/.cloudflared/
```

## Step 3: If Credentials Don't Exist - Create Tunnel Again

```bash
# Create tunnel (this creates credentials)
cloudflared tunnel create intern-attendance

# This will:
# - Create tunnel
# - Save credentials to ~/.cloudflared/<UUID>.json
# - Show you the UUID
```

**Note the UUID and file path shown!**

## Step 4: Update Config File with Correct Path

```bash
# Edit config
sudo nano /etc/cloudflared/config.yml
```

Make sure the path matches what was created:

```yaml
tunnel: <YOUR_TUNNEL_UUID>
credentials-file: /home/<YOUR_USERNAME>/.cloudflared/<TUNNEL_UUID>.json

ingress:
  - hostname: intern.langkawiport.com.my
    service: http://localhost:3000
  - service: http_status:404
```

**Important:** 
- Replace `<YOUR_USERNAME>` with your actual username (e.g., `user`)
- Replace `<TUNNEL_UUID>` with the actual UUID from Step 3
- The path must be **absolute** (starts with `/`)

**Example:**
```yaml
tunnel: a5bd678c-3be6-d70a-fd8e-bd20e54211e
credentials-file: /home/user/.cloudflared/a5bd678c-3be6-d70a-fd8e-bd20e54211e.json

ingress:
  - hostname: intern.langkawiport.com.my
    service: http://localhost:3000
  - service: http_status:404
```

## Step 5: Verify Credentials File Exists

```bash
# Check if file exists (replace with your actual path)
ls -la /home/user/.cloudflared/a5bd678c-3be6-d70a-fd8e-bd20e54211e.json

# Should show the file exists
# If not, the tunnel wasn't created properly
```

## Step 6: Fix Permissions (If Needed)

```bash
# Make sure credentials are readable
chmod 600 ~/.cloudflared/*.json
chmod 600 ~/.cloudflared/cert.pem

# If running as root, copy to root's home
sudo cp ~/.cloudflared/*.json /root/.cloudflared/ 2>/dev/null || true
```

## Alternative: Use Cert.pem Instead

If you logged in with `cloudflared tunnel login`, you might have `cert.pem`:

```bash
# Check if cert.pem exists
ls -la ~/.cloudflared/cert.pem

# If it exists, you can use it in config:
```

```yaml
tunnel: <YOUR_TUNNEL_UUID>
credentials-file: /home/<YOUR_USERNAME>/.cloudflared/cert.pem

ingress:
  - hostname: intern.langkawiport.com.my
    service: http://localhost:3000
  - service: http_status:404
```

## Complete Fix Process

```bash
# 1. Find your username
whoami

# 2. Create tunnel (if not exists)
cloudflared tunnel create intern-attendance

# 3. Note the UUID and file path shown

# 4. Check credentials file exists
ls -la ~/.cloudflared/

# 5. Update config with correct path
sudo nano /etc/cloudflared/config.yml

# 6. Test config
cloudflared tunnel --config /etc/cloudflared/config.yml run intern-attendance
```

## Common Issues

### Issue 1: Wrong Username in Path

**Fix:** Use `whoami` to get your actual username, then update config

### Issue 2: File Doesn't Exist

**Fix:** Run `cloudflared tunnel create intern-attendance` again

### Issue 3: Running as Root

**Fix:** Either:
- Copy credentials to `/root/.cloudflared/`
- Or use your user's home path: `/home/user/.cloudflared/`

### Issue 4: Relative Path

**Fix:** Use absolute path (starts with `/`), not relative

## Quick Check Commands

```bash
# 1. Check your username
whoami

# 2. Check credentials location
ls -la ~/.cloudflared/

# 3. Check config path
sudo cat /etc/cloudflared/config.yml | grep credentials-file

# 4. Verify file exists
sudo test -f /home/user/.cloudflared/<UUID>.json && echo "Exists" || echo "Missing"
```

---

**Most common fix:** Update the credentials-file path in config.yml to match where the file actually is!


