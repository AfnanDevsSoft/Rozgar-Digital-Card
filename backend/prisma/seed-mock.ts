import { PrismaClient, Role, CardStatus, LabStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting comprehensive mock data seeding...');

    // 1. Setup Towns
    console.log('📍 Seeding Towns...');
    const towns = ['Gulberg', 'DHA', 'Bahria Town', 'Johar Town', 'Model Town'];
    for (let i = 0; i < towns.length; i++) {
        await prisma.town.upsert({
            where: { code: `000${i + 1}` },
            update: {},
            create: {
                name: towns[i],
                code: `000${i + 1}`,
                is_active: true
            }
        });
    }

    // 2. Setup Labs
    console.log('🏥 Seeding Labs...');
    const labs = [
        { name: 'City Diagnostic Center', code: 'LAB001', address: '123 Main Blvd, Gulberg', phone: '0300-1111111', email: 'info@citylab.com' },
        { name: 'Alpha Health Lab', code: 'LAB002', address: '45-A DHA Phase 6', phone: '0300-2222222', email: 'contact@alphalab.com' },
        { name: 'Medicare Diagnostics', code: 'LAB003', address: 'Civic Center, Bahria Town', phone: '0300-3333333', email: 'support@medicare.com' }
    ];

    const createdLabs = [];
    for (const lab of labs) {
        const createdLab = await prisma.lab.upsert({
            where: { lab_code: lab.code },
            update: {},
            create: {
                name: lab.name,
                lab_code: lab.code,
                address: lab.address,
                phone: lab.phone,
                email: lab.email,
                status: 'ACTIVE',
                license_no: `LIC-${lab.code}`,
                discount_rate: 30.0
            }
        });
        createdLabs.push(createdLab);
    }

    // 3. Setup Super Admin
    console.log('👮 Seeding Super Admin...');
    const adminPassword = await bcrypt.hash('Admin@123', 12);
    await prisma.admin.upsert({
        where: { email: 'admin@system.com' },
        update: {},
        create: {
            email: 'admin@system.com',
            password_hash: adminPassword,
            name: 'Super Admin',
            role: 'SUPER_ADMIN',
            is_active: true
        }
    });

    // 4. Setup Branch Admins & Staff
    console.log('👥 Seeding Lab Admins & Staff...');
    const userPassword = await bcrypt.hash('User@123', 12);

    for (let i = 0; i < createdLabs.length; i++) {
        const lab = createdLabs[i];

        // Create Lab Admin
        await prisma.admin.upsert({
            where: { email: `admin@${lab.lab_code.toLowerCase()}.com` }, // e.g., admin@lab001.com
            update: {},
            create: {
                email: `admin@${lab.lab_code.toLowerCase()}.com`,
                password_hash: userPassword,
                name: `${lab.name} Admin`,
                role: 'BRANCH_ADMIN',
                lab_id: lab.id,
                is_active: true
            }
        });

        // Create Lab Staff (Receptionist)
        await prisma.labStaff.upsert({
            where: { email: `staff@${lab.lab_code.toLowerCase()}.com` },
            update: {},
            create: {
                lab_id: lab.id,
                name: `${lab.name} Receptionist`,
                email: `staff@${lab.lab_code.toLowerCase()}.com`,
                password_hash: userPassword,
                is_active: true
            }
        });

        // 5. Setup Test Catalog
        console.log(`🧪 Seeding tests for ${lab.name}...`);
        const tests = [
            { name: 'Complete Blood Count (CBC)', category: 'Hematology', price: 1500 },
            { name: 'Lipid Profile', category: 'Biochemistry', price: 2500 },
            { name: 'Liver Function Test (LFT)', category: 'Biochemistry', price: 2000 },
            { name: 'Blood Sugar Random', category: 'Biochemistry', price: 500 },
            { name: 'PCR Test', category: 'Molecular Biology', price: 6500 }
        ];

        for (const test of tests) {
            // Check if test exists for this lab to avoid duplicates
            const existing = await prisma.testCatalog.findFirst({
                where: { lab_id: lab.id, name: test.name }
            });

            if (!existing) {
                await prisma.testCatalog.create({
                    data: {
                        lab_id: lab.id,
                        name: test.name,
                        category: test.category,
                        price: test.price,
                        discount_percent: 0
                    }
                });
            }
        }
    }

    // 6. Setup Users & Health Cards
    console.log('👨‍👩‍👧‍👦 Seeding Users & Health Cards...');
    const usersData = [
        { name: 'Ali Khan', cnic: '35202-1111111-1', phone: '0321-1111111', town: 'Gulberg', email: 'ali.khan@example.com' },
        { name: 'Sara Ahmed', cnic: '35202-2222222-2', phone: '0321-2222222', town: 'DHA', email: 'sara.ahmed@example.com' },
        { name: 'Usman Bilal', cnic: '35202-3333333-3', phone: '0321-3333333', town: 'Johar Town', email: 'usman.bilal@example.com' },
        { name: 'Fatima Noor', cnic: '35202-4444444-4', phone: '0321-4444444', town: 'Model Town', email: 'fatima.noor@example.com' },
        { name: 'Zainab Bibi', cnic: '35202-5555555-5', phone: '0321-5555555', town: 'Bahria Town', email: 'zainab.bibi@example.com' }
    ];

    const receiptCounter = await prisma.receiptCounter.upsert({
        where: { year: new Date().getFullYear() },
        update: {},
        create: { year: new Date().getFullYear(), count: 0 }
    });

    for (let i = 0; i < usersData.length; i++) {
        const u = usersData[i];
        const user = await prisma.user.upsert({
            where: { cnic: u.cnic },
            update: {},
            create: {
                name: u.name,
                cnic: u.cnic,
                phone: u.phone,
                town: u.town,
                email: u.email,
                password_hash: userPassword,
                is_active: true,
                address: `House ${i + 1}, Street 5, ${u.town}, Lahore`
            }
        });

        // Create Health Card
        const serialNumber = `SSC-${new Date().getFullYear()}-0001-000${i + 1}`;
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);

        const card = await prisma.healthCard.upsert({
            where: { user_id: user.id },
            update: {},
            create: {
                serial_number: serialNumber, // Simple serial for mock
                user_id: user.id,
                status: 'ACTIVE',
                expiry_date: expiryDate
            }
        });

        // 7. Setup Transactions (Random for each user)
        console.log(`💸 Creating mock transactions for ${u.name}...`);

        // Pick a random lab
        const randomLab = createdLabs[Math.floor(Math.random() * createdLabs.length)];

        // Create 2 transactions per user
        for (let j = 0; j < 2; j++) {
            const receiptNum = `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 100000)}`;

            await prisma.transaction.create({
                data: {
                    receipt_number: receiptNum,
                    user_id: user.id,
                    health_card_id: card.id,
                    lab_id: randomLab.id,
                    test_name: j === 0 ? 'Complete Blood Count (CBC)' : 'Lipid Profile',
                    original_amount: j === 0 ? 1500 : 2500,
                    discount_percentage: 30,
                    discount_amount: j === 0 ? 450 : 750,
                    final_amount: j === 0 ? 1050 : 1750
                }
            });
        }
    }

    // 8. Default Discount Settings
    await prisma.discountSettings.upsert({
        where: { id: 'default' }, // Assuming single row usage primarily, but schema uses uuid. We will create if empty.
        update: {},
        create: {
            default_discount_rate: 30.00,
            apply_to_expired: false
        }
    }).catch(() => {
        // Fallback for uuid if 'default' fails validation or isn't appropriate, 
        // usually for settings tables we fetch first or use a known ID.
        // For simplicity in seed, we'll try findFirst to skip if exists.
        prisma.discountSettings.findFirst().then(async found => {
            if (!found) {
                await prisma.discountSettings.create({
                    data: {
                        default_discount_rate: 30.00,
                        apply_to_expired: false
                    }
                });
            }
        })
    });

    console.log('✅ Mock data seeding completed successfully!');
    console.log('\n--- Login Credentials ---');
    console.log('Super Admin: admin@system.com / Admin@123');
    console.log('Lab Admin:   admin@lab001.com / User@123 (City Lab)');
    console.log('Lab Staff:   staff@lab001.com / User@123 (City Lab)');
    console.log('User Portal: 35202-1111111-1 / User@123 (Ali Khan)');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
