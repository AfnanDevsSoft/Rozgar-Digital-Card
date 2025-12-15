'use client';

/**
 * Header Component
 */

import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { RootState } from '@/store/store';
import { clearAuth } from '@/store/slices/authSlice';
import { LogOut, Bell, User } from 'lucide-react';

interface HeaderProps {
    sidebarOpen: boolean;
}

export default function Header({ sidebarOpen }: HeaderProps) {
    const dispatch = useDispatch();
    const router = useRouter();
    const user = useSelector((state: RootState) => state.auth.user);
    const currentPage = useSelector((state: RootState) => state.ui.currentPage);

    const handleLogout = () => {
        Cookies.remove('admin_token');
        dispatch(clearAuth());
        router.push('/login');
    };

    return (
        <header
            style={{
                height: '64px',
                backgroundColor: '#ffffff',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 24px',
                position: 'fixed',
                top: 0,
                right: 0,
                left: sidebarOpen ? '260px' : '72px',
                zIndex: 50,
                transition: 'left 0.3s ease',
            }}
        >
            {/* Page Title */}
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#0a0a0a' }}>
                {currentPage}
            </h2>

            {/* Right Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {/* Notifications */}
                <button
                    style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                    }}
                >
                    <Bell size={20} color="#4b5563" />
                </button>

                {/* User Menu */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        backgroundColor: '#f5f5f5',
                    }}
                >
                    <div
                        style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: '#0a0a0a',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <User size={16} color="#ffffff" />
                    </div>
                    <div>
                        <p style={{ fontSize: '14px', fontWeight: 500, color: '#0a0a0a' }}>
                            {user?.name || 'Admin'}
                        </p>
                        <p style={{ fontSize: '12px', color: '#6b7280' }}>
                            {user?.role?.replace('_', ' ') || 'Role'}
                        </p>
                    </div>
                </div>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: '#fee2e2',
                        color: '#dc2626',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 500,
                    }}
                >
                    <LogOut size={16} />
                    Logout
                </button>
            </div>
        </header>
    );
}
