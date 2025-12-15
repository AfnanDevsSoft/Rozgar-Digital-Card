/**
 * Test Catalog Management Routes
 */

import { Router, Response } from 'express';
import { prisma } from '../app.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';
import { requireAdmin, requireLabAccess } from '../middleware/rbac.middleware.js';
import { z } from 'zod';
import { Decimal } from '@prisma/client/runtime/library';

const router = Router();

// Validation schema
const createTestSchema = z.object({
    name: z.string().min(2),
    category: z.string().min(2),
    price: z.number().positive(),
    lab_id: z.string()
});

/**
 * Get test catalog for a lab
 * GET /api/test-catalog/lab/:labId
 */
router.get('/lab/:labId', authMiddleware, requireLabAccess, async (req: AuthRequest, res: Response) => {
    try {
        // Lab staff can only see their lab's tests
        if (req.user?.role !== 'SUPER_ADMIN' && req.user?.lab_id !== req.params.labId) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        const tests = await prisma.testCatalog.findMany({
            where: {
                lab_id: req.params.labId,
                is_active: true
            },
            orderBy: [
                { category: 'asc' },
                { name: 'asc' }
            ]
        });

        res.json(tests);
    } catch (error) {
        console.error('Get test catalog error:', error);
        res.status(500).json({ error: 'Failed to fetch test catalog' });
    }
});

/**
 * Get tests by category
 * GET /api/test-catalog/lab/:labId/categories
 */
router.get('/lab/:labId/categories', authMiddleware, requireLabAccess, async (req: AuthRequest, res: Response) => {
    try {
        const tests = await prisma.testCatalog.findMany({
            where: {
                lab_id: req.params.labId,
                is_active: true
            },
            orderBy: [
                { category: 'asc' },
                { name: 'asc' }
            ]
        });

        // Group by category
        const grouped = tests.reduce((acc: Record<string, any[]>, test) => {
            if (!acc[test.category]) {
                acc[test.category] = [];
            }
            acc[test.category].push(test);
            return acc;
        }, {});

        res.json(grouped);
    } catch (error) {
        console.error('Get test categories error:', error);
        res.status(500).json({ error: 'Failed to fetch test categories' });
    }
});

/**
 * Get single test
 * GET /api/test-catalog/:id
 */
router.get('/:id', authMiddleware, requireLabAccess, async (req: AuthRequest, res: Response) => {
    try {
        const test = await prisma.testCatalog.findUnique({
            where: { id: req.params.id },
            include: { lab: true }
        });

        if (!test) {
            res.status(404).json({ error: 'Test not found' });
            return;
        }

        res.json(test);
    } catch (error) {
        console.error('Get test error:', error);
        res.status(500).json({ error: 'Failed to fetch test' });
    }
});

/**
 * Create test
 * POST /api/test-catalog
 */
router.post('/', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const data = createTestSchema.parse(req.body);

        // Branch admins can only create tests for their lab
        if (req.user?.role === 'BRANCH_ADMIN' && req.user.lab_id !== data.lab_id) {
            res.status(403).json({ error: 'Can only create tests for your assigned lab' });
            return;
        }

        // Check if test with same name exists in this lab
        const existing = await prisma.testCatalog.findFirst({
            where: {
                name: data.name,
                lab_id: data.lab_id
            }
        });

        if (existing) {
            res.status(400).json({ error: 'Test with this name already exists' });
            return;
        }

        const test = await prisma.testCatalog.create({
            data: {
                name: data.name,
                category: data.category,
                price: new Decimal(data.price),
                lab_id: data.lab_id
            }
        });

        res.status(201).json(test);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Invalid input', details: error.errors });
            return;
        }
        console.error('Create test error:', error);
        res.status(500).json({ error: 'Failed to create test' });
    }
});

/**
 * Update test
 * PUT /api/test-catalog/:id
 */
router.put('/:id', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { name, category, price } = req.body;

        const test = await prisma.testCatalog.findUnique({
            where: { id: req.params.id }
        });

        if (!test) {
            res.status(404).json({ error: 'Test not found' });
            return;
        }

        // Branch admins can only update their lab's tests
        if (req.user?.role === 'BRANCH_ADMIN' && req.user.lab_id !== test.lab_id) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        const updated = await prisma.testCatalog.update({
            where: { id: req.params.id },
            data: {
                name,
                category,
                price: price ? new Decimal(price) : undefined
            }
        });

        res.json(updated);
    } catch (error) {
        console.error('Update test error:', error);
        res.status(500).json({ error: 'Failed to update test' });
    }
});

/**
 * Toggle test status
 * PATCH /api/test-catalog/:id/toggle-status
 */
router.patch('/:id/toggle-status', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const test = await prisma.testCatalog.findUnique({
            where: { id: req.params.id }
        });

        if (!test) {
            res.status(404).json({ error: 'Test not found' });
            return;
        }

        // Branch admins can only toggle their lab's tests
        if (req.user?.role === 'BRANCH_ADMIN' && req.user.lab_id !== test.lab_id) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        const updated = await prisma.testCatalog.update({
            where: { id: req.params.id },
            data: { is_active: !test.is_active }
        });

        res.json({
            message: updated.is_active ? 'Test activated' : 'Test deactivated',
            is_active: updated.is_active
        });
    } catch (error) {
        console.error('Toggle test status error:', error);
        res.status(500).json({ error: 'Failed to toggle test status' });
    }
});

/**
 * Delete test
 * DELETE /api/test-catalog/:id
 */
router.delete('/:id', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const test = await prisma.testCatalog.findUnique({
            where: { id: req.params.id }
        });

        if (!test) {
            res.status(404).json({ error: 'Test not found' });
            return;
        }

        // Branch admins can only delete their lab's tests
        if (req.user?.role === 'BRANCH_ADMIN' && req.user.lab_id !== test.lab_id) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        // Soft delete - just deactivate
        await prisma.testCatalog.update({
            where: { id: req.params.id },
            data: { is_active: false }
        });

        res.json({ message: 'Test deleted successfully' });
    } catch (error) {
        console.error('Delete test error:', error);
        res.status(500).json({ error: 'Failed to delete test' });
    }
});

export default router;
