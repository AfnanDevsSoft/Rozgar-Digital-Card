/**
 * Discount Calculation Service
 */

import { prisma } from '../lib/prisma.js';
import { Decimal } from '@prisma/client/runtime/library';

export interface DiscountResult {
    original_amount: number;
    discount_percentage: number;
    discount_amount: number;
    final_amount: number;
}

/**
 * Calculate discount for a given amount
 */
export const calculateDiscount = async (
    originalAmount: number,
    labId?: string
): Promise<DiscountResult> => {
    let discountRate: number;

    // If lab is specified, use lab's discount rate
    if (labId) {
        const lab = await prisma.lab.findUnique({
            where: { id: labId },
            select: { discount_rate: true }
        });

        if (lab) {
            discountRate = Number(lab.discount_rate);
        } else {
            // Fallback to global settings
            discountRate = await getGlobalDiscountRate();
        }
    } else {
        discountRate = await getGlobalDiscountRate();
    }

    const discountAmount = originalAmount * (discountRate / 100);
    const finalAmount = originalAmount - discountAmount;

    return {
        original_amount: originalAmount,
        discount_percentage: discountRate,
        discount_amount: Math.round(discountAmount * 100) / 100,
        final_amount: Math.round(finalAmount * 100) / 100
    };
};

/**
 * Get global discount rate from settings
 */
export const getGlobalDiscountRate = async (): Promise<number> => {
    const settings = await prisma.discountSettings.findFirst();
    return settings ? Number(settings.default_discount_rate) : 30;
};

/**
 * Check if discount applies to expired cards
 */
export const shouldApplyToExpired = async (): Promise<boolean> => {
    const settings = await prisma.discountSettings.findFirst();
    return settings?.apply_to_expired ?? false;
};

/**
 * Update global discount settings
 */
export const updateDiscountSettings = async (
    discountRate: number,
    applyToExpired: boolean
): Promise<void> => {
    const existing = await prisma.discountSettings.findFirst();

    if (existing) {
        await prisma.discountSettings.update({
            where: { id: existing.id },
            data: {
                default_discount_rate: new Decimal(discountRate),
                apply_to_expired: applyToExpired
            }
        });
    } else {
        await prisma.discountSettings.create({
            data: {
                default_discount_rate: new Decimal(discountRate),
                apply_to_expired: applyToExpired
            }
        });
    }
};
