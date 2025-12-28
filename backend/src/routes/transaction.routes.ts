/**
 * Transaction Routes with Automatic Discount Calculation
 */

import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';
import { requireLabAccess, requireAdmin } from '../middleware/rbac.middleware.js';
import { calculateDiscount } from '../services/discount.service.js';
import { generateReceiptNumber } from '../services/serial.service.js';
import { z } from 'zod';
import { Decimal } from '@prisma/client/runtime/library';

const router = Router();

// Validation schema
const createTransactionSchema = z.object({
    serial_number: z.string().min(10),
    test_name: z.string().min(2),
    original_amount: z.number().positive(),
    discount_percentage: z.number().min(0).max(100).optional(),
    discount_amount: z.number().min(0).optional(),
    final_amount: z.number().positive().optional()
});

/**
 * Get user's own transactions (User Portal)
 * GET /api/transactions/my
 */
router.get('/my', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        const where = { user_id: req.user?.id };

        const [transactions, total] = await Promise.all([
            prisma.transaction.findMany({
                where,
                include: {
                    lab: { select: { name: true } },
                    health_card: { select: { serial_number: true } }
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { created_at: 'desc' }
            }),
            prisma.transaction.count({ where })
        ]);

        res.json({
            transactions,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get my transactions error:', error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

/**
 * Create transaction with discount from frontend
 * POST /api/transactions
 */
router.post('/', authMiddleware, requireLabAccess, async (req: AuthRequest, res: Response) => {
    try {
        const data = createTransactionSchema.parse(req.body);
        const labId = req.user?.lab_id;

        if (!labId) {
            res.status(400).json({ error: 'Lab ID is required' });
            return;
        }

        // Verify card
        const card = await prisma.healthCard.findUnique({
            where: { serial_number: data.serial_number },
            include: { user: true }
        });

        if (!card) {
            res.status(404).json({ error: 'Card not found' });
            return;
        }

        if (card.status !== 'ACTIVE') {
            res.status(400).json({ error: `Card is ${card.status.toLowerCase()}` });
            return;
        }

        if (!card.user.is_active) {
            res.status(400).json({ error: 'User account is inactive' });
            return;
        }

        // Use discount values from frontend (already calculated per-test)
        // If not provided, calculate using old method as fallback
        let discountPercentage = data.discount_percentage ?? 0;
        let discountAmount = data.discount_amount ?? 0;
        let finalAmount = data.final_amount ?? data.original_amount;

        // If frontend didn't send discount values, calculate (fallback for compatibility)
        if (data.discount_percentage === undefined && data.discount_amount === undefined) {
            const discountResult = await calculateDiscount(data.original_amount, labId);
            discountPercentage = discountResult.discount_percentage;
            discountAmount = discountResult.discount_amount;
            finalAmount = discountResult.final_amount;
        }

        // Generate receipt number
        const receiptNumber = await generateReceiptNumber();

        // Create transaction
        const transaction = await prisma.transaction.create({
            data: {
                receipt_number: receiptNumber,
                user_id: card.user.id,
                health_card_id: card.id,
                lab_id: labId,
                test_name: data.test_name,
                original_amount: new Decimal(data.original_amount),
                discount_percentage: new Decimal(discountPercentage),
                discount_amount: new Decimal(discountAmount),
                final_amount: new Decimal(finalAmount)
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                },
                lab: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                        phone: true
                    }
                }
            }
        });

        res.status(201).json({
            transaction,
            receipt: {
                receipt_number: receiptNumber,
                patient_name: card.user.name,
                serial_number: data.serial_number,
                test_name: data.test_name,
                original_amount: data.original_amount,
                discount_percentage: discountPercentage,
                discount_amount: discountAmount,
                final_amount: finalAmount,
                lab_name: transaction.lab.name,
                lab_address: transaction.lab.address,
                date: transaction.created_at
            }
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Invalid input', details: error.errors });
            return;
        }
        console.error('Create transaction error:', error);
        res.status(500).json({ error: 'Failed to create transaction' });
    }
});

/**
 * Calculate discount preview (without creating transaction)
 * POST /api/transactions/calculate
 */
router.post('/calculate', authMiddleware, requireLabAccess, async (req: AuthRequest, res: Response) => {
    try {
        const { original_amount } = req.body;
        const labId = req.user?.lab_id;

        if (!original_amount || original_amount <= 0) {
            res.status(400).json({ error: 'Valid original amount is required' });
            return;
        }

        const discountResult = await calculateDiscount(original_amount, labId);
        res.json(discountResult);
    } catch (error) {
        console.error('Calculate discount error:', error);
        res.status(500).json({ error: 'Failed to calculate discount' });
    }
});

/**
 * Get all transactions (paginated)
 * GET /api/transactions
 */
router.get('/', authMiddleware, requireLabAccess, async (req: AuthRequest, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const search = req.query.search as string;
        const date_from = req.query.date_from as string;
        const date_to = req.query.date_to as string;

        const where: any = {};

        // Lab staff can only see their lab's transactions
        if (req.user?.role !== 'SUPER_ADMIN' && req.user?.lab_id) {
            where.lab_id = req.user.lab_id;
        }

        if (search) {
            where.OR = [
                { receipt_number: { contains: search } },
                { test_name: { contains: search, mode: 'insensitive' } },
                { user: { name: { contains: search, mode: 'insensitive' } } }
            ];
        }

        if (date_from || date_to) {
            where.created_at = {};
            if (date_from) where.created_at.gte = new Date(date_from);
            if (date_to) where.created_at.lte = new Date(date_to);
        }

        const [transactions, total] = await Promise.all([
            prisma.transaction.findMany({
                where,
                include: {
                    user: {
                        select: { id: true, name: true, email: true, phone: true }
                    },
                    lab: {
                        select: { id: true, name: true }
                    },
                    health_card: {
                        select: { serial_number: true }
                    },
                    _count: {
                        select: { reports: true }
                    }
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { created_at: 'desc' }
            }),
            prisma.transaction.count({ where })
        ]);

        res.json({
            transactions,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

/**
 * Get transaction by ID
 * GET /api/transactions/:id
 */
router.get('/:id', authMiddleware, requireLabAccess, async (req: AuthRequest, res: Response) => {
    try {
        const transaction = await prisma.transaction.findUnique({
            where: { id: req.params.id },
            include: {
                user: true,
                lab: true,
                health_card: true,
                reports: true
            }
        });

        if (!transaction) {
            res.status(404).json({ error: 'Transaction not found' });
            return;
        }

        // Check access
        if (req.user?.role !== 'SUPER_ADMIN' && req.user?.lab_id !== transaction.lab_id) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        res.json(transaction);
    } catch (error) {
        console.error('Get transaction error:', error);
        res.status(500).json({ error: 'Failed to fetch transaction' });
    }
});

/**
 * Get receipt for transaction
 * GET /api/transactions/:id/receipt
 */
router.get('/:id/receipt', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const transaction = await prisma.transaction.findUnique({
            where: { id: req.params.id },
            include: {
                user: {
                    select: { name: true, email: true, phone: true }
                },
                lab: {
                    select: { name: true, address: true, phone: true, email: true }
                },
                health_card: {
                    select: { serial_number: true }
                }
            }
        });

        if (!transaction) {
            res.status(404).json({ error: 'Transaction not found' });
            return;
        }

        res.json({
            receipt_number: transaction.receipt_number,
            date: transaction.created_at,
            patient: {
                name: transaction.user.name,
                phone: transaction.user.phone,
                serial_number: transaction.health_card.serial_number
            },
            lab: {
                name: transaction.lab.name,
                address: transaction.lab.address,
                phone: transaction.lab.phone
            },
            test_name: transaction.test_name,
            original_amount: Number(transaction.original_amount),
            discount_percentage: Number(transaction.discount_percentage),
            discount_amount: Number(transaction.discount_amount),
            final_amount: Number(transaction.final_amount)
        });
    } catch (error) {
        console.error('Get receipt error:', error);
        res.status(500).json({ error: 'Failed to fetch receipt' });
    }
});

/**
 * Get transaction statistics
 * GET /api/transactions/stats/overview
 */
router.get('/stats/overview', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const where: any = {};

        if (req.user?.role !== 'SUPER_ADMIN' && req.user?.lab_id) {
            where.lab_id = req.user.lab_id;
        }

        // Today's date range
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const [
            totalTransactions,
            todayTransactions,
            totalAmount,
            totalDiscount
        ] = await Promise.all([
            prisma.transaction.count({ where }),
            prisma.transaction.count({
                where: {
                    ...where,
                    created_at: { gte: today, lt: tomorrow }
                }
            }),
            prisma.transaction.aggregate({
                where,
                _sum: { final_amount: true }
            }),
            prisma.transaction.aggregate({
                where,
                _sum: { discount_amount: true }
            })
        ]);

        res.json({
            total_transactions: totalTransactions,
            today_transactions: todayTransactions,
            total_amount: totalAmount._sum.final_amount ? Number(totalAmount._sum.final_amount) : 0,
            total_discount_given: totalDiscount._sum.discount_amount ? Number(totalDiscount._sum.discount_amount) : 0
        });
    } catch (error) {
        console.error('Get transaction stats error:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

export default router;
