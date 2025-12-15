'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import Cookies from 'js-cookie';
import { RootState } from '@/store/store';
import { setUser, clearAuth } from '@/store/slices/authSlice';
import { authAPI } from '@/lib/api';
import Sidebar from './Sidebar';
import Header from './Header';

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const dispatch = useDispatch();
    const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const token = Cookies.get('lab_token');
            if (!token) {
                dispatch(clearAuth());
                router.push('/login');
                return;
            }
            try {
                const response = await authAPI.getProfile();
                dispatch(setUser(response.data.user || response.data.staff));
            } catch (error) {
                Cookies.remove('lab_token');
                dispatch(clearAuth());
                router.push('/login');
            }
        };
        checkAuth();
    }, [dispatch, router]);

    if (isLoading) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '48px', height: '48px', border: '4px solid #e5e7eb', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                    <p style={{ color: '#6b7280' }}>Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) return null;

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
            <div style={{ flex: 1, marginLeft: sidebarOpen ? '260px' : '72px', transition: 'margin-left 0.3s ease' }}>
                <Header sidebarOpen={sidebarOpen} />
                <main style={{ padding: '24px', marginTop: '64px', minHeight: 'calc(100vh - 64px)', backgroundColor: '#f5f5f5' }}>
                    {children}
                </main>
            </div>
            <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
