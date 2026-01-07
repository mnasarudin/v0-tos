# Fix: Invalid Nameservers Error 🔧

**Error:** "Invalid nameservers" for `intern-langkawiport.com`

This means your domain's nameservers at the registrar haven't been updated to Cloudflare's nameservers.

## What This Means

Your domain `intern-langkawiport.com` is registered somewhere (like GoDaddy, Namecheap, etc.), but it's not using Cloudflare's nameservers yet.

## Step-by-Step Fix

### Step 1: Get Cloudflare Nameservers

1. Go to: https://dash.cloudflare.com
2. Select your domain: `intern-langkawiport.com`
3. You'll see a page showing **Cloudflare Nameservers**
4. They look like:
   ```
   alice.ns.cloudflare.com
   bob.ns.cloudflare.com
   ```
   Or:
   ```
   <something>.ns.cloudflare.com
   <something>.ns.cloudflare.com
   ```
5. **Copy both nameservers** - you'll need them!

### Step 2: Find Your Domain Registrar

Your domain `intern-langkawiport.com` is registered at a domain registrar. Common ones:
- GoDaddy
- Namecheap
- Google Domains
- Cloudflare Registrar
- Local registrar (Malaysia)

**To find out:**
- Check your email for domain registration confirmation
- Ask whoever registered the domain
- Or check WHOIS: `whois intern-langkawiport.com`

### Step 3: Update Nameservers at Registrar

1. **Log in to your domain registrar** (where you bought the domain)

2. **Find DNS/Nameserver settings:**
   - Look for: "DNS Management", "Nameservers", "DNS Settings"
   - Usually under: Domain Settings → Nameservers

3. **Change nameservers:**
   - Select "Custom Nameservers" or "Use Custom Nameservers"
   - Enter the TWO Cloudflare nameservers from Step 1:
     ```
     alice.ns.cloudflare.com
     bob.ns.cloudflare.com
     ```
   - Save/Update

4. **Important:**
   - Replace ALL existing nameservers with Cloudflare's
   - Use exactly what Cloudflare shows (case-sensitive)
   - Usually need 2 nameservers

### Step 4: Wait for Propagation

After updating nameservers:
- ⏰ Wait **24-48 hours** for full propagation
- 🔄 Usually works within **1-2 hours**
- ✅ Cloudflare will show "Active" when nameservers are correct

### Step 5: Verify in Cloudflare

1. Go back to Cloudflare Dashboard
2. Select `intern-langkawiport.com`
3. Check status - should change from "Invalid nameservers" to:
   - ✅ "Active" (green)
   - Or shows checkmarks next to nameservers

## Common Registrars - Quick Guide

### GoDaddy
1. Log in → My Products → Domains
2. Click `intern-langkawiport.com`
3. Scroll to "Additional Settings" → "Manage DNS"
4. Click "Change" next to Nameservers
5. Select "Custom"
6. Enter Cloudflare nameservers
7. Save

### Namecheap
1. Log in → Domain List
2. Click "Manage" next to domain
3. Go to "Nameservers" tab
4. Select "Custom DNS"
5. Enter Cloudflare nameservers
6. Save

### Google Domains
1. Log in → My Domains
2. Click domain
3. Go to "DNS" tab
4. Scroll to "Name servers"
5. Click "Use custom name servers"
6. Enter Cloudflare nameservers
7. Save

## Alternative: If You Can't Access Registrar

If you don't have access to the registrar:

1. **Ask the domain owner** to update nameservers
2. **Or use Cloudflare Registrar** (transfer domain to Cloudflare)
3. **Or use subdomain instead:**
   - Use: `intern.langkawiport.com.my` (if `langkawiport.com.my` is already in Cloudflare)
   - Just create CNAME record (no nameserver change needed)

## Quick Check Commands

After updating nameservers, verify:

```bash
# Check current nameservers
dig NS intern-langkawiport.com

# Should show Cloudflare nameservers:
# intern-langkawiport.com.  IN  NS  alice.ns.cloudflare.com.
# intern-langkawiport.com.  IN  NS  bob.ns.cloudflare.com.
```

## Timeline

- **Immediate:** Nameservers updated at registrar
- **5-30 minutes:** Some DNS servers see new nameservers
- **1-2 hours:** Most DNS servers updated
- **24-48 hours:** Full global propagation

## After Nameservers Are Active

Once Cloudflare shows "Active":

1. ✅ Create DNS records (CNAME for tunnel)
2. ✅ Tunnel will work
3. ✅ Website accessible via HTTPS

## If Using Subdomain Instead

If you can't change nameservers, use a subdomain:

1. Make sure root domain `langkawiport.com.my` is in Cloudflare
2. Create CNAME: `intern` → `<TUNNEL_UUID>.cfargotunnel.com`
3. Access via: `https://intern.langkawiport.com.my`
4. No nameserver change needed!

---

**Next Steps:**
1. Get Cloudflare nameservers from dashboard
2. Update at your domain registrar
3. Wait 1-2 hours
4. Check Cloudflare - should show "Active"


