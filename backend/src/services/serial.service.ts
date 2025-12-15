/**
 * Serial Number Generation Service
 * Format: DCD + YY (2-digit year) + 7 random digits
 * Example: DCD2512345678
 */

import { prisma } from '../app.js';

export const generateSerialNumber = async (): Promise<string> => {
    const year = new Date().getFullYear().toString().slice(-2);
    let serialNumber: string;
    let exists = true;

    // Keep generating until we find a unique one
    while (exists) {
        const random = Math.floor(Math.random() * 10000000)
            .toString()
            .padStart(7, '0');
        serialNumber = `DCD${year}${random}`;

        // Check if this serial number already exists
        const existing = await prisma.healthCard.findUnique({
            where: { serial_number: serialNumber }
        });

        exists = !!existing;
    }

    return serialNumber!;
};

/**
 * Generate Receipt Number
 * Format: INV-YYYY-NNNNN
 * Example: INV-2025-00001
 */
export const generateReceiptNumber = async (): Promise<string> => {
    const year = new Date().getFullYear();

    // Get or create counter for this year
    const counter = await prisma.receiptCounter.upsert({
        where: { year },
        update: { count: { increment: 1 } },
        create: { year, count: 1 }
    });

    const sequence = counter.count.toString().padStart(5, '0');
    return `INV-${year}-${sequence}`;
};

/**
 * Generate Lab Code
 * Format: LAB-XXXX (random 4 alphanumeric)
 */
export const generateLabCode = async (): Promise<string> => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let labCode: string;
    let exists = true;

    while (exists) {
        let code = '';
        for (let i = 0; i < 4; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        labCode = `LAB-${code}`;

        const existing = await prisma.lab.findUnique({
            where: { lab_code: labCode }
        });

        exists = !!existing;
    }

    return labCode!;
};
