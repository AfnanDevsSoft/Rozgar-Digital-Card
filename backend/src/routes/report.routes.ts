/**
 * Report Management Routes
 * Supports batch upload per invoice with duplicate prevention
 */

import { Router, Response } from 'express';
import multer from 'multer';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';
import { requireLabAccess, requireUser } from '../middleware/rbac.middleware.js';
import { saveFile, deleteFile } from '../services/storage.service.js';
import { sendReportNotification } from '../services/email.service.js';

const router = Router();

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 5
    },
    fileFilter: (_req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/webp',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    }
});

/**
 * Upload report for a transaction
 * POST /api/reports
 */
router.post('/', authMiddleware, requireLabAccess, upload.any(), async (req: AuthRequest, res: Response) => {
    try {
        const { transaction_id, receipt_number } = req.body;
        const files = req.files as Express.Multer.File[];

        if (!transaction_id) {
            res.status(400).json({ error: 'Transaction ID is required' });
            return;
        }

        if (!files || files.length === 0) {
            res.status(400).json({ error: 'At least one file is required' });
            return;
        }

        // Get transaction
        const transaction = await prisma.transaction.findUnique({
            where: { id: transaction_id },
            include: {
                user: true,
                lab: true
            }
        });

        if (!transaction) {
            res.status(404).json({ error: 'Transaction not found' });
            return;
        }

        // Check lab access
        if (req.user?.role !== 'SUPER_ADMIN' && req.user?.lab_id !== transaction.lab_id) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        // Check if invoice already has reports uploaded (prevent duplicates)
        const invoiceReceiptNumber = receipt_number || transaction.receipt_number;
        const existingUpload = await prisma.uploadedInvoice.findUnique({
            where: { receipt_number: invoiceReceiptNumber }
        });

        if (existingUpload) {
            res.status(400).json({
                error: 'Reports already uploaded for this invoice',
                message: `Invoice ${invoiceReceiptNumber} already has reports uploaded on ${existingUpload.uploaded_at.toLocaleDateString()}`,
                uploaded_at: existingUpload.uploaded_at
            });
            return;
        }

        // Generate batch ID for this upload session
        const batchId = `batch-${Date.now()}-${transaction.id.slice(0, 8)}`;

        // Save files and create report records
        const reports = [];

        for (const file of files) {
            const result = await saveFile(file);

            if (!result.success) {
                res.status(500).json({ error: result.error || 'Failed to save file' });
                return;
            }

            const report = await prisma.report.create({
                data: {
                    transaction_id: transaction.id,
                    user_id: transaction.user_id,
                    lab_id: transaction.lab_id,
                    file_name: result.fileName!,
                    file_url: result.fileUrl!,
                    file_type: result.fileType!,
                    file_size: result.fileSize!,
                    uploaded_in_batch: files.length > 1,
                    batch_id: batchId,
                    status: 'UPLOADED'
                }
            });

            reports.push(report);
        }

        // Mark invoice as uploaded to prevent future duplicates
        await prisma.uploadedInvoice.create({
            data: {
                receipt_number: invoiceReceiptNumber,
                lab_id: transaction.lab_id
            }
        });

        // Send email notification to user
        const portalUrl = process.env.USER_PORTAL_URL || 'http://localhost:3003';
        await sendReportNotification(
            transaction.user.email,
            transaction.user.name,
            transaction.lab.name,
            transaction.test_name,
            portalUrl
        );

        res.status(201).json({
            message: `${files.length} report(s) uploaded successfully`,
            reports,
            batch_id: batchId,
            notification_sent: true
        });
    } catch (error) {
        console.error('Upload report error:', error);
        res.status(500).json({ error: 'Failed to upload report' });
    }
});

/**
 * Get reports for a user (User Portal)
 * GET /api/reports/my
 */
