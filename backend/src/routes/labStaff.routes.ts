/**
 * Lab Staff (Receptionist) Management Routes
 */

import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../app.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/rbac.middleware.js';
import { z } from 'zod';

const router = Router();

// Validation schema
const createStaffSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6).optional(),
    lab_id: z.string()
});

/**
 * Get all lab staff
 * GET /api/lab-staff
 */
router.get('/', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const where: any = {};

        // Branch admins can only see their lab's staff
        if (req.user?.role === 'BRANCH_ADMIN' && req.user.lab_id) {
            where.lab_id = req.user.lab_id;
        }

        const staff = await prisma.labStaff.findMany({
            where,
            include: {
                lab: {
                    select: { id: true, name: true, lab_code: true }
                }
            },
            orderBy: { created_at: 'desc' }
        });

        // Remove password hashes
        const safeStaff = staff.map(({ password_hash, ...s }) => s);

        res.json(safeStaff);
    } catch (error) {
        console.error('Get lab staff error:', error);
        res.status(500).json({ error: 'Failed to fetch lab staff' });
    }
});

/**
 * Get staff by lab ID
 * GET /api/lab-staff/lab/:labId
 */
router.get('/lab/:labId', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        // Branch admins can only see their lab's staff
        if (req.user?.role === 'BRANCH_ADMIN' && req.user.lab_id !== req.params.labId) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        const staff = await prisma.labStaff.findMany({
            where: { lab_id: req.params.labId },
            orderBy: { created_at: 'desc' }
        });

        const safeStaff = staff.map(({ password_hash, ...s }) => s);
        res.json(safeStaff);
    } catch (error) {
        console.error('Get lab staff error:', error);
        res.status(500).json({ error: 'Failed to fetch lab staff' });
    }
});

/**
 * Create lab staff (Receptionist)
 * POST /api/lab-staff
 */
router.post('/', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const data = createStaffSchema.parse(req.body);

        // Branch admins can only create staff for their lab
        if (req.user?.role === 'BRANCH_ADMIN' && req.user.lab_id !== data.lab_id) {
            res.status(403).json({ error: 'Can only create staff for your assigned lab' });
            return;
        }

        // Check if email exists
        const existing = await prisma.labStaff.findUnique({
            where: { email: data.email }
        });

        if (existing) {
            res.status(400).json({ error: 'Email already registered' });
            return;
        }

        // Verify lab exists
        const lab = await prisma.lab.findUnique({ where: { id: data.lab_id } });
        if (!lab) {
            res.status(400).json({ error: 'Lab not found' });
            return;
        }

        // Use default password "user123" for all new lab staff
        const tempPassword = 'user123';
        const passwordHash = await bcrypt.hash(tempPassword, 12);

        const staff = await prisma.labStaff.create({
            data: {
                name: data.name,
                email: data.email,
                password_hash: passwordHash,
                lab_id: data.lab_id,
                must_change_password: true  // Force password change on first login
            },
            include: { lab: true }
        });

        const { password_hash: _, ...safeStaff } = staff;
        res.status(201).json({
            ...safeStaff,
            temp_password: tempPassword,
            message: 'Lab staff created. Default password: user123. Please share with staff member.'
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Invalid input', details: error.errors });
            return;
        }
        console.error('Create lab staff error:', error);
        res.status(500).json({ error: 'Failed to create lab staff' });
    }
});

/**
 * Update lab staff
 * PUT /api/lab-staff/:id
 */
router.put('/:id', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { name, email } = req.body;

        const staff = await prisma.labStaff.findUnique({
            where: { id: req.params.id }
        });

        if (!staff) {
            res.status(404).json({ error: 'Staff not found' });
            return;
        }

        // Branch admins can only update their lab's staff
        if (req.user?.role === 'BRANCH_ADMIN' && req.user.lab_id !== staff.lab_id) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        const updated = await prisma.labStaff.update({
            where: { id: req.params.id },
            data: { name, email },
            include: { lab: true }
        });

        const { password_hash, ...safeStaff } = updated;
        res.json(safeStaff);
    } catch (error) {
        console.error('Update lab staff error:', error);
        res.status(500).json({ error: 'Failed to update lab staff' });
    }
});

/**
 * Toggle staff status
 * PATCH /api/lab-staff/:id/toggle-status
 */
router.patch('/:id/toggle-status', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const staff = await prisma.labStaff.findUnique({
            where: { id: req.params.id }
        });

        if (!staff) {
            res.status(404).json({ error: 'Staff not found' });
            return;
        }

        // Branch admins can only toggle their lab's staff
        if (req.user?.role === 'BRANCH_ADMIN' && req.user.lab_id !== staff.lab_id) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        const updated = await prisma.labStaff.update({
            where: { id: req.params.id },
            data: { is_active: !staff.is_active }
        });

        res.json({
            message: updated.is_active ? 'Staff activated' : 'Staff deactivated',
            is_active: updated.is_active
        });
    } catch (error) {
        console.error('Toggle staff status error:', error);
        res.status(500).json({ error: 'Failed to toggle staff status' });
    }
});

/**
 * Reset staff password
 * POST /api/lab-staff/:id/reset-password
 */
router.post('/:id/reset-password', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { new_password } = req.body;

        if (!new_password || new_password.length < 6) {
            res.status(400).json({ error: 'Password must be at least 6 characters' });
            return;
        }

        const staff = await prisma.labStaff.findUnique({
            where: { id: req.params.id }
        });

        if (!staff) {
            res.status(404).json({ error: 'Staff not found' });
            return;
        }

        // Branch admins can only reset their lab's staff password
        if (req.user?.role === 'BRANCH_ADMIN' && req.user.lab_id !== staff.lab_id) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        const passwordHash = await bcrypt.hash(new_password, 12);

        await prisma.labStaff.update({
            where: { id: req.params.id },
            data: { password_hash: passwordHash }
        });

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset staff password error:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
});

export default router;
