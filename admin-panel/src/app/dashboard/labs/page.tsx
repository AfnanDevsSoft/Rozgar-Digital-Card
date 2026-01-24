'use client';

/**
 * Labs Management Page
 */

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentPage } from '@/store/slices/uiSlice';
import { RootState } from '@/store/store';
import { labsAPI, Lab } from '@/lib/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Plus, Search, Eye, Edit, X, Building2 } from 'lucide-react';

export default function LabsPage() {
    const dispatch = useDispatch();
    const router = useRouter();
    const user = useSelector((state: RootState) => state.auth.user);
    const [labs, setLabs] = useState<Lab[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phone: '',
        email: '',
    });

    useEffect(() => {
        dispatch(setCurrentPage('Labs'));
        fetchLabs();
    }, [dispatch, search]);

    const fetchLabs = async () => {
        try {
            const response = await labsAPI.getAll({ search: search || undefined });
            setLabs(response.data.labs);
        } catch (error) {
            console.error('Failed to fetch labs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateLab = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await labsAPI.create(formData);
            toast.success('Lab created successfully!');
            setShowModal(false);
            setFormData({ name: '', address: '', phone: '', email: '' });
            fetchLabs();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to create lab');
        }
    };

    const handleStatusChange = async (lab: Lab, status: string) => {
        try {
            await labsAPI.updateStatus(lab.id, status);
            toast.success(`Lab ${status.toLowerCase()}`);
            fetchLabs();
        } catch (error) {
            toast.error('Failed to update lab status');
        }
    };

    const canManageLabs = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

    return (
        <div className="animate-fadeIn">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Labs Management</h1>
                    <p style={{ color: '#6b7280', marginTop: '4px' }}>Manage partner laboratories</p>
                </div>
                {canManageLabs && (
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <Plus size={18} />
                        Add Lab
                    </button>
                )}
            </div>

            {/* Search */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <div style={{ position: 'relative', maxWidth: '400px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                    <input
                        type="text"
                        placeholder="Search labs..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="form-input"
                        style={{ paddingLeft: '40px' }}
                    />
                </div>
            </div>

            {/* Labs Grid */}
            <div className="grid grid-cols-3">
                {loading ? (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>Loading...</div>
                ) : labs.length === 0 ? (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                        No labs found
                    </div>
                ) : (
                    labs.map((lab) => (
                        <div key={lab.id} className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '12px',
                                        backgroundColor: '#f3f4f6',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        <Building2 size={24} color="#6b7280" />
                                    </div>
                                    <div>
                                        <h3 style={{ fontWeight: 600, fontSize: '16px' }}>{lab.name}</h3>
                                        <p style={{ fontSize: '12px', color: '#6b7280' }}>{lab.lab_code}</p>
                                    </div>
                                </div>
                                <span className={`badge ${lab.status === 'ACTIVE' ? 'badge-success' :
                                    lab.status === 'SUSPENDED' ? 'badge-danger' :
                                        'badge-neutral'
                                    }`}>
                                    {lab.status}
                                </span>
                            </div>

                            <div style={{ fontSize: '14px', color: '#4b5563', marginBottom: '12px' }}>
                                <p style={{ marginBottom: '4px' }}>📍 {lab.address}</p>
                                <p style={{ marginBottom: '4px' }}>📞 {lab.phone}</p>
                                <p>📧 {lab.email}</p>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                                <div>
                                    <p style={{ fontSize: '12px', color: '#6b7280' }}>Discount Rate</p>
                                    <p style={{ fontSize: '18px', fontWeight: 600, color: '#16a34a' }}>{lab.discount_rate}%</p>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => router.push(`/dashboard/labs/${lab.id}`)}
                                    >
                                        <Eye size={14} /> View
                                    </button>
                                    {canManageLabs && (
                                        <>
                                            {lab.status === 'ACTIVE' ? (
                                                <button className="btn btn-danger btn-sm" onClick={() => handleStatusChange(lab, 'SUSPENDED')}>
                                                    Suspend
                                                </button>
                                            ) : (
                                                <button className="btn btn-success btn-sm" onClick={() => handleStatusChange(lab, 'ACTIVE')}>
                                                    Activate
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create Lab Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 200,
                }}>
                    <div style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '16px',
                        width: '100%',
                        maxWidth: '500px',
                    }}>
                        <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: 600 }}>Add New Lab</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={24} color="#6b7280" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateLab} style={{ padding: '24px' }}>
                            <div className="form-group">
                                <label className="form-label">Lab Name *</label>
                                <input type="text" required className="form-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Address *</label>
                                <input type="text" required className="form-input" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2">
                                <div className="form-group">
                                    <label className="form-label">Phone *</label>
                                    <input type="tel" required className="form-input" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email *</label>
                                    <input type="email" required className="form-input" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-success">Create Lab</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
