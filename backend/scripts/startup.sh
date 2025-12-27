#!/bin/sh
set -e

echo "🚀 Starting backend initialization..."

# Run database migrations
echo "📦 Running database migrations..."
npx prisma migrate deploy

# Seed the database (creates super admin if not exists)
echo "🌱 Seeding database..."
npm run prisma:seed

# Start the application
echo "🎯 Starting application..."
exec node dist/app.js
