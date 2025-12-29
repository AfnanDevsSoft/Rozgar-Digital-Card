'use client';

import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import MainLayout from '@/components/layouts/MainLayout';
import PasswordChangeScreen from '@/components/PasswordChangeScreen';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const user = useSelector((state: RootState) => state.auth.user);

    // Force password change on first login
    if (user?.must_change_password) {
        return (
            <PasswordChangeScreen
                userType="staff"
                apiUrl={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}
                redirectPath="/dashboard"
            />
        );
    }

    return <MainLayout>{children}</MainLayout>;
}
