/**
 * Lab Management Routes
 */

import { Router, Response } from 'express';
import { prisma } from '../app.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';
import { requireAdmin, requireSuperAdmin } from '../middleware/rbac.middleware.js';
import { generateLabCode } from '../services/serial.service.js';
import { z } from 'zod';
import { Decimal } from '@prisma/client/runtime/library';

const router = Router();

// Validation schema
const createLabSchema = z.object({
    name: z.string().min(2),
    address: z.string().min(5),
    phone: z.string().min(10),
    email: z.string().email(),
    license_no: z.string().optional(),
    discount_rate: z.number().min(0).max(100).optional()
});

/**
 * Get all labs (paginated)
 * GET /api/labs
 */
router.get('/', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const search = req.query.search as string;
        const status = req.query.status as string;

        const where: any = {};

        // Branch admins can only see their assigned lab
        if (req.user?.role === 'BRANCH_ADMIN' && req.user.lab_id) {
            where.id = req.user.lab_id;
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { lab_code: { contains: search } },
                { email: { contains: search, mode: 'insensitive' } }
            ];
        }

        if (status) {
            where.status = status;
        }

        const [labs, total] = await Promise.all([
            prisma.lab.findMany({
                where,
                include: {
                    _count: {
                        select: {
                            transactions: true,
                            staff: true,
                            tests: true
                        }
                    }
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { created_at: 'desc' }
            }),
            prisma.lab.count({ where })
        ]);

        res.json({
            labs,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get labs error:', error);
        res.status(500).json({ error: 'Failed to fetch labs' });
    }
});

/**
 * Get lab by ID
 * GET /api/labs/:id
 */
router.get('/:id', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        // Branch admins can only see their assigned lab
        if (req.user?.role === 'BRANCH_ADMIN' && req.user.lab_id !== req.params.id) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        const lab = await prisma.lab.findUnique({
            where: { id: req.params.id },
            include: {
                admins: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        is_active: true
                    }
                },
                staff: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        is_active: true
                    }
                },
                tests: {
                    where: { is_active: true },
                    orderBy: { category: 'asc' }
                },
                _count: {
                    select: {
                        transactions: true,
                        reports: true
                    }
                }
            }
        });

        if (!lab) {
            res.status(404).json({ error: 'Lab not found' });
            return;
        }

        res.json(lab);
    } catch (error) {
        console.error('Get lab error:', error);
        res.status(500).json({ error: 'Failed to fetch lab' });
    }
});

/**
 * Create new lab
 * POST /api/labs
 */
router.post('/', authMiddleware, requireSuperAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const data = createLabSchema.parse(req.body);

        // Check if email already exists
        const existing = await prisma.lab.findFirst({
            where: { email: data.email }
        });

        if (existing) {
            res.status(400).json({ error: 'Email already registered' });
            return;
        }

        // Generate lab code
        const labCode = await generateLabCode();

        const lab = await prisma.lab.create({
            data: {
                lab_code: labCode,
                name: data.name,
                address: data.address,
                phone: data.phone,
                email: data.email,
                license_no: data.license_no,
                discount_rate: new Decimal(data.discount_rate || 30),
                status: 'ACTIVE'
            }
        });

        res.status(201).json(lab);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Invalid input', details: error.errors });
            return;
        }
        console.error('Create lab error:', error);
        res.status(500).json({ error: 'Failed to create lab' });
    }
});

/**
 * Update lab
 * PUT /api/labs/:id
 */
router.put('/:id', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        // Branch admins can only update their assigned lab
        if (req.user?.role === 'BRANCH_ADMIN' && req.user.lab_id !== req.params.id) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        const { name, address, phone, email, license_no, discount_rate } = req.body;

        const lab = await prisma.lab.update({
            where: { id: req.params.id },
            data: {
                name,
                address,
                phone,
                email,
                license_no,
                discount_rate: discount_rate ? new Decimal(discount_rate) : undefined
            }
        });

        res.json(lab);
    } catch (error) {
        console.error('Update lab error:', error);
        res.status(500).json({ error: 'Failed to update lab' });
    }
});

/**
 * Update lab status
 * PATCH /api/labs/:id/status
 */
router.patch('/:id/status', authMiddleware, requireSuperAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { status } = req.body;

        if (!['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status)) {
            res.status(400).json({ error: 'Invalid status' });
            return;
        }

        const lab = await prisma.lab.update({
            where: { id: req.params.id },
            data: { status }
        });

        res.json(lab);
    } catch (error) {
        console.error('Update lab status error:', error);
        res.status(500).json({ error: 'Failed to update lab status' });
    }
});

/**
 * Get lab statistics
 * GET /api/labs/stats
 */
router.get('/stats/overview', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const where: any = {};

        // Branch admins only see their lab stats
        if (req.user?.role === 'BRANCH_ADMIN' && req.user.lab_id) {
            where.id = req.user.lab_id;
        }

        const [total, active, inactive, suspended] = await Promise.all([
            prisma.lab.count({ where }),
            prisma.lab.count({ where: { ...where, status: 'ACTIVE' } }),
            prisma.lab.count({ where: { ...where, status: 'INACTIVE' } }),
            prisma.lab.count({ where: { ...where, status: 'SUSPENDED' } })
        ]);

        res.json({
            total,
            active,
            inactive,
            suspended
        });
    } catch (error) {
        console.error('Get lab stats error:', error);
        res.status(500).json({ error: 'Failed to fetch lab statistics' });
    }
});

export default router;
