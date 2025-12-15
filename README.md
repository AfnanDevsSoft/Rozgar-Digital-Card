# Digital Health Card & Lab Management System

A comprehensive health card management system with automatic discount calculation for partner laboratories.

## 🏗️ Project Structure

```
├── backend/          # Express.js + TypeScript API
├── admin-panel/      # Next.js 14 Admin Dashboard
├── lab-portal/       # Next.js 14 Lab Management
├── user-portal/      # Next.js 14 User Access Portal
└── docker-compose.yml
```

## ✨ Features

### Admin Panel (Port 3001)
- User management with health card generation
- Lab partner management
- Admin roles (Super Admin / Branch Admin)
- Configurable discount settings (default 30%)
- Transaction & report overview

### Lab Portal (Port 3002)
- Card verification by serial number
- Billing with automatic discount calculation
- Printable receipts (INV-YYYY-NNNNN format)
- Report upload with email notifications
- Test catalog management

### User Portal (Port 3003)
- Login with Serial Number + Password
- View health card status
- Download lab reports
- Transaction history with savings summary

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 16
- Redis (optional)

### 1. Install Dependencies
```bash
# Install all dependencies
npm run install:all
```

### 2. Setup Database
```bash
# Copy environment file
cp backend/.env.example backend/.env

# Edit with your database credentials
# DATABASE_URL=postgresql://postgres:admin123@localhost:5432/health_card_db

# Generate Prisma client and run migrations
cd backend
npx prisma generate
npx prisma db push
npx prisma db seed
```

### 3. Start Development Servers
```bash
# Start all services
npm run dev
```

This will start:
- Backend API: http://localhost:4000
- Admin Panel: http://localhost:3001
- Lab Portal: http://localhost:3002
- User Portal: http://localhost:3003

## 🔐 Default Credentials

### Admin Panel
- **Email:** admin@system.com
- **Password:** Admin@123

### User Portal
- Login with Serial Number + Password (provided when card is issued)

## 🐳 Docker Deployment

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

## 📁 API Endpoints

### Authentication
- `POST /api/auth/admin/login` - Admin login
- `POST /api/auth/user/login` - User login (serial + password)
- `POST /api/auth/staff/login` - Lab staff login

### Users & Cards
- `GET/POST /api/users` - User CRUD
- `GET /api/cards/verify/:serial` - Verify card
- `PATCH /api/cards/:id/renew` - Renew card

### Transactions
- `POST /api/transactions` - Create with auto discount
- `POST /api/transactions/calculate` - Preview discount

### Reports
- `POST /api/reports` - Upload report (email notification)
- `GET /api/reports` - List reports

## 🎨 UI Theme
- Black/White base theme
- Action buttons: Blue (primary), Green (success), Red (danger)
- Font: Inter

## 📋 Serial Number Format
- Format: `DCDYYXXXXXXX` (e.g., DCD251234567)
- DCD = Prefix
- YY = Year (25 = 2025)
- XXXXXXX = 7 unique digits

## 🧾 Receipt Format
- Format: `INV-YYYY-NNNNN` (e.g., INV-2025-00001)
- Annual counter reset
