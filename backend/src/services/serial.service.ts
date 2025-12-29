/**
 * Serial Number Generation Service
 * Format: SSC-YYMM-NNNNN
 * - SSC: Static prefix
 * - YYMM: Year (2 digits) + Month (2 digits)
 * - NNNNN: Sequential number (5 digits, zero-padded)
 * Example: SSC-2512-00001
 */

import { prisma } from '../lib/prisma.js';

export const generateSerialNumber = async (): Promise<string> => {
    const now = new Date();
    const year = now.getFullYear(); // Full year (e.g., 2025)
    const month = now.getMonth() + 1; // Month (1-12)

    // Format year and month as YYMM (e.g., 2512 for Dec 2025)
    const yearStr = year.toString().slice(-2); // Last 2 digits
    const monthStr = month.toString().padStart(2, '0'); // Zero-pad month
    const yearMonth = `${yearStr}${monthStr}`; // e.g., "2512"

    // Get or create counter for this year/month combination
    const counter = await prisma.cardCounter.upsert({
        where: {
            year_month_town_code: {
                year,
                month,
                town_code: '0000' // Default town code (not used but required for unique constraint)
            }
        },
        update: {
            count: { increment: 1 }
        },
        create: {
            year,
            month,
            town_code: '0000',
            count: 1
        }
    });

    // Format sequence number (5 digits, zero-padded)
    const sequence = counter.count.toString().padStart(5, '0');

    // Construct final serial number: SSC-YYMM-NNNNN
    return `SSC-${yearMonth}-${sequence}`;
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
