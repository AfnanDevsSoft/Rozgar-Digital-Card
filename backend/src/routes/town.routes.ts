/**
 * Town Management Routes
 * Manages town codes for card serial number generation
 */

import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/rbac.middleware.js';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createTownSchema = z.object({
    name: z.string().min(2, 'Town name must be at least 2 characters')
    // Code is now auto-generated
});

const updateTownSchema = z.object({
    name: z.string().min(2).optional(),
    code: z.string().regex(/^\d{1,4}$/).optional(),
    is_active: z.boolean().optional()
});

/**
 * Get all towns
 * GET /api/towns
 */
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { active } = req.query;

        const where: any = {};
        if (active === 'true') {
            where.is_active = true;
        }

        const towns = await prisma.town.findMany({
            where,
            orderBy: { name: 'asc' }
        });

        res.json(towns);
    } catch (error) {
        console.error('Get towns error:', error);
        res.status(500).json({ error: 'Failed to fetch towns' });
    }
});

/**
 * Get town by ID
 * GET /api/towns/:id
 */
router.get('/:id', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const town = await prisma.town.findUnique({
            where: { id: req.params.id }
        });

        if (!town) {
            res.status(404).json({ error: 'Town not found' });
            return;
        }

        res.json(town);
    } catch (error) {
        console.error('Get town error:', error);
        res.status(500).json({ error: 'Failed to fetch town' });
    }
});

/**
 * Create new town
 * POST /api/towns
 */
router.post('/', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const data = createTownSchema.parse(req.body);

        // Auto-generate the next town code
        const lastTown = await prisma.town.findFirst({
            orderBy: { code: 'desc' }
        });

        let nextCode = '0001';
        if (lastTown) {
            const lastCodeNum = parseInt(lastTown.code);
            nextCode = (lastCodeNum + 1).toString().padStart(4, '0');
        }

        const town = await prisma.town.create({
            data: {
                name: data.name,
                code: nextCode
            }
        });

        res.status(201).json(town);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Invalid input', details: error.errors });
            return;
        }
        console.error('Create town error:', error);
        res.status(500).json({ error: 'Failed to create town' });
    }
});

/**
 * Update town
 * PUT /api/towns/:id
 */
router.put('/:id', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const data = updateTownSchema.parse(req.body);

        // If code is being updated, check for duplicates
        if (data.code) {
            const formattedCode = data.code.padStart(4, '0');
            const existing = await prisma.town.findFirst({
                where: {
                    code: formattedCode,
                    NOT: { id: req.params.id }
                }
            });

            if (existing) {
                res.status(400).json({ error: 'Town code already exists' });
                return;
            }

            data.code = formattedCode;
        }

        const town = await prisma.town.update({
            where: { id: req.params.id },
            data
        });

        res.json(town);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Invalid input', details: error.errors });
            return;
        }
        console.error('Update town error:', error);
        res.status(500).json({ error: 'Failed to update town' });
    }
});

/**
 * Delete town
 * DELETE /api/towns/:id
 */
router.delete('/:id', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const townToDelete = await prisma.town.findUnique({ where: { id: req.params.id } });
        if (!townToDelete) {
            res.status(404).json({ error: 'Town not found' });
            return;
        }

        // Check if town is being used in card counters
        const usedInCards = await prisma.cardCounter.findFirst({
            where: { town_code: townToDelete.code }
        });

        if (usedInCards) {
            res.status(400).json({
                error: 'Cannot delete town that has been used in card generation. Deactivate instead.'
            });
            return;
        }

        await prisma.town.delete({
            where: { id: req.params.id }
        });

        res.json({ message: 'Town deleted successfully' });
    } catch (error) {
        console.error('Delete town error:', error);
        res.status(500).json({ error: 'Failed to delete town' });
    }
});

/**
 * Deactivate town
 * PATCH /api/towns/:id/deactivate
 */
router.patch('/:id/deactivate', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const town = await prisma.town.update({
            where: { id: req.params.id },
            data: { is_active: false }
        });

        res.json(town);
    } catch (error) {
        console.error('Deactivate town error:', error);
        res.status(500).json({ error: 'Failed to deactivate town' });
    }
});

/**
 * Activate town
 * PATCH /api/towns/:id/activate
 */
router.patch('/:id/activate', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const town = await prisma.town.update({
            where: { id: req.params.id },
            data: { is_active: true }
        });

        res.json(town);
    } catch (error) {
        console.error('Activate town error:', error);
        res.status(500).json({ error: 'Failed to activate town' });
    }
});

export default router;
