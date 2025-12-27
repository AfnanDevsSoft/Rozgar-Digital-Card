import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger.js';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import cardRoutes from './routes/card.routes.js';
import labRoutes from './routes/lab.routes.js';
import transactionRoutes from './routes/transaction.routes.js';
import reportRoutes from './routes/report.routes.js';
import discountRoutes from './routes/discount.routes.js';
import adminRoutes from './routes/admin.routes.js';
import labStaffRoutes from './routes/labStaff.routes.js';
import testCatalogRoutes from './routes/testCatalog.routes.js';
import uploadRoutes from './routes/upload.routes.js';

// Initialize Express app
const app: Express = express();
const PORT = process.env.PORT || 4000;

// Initialize Prisma
export const prisma = new PrismaClient();

// Middleware
app.use(helmet({
    contentSecurityPolicy: false // Disable for Swagger UI
}));
app.use(cors({
    origin: [
        'https://shifaadmin.afnandevs.com',
        'https://shifaclients.afnandevs.com',
        'https://shifalabs.afnandevs.com',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:3003'
    ],
    credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting (1000 requests per 15 minutes for development)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
    message: { error: 'Too many requests, please try again later.' }
});
app.use('/api', limiter);

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Health Card API Docs'
}));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'OK', message: 'Health Card System API is running' });
});

// Serve static files from uploads directory (must be before /api routes)
app.use('/api/uploads', express.static(path.join(process.cwd(), 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/labs', labRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/discount', discountRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/lab-staff', labStaffRoutes);
app.use('/api/test-catalog', testCatalogRoutes);
app.use('/api/upload', uploadRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Error:', err.message);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
async function startServer() {
    try {
        // Connect to database
        await prisma.$connect();
        console.log('✅ Database connected');

        // Start Express server
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`📚 Health check: http://localhost:${PORT}/health`);
            console.log(`📖 Swagger API Docs: http://localhost:${PORT}/docs`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
});

startServer();

export default app;
