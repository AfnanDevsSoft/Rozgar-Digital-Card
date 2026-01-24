'use client';

/**
 * Profile Settings Page
 */

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentPage } from '@/store/slices/uiSlice';
import { RootState } from '@/store/store';
import { authAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { User, Lock, Save, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProfileSettingsPage() {
    const dispatch = useDispatch();
    const router = useRouter();
    const user = useSelector((state: RootState) => state.auth.user);

    const [passwordForm, setPasswordForm] = useState({
        current_password: '',
        new_password: '',
        confirm_password: '',
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        dispatch(setCurrentPage('Profile Settings'));
    }, [dispatch]);

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwordForm.new_password !== passwordForm.confirm_password) {
            toast.error('New passwords do not match');
            return;
        }

        if (passwordForm.new_password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setSaving(true);
        try {
            await authAPI.changePassword(passwordForm.current_password, passwordForm.new_password);
            toast.success('Password changed successfully!');
            setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to change password');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="animate-fadeIn">
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                <button
                    onClick={() => router.push('/dashboard/settings')}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '8px',
                        borderRadius: '8px',
                        backgroundColor: '#f3f4f6'
                    }}
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Profile Settings</h1>
                    <p style={{ color: '#6b7280', marginTop: '4px' }}>Manage your account information</p>
                </div>
            </div>

            <div style={{ display: 'grid', gap: '24px', maxWidth: '600px' }}>
                {/* Profile Info Card */}
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            backgroundColor: '#dbeafe',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <User size={24} color="#2563eb" />
                        </div>
                        <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Account Information</h2>
                    </div>

                    <div style={{ display: 'grid', gap: '12px' }}>
                        <div>
                            <label style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>Name</label>
                            <p style={{ fontSize: '16px', fontWeight: 500 }}>{user?.name || '-'}</p>
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>Email</label>
                            <p style={{ fontSize: '16px', fontWeight: 500 }}>{user?.email || '-'}</p>
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>Role</label>
                            <p style={{ fontSize: '16px', fontWeight: 500 }}>{user?.role?.replace('_', ' ') || '-'}</p>
                        </div>
                    </div>
                </div>

                {/* Change Password Card */}
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            backgroundColor: '#fef3c7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <Lock size={24} color="#d97706" />
                        </div>
                        <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Change Password</h2>
                    </div>

                    <form onSubmit={handleChangePassword}>
                        <div className="form-group">
                            <label className="form-label">Current Password</label>
                            <input
                                type="password"
                                required
                                className="form-input"
                                value={passwordForm.current_password}
                                onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">New Password</label>
                            <input
                                type="password"
                                required
                                className="form-input"
                                value={passwordForm.new_password}
                                onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Confirm New Password</label>
                            <input
                                type="password"
                                required
                                className="form-input"
                                value={passwordForm.confirm_password}
                                onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                            />
                        </div>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={saving}
                            style={{ marginTop: '8px' }}
                        >
                            <Save size={18} />
                            {saving ? 'Saving...' : 'Update Password'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
