'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PasswordChangeScreen from '@/components/PasswordChangeScreen';

export default function ChangePasswordPage() {
    const router = useRouter();

    useEffect(() => {
        // Check if user is logged in
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
        }
    }, [router]);

    return (
        <PasswordChangeScreen
            userType="user"
            apiUrl={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}
            redirectPath="/dashboard"
        />
    );
}