router.get('/my', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        const where: any = { user_id: req.user?.id };

        const [reports, total] = await Promise.all([
            prisma.report.findMany({
                where,
                include: {
                    lab: {
                        select: { name: true }
                    },
                    transaction: {
                        select: { test_name: true, receipt_number: true, created_at: true }
                    }
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { uploaded_at: 'desc' }
            }),
            prisma.report.count({ where })
        ]);

        res.json({
            reports,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get my reports error:', error);
        res.status(500).json({ error: 'Failed to fetch reports' });
    }
});

/**
 * Get all reports (Lab/Admin)
 * GET /api/reports
 */
router.get('/', authMiddleware, requireLabAccess, async (req: AuthRequest, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const status = req.query.status as string;

        const where: any = {};

        // Lab staff can only see their lab's reports
        if (req.user?.role !== 'SUPER_ADMIN' && req.user?.lab_id) {
            where.lab_id = req.user.lab_id;
        }

        if (status) {
            where.status = status;
        }

        const [reports, total] = await Promise.all([
            prisma.report.findMany({
                where,
                include: {
                    user: {
                        select: { name: true, email: true, phone: true }
                    },
                    lab: {
                        select: { name: true }
                    },
                    transaction: {
                        select: { test_name: true, receipt_number: true }
                    }
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { uploaded_at: 'desc' }
            }),
            prisma.report.count({ where })
        ]);

        res.json({
            reports,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get reports error:', error);
        res.status(500).json({ error: 'Failed to fetch reports' });
    }
});

/**
 * Get report by ID
 * GET /api/reports/:id
 */
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const report = await prisma.report.findUnique({
            where: { id: req.params.id },
            include: {
                user: true,
                lab: true,
                transaction: true
            }
        });

        if (!report) {
            res.status(404).json({ error: 'Report not found' });
            return;
        }

        // Check access
        const isOwner = req.user?.id === report.user_id;
        const isLabStaff = req.user?.lab_id === report.lab_id;
        const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';

        if (!isOwner && !isLabStaff && !isSuperAdmin) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        res.json(report);
    } catch (error) {
        console.error('Get report error:', error);
        res.status(500).json({ error: 'Failed to fetch report' });
    }
});

/**
 * Update report status
 * PATCH /api/reports/:id/status
 */
router.patch('/:id/status', authMiddleware, requireLabAccess, async (req: AuthRequest, res: Response) => {
    try {
        const { status } = req.body;

        if (!['PENDING', 'UPLOADED', 'DELIVERED'].includes(status)) {
            res.status(400).json({ error: 'Invalid status' });
            return;
        }

        const report = await prisma.report.update({
            where: { id: req.params.id },
            data: { status }
        });

        res.json(report);
    } catch (error) {
        console.error('Update report status error:', error);
        res.status(500).json({ error: 'Failed to update report status' });
    }
});

/**
 * Delete report
 * DELETE /api/reports/:id
 */
router.delete('/:id', authMiddleware, requireLabAccess, async (req: AuthRequest, res: Response) => {
    try {
        const report = await prisma.report.findUnique({
            where: { id: req.params.id }
        });

        if (!report) {
            res.status(404).json({ error: 'Report not found' });
            return;
        }

        // Check lab access
        if (req.user?.role !== 'SUPER_ADMIN' && req.user?.lab_id !== report.lab_id) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        // Delete file from storage
        await deleteFile(report.file_url);

        // Delete from database
        await prisma.report.delete({
            where: { id: req.params.id }
        });

        res.json({ message: 'Report deleted successfully' });
    } catch (error) {
        console.error('Delete report error:', error);
        res.status(500).json({ error: 'Failed to delete report' });
    }
});

/**
 * Get report statistics
 * GET /api/reports/stats/overview
 */
router.get('/stats/overview', authMiddleware, requireLabAccess, async (req: AuthRequest, res: Response) => {
    try {
        const where: any = {};

        if (req.user?.role !== 'SUPER_ADMIN' && req.user?.lab_id) {
            where.lab_id = req.user.lab_id;
        }

        const [total, pending, uploaded, delivered] = await Promise.all([
            prisma.report.count({ where }),
            prisma.report.count({ where: { ...where, status: 'PENDING' } }),
            prisma.report.count({ where: { ...where, status: 'UPLOADED' } }),
            prisma.report.count({ where: { ...where, status: 'DELIVERED' } })
        ]);

        res.json({
            total,
            pending,
            uploaded,
            delivered
        });
    } catch (error) {
        console.error('Get report stats error:', error);
        res.status(500).json({ error: 'Failed to fetch report statistics' });
    }
});

export default router;
