'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export default function HomePage() {
    const router = useRouter();

    useEffect(() => {
        const token = Cookies.get('user_token');
        router.push(token ? '/dashboard' : '/login');
    }, [router]);

    return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p>Redirecting...</p>
        </div>
    );
}
