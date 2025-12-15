'use client';

import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { CreditCard, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
    const user = useSelector((state: RootState) => state.auth.user);
    const card = user?.health_card;
    const isActive = card?.status === 'ACTIVE';
    const isExpired = card ? new Date(card.expiry_date) < new Date() : false;

    return (
        <div className="animate-fadeIn">
            <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>Hello, {user?.name}! 👋</h1>
            <p style={{ color: '#6b7280', marginBottom: '32px' }}>Here's your health card information</p>

            {/* Health Card Display */}
            <div style={{
                background: 'linear-gradient(135deg, #0a0a0a 0%, #1f1f1f 100%)',
                borderRadius: '20px',
                padding: '32px',
                color: '#fff',
                marginBottom: '32px',
                position: 'relative',
                overflow: 'hidden',
            }}>
                {/* Card Pattern */}
                <div style={{ position: 'absolute', right: '-50px', top: '-50px', width: '200px', height: '200px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)' }}></div>
                <div style={{ position: 'absolute', right: '50px', bottom: '-30px', width: '150px', height: '150px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.03)' }}></div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <CreditCard size={24} />
                            <span style={{ fontSize: '14px', opacity: 0.8 }}>Digital Health Card</span>
                        </div>
                        <h2 style={{ fontSize: '28px', fontFamily: 'monospace', fontWeight: 700, letterSpacing: '3px' }}>
                            {card?.serial_number || 'N/A'}
                        </h2>
                    </div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        backgroundColor: isActive && !isExpired ? '#16a34a' : '#dc2626',
                    }}>
                        {isActive && !isExpired ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                        <span style={{ fontSize: '12px', fontWeight: 500 }}>{isExpired ? 'EXPIRED' : card?.status}</span>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '48px' }}>
                    <div>
                        <p style={{ fontSize: '11px', opacity: 0.6, marginBottom: '4px' }}>CARD HOLDER</p>
                        <p style={{ fontSize: '16px', fontWeight: 500 }}>{user?.name}</p>
                    </div>
                    <div>
                        <p style={{ fontSize: '11px', opacity: 0.6, marginBottom: '4px' }}>VALID UNTIL</p>
                        <p style={{ fontSize: '16px', fontWeight: 500, color: isExpired ? '#f87171' : '#fff' }}>
                            {card ? new Date(card.expiry_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}
                        </p>
                    </div>
                </div>

                <div style={{ position: 'absolute', bottom: '20px', right: '24px', fontSize: '40px', opacity: 0.1 }}>
                    🏥
                </div>
            </div>

            {/* Quick Info */}
            <div className="grid grid-cols-3">
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Calendar size={24} color="#2563eb" />
                        </div>
                        <div>
                            <p style={{ fontSize: '12px', color: '#6b7280' }}>Issue Date</p>
                            <p style={{ fontWeight: 600 }}>
                                {card ? new Date(card.issue_date).toLocaleDateString() : 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>

                <Link href="/dashboard/reports" style={{ textDecoration: 'none' }}>
                    <div className="card" style={{ cursor: 'pointer' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                📄
                            </div>
                            <div>
                                <p style={{ fontSize: '12px', color: '#6b7280' }}>My Reports</p>
                                <p style={{ fontWeight: 600, color: '#0a0a0a' }}>View All →</p>
                            </div>
                        </div>
                    </div>
                </Link>

                <Link href="/dashboard/transactions" style={{ textDecoration: 'none' }}>
                    <div className="card" style={{ cursor: 'pointer' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                🧾
                            </div>
                            <div>
                                <p style={{ fontSize: '12px', color: '#6b7280' }}>Transactions</p>
                                <p style={{ fontWeight: 600, color: '#0a0a0a' }}>View History →</p>
                            </div>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Contact Info */}
            <div className="card" style={{ marginTop: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Your Information</h3>
                <div className="grid grid-cols-2">
                    <div>
                        <p style={{ fontSize: '12px', color: '#6b7280' }}>Email</p>
                        <p style={{ fontWeight: 500 }}>{user?.email}</p>
                    </div>
                    <div>
                        <p style={{ fontSize: '12px', color: '#6b7280' }}>Phone</p>
                        <p style={{ fontWeight: 500 }}>{user?.phone}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
