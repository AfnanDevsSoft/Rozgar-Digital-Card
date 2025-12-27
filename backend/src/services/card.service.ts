/**
 * Card PDF Generation Service
 * Generates 200x300mm health cards with user data overlaid on design templates
 */

import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { HealthCard, User } from '@prisma/client';

interface CardData extends User {
    health_card: HealthCard;
}

/**
 * Generate health card PDF with design overlay
 * Size: 200x300mm (portrait) = 566.93 x 850.39 points
 */
export const generateHealthCardPDF = async (
    userData: CardData
): Promise<{ success: boolean; filePath?: string; error?: string }> => {
    try {
        const outputDir = path.join(process.cwd(), 'uploads', 'cards');

        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const fileName = `card-${userData.health_card.serial_number}-${Date.now()}.pdf`;
        const filePath = path.join(outputDir, fileName);

        // Create PDF - 200x300mm
        const doc = new PDFDocument({
            size: [566.93, 850.39],
            margins: { top: 0, bottom: 0, left: 0, right: 0 }
        });

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // === CARD FRONT ===
        const cardFrontPath = path.join(process.cwd(), 'docs', 'CARD.jpg');
        if (fs.existsSync(cardFrontPath)) {
            doc.image(cardFrontPath, 0, 0, { width: 566.93, height: 850.39 });
        }

        // Overlay data on front
        overlayFrontData(doc, userData);

        // === CARD BACK ===
        doc.addPage();
        const cardBackPath = path.join(process.cwd(), 'docs', 'CARD-02.jpg');
        if (fs.existsSync(cardBackPath)) {
            doc.image(cardBackPath, 0, 0, { width: 566.93, height: 850.39 });
        }

        // Overlay data on back
        overlayBackData(doc, userData);

        doc.end();

        await new Promise<void>((resolve, reject) => {
            stream.on('finish', () => resolve());
            stream.on('error', reject);
        });

        return {
            success: true,
            filePath: `/uploads/cards/${fileName}`
        };
    } catch (error) {
        console.error('Card PDF generation error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
};

/**
 * Overlay user data on FRONT of card
 * Fields: Card No, Name, CNIC, Valid (Expiry)
 */
function overlayFrontData(doc: PDFKit.PDFDocument, userData: CardData) {
    // Card Number - Top center area (adjust Y based on your design)
    doc.font('Helvetica-Bold')
        .fontSize(16)
        .fillColor('#FFFFFF')
        .text(userData.health_card.serial_number, 50, 80, {
            width: 466.93,
            align: 'center'
        });

    // Cardholder Name - Below card number
    doc.font('Helvetica-Bold')
        .fontSize(14)
        .fillColor('#FFFFFF')
        .text(userData.name.toUpperCase(), 50, 130, {
            width: 466.93,
            align: 'left'
        });

    // CNIC - Below name
    doc.font('Helvetica')
        .fontSize(12)
        .fillColor('#FFFFFF')
        .text(`CNIC: ${userData.cnic}`, 50, 160, {
            width: 466.93,
            align: 'left'
        });

    // Valid Until (Expiry Date) - Right side
    const expiryDate = new Date(userData.health_card.expiry_date);
    const formattedExpiry = `${String(expiryDate.getMonth() + 1).padStart(2, '0')}/${expiryDate.getFullYear().toString().slice(2)}`;

    doc.font('Helvetica-Bold')
        .fontSize(12)
        .fillColor('#FFFFFF')
        .text(`VALID: ${formattedExpiry}`, 400, 130, {
            width: 100,
            align: 'right'
        });
}

/**
 * Overlay user data on BACK of card
 * Fields: Address, Signature line
 */
function overlayBackData(doc: PDFKit.PDFDocument, userData: CardData) {
    // Address - Fixed address as specified
    const address = 'PMML House Plot No:D-18, P.E.C.H.S Block 6,\nNursery Shahrah-e-Faisal Karachi';

    doc.font('Helvetica')
        .fontSize(10)
        .fillColor('#000000')
        .text(address, 50, 100, {
            width: 466.93,
            align: 'left',
            lineGap: 4
        });

    // Signature line (placeholder - actual signature would be added manually or via image)
    doc.font('Helvetica-Oblique')
        .fontSize(9)
        .fillColor('#666666')
        .text('Authorized Signature', 50, 200, {
            width: 466.93,
            align: 'right'
        });

    // Draw signature line
    doc.moveTo(350, 218)
        .lineTo(500, 218)
        .stroke('#666666');
}

export default { generateHealthCardPDF };
