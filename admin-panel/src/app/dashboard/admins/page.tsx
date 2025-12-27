'use client';

/**
 * Admins Management Page
 */

import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setCurrentPage } from '@/store/slices/uiSlice';
import { adminsAPI, labsAPI, Admin, Lab } from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, X, UserCog, Shield, Building2 } from 'lucide-react';

export default function AdminsPage() {
    const dispatch = useDispatch();
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [labs, setLabs] = useState<Lab[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'BRANCH_ADMIN' as 'SUPER_ADMIN' | 'BRANCH_ADMIN',
        lab_id: '',
    });

    useEffect(() => {
        dispatch(setCurrentPage('Admins'));
        fetchData();
    }, [dispatch]);

    const fetchData = async () => {
        try {
            const [adminsRes, labsRes] = await Promise.all([
                adminsAPI.getAll(),
                labsAPI.getAll(),
            ]);
            setAdmins(adminsRes.data);
            setLabs(labsRes.data.labs);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await adminsAPI.create(formData);
            toast.success('Admin created successfully!');
            setShowModal(false);
            setFormData({ name: '', email: '', role: 'BRANCH_ADMIN', lab_id: '' });
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to create admin');
        }
    };

    const handleToggleStatus = async (admin: Admin) => {
        try {
            await adminsAPI.toggleStatus(admin.id);
            toast.success(admin.is_active ? 'Admin deactivated' : 'Admin activated');
            fetchData();
        } catch (error) {
            toast.error('Failed to update admin status');
        }
    };

    return (
        <div className="animate-fadeIn">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Admins Management</h1>
                    <p style={{ color: '#6b7280', marginTop: '4px' }}>Manage Super Admins and Branch Admins</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={18} />
                    Add Admin
                </button>
            </div>

            {/* Admins Grid */}
            <div className="grid grid-cols-3">
                {loading ? (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>Loading...</div>
                ) : admins.length === 0 ? (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                        No admins found
                    </div>
                ) : (
                    admins.map((admin) => (
                        <div key={admin.id} className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '50%',
                                        backgroundColor: admin.role === 'SUPER_ADMIN' ? '#0a0a0a' : '#f3f4f6',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        {admin.role === 'SUPER_ADMIN' ? (
                                            <Shield size={24} color="#fff" />
                                        ) : (
                                            <UserCog size={24} color="#6b7280" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 style={{ fontWeight: 600, fontSize: '16px' }}>{admin.name}</h3>
                                        <p style={{ fontSize: '12px', color: '#6b7280' }}>{admin.email}</p>
                                    </div>
                                </div>
                                <span className={`badge ${admin.is_active ? 'badge-success' : 'badge-neutral'}`}>
                                    {admin.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                <span className={`badge ${admin.role === 'SUPER_ADMIN' ? 'badge-info' : 'badge-neutral'}`}>
                                    {admin.role.replace('_', ' ')}
                                </span>
                                {admin.lab && (
                                    <span style={{ fontSize: '13px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Building2 size={14} /> {admin.lab.name}
                                    </span>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                                <button
                                    className={`btn btn-sm ${admin.is_active ? 'btn-danger' : 'btn-success'}`}
                                    onClick={() => handleToggleStatus(admin)}
                                >
                                    {admin.is_active ? 'Deactivate' : 'Activate'}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create Admin Modal */}
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
                        maxWidth: '450px',
                    }}>
                        <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: 600 }}>Add New Admin</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={24} color="#6b7280" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} style={{ padding: '24px' }}>
                            <div className="form-group">
                                <label className="form-label">Name *</label>
                                <input type="text" required className="form-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email *</label>
                                <input type="email" required className="form-input" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                                ℹ️ Default password: <strong>user123</strong> (Admin must change on first login)
                            </p>
                            <div className="form-group">
                                <label className="form-label">Role *</label>
                                <select className="form-select" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}>
                                    <option value="BRANCH_ADMIN">Branch Admin</option>
                                    <option value="SUPER_ADMIN">Super Admin</option>
                                </select>
                            </div>
                            {formData.role === 'BRANCH_ADMIN' && (
                                <div className="form-group">
                                    <label className="form-label">Assign to Lab *</label>
                                    <select className="form-select" required value={formData.lab_id} onChange={(e) => setFormData({ ...formData, lab_id: e.target.value })}>
                                        <option value="">Select Lab</option>
                                        {labs.map((lab) => (
                                            <option key={lab.id} value={lab.id}>{lab.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-success">Create Admin</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
