'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import Cookies from 'js-cookie';
import Link from 'next/link';
import { RootState } from '@/store/store';
import { setUser, clearAuth } from '@/store/slices/authSlice';
import { authAPI } from '@/lib/api';
import { CreditCard, FileText, Receipt, LogOut, User, Menu, X } from 'lucide-react';

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const dispatch = useDispatch();
    const { user, isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            const token = Cookies.get('user_token');
            if (!token) {
                dispatch(clearAuth());
                router.push('/login');
                return;
            }
            try {
                const response = await authAPI.getProfile();
                dispatch(setUser(response.data.user));
            } catch (error) {
                Cookies.remove('user_token');
                dispatch(clearAuth());
                router.push('/login');
            }
        };
        checkAuth();
    }, [dispatch, router]);

    const handleLogout = () => {
        Cookies.remove('user_token');
        dispatch(clearAuth());
        router.push('/login');
    };

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
        <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
            {/* Header */}
            <header style={{ backgroundColor: '#0a0a0a', color: '#fff', padding: '0 24px', position: 'sticky', top: 0, zIndex: 100 }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: '#fff' }}>
                        <span style={{ fontSize: '24px' }}>🏥</span>
                        <span style={{ fontSize: '18px', fontWeight: 700 }}>My Health Card</span>
                    </Link>

                    {/* Desktop Nav */}
                    <nav style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                        <Link href="/dashboard" style={{ color: '#fff', textDecoration: 'none', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <CreditCard size={18} /> Card
                        </Link>
                        <Link href="/dashboard/reports" style={{ color: '#fff', textDecoration: 'none', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FileText size={18} /> Reports
                        </Link>
                        <Link href="/dashboard/transactions" style={{ color: '#fff', textDecoration: 'none', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Receipt size={18} /> History
                        </Link>
                    </nav>

                    {/* User */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <User size={16} color="#fff" />
                            </div>
                            <span style={{ fontSize: '14px' }}>{user?.name}</span>
                        </div>
                        <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px' }}>
                            <LogOut size={16} /> Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
                {children}
            </main>

            <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
