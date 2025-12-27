/**
 * File Upload Route for User Documents
 * Handles CNIC photos, disability certificates, passport photos
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import sharp from 'sharp';

const router = Router();

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'uploads', 'user-documents');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

// File filter
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and PDF files are allowed.'));
    }
};

// Configure multer
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

/**
 * Upload user documents
 * POST /api/upload/user-documents
 * Accepts: cnic_front, cnic_back, disability_certificate, passport_photo
 */
router.post('/user-documents', upload.fields([
    { name: 'cnic_front', maxCount: 1 },
    { name: 'cnic_back', maxCount: 1 },
    { name: 'disability_certificate', maxCount: 1 },
    { name: 'passport_photo', maxCount: 1 }
]), async (req: Request, res: Response) => {
    try {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        const uploadedFiles: { [key: string]: string } = {};

        if (!files || Object.keys(files).length === 0) {
            res.status(400).json({ error: 'No files uploaded' });
            return;
        }

        // Process each uploaded file
        for (const [fieldName, fileArray] of Object.entries(files)) {
            if (fileArray && fileArray.length > 0) {
                const file = fileArray[0];

                // Optimize images (not PDFs)
                if (file.mimetype.startsWith('image/')) {
                    try {
                        const optimizedPath = path.join(uploadDir, `optimized-${file.filename}`);
                        await sharp(file.path)
                            .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
                            .jpeg({ quality: 85 })
                            .toFile(optimizedPath);

                        // Remove original and rename optimized
                        fs.unlinkSync(file.path);
                        fs.renameSync(optimizedPath, file.path);
                    } catch (error) {
                        console.warn('Image optimization failed, using original:', error);
                    }
                }

                // Store relative path
                uploadedFiles[fieldName] = `/uploads/user-documents/${file.filename}`;
            }
        }

        res.json({
            success: true,
            files: uploadedFiles,
            message: 'Files uploaded successfully'
        });
    } catch (error) {
        console.error('File upload error:', error);
        res.status(500).json({ error: 'Failed to upload files' });
    }
});

/**
 * Upload single file (generic)
 * POST /api/upload/single
 */
router.post('/single', upload.single('file'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        const filePath = `/uploads/user-documents/${req.file.filename}`;

        res.json({
            success: true,
            file: filePath,
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size,
            message: 'File uploaded successfully'
        });
    } catch (error) {
        console.error('Single file upload error:', error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
});

export default router;
