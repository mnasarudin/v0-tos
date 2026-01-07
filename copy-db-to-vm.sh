#!/bin/bash

# Script to copy database from Mac to Proxmox VM
# Usage: ./copy-db-to-vm.sh

VM_IP="192.168.1.113"
VM_USER="user"
VM_PASSWORD="user@123"
LOCAL_DB_PATH="/Users/wanadiba/v0-tos/data/attendance.db"
VM_DB_PATH="/var/www/intern-attendance/data/attendance.db"

echo "🔄 Copying database to VM..."

# Check if local database exists
if [ ! -f "$LOCAL_DB_PATH" ]; then
    echo "❌ Error: Database file not found at $LOCAL_DB_PATH"
    exit 1
fi

echo "📦 Found database file: $LOCAL_DB_PATH"
echo "📊 Database size: $(ls -lh "$LOCAL_DB_PATH" | awk '{print $5}')"

# Create directory on VM if it doesn't exist
echo "📁 Creating directory on VM..."
sshpass -p "$VM_PASSWORD" ssh "$VM_USER@$VM_IP" "mkdir -p /var/www/intern-attendance/data"

# Copy database file
echo "📤 Copying database file..."
sshpass -p "$VM_PASSWORD" scp "$LOCAL_DB_PATH" "$VM_USER@$VM_IP:$VM_DB_PATH"

# Set permissions
echo "🔐 Setting permissions..."
sshpass -p "$VM_PASSWORD" ssh "$VM_USER@$VM_IP" "chmod 664 $VM_DB_PATH && chown $VM_USER:$VM_USER $VM_DB_PATH"

# Restart PM2
echo "♻️  Restarting application..."
sshpass -p "$VM_PASSWORD" ssh "$VM_USER@$VM_IP" "cd /var/www/intern-attendance && pm2 restart intern-attendance"

echo "✅ Database copied successfully!"
echo ""
echo "📝 Next steps:"
echo "   1. Check logs: ssh $VM_USER@$VM_IP 'pm2 logs intern-attendance'"
echo "   2. Test login at: http://lpsp.intern"

