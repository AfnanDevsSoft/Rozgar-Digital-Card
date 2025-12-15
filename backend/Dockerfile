FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source code
COPY dist ./dist/

# Create uploads directory
RUN mkdir -p uploads/reports

# Expose port
EXPOSE 4000

# Start the application
CMD ["node", "dist/app.js"]
