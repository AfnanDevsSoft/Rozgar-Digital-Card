'use client';

/**
 * Settings Page
 */

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setCurrentPage } from '@/store/slices/uiSlice';
import Link from 'next/link';
import { User } from 'lucide-react';

export default function SettingsPage() {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(setCurrentPage('Settings'));
    }, [dispatch]);

    const settingsLinks = [
        {
            title: 'Profile Settings',
            description: 'Update your account information and password',
            href: '/dashboard/settings/profile',
            icon: <User size={24} />,
            color: '#2563eb',
            bgColor: '#dbeafe',
        },
    ];

    return (
        <div className="animate-fadeIn">
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Settings</h1>
                <p style={{ color: '#6b7280', marginTop: '4px' }}>Manage your account settings</p>
            </div>

            <div className="grid grid-cols-3">
                {settingsLinks.map((item) => (
                    <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                        <div className="card" style={{ cursor: 'pointer', transition: 'box-shadow 0.2s' }}>
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                <div style={{
                                    width: '56px',
                                    height: '56px',
                                    borderRadius: '12px',
                                    backgroundColor: item.bgColor,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: item.color,
                                }}>
                                    {item.icon}
                                </div>
                                <div>
                                    <h3 style={{ fontWeight: 600, fontSize: '16px', color: '#0a0a0a', marginBottom: '4px' }}>
                                        {item.title}
                                    </h3>
                                    <p style={{ fontSize: '14px', color: '#6b7280' }}>
                                        {item.description}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
