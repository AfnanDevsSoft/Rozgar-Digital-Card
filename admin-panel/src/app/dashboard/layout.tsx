'use client';

/**
 * Dashboard Layout - wraps all dashboard pages
 */

import MainLayout from '@/components/layouts/MainLayout';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <MainLayout>{children}</MainLayout>;
}
