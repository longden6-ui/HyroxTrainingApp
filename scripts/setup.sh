#!/bin/bash

set -e

echo "🚀 Setting up HYROX Coach AI project..."

# Check for required tools
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is required but not installed."
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Start PostgreSQL container
echo "🐘 Starting PostgreSQL..."
docker-compose up -d postgres

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Set up environment
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local..."
    cat > .env.local << EOF
DATABASE_URL="postgresql://hyrox_user:hyrox_password@localhost:5432/hyrox_db"
EOF
fi

# Run Prisma migrations
echo "🗄️  Running database migrations..."
npm run db:push -- --skip-generate

# Seed database
echo "🌱 Seeding database..."
npm run db:seed

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  npm run dev       - Start development server"
echo "  npm run db:studio - Open Prisma Studio"
echo ""
