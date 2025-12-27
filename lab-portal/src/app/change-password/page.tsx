'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PasswordChangeScreen from '@/components/PasswordChangeScreen';

export default function ChangePasswordPage() {
    const router = useRouter();
    const [mustChange, setMustChange] = useState(false);

    useEffect(() => {
        // Check if password change is required
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        // Verify from stored user data or make API call
        const userDataStr = localStorage.getItem('user');
        if (userDataStr) {
            const userData = JSON.parse(userDataStr);
            if (userData.must_change_password) {
                setMustChange(true);
            }
        }
    }, [router]);

    if (!mustChange) {
        return null;
    }

    return (
        <PasswordChangeScreen
            userType="staff"
            apiUrl={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}
            redirectPath="/dashboard"
        />
    );
}
