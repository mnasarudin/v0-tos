#!/bin/bash

# Update script for Intern Attendance System
# Usage: ./update-app.sh

set -e  # Exit on error

APP_DIR="/var/www/intern-attendance"
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔄 Updating Intern Attendance System...${NC}"
echo ""

# Check if app directory exists
if [ ! -d "$APP_DIR" ]; then
    echo -e "${RED}❌ App directory not found: $APP_DIR${NC}"
    exit 1
fi

cd "$APP_DIR"

# Check git status
echo -e "${YELLOW}📥 Pulling latest changes from GitHub...${NC}"
if ! git pull origin main; then
    echo -e "${RED}❌ Git pull failed! Check your connection and try again.${NC}"
    exit 1
fi

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
if ! npm install; then
    echo -e "${RED}❌ npm install failed!${NC}"
    exit 1
fi

# Build application
echo -e "${YELLOW}🔨 Building application...${NC}"
if ! npm run build; then
    echo -e "${RED}❌ Build failed! Check the errors above.${NC}"
    exit 1
fi

# Restart or Start PM2
echo -e "${YELLOW}🔄 Restarting/Starting application...${NC}"
if pm2 list | grep -q "intern-attendance-system"; then
    # Process exists, restart it
    if ! pm2 restart intern-attendance-system; then
        echo -e "${RED}❌ PM2 restart failed!${NC}"
        exit 1
    fi
else
    # Process doesn't exist, start it
    echo -e "${YELLOW}⚠️  Process not found, starting new instance...${NC}"
    if ! pm2 start ecosystem.config.js; then
        echo -e "${RED}❌ PM2 start failed!${NC}"
        exit 1
    fi
    pm2 save
fi

# Show status
echo ""
echo -e "${GREEN}✅ Update complete!${NC}"
echo ""
echo "📊 Application Status:"
pm2 status intern-attendance-system

echo ""
echo -e "${GREEN}📋 Recent logs (last 10 lines):${NC}"
pm2 logs intern-attendance-system --lines 10 --nostream

echo ""
echo -e "${GREEN}✨ Your application is now updated and running!${NC}"

