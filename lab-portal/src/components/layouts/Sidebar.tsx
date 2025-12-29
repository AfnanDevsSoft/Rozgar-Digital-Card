'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import {
    LayoutDashboard,
    Search,
    Receipt,
    FileText,
    Upload,
    Microscope,
    ChevronLeft,
    ChevronRight,
    Users,
} from 'lucide-react';

const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={20} />, allowedRoles: ['BRANCH_ADMIN'] },
    { name: 'Verify Card', href: '/dashboard/verify', icon: <Search size={20} />, allowedRoles: ['BRANCH_ADMIN', 'RECEPTIONIST'] },
    { name: 'Billing', href: '/dashboard/billing', icon: <Receipt size={20} />, allowedRoles: ['BRANCH_ADMIN', 'RECEPTIONIST'] },
    { name: 'Test Catalog', href: '/dashboard/tests', icon: <Microscope size={20} />, allowedRoles: ['BRANCH_ADMIN'] },
    { name: 'Upload Reports', href: '/dashboard/reports', icon: <Upload size={20} />, allowedRoles: ['BRANCH_ADMIN', 'RECEPTIONIST'] },
    { name: 'Transactions', href: '/dashboard/transactions', icon: <FileText size={20} />, allowedRoles: ['BRANCH_ADMIN'] },
    { name: 'Staff', href: '/dashboard/staff', icon: <Users size={20} />, allowedRoles: ['BRANCH_ADMIN'] },
];

interface SidebarProps {
    isOpen: boolean;
    onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
    const pathname = usePathname();
    const user = useSelector((state: RootState) => state.auth.user);

    // Filter navigation items based on user role
    const userRole = user?.role || '';
    const filteredItems = navItems.filter(item =>
        item.allowedRoles.includes(userRole)
    );

    // Debug logging
    console.log('Sidebar Debug:', {
        userRole,
        totalItems: navItems.length,
        filteredItems: filteredItems.length,
        items: filteredItems.map(i => i.name)
    });

    return (
        <aside
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
            <div style={{ height: '64px', display: 'flex', alignItems: 'center', padding: '0 20px', borderBottom: '1px solid #1f1f1f' }}>
                {isOpen ? (
                    <h1 style={{ fontSize: '18px', fontWeight: 700 }}>🔬 Lab Portal</h1>
                ) : (
                    <span style={{ fontSize: '24px' }}>🔬</span>
                )}
            </div>

            <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
                {filteredItems.length === 0 ? (
                    <div style={{ padding: '20px', color: '#9ca3af', fontSize: '14px', textAlign: 'center' }}>
                        <p>No menu items</p>
                        <p style={{ fontSize: '12px', marginTop: '8px' }}>Role: {userRole || 'None'}</p>
                        <p style={{ fontSize: '12px' }}>Total items: {navItems.length}</p>
                    </div>
                ) : (
                    filteredItems.map((item) => {
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
                            >
                                {item.icon}
                                {isOpen && <span style={{ fontSize: '14px' }}>{item.name}</span>}
                            </Link>
                        );
                    })
                )}
            </nav>

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
                }}
            >
                {isOpen ? <ChevronLeft size={16} color="#0a0a0a" /> : <ChevronRight size={16} color="#0a0a0a" />}
            </button>

            {user && isOpen && (
                <div style={{ padding: '16px', borderTop: '1px solid #1f1f1f' }}>
                    <p style={{ fontSize: '14px', fontWeight: 500 }}>{user.name}</p>
                    <p style={{ fontSize: '12px', color: '#9ca3af' }}>{user.lab?.name}</p>
                </div>
            )}
        </aside>
    );
}
