#!/bin/sh

echo "🚀 Starting backend initialization..."

# Try to run database migrations (will skip if database schema conflicts)
echo "📦 Running database migrations..."
npx prisma migrate deploy || echo "⚠️  Migration skipped - manual migration may be needed"

# Seed the database (creates super admin if not exists - completely safe, idempotent)
echo "🌱 Seeding database..."
npm run prisma:seed:prod || echo "⚠️  Seeding skipped - may already be seeded"

# Start the application
echo "🎯 Starting application..."
exec node dist/app.js
