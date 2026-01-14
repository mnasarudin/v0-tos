# Database Setup Guide

This guide will help you set up the database for the TOS (Tender Ordering System) application.

## Prerequisites

- MySQL or MariaDB installed and running
- Node.js and npm/pnpm installed
- Access to create databases and tables

## Step 1: Create the Database

1. Open your MySQL client (MySQL Workbench, phpMyAdmin, or command line)
2. Run the base SQL file to create the database and initial tables:

```bash
mysql -u root -p < ../Tos.sql
```

Or manually:
```sql
CREATE DATABASE Tos;
USE Tos;
```

Then run the SQL commands from `Tos.sql` to create the base tables.

## Step 2: Run the Enhanced Schema

Run the enhanced schema file to add additional fields and tables:

```bash
mysql -u root -p Tos < database-schema.sql
```

Or copy and paste the contents of `database-schema.sql` into your MySQL client.

**Note:** If you get errors about `IF NOT EXISTS` or `ADD COLUMN IF NOT EXISTS`, you may need to modify the SQL to work with your MySQL version, or run the ALTER TABLE statements manually.

## Step 3: Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`:
```bash
cp .env.local.example .env.local
```

2. Edit `.env.local` with your database credentials:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=Tos
```

## Step 4: Install Dependencies

The `mysql2` package should already be installed. If not:

```bash
npm install mysql2
# or
pnpm install mysql2
```

## Step 5: Test the Connection

Start your development server:

```bash
npm run dev
# or
pnpm dev
```

The application should now connect to the database. You can test by:

1. Navigating to `/item/list` - should show items from the database
2. Adding a new item - should save to the database
3. Adding items to cart - should save to the database

## Migration from localStorage

The application has been set up with API routes that replace localStorage operations. The components will gradually be updated to use the API client (`lib/api-client.ts`) instead of direct localStorage access.

### Current API Endpoints

- `GET /api/items` - Get all items
- `POST /api/items` - Create item
- `GET /api/items/[id]` - Get single item
- `PUT /api/items/[id]` - Update item
- `DELETE /api/items/[id]` - Delete item

- `GET /api/vendors` - Get all vendors
- `POST /api/vendors` - Create vendor
- `GET /api/vendors/[id]` - Get single vendor
- `PUT /api/vendors/[id]` - Update vendor
- `DELETE /api/vendors/[id]` - Delete vendor

- `GET /api/cart` - Get user's cart
- `POST /api/cart` - Add to cart
- `PUT /api/cart` - Update cart item
- `DELETE /api/cart` - Remove from cart

- `GET /api/prs` - Get all purchase requisitions
- `POST /api/prs` - Create purchase requisition

## Troubleshooting

### Connection Errors

If you get connection errors:

1. Verify MySQL is running: `mysql -u root -p`
2. Check your credentials in `.env.local`
3. Ensure the database `Tos` exists
4. Check firewall settings if connecting to remote database

### Table Not Found Errors

If you get "Table doesn't exist" errors:

1. Verify you ran both SQL files (`Tos.sql` and `database-schema.sql`)
2. Check that you're using the correct database: `USE Tos;`
3. List tables: `SHOW TABLES;`

### Permission Errors

If you get permission errors:

1. Grant privileges: `GRANT ALL PRIVILEGES ON Tos.* TO 'your_user'@'localhost';`
2. Flush privileges: `FLUSH PRIVILEGES;`

## Next Steps

1. Update components to use `api-client.ts` instead of localStorage
2. Add authentication to API routes
3. Add error handling and validation
4. Add pagination for large datasets
5. Add caching where appropriate
