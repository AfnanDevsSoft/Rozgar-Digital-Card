'use client';

/**
 * Sidebar Component - Black theme
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import {
    LayoutDashboard,
    Users,
    CreditCard,
    Building2,
    UserCog,
    Settings,
    Receipt,
    FileText,
    Percent,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';

interface NavItem {
    name: string;
    href: string;
    icon: React.ReactNode;
    roles?: string[];
}

const navItems: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Users', href: '/dashboard/users', icon: <Users size={20} /> },
    { name: 'Health Cards', href: '/dashboard/cards', icon: <CreditCard size={20} /> },
    { name: 'Labs', href: '/dashboard/labs', icon: <Building2 size={20} />, roles: ['SUPER_ADMIN'] },
    { name: 'Admins', href: '/dashboard/admins', icon: <UserCog size={20} />, roles: ['SUPER_ADMIN'] },
    { name: 'Transactions', href: '/dashboard/transactions', icon: <Receipt size={20} /> },
    { name: 'Reports', href: '/dashboard/reports', icon: <FileText size={20} /> },
    { name: 'Discount Settings', href: '/dashboard/settings/discount', icon: <Percent size={20} />, roles: ['SUPER_ADMIN'] },
    { name: 'Settings', href: '/dashboard/settings', icon: <Settings size={20} /> },
];

interface SidebarProps {
    isOpen: boolean;
    onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
    const pathname = usePathname();
    const user = useSelector((state: RootState) => state.auth.user);

    const filteredNavItems = navItems.filter((item) => {
        if (!item.roles) return true;
        return user && item.roles.includes(user.role);
    });

    return (
        <aside
            className="sidebar"
            style={{
                width: isOpen ? '260px' : '72px',
                minWidth: isOpen ? '260px' : '72px',
                height: '100vh',
                position: 'fixed',
                left: 0,
                top: 0,
                backgroundColor: '#0a0a0a',
                color: '#ffffff',
                transition: 'width 0.3s ease',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {/* Logo */}
            <div
                style={{
                    height: '64px',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 20px',
                    borderBottom: '1px solid #1f1f1f',
                }}
            >
                {isOpen ? (
                    <h1 style={{ fontSize: '18px', fontWeight: 700 }}>🏥 Health Card</h1>
                ) : (
                    <span style={{ fontSize: '24px' }}>🏥</span>
                )}
            </div>

            {/* Navigation */}
            <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
                {filteredNavItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px',
                                borderRadius: '8px',
                                marginBottom: '4px',
                                color: isActive ? '#ffffff' : '#9ca3af',
                                backgroundColor: isActive ? '#2563eb' : 'transparent',
                                textDecoration: 'none',
                                transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.backgroundColor = '#1f1f1f';
                                    e.currentTarget.style.color = '#ffffff';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = '#9ca3af';
                                }
                            }}
                        >
                            {item.icon}
                            {isOpen && <span style={{ fontSize: '14px' }}>{item.name}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* Toggle Button */}
            <button
                onClick={onToggle}
                style={{
                    position: 'absolute',
                    right: '-14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
            >
                {isOpen ? <ChevronLeft size={16} color="#0a0a0a" /> : <ChevronRight size={16} color="#0a0a0a" />}
            </button>

            {/* User Info */}
            {user && isOpen && (
                <div
                    style={{
                        padding: '16px',
                        borderTop: '1px solid #1f1f1f',
                    }}
                >
                    <p style={{ fontSize: '14px', fontWeight: 500 }}>{user.name}</p>
                    <p style={{ fontSize: '12px', color: '#9ca3af' }}>{user.role.replace('_', ' ')}</p>
                </div>
            )}
        </aside>
    );
}
