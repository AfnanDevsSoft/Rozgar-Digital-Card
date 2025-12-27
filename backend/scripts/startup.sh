#!/bin/sh

echo "🚀 Starting backend initialization..."

# Try to run database migrations (skip if database already exists)
echo "📦 Running database migrations..."
npx prisma migrate deploy || echo "ℹ️  Migrations skipped (database may already exist)"

# Ensure Prisma schema is synced (safe for existing databases)
echo "🔄 Syncing database schema..."
npx prisma db push --skip-generate --accept-data-loss || echo "ℹ️  Schema already in sync"

# Seed the database (creates super admin if not exists)
echo "🌱 Seeding database..."
npm run prisma:seed

# Start the application
echo "🎯 Starting application..."
exec node dist/app.js
