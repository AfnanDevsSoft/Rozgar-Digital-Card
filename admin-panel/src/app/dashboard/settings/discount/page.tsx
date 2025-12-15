'use client';

/**
 * Discount Settings Page
 */

import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setCurrentPage } from '@/store/slices/uiSlice';
import { discountAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { Percent, Save, AlertCircle } from 'lucide-react';

export default function DiscountSettingsPage() {
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        default_discount_rate: 30,
        apply_to_expired: false,
    });

    useEffect(() => {
        dispatch(setCurrentPage('Discount Settings'));
        fetchSettings();
    }, [dispatch]);

    const fetchSettings = async () => {
        try {
            const response = await discountAPI.getSettings();
            setSettings(response.data);
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await discountAPI.updateSettings(settings.default_discount_rate, settings.apply_to_expired);
            toast.success('Discount settings saved successfully!');
        } catch (error) {
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="animate-fadeIn">
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Discount Settings</h1>
                <p style={{ color: '#6b7280', marginTop: '4px' }}>Configure global discount rate for health card holders</p>
            </div>

            <div className="card" style={{ maxWidth: '600px' }}>
                {/* Discount Rate */}
                <div className="form-group">
                    <label className="form-label">Default Discount Rate (%)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            className="form-input"
                            style={{ maxWidth: '120px', fontSize: '24px', fontWeight: 600, textAlign: 'center' }}
                            value={settings.default_discount_rate}
                            onChange={(e) => setSettings({ ...settings, default_discount_rate: parseInt(e.target.value) || 0 })}
                        />
                        <Percent size={24} color="#16a34a" />
                    </div>
                    <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '8px' }}>
                        This discount will be automatically applied to all transactions.
                    </p>
                </div>

                {/* Apply to Expired */}
                <div className="form-group" style={{ marginTop: '24px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={settings.apply_to_expired}
                            onChange={(e) => setSettings({ ...settings, apply_to_expired: e.target.checked })}
                            style={{ width: '20px', height: '20px' }}
                        />
                        <span className="form-label" style={{ marginBottom: 0 }}>
                            Apply discount to expired cards
                        </span>
                    </label>
                    <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '8px', marginLeft: '32px' }}>
                        When enabled, users with expired cards can still receive discounts.
                    </p>
                </div>

                {/* Warning */}
                <div style={{
                    backgroundColor: '#fef3c7',
                    border: '1px solid #f59e0b',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    marginTop: '24px',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start',
                }}>
                    <AlertCircle size={20} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                        <p style={{ fontSize: '14px', fontWeight: 500, color: '#92400e' }}>Important</p>
                        <p style={{ fontSize: '13px', color: '#92400e', marginTop: '4px' }}>
                            Changes to discount settings will apply to all future transactions.
                            Labs can also have their own discount rates which override this global setting.
                        </p>
                    </div>
                </div>

                {/* Save Button */}
                <button
                    className="btn btn-success"
                    onClick={handleSave}
                    disabled={saving}
                    style={{ marginTop: '24px' }}
                >
                    <Save size={18} />
                    {saving ? 'Saving...' : 'Save Settings'}
                </button>
            </div>
        </div>
    );
}
