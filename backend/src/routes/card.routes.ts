/**
 * Health Card Management Routes
 */

import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';
import { requireAdmin, requireLabAccess } from '../middleware/rbac.middleware.js';

const router = Router();

/**
 * Verify card by serial number
 * GET /api/cards/verify/:serial
 */
router.get('/verify/:serial', authMiddleware, requireLabAccess, async (req: AuthRequest, res: Response) => {
    try {
        const { serial } = req.params;

        const card = await prisma.healthCard.findUnique({
            where: { serial_number: serial },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        cnic: true,
                        dob: true,
                        gender: true,
                        blood_group: true,
                        is_active: true
                    }
                }
            }
        });

        if (!card) {
            res.status(404).json({ error: 'Card not found', valid: false });
            return;
        }

        // Check if user is active
        if (!card.user.is_active) {
            res.status(400).json({ error: 'User account is inactive', valid: false });
            return;
        }

        // Check card status
        if (card.status !== 'ACTIVE') {
            res.status(400).json({
                error: `Card is ${card.status.toLowerCase()}`,
                valid: false,
                status: card.status
            });
            return;
        }

        // Check expiry
        const isExpired = new Date(card.expiry_date) < new Date();
        if (isExpired) {
            // Update card status to EXPIRED
            await prisma.healthCard.update({
                where: { id: card.id },
                data: { status: 'EXPIRED' }
            });

            res.status(400).json({
                error: 'Card has expired',
                valid: false,
                status: 'EXPIRED',
                expiry_date: card.expiry_date
            });
            return;
        }

        res.json({
            valid: true,
            discountEligible: true,  // Card is active and not expired, eligible for discounts
            card: {
                serial_number: card.serial_number,
                status: card.status,
                issue_date: card.issue_date,
                expiry_date: card.expiry_date
            },
            user: card.user
        });
    } catch (error) {
        console.error('Verify card error:', error);
        res.status(500).json({ error: 'Failed to verify card' });
    }
});

/**
 * Get all cards (paginated)
 * GET /api/cards
 */
router.get('/', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const status = req.query.status as string;
        const search = req.query.search as string;

        const where: any = {};

        if (status) {
            where.status = status;
        }

        if (search) {
            where.OR = [
                { serial_number: { contains: search } },
                { user: { name: { contains: search, mode: 'insensitive' } } }
            ];
        }

        const [cards, total] = await Promise.all([
            prisma.healthCard.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phone: true
                        }
                    }
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { created_at: 'desc' }
            }),
            prisma.healthCard.count({ where })
        ]);

        res.json({
            cards,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get cards error:', error);
        res.status(500).json({ error: 'Failed to fetch cards' });
    }
});

/**
 * Update card status
 * PATCH /api/cards/:id/status
 */
router.patch('/:id/status', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { status } = req.body;

        if (!['ACTIVE', 'INACTIVE', 'LOST'].includes(status)) {
            res.status(400).json({ error: 'Invalid status' });
            return;
        }

        const card = await prisma.healthCard.update({
            where: { id: req.params.id },
            data: { status },
            include: { user: true }
        });

        res.json(card);
    } catch (error) {
        console.error('Update card status error:', error);
        res.status(500).json({ error: 'Failed to update card status' });
    }
});

/**
 * Renew card (update expiry date)
 * PATCH /api/cards/:id/renew
 */
router.patch('/:id/renew', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { expiry_date } = req.body;

        if (!expiry_date) {
            res.status(400).json({ error: 'Expiry date is required' });
            return;
        }

        const newExpiry = new Date(expiry_date);
        if (newExpiry < new Date()) {
            res.status(400).json({ error: 'Expiry date must be in the future' });
            return;
        }

        const card = await prisma.healthCard.update({
            where: { id: req.params.id },
            data: {
                expiry_date: newExpiry,
                status: 'ACTIVE' // Reactivate the card
            },
            include: { user: true }
        });

        res.json({
            message: 'Card renewed successfully',
            card
        });
    } catch (error) {
        console.error('Renew card error:', error);
        res.status(500).json({ error: 'Failed to renew card' });
    }
});

/**
 * Get card statistics
 * GET /api/cards/stats
 */
router.get('/stats', authMiddleware, requireAdmin, async (_req: AuthRequest, res: Response) => {
    try {
        const [total, active, inactive, expired, lost] = await Promise.all([
            prisma.healthCard.count(),
            prisma.healthCard.count({ where: { status: 'ACTIVE' } }),
            prisma.healthCard.count({ where: { status: 'INACTIVE' } }),
            prisma.healthCard.count({ where: { status: 'EXPIRED' } }),
            prisma.healthCard.count({ where: { status: 'LOST' } })
        ]);

        // Cards expiring in next 30 days
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const expiringSoon = await prisma.healthCard.count({
            where: {
                status: 'ACTIVE',
                expiry_date: {
                    lte: thirtyDaysFromNow,
                    gt: new Date()
                }
            }
        });

        res.json({
            total,
            active,
            inactive,
            expired,
            lost,
            expiring_soon: expiringSoon
        });
    } catch (error) {
        console.error('Get card stats error:', error);
        res.status(500).json({ error: 'Failed to fetch card statistics' });
    }
});

/**
 * Generate and download card PDF
 * POST /api/cards/:id/print
 */
router.post('/:id/print', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const card = await prisma.healthCard.findUnique({
            where: { id: req.params.id },
            include: { user: true }
        });

        if (!card) {
            res.status(404).json({ error: 'Card not found' });
            return;
        }

        // Import card service (dynamic to avoid circular dependency)
        const { generateHealthCardPDF } = await import('../services/card.service.js');

        const result = await generateHealthCardPDF({ ...card.user, health_card: card });

        if (!result.success) {
            res.status(500).json({ error: result.error || 'Failed to generate card PDF' });
            return;
        }

        res.json({
            message: 'Card PDF generated successfully',
            file_url: result.filePath,
            download_url: `${process.env.API_URL || 'http://localhost:4000'}${result.filePath}`
        });
    } catch (error) {
        console.error('Print card error:', error);
        res.status(500).json({ error: 'Failed to print card' });
    }
});

export default router;
