/**
 * User Management Routes
 */

import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../app.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/rbac.middleware.js';
import { generateSerialNumber } from '../services/serial.service.js';
import { sendWelcomeEmail } from '../services/email.service.js';
import { z } from 'zod';

const router = Router();

// Validation schema
const createUserSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(10),
    cnic: z.string().min(13),
    address: z.string().optional(),
    dob: z.string().optional(),
    gender: z.string().optional(),
    blood_group: z.string().optional(),
    expiry_date: z.string(), // Card expiry date
    password: z.string().min(6).optional()
});

/**
 * Get all users (paginated)
 * GET /api/users
 */
router.get('/', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const search = req.query.search as string || '';
        const status = req.query.status as string;

        const where: any = {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search } },
                { cnic: { contains: search } },
                { health_card: { serial_number: { contains: search } } }
            ];
        }

        if (status === 'active') {
            where.is_active = true;
        } else if (status === 'inactive') {
            where.is_active = false;
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                include: { health_card: true },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { created_at: 'desc' }
            }),
            prisma.user.count({ where })
        ]);

        res.json({
            users,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

/**
 * Get user by ID
 * GET /api/users/:id
 */
router.get('/:id', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.params.id },
            include: {
                health_card: true,
                transactions: {
                    take: 10,
                    orderBy: { created_at: 'desc' },
                    include: { lab: true }
                },
                reports: {
                    take: 10,
                    orderBy: { uploaded_at: 'desc' }
                }
            }
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json(user);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

/**
 * Create user with health card
 * POST /api/users
 */
router.post('/', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const data = createUserSchema.parse(req.body);

        // Check if email or CNIC already exists
        const existing = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: data.email },
                    { cnic: data.cnic }
                ]
            }
        });

        if (existing) {
            res.status(400).json({
                error: existing.email === data.email
                    ? 'Email already registered'
                    : 'CNIC already registered'
            });
            return;
        }

        // Generate password if not provided
        const tempPassword = data.password || `${data.name.split(' ')[0]}@${data.phone.slice(-4)}`;
        const passwordHash = await bcrypt.hash(tempPassword, 12);

        // Generate serial number
        const serialNumber = await generateSerialNumber();

        // Create user and card in transaction
        const user = await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                phone: data.phone,
                cnic: data.cnic,
                address: data.address,
                dob: data.dob ? new Date(data.dob) : null,
                gender: data.gender,
                blood_group: data.blood_group,
                password_hash: passwordHash,
                health_card: {
                    create: {
                        serial_number: serialNumber,
                        expiry_date: new Date(data.expiry_date),
                        status: 'ACTIVE'
                    }
                }
            },
            include: { health_card: true }
        });

        // Send welcome email with credentials
        const portalUrl = process.env.USER_PORTAL_URL || 'http://localhost:3003';
        await sendWelcomeEmail(
            user.email,
            user.name,
            serialNumber,
            tempPassword,
            portalUrl
        );

        res.status(201).json({
            user,
            credentials: {
                serial_number: serialNumber,
                password: tempPassword,
                message: 'Credentials have been sent to user email'
            }
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Invalid input', details: error.errors });
            return;
        }
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

/**
 * Update user
 * PUT /api/users/:id
 */
router.put('/:id', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { name, email, phone, address, dob, gender, blood_group } = req.body;

        const user = await prisma.user.update({
            where: { id: req.params.id },
            data: {
                name,
                email,
                phone,
                address,
                dob: dob ? new Date(dob) : undefined,
                gender,
                blood_group
            },
            include: { health_card: true }
        });

        res.json(user);
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

/**
 * Deactivate user
 * PATCH /api/users/:id/deactivate
 */
router.patch('/:id/deactivate', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const user = await prisma.user.update({
            where: { id: req.params.id },
            data: { is_active: false },
            include: { health_card: true }
        });

        // Also deactivate the card
        if (user.health_card) {
            await prisma.healthCard.update({
                where: { id: user.health_card.id },
                data: { status: 'INACTIVE' }
            });
        }

        res.json({ message: 'User deactivated successfully' });
    } catch (error) {
        console.error('Deactivate user error:', error);
        res.status(500).json({ error: 'Failed to deactivate user' });
    }
});

/**
 * Activate user
 * PATCH /api/users/:id/activate
 */
router.patch('/:id/activate', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const user = await prisma.user.update({
            where: { id: req.params.id },
            data: { is_active: true },
            include: { health_card: true }
        });

        // Also activate the card if expiry is valid
        if (user.health_card && new Date(user.health_card.expiry_date) > new Date()) {
            await prisma.healthCard.update({
                where: { id: user.health_card.id },
                data: { status: 'ACTIVE' }
            });
        }

        res.json({ message: 'User activated successfully' });
    } catch (error) {
        console.error('Activate user error:', error);
        res.status(500).json({ error: 'Failed to activate user' });
    }
});

/**
 * Reset user password
 * POST /api/users/:id/reset-password
 */
router.post('/:id/reset-password', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.params.id },
            include: { health_card: true }
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // Generate new password
        const newPassword = `${user.name.split(' ')[0]}@${Date.now().toString().slice(-4)}`;
        const passwordHash = await bcrypt.hash(newPassword, 12);

        await prisma.user.update({
            where: { id: req.params.id },
            data: { password_hash: passwordHash }
        });

        // Send email with new credentials
        const portalUrl = process.env.USER_PORTAL_URL || 'http://localhost:3003';
        await sendWelcomeEmail(
            user.email,
            user.name,
            user.health_card?.serial_number || '',
            newPassword,
            portalUrl
        );

        res.json({
            message: 'Password reset successfully',
            credentials: {
                password: newPassword,
                message: 'New credentials have been sent to user email'
            }
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
});

export default router;
