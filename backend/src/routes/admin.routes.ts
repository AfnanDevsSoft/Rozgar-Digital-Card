/**
 * Admin Management Routes
 */

import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../app.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';
import { requireSuperAdmin } from '../middleware/rbac.middleware.js';
import { z } from 'zod';

const router = Router();

// Validation schema
const createAdminSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6).optional(),
    role: z.enum(['SUPER_ADMIN', 'BRANCH_ADMIN']),
    lab_id: z.string().optional()
});

/**
 * Get all admins
 * GET /api/admins
 */
router.get('/', authMiddleware, requireSuperAdmin, async (_req: AuthRequest, res: Response) => {
    try {
        const admins = await prisma.admin.findMany({
            include: {
                lab: {
                    select: { id: true, name: true, lab_code: true }
                }
            },
            orderBy: { created_at: 'desc' }
        });

        // Remove password hashes
        const safeAdmins = admins.map(({ password_hash, ...admin }) => admin);

        res.json(safeAdmins);
    } catch (error) {
        console.error('Get admins error:', error);
        res.status(500).json({ error: 'Failed to fetch admins' });
    }
});

/**
 * Get admin by ID
 * GET /api/admins/:id
 */
router.get('/:id', authMiddleware, requireSuperAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const admin = await prisma.admin.findUnique({
            where: { id: req.params.id },
            include: {
                lab: true
            }
        });

        if (!admin) {
            res.status(404).json({ error: 'Admin not found' });
            return;
        }

        const { password_hash, ...safeAdmin } = admin;
        res.json(safeAdmin);
    } catch (error) {
        console.error('Get admin error:', error);
        res.status(500).json({ error: 'Failed to fetch admin' });
    }
});

/**
 * Create admin (Branch Admin)
 * POST /api/admins
 */
router.post('/', authMiddleware, requireSuperAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const data = createAdminSchema.parse(req.body);

        // Check if email exists
        const existing = await prisma.admin.findUnique({
            where: { email: data.email }
        });

        if (existing) {
            res.status(400).json({ error: 'Email already registered' });
            return;
        }

        // If BRANCH_ADMIN, lab_id is required
        if (data.role === 'BRANCH_ADMIN' && !data.lab_id) {
            res.status(400).json({ error: 'Lab ID is required for Branch Admin' });
            return;
        }

        // Verify lab exists
        if (data.lab_id) {
            const lab = await prisma.lab.findUnique({ where: { id: data.lab_id } });
            if (!lab) {
                res.status(400).json({ error: 'Lab not found' });
                return;
            }
        }

        // Use provided password or default to 'user123'
        const defaultPassword = 'user123';
        const password = data.password || defaultPassword;
        const passwordHash = await bcrypt.hash(password, 12);

        const admin = await prisma.admin.create({
            data: {
                name: data.name,
                email: data.email,
                password_hash: passwordHash,
                role: data.role,
                lab_id: data.lab_id,
                must_change_password: !data.password // If no password provided, force change
            },
            include: { lab: true }
        });

        const { password_hash: _, ...safeAdmin } = admin;
        res.status(201).json(safeAdmin);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Invalid input', details: error.errors });
            return;
        }
        console.error('Create admin error:', error);
        res.status(500).json({ error: 'Failed to create admin' });
    }
});

/**
 * Update admin
 * PUT /api/admins/:id
 */
router.put('/:id', authMiddleware, requireSuperAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { name, email, lab_id } = req.body;

        const admin = await prisma.admin.update({
            where: { id: req.params.id },
            data: { name, email, lab_id },
            include: { lab: true }
        });

        const { password_hash, ...safeAdmin } = admin;
        res.json(safeAdmin);
    } catch (error) {
        console.error('Update admin error:', error);
        res.status(500).json({ error: 'Failed to update admin' });
    }
});

/**
 * Toggle admin status
 * PATCH /api/admins/:id/toggle-status
 */
router.patch('/:id/toggle-status', authMiddleware, requireSuperAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const admin = await prisma.admin.findUnique({
            where: { id: req.params.id }
        });

        if (!admin) {
            res.status(404).json({ error: 'Admin not found' });
            return;
        }

        // Prevent deactivating yourself
        if (admin.id === req.user?.id) {
            res.status(400).json({ error: 'Cannot deactivate your own account' });
            return;
        }

        const updated = await prisma.admin.update({
            where: { id: req.params.id },
            data: { is_active: !admin.is_active }
        });

        res.json({
            message: updated.is_active ? 'Admin activated' : 'Admin deactivated',
            is_active: updated.is_active
        });
    } catch (error) {
        console.error('Toggle admin status error:', error);
        res.status(500).json({ error: 'Failed to toggle admin status' });
    }
});

/**
 * Reset admin password
 * POST /api/admins/:id/reset-password
 */
router.post('/:id/reset-password', authMiddleware, requireSuperAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { new_password } = req.body;

        if (!new_password || new_password.length < 6) {
            res.status(400).json({ error: 'Password must be at least 6 characters' });
            return;
        }

        const passwordHash = await bcrypt.hash(new_password, 12);

        await prisma.admin.update({
            where: { id: req.params.id },
            data: { password_hash: passwordHash }
        });

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset admin password error:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
});

export default router;
