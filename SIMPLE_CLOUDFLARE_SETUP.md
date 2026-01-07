# Setup Cloudflare Tunnel - Cara Mudah 🚀

## Langkah 1: Install Cloudflared

```bash
cd /tmp
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
sudo apt-get install -f -y
```

## Langkah 2: Login

```bash
cloudflared tunnel login
# Pilih domain: langkawiport.com.my
```

## Langkah 3: Buat Tunnel

```bash
cloudflared tunnel create intern
# Copy UUID yang keluar!
```

## Langkah 4: Buat DNS (Auto)

```bash
cloudflared tunnel route dns intern intern.langkawiport.com.my
```

## Langkah 5: Setup Config

```bash
sudo mkdir -p /etc/cloudflared
sudo nano /etc/cloudflared/config.yml
```

Masukkan (ganti `<UUID>` dan `<USER>` dengan yang betul):

```yaml
tunnel: <UUID>
credentials-file: /home/<USER>/.cloudflared/<UUID>.json

ingress:
  - hostname: intern.langkawiport.com.my
    service: http://localhost:3000
  - service: http_status:404
```

## Langkah 6: Test

```bash
cloudflared tunnel --config /etc/cloudflared/config.yml run intern
# Kalau OK, tekan Ctrl+C
```

## Langkah 7: Install Service

```bash
sudo nano /etc/systemd/system/cloudflared.service
```

Masukkan:

```ini
[Unit]
Description=Cloudflare Tunnel
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/cloudflared tunnel --config /etc/cloudflared/config.yml run intern
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Kemudian:

```bash
sudo systemctl daemon-reload
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
sudo systemctl status cloudflared
```

## Selesai! ✅

Buka: `https://intern.langkawiport.com.my`

---

**Kalau masih susah, tanya encik nasa untuk service token yang dah siap!**


