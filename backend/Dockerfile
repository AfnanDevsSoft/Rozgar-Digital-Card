FROM node:20-alpine AS builder

WORKDIR /app

# Install OpenSSL and other dependencies needed by Prisma
RUN apk add --no-cache openssl libc6-compat

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for building)
RUN npm ci

# Copy source code and Prisma schema
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install OpenSSL and dependencies for Prisma to run
RUN apk add --no-cache openssl libc6-compat

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy compiled code from builder
COPY --from=builder /app/dist ./dist/

# Create uploads directory
RUN mkdir -p uploads/reports

# Expose port
EXPOSE 4000

# Start the application
CMD ["node", "dist/app.js"]
