import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seeding...');

    // Check if Super Admin already exists
    const existingAdmin = await prisma.admin.findFirst({
        where: { role: 'SUPER_ADMIN' }
    });

    if (existingAdmin) {
        console.log('✅ Super Admin already exists. Skipping seed.');
        return;
    }

    // Create Super Admin
    const hashedPassword = await bcrypt.hash('Admin@123', 12);

    const superAdmin = await prisma.admin.create({
        data: {
            email: 'admin@system.com',
            password_hash: hashedPassword,
            name: 'Super Admin',
            role: 'SUPER_ADMIN',
            is_active: true
        }
    });

    console.log('✅ Super Admin created:');
    console.log('   Email: admin@system.com');
    console.log('   Password: Admin@123');
    console.log('   ⚠️  Please change the password after first login!');

    // Create default discount settings
    await prisma.discountSettings.create({
        data: {
            default_discount_rate: 30.00,
            apply_to_expired: false
        }
    });

    console.log('✅ Default discount settings created (30%)');

    // Initialize receipt counter for current year
    const currentYear = new Date().getFullYear();
    await prisma.receiptCounter.create({
        data: {
            year: currentYear,
            count: 0
        }
    });

    console.log(`✅ Receipt counter initialized for ${currentYear}`);

    console.log('🎉 Database seeding completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
