'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { setCurrentPage } from '@/store/slices/uiSlice';
import { transactionsAPI, reportsAPI } from '@/lib/api';
import { Receipt, FileText, TrendingUp, Users, Search, Upload } from 'lucide-react';
import Link from 'next/link';

interface Stats {
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
    const user = useSelector((state: RootState) => state.auth.user);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        dispatch(setCurrentPage('Dashboard'));
        fetchStats();
    }, [dispatch]);

    const fetchStats = async () => {
        try {
            const [txRes, reportRes] = await Promise.all([
                transactionsAPI.getStats(),
                reportsAPI.getStats(),
            ]);
            setStats({ transactions: txRes.data, reports: reportRes.data });
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="animate-fadeIn">
            {/* Welcome */}
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 700 }}>Welcome, {user?.name}! 👋</h1>
                <p style={{ color: '#6b7280', marginTop: '8px' }}>
                    Lab: <strong>{user?.lab?.name}</strong> • Discount Rate: <strong>{user?.lab?.discount_rate}%</strong>
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4" style={{ marginBottom: '32px' }}>
                <div className="stat-card">
                    <div className="stat-icon stat-icon-primary"><Receipt size={24} /></div>
                    <div>
                        <div className="stat-value">{stats?.transactions.today_transactions || 0}</div>
                        <div className="stat-label">Today's Transactions</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon-success"><TrendingUp size={24} /></div>
                    <div>
                        <div className="stat-value">Rs. {(stats?.transactions.total_amount || 0).toLocaleString()}</div>
                        <div className="stat-label">Total Revenue</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon-warning"><FileText size={24} /></div>
                    <div>
                        <div className="stat-value">{stats?.reports.pending || 0}</div>
                        <div className="stat-label">Pending Reports</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon-danger"><Users size={24} /></div>
                    <div>
                        <div className="stat-value">{stats?.transactions.total_transactions || 0}</div>
                        <div className="stat-label">Total Patients</div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Quick Actions</h3>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <Link href="/dashboard/verify" className="btn btn-primary">
                        <Search size={18} />
                        Verify Card
                    </Link>
                    <Link href="/dashboard/billing" className="btn btn-success">
                        <Receipt size={18} />
                        New Billing
                    </Link>
                    <Link href="/dashboard/reports" className="btn btn-outline">
                        <Upload size={18} />
                        Upload Report
                    </Link>
                </div>
            </div>
        </div>
    );
}
