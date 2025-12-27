/**
 * File Storage and Compression Service
 */

import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Ensure upload directory exists
export const initStorage = async (): Promise<void> => {
    try {
        await fs.mkdir(UPLOAD_DIR, { recursive: true });
        await fs.mkdir(path.join(UPLOAD_DIR, 'reports'), { recursive: true });
        console.log('✅ Storage directories initialized');
    } catch (error) {
        console.error('❌ Failed to initialize storage:', error);
    }
};

interface UploadResult {
    success: boolean;
    fileName?: string;
    filePath?: string;
    fileUrl?: string;
    fileSize?: number;
    fileType?: string;
    error?: string;
}

/**
 * Save uploaded file with compression
 */
export const saveFile = async (
    file: Express.Multer.File
): Promise<UploadResult> => {
    try {
        // Check file size
        if (file.size > MAX_FILE_SIZE) {
            return { success: false, error: 'File size exceeds 10MB limit' };
        }

        const ext = path.extname(file.originalname).toLowerCase();
        const uniqueName = `${uuidv4()}${ext}`;
        const filePath = path.join(UPLOAD_DIR, 'reports', uniqueName);

        // Image compression
        if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
            const compressed = await sharp(file.buffer)
                .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
                .jpeg({ quality: 80 })
                .toBuffer();

            await fs.writeFile(filePath, compressed);

            return {
                success: true,
                fileName: file.originalname,
                filePath,
                fileUrl: `/api/uploads/reports/${uniqueName}`,
                fileSize: compressed.length,
                fileType: file.mimetype
            };
        }

        // For non-image files, save as-is
        await fs.writeFile(filePath, file.buffer);

        return {
            success: true,
            fileName: file.originalname,
            filePath,
            fileUrl: `/api/uploads/reports/${uniqueName}`,
            fileSize: file.size,
            fileType: file.mimetype
        };
    } catch (error) {
        console.error('❌ File save error:', error);
        return { success: false, error: 'Failed to save file' };
    }
};

/**
 * Delete file
 */
export const deleteFile = async (filePath: string): Promise<boolean> => {
    try {
        await fs.unlink(filePath);
        return true;
    } catch (error) {
        console.error('❌ File delete error:', error);
        return false;
    }
};

/**
 * Get file stats
 */
export const getFileStats = async (filePath: string) => {
    try {
        const stats = await fs.stat(filePath);
        return {
            exists: true,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime
        };
    } catch {
        return { exists: false };
    }
};

// Initialize storage on module load
initStorage();
