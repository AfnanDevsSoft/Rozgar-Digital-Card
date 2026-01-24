/**
 * Authentication Routes
 */

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { generateToken, authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';
import { z } from 'zod';

const router = Router();

// Validation schemas
const adminLoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6)
});

const userLoginSchema = z.object({
    serial_number: z.string().min(10),
    password: z.string().min(6)
});

const staffLoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6)
});

/**
 * Admin Login (Super Admin & Branch Admin)
 * POST /api/auth/admin/login
 */
router.post('/admin/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = adminLoginSchema.parse(req.body);

        const admin = await prisma.admin.findUnique({
            where: { email },
            include: { lab: true }
        });

        if (!admin) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        if (!admin.is_active) {
            res.status(401).json({ error: 'Account is inactive' });
            return;
        }

        const isValid = await bcrypt.compare(password, admin.password_hash);
        if (!isValid) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const token = generateToken({
            id: admin.id,
            email: admin.email,
            role: admin.role,
            lab_id: admin.lab_id || undefined,
            type: 'admin'
        });

        res.json({
            token,
            must_change_password: admin.must_change_password,
            user: {
                id: admin.id,
                email: admin.email,
                name: admin.name,
                role: admin.role,
                lab: admin.lab,
                must_change_password: admin.must_change_password
            }
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Invalid input', details: error.errors });
            return;
        }
        console.error('Admin login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

/**
 * User Login (Card holders - Serial + Password)
 * POST /api/auth/user/login
 */
router.post('/user/login', async (req: Request, res: Response) => {
    try {
        const { serial_number, password } = userLoginSchema.parse(req.body);

        // Find card by serial number
        const card = await prisma.healthCard.findUnique({
            where: { serial_number },
            include: { user: true }
        });

        if (!card) {
            res.status(401).json({ error: 'Invalid serial number' });
            return;
        }

        if (!card.user.is_active) {
            res.status(401).json({ error: 'Account is inactive' });
            return;
        }

        const isValid = await bcrypt.compare(password, card.user.password_hash);
        if (!isValid) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const token = generateToken({
            id: card.user.id,
            email: card.user.email || '',
            role: 'USER',
            type: 'user'
        });

        res.json({
            token,
            must_change_password: card.user.must_change_password,
            user: {
                id: card.user.id,
                email: card.user.email ?? undefined,
                name: card.user.name,
                phone: card.user.phone,
                must_change_password: card.user.must_change_password,
                card: {
                    serial_number: card.serial_number,
                    status: card.status,
                    expiry_date: card.expiry_date
                }
            }
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Invalid input', details: error.errors });
            return;
        }
        console.error('User login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

/**
 * Lab Staff Login (Receptionists)
 * POST /api/auth/staff/login
 */
router.post('/staff/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = staffLoginSchema.parse(req.body);

        const staff = await prisma.labStaff.findUnique({
            where: { email },
            include: { lab: true }
        });

        if (!staff) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        if (!staff.is_active) {
            res.status(401).json({ error: 'Account is inactive' });
            return;
        }

        if (staff.lab.status !== 'ACTIVE') {
            res.status(401).json({ error: 'Lab is not active' });
            return;
        }

        const isValid = await bcrypt.compare(password, staff.password_hash);
        if (!isValid) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const token = generateToken({
            id: staff.id,
            email: staff.email,
            role: 'RECEPTIONIST',
            lab_id: staff.lab_id,
            type: 'staff'
        });

        res.json({
            token,
            must_change_password: staff.must_change_password,
            user: {
                id: staff.id,
                email: staff.email,
                name: staff.name,
                role: 'RECEPTIONIST',
                lab_id: staff.lab_id,
                lab: staff.lab,
                must_change_password: staff.must_change_password
            }
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Invalid input', details: error.errors });
            return;
        }
        console.error('Staff login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

/**
 * Get current user profile
 * GET /api/auth/me
 */
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { id, role } = req.user!;

        if (role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'BRANCH_ADMIN') {
            const admin = await prisma.admin.findUnique({
                where: { id },
                include: { lab: true }
            });
            res.json({ user: admin, type: 'admin' });
        } else if (role === 'USER') {
            const user = await prisma.user.findUnique({
                where: { id },
                include: { health_card: true }
            });
            res.json({ user, type: 'user' });
        } else if (role === 'RECEPTIONIST') {
            const staff = await prisma.labStaff.findUnique({
                where: { id },
                include: { lab: true }
            });
            // Add role to staff object
            const staffWithRole = { ...staff, role: 'RECEPTIONIST' };
            res.json({ user: staffWithRole, type: 'staff' });
        }
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to get profile' });
    }
});

/**
 * Change password
 * POST /api/auth/change-password
 */
router.post('/change-password', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { current_password, new_password } = req.body;
        const { id, role } = req.user!;

        if (!current_password || !new_password) {
            res.status(400).json({ error: 'Current and new password required' });
            return;
        }

        if (new_password.length < 6) {
            res.status(400).json({ error: 'Password must be at least 6 characters' });
            return;
        }

        let passwordHash: string | undefined;

        if (role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'BRANCH_ADMIN') {
            const admin = await prisma.admin.findUnique({ where: { id } });
            if (!admin || !(await bcrypt.compare(current_password, admin.password_hash))) {
                res.status(401).json({ error: 'Current password is incorrect' });
                return;
            }
            passwordHash = await bcrypt.hash(new_password, 12);
            await prisma.admin.update({
                where: { id },
                data: {
                    password_hash: passwordHash,
                    must_change_password: false,
                    password_changed_at: new Date()
                }
            });
        } else if (role === 'USER') {
            const user = await prisma.user.findUnique({ where: { id } });
            if (!user || !(await bcrypt.compare(current_password, user.password_hash))) {
                res.status(401).json({ error: 'Current password is incorrect' });
                return;
            }
            passwordHash = await bcrypt.hash(new_password, 12);
            await prisma.user.update({
                where: { id },
                data: {
                    password_hash: passwordHash,
                    must_change_password: false,
                    password_changed_at: new Date()
                }
            });
        } else if (role === 'RECEPTIONIST') {
            const staff = await prisma.labStaff.findUnique({ where: { id } });
            if (!staff || !(await bcrypt.compare(current_password, staff.password_hash))) {
                res.status(401).json({ error: 'Current password is incorrect' });
                return;
            }
            passwordHash = await bcrypt.hash(new_password, 12);
            await prisma.labStaff.update({
                where: { id },
                data: {
                    password_hash: passwordHash,
                    must_change_password: false,
                    password_changed_at: new Date()
                }
            });
        }

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
});

export default router;
 