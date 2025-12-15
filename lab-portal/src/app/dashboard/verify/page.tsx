'use client';

import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setCurrentPage } from '@/store/slices/uiSlice';
import { cardsAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { Search, CheckCircle, XCircle, AlertCircle, CreditCard } from 'lucide-react';

interface CardInfo {
    card: {
        serial_number: string;
        status: string;
        issue_date: string;
        expiry_date: string;
    };
    user: {
        name: string;
        email: string;
        phone: string;
        cnic: string;
        dob?: string;
        gender?: string;
        blood_group?: string;
    };
    discountEligible: boolean;
}

export default function VerifyCardPage() {
    const dispatch = useDispatch();
    const [serial, setSerial] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<CardInfo | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        dispatch(setCurrentPage('Verify Card'));
    }, [dispatch]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!serial.trim()) {
            toast.error('Please enter serial number');
            return;
        }

        setLoading(true);
        setResult(null);
        setError('');

        try {
            const response = await cardsAPI.verify(serial.trim());
            setResult(response.data);
            toast.success('Card verified!');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Card not found');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fadeIn">
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Verify Health Card</h1>
                <p style={{ color: '#6b7280', marginTop: '4px' }}>Enter serial number to verify card and check discount eligibility</p>
            </div>

            {/* Search Box */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <form onSubmit={handleVerify}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <CreditCard size={20} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                            <input
                                type="text"
                                value={serial}
                                onChange={(e) => setSerial(e.target.value.toUpperCase())}
                                placeholder="Enter serial number (e.g., DCD251234567)"
                                className="form-input"
                                style={{ paddingLeft: '44px', fontSize: '18px', padding: '16px 16px 16px 44px' }}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                            <Search size={20} />
                            {loading ? 'Verifying...' : 'Verify'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Error */}
            {error && (
                <div className="card" style={{ borderColor: '#fee2e2', backgroundColor: '#fef2f2' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#dc2626' }}>
                        <XCircle size={24} />
                        <div>
                            <p style={{ fontWeight: 600 }}>Card Not Found</p>
                            <p style={{ fontSize: '14px' }}>{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Result */}
            {result && (
                <div className="grid grid-cols-2">
                    {/* Card Status */}
                    <div className="card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                            {result.discountEligible ? (
                                <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <CheckCircle size={28} color="#16a34a" />
                                </div>
                            ) : (
                                <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <AlertCircle size={28} color="#d97706" />
                                </div>
                            )}
                            <div>
                                <h3 style={{ fontSize: '18px', fontWeight: 600 }}>
                                    {result.discountEligible ? 'Discount Eligible' : 'Not Eligible for Discount'}
                                </h3>
                                <p style={{ color: '#6b7280' }}>Card Status: <span className={`badge ${result.card.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>{result.card.status}</span></p>
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <p style={{ fontSize: '12px', color: '#6b7280' }}>Serial Number</p>
                                    <p style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '16px' }}>{result.card.serial_number}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: '12px', color: '#6b7280' }}>Expiry Date</p>
                                    <p style={{ fontWeight: 600, color: new Date(result.card.expiry_date) < new Date() ? '#dc2626' : '#0a0a0a' }}>
                                        {new Date(result.card.expiry_date).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* User Info */}
                    <div className="card">
                        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Patient Information</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <p style={{ fontSize: '12px', color: '#6b7280' }}>Name</p>
                                <p style={{ fontWeight: 500 }}>{result.user.name}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '12px', color: '#6b7280' }}>Phone</p>
                                <p style={{ fontWeight: 500 }}>{result.user.phone}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '12px', color: '#6b7280' }}>CNIC</p>
                                <p style={{ fontWeight: 500 }}>{result.user.cnic}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '12px', color: '#6b7280' }}>Email</p>
                                <p style={{ fontWeight: 500 }}>{result.user.email}</p>
                            </div>
                            {result.user.blood_group && (
                                <div>
                                    <p style={{ fontSize: '12px', color: '#6b7280' }}>Blood Group</p>
                                    <p style={{ fontWeight: 500 }}>{result.user.blood_group}</p>
                                </div>
                            )}
                            {result.user.gender && (
                                <div>
                                    <p style={{ fontSize: '12px', color: '#6b7280' }}>Gender</p>
                                    <p style={{ fontWeight: 500 }}>{result.user.gender}</p>
                                </div>
                            )}
                        </div>

                        <div style={{ marginTop: '20px' }}>
                            <a href={`/dashboard/billing?serial=${result.card.serial_number}`} className="btn btn-success" style={{ width: '100%' }}>
                                Proceed to Billing
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
