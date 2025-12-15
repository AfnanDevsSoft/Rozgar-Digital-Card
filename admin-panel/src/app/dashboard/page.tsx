'use client';

/**
 * Dashboard Page - Main dashboard with statistics
 */

import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setCurrentPage } from '@/store/slices/uiSlice';
import { cardsAPI, labsAPI, transactionsAPI, reportsAPI } from '@/lib/api';
import {
    Users,
    CreditCard,
    Building2,
    Receipt,
    FileText,
    TrendingUp,
    AlertCircle,
    Clock,
} from 'lucide-react';

interface DashboardStats {
    cards: {
        total: number;
        active: number;
        expired: number;
        expiring_soon: number;
    };
    labs: {
        total: number;
        active: number;
    };
    transactions: {
        total_transactions: number;
        today_transactions: number;
        total_amount: number;
        total_discount_given: number;
    };
    reports: {
        total: number;
        pending: number;
        uploaded: number;
    };
}

export default function DashboardPage() {
    const dispatch = useDispatch();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        dispatch(setCurrentPage('Dashboard'));
        fetchStats();
    }, [dispatch]);

    const fetchStats = async () => {
        try {
            const [cardsRes, labsRes, transactionsRes, reportsRes] = await Promise.all([
                cardsAPI.getStats(),
                labsAPI.getStats(),
                transactionsAPI.getStats(),
                reportsAPI.getStats(),
            ]);

            setStats({
                cards: cardsRes.data,
                labs: labsRes.data,
                transactions: transactionsRes.data,
                reports: reportsRes.data,
            });
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <div
                        style={{
                            width: '40px',
                            height: '40px',
                            border: '3px solid #e5e7eb',
                            borderTopColor: '#2563eb',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto 12px',
                        }}
                    />
                    <p style={{ color: '#6b7280' }}>Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fadeIn">
            {/* Welcome Header */}
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0a0a0a' }}>
                    Welcome Back! 👋
                </h1>
                <p style={{ color: '#6b7280', marginTop: '8px' }}>
                    Here's what's happening with your health card system today.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4" style={{ marginBottom: '32px' }}>
                {/* Total Cards */}
                <div className="stat-card">
                    <div className="stat-icon stat-icon-primary">
                        <CreditCard size={24} />
                    </div>
                    <div>
                        <div className="stat-value">{stats?.cards.total || 0}</div>
                        <div className="stat-label">Total Cards</div>
                    </div>
                </div>

                {/* Active Cards */}
                <div className="stat-card">
                    <div className="stat-icon stat-icon-success">
                        <Users size={24} />
                    </div>
                    <div>
                        <div className="stat-value">{stats?.cards.active || 0}</div>
                        <div className="stat-label">Active Cards</div>
                    </div>
                </div>

                {/* Active Labs */}
                <div className="stat-card">
                    <div className="stat-icon stat-icon-warning">
                        <Building2 size={24} />
                    </div>
                    <div>
                        <div className="stat-value">{stats?.labs.active || 0}</div>
                        <div className="stat-label">Active Labs</div>
                    </div>
                </div>

                {/* Today's Transactions */}
                <div className="stat-card">
                    <div className="stat-icon stat-icon-danger">
                        <Receipt size={24} />
                    </div>
                    <div>
                        <div className="stat-value">{stats?.transactions.today_transactions || 0}</div>
                        <div className="stat-label">Today's Transactions</div>
                    </div>
                </div>
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-3" style={{ marginBottom: '32px' }}>
                {/* Total Revenue */}
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <TrendingUp size={20} color="#16a34a" />
                        <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Total Revenue</h3>
                    </div>
                    <p style={{ fontSize: '32px', fontWeight: 700, color: '#16a34a' }}>
                        Rs. {(stats?.transactions.total_amount || 0).toLocaleString()}
                    </p>
                    <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '8px' }}>
                        Discounts given: Rs. {(stats?.transactions.total_discount_given || 0).toLocaleString()}
                    </p>
                </div>

                {/* Pending Reports */}
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <FileText size={20} color="#f59e0b" />
                        <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Report Status</h3>
                    </div>
                    <div style={{ display: 'flex', gap: '24px' }}>
                        <div>
                            <p style={{ fontSize: '28px', fontWeight: 700, color: '#f59e0b' }}>
                                {stats?.reports.pending || 0}
                            </p>
                            <p style={{ fontSize: '13px', color: '#6b7280' }}>Pending</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '28px', fontWeight: 700, color: '#16a34a' }}>
                                {stats?.reports.uploaded || 0}
                            </p>
                            <p style={{ fontSize: '13px', color: '#6b7280' }}>Uploaded</p>
                        </div>
                    </div>
                </div>

                {/* Expiring Soon */}
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <Clock size={20} color="#dc2626" />
                        <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Attention Required</h3>
                    </div>
                    <div style={{ display: 'flex', gap: '24px' }}>
                        <div>
                            <p style={{ fontSize: '28px', fontWeight: 700, color: '#dc2626' }}>
                                {stats?.cards.expiring_soon || 0}
                            </p>
                            <p style={{ fontSize: '13px', color: '#6b7280' }}>Expiring Soon</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '28px', fontWeight: 700, color: '#6b7280' }}>
                                {stats?.cards.expired || 0}
                            </p>
                            <p style={{ fontSize: '13px', color: '#6b7280' }}>Expired</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Quick Actions</h3>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <a href="/dashboard/users" className="btn btn-primary">
                        <Users size={18} />
                        Add New User
                    </a>
                    <a href="/dashboard/labs" className="btn btn-outline">
                        <Building2 size={18} />
                        Manage Labs
                    </a>
                    <a href="/dashboard/cards" className="btn btn-outline">
                        <CreditCard size={18} />
                        View Cards
                    </a>
                    <a href="/dashboard/transactions" className="btn btn-outline">
                        <Receipt size={18} />
                        Transactions
                    </a>
                </div>
            </div>

            <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}
