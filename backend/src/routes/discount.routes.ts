/**
 * Discount Settings Routes
 */

import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';
import { requireSuperAdmin } from '../middleware/rbac.middleware.js';
import { calculateDiscount, updateDiscountSettings } from '../services/discount.service.js';

const router = Router();

/**
 * Get discount settings
 * GET /api/discount/settings
 */
router.get('/settings', authMiddleware, async (_req: AuthRequest, res: Response) => {
    try {
        const settings = await prisma.discountSettings.findFirst();

        if (!settings) {
            res.json({
                default_discount_rate: 30,
                apply_to_expired: false
            });
            return;
        }

        res.json({
            default_discount_rate: Number(settings.default_discount_rate),
            apply_to_expired: settings.apply_to_expired,
            updated_at: settings.updated_at
        });
    } catch (error) {
        console.error('Get discount settings error:', error);
        res.status(500).json({ error: 'Failed to fetch discount settings' });
    }
});

/**
 * Update discount settings
 * PUT /api/discount/settings
 */
router.put('/settings', authMiddleware, requireSuperAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { default_discount_rate, apply_to_expired } = req.body;

        if (default_discount_rate < 0 || default_discount_rate > 100) {
            res.status(400).json({ error: 'Discount rate must be between 0 and 100' });
            return;
        }

        await updateDiscountSettings(default_discount_rate, apply_to_expired);

        res.json({
            message: 'Discount settings updated successfully',
            default_discount_rate,
            apply_to_expired
        });
    } catch (error) {
        console.error('Update discount settings error:', error);
        res.status(500).json({ error: 'Failed to update discount settings' });
    }
});

/**
 * Calculate discount for an amount
 * POST /api/discount/calculate
 */
router.post('/calculate', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { amount, lab_id } = req.body;

        if (!amount || amount <= 0) {
            res.status(400).json({ error: 'Valid amount is required' });
            return;
        }

        const result = await calculateDiscount(amount, lab_id);
        res.json(result);
    } catch (error) {
        console.error('Calculate discount error:', error);
        res.status(500).json({ error: 'Failed to calculate discount' });
    }
});

export default router;
