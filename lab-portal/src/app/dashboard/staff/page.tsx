'use client';

/**
 * Staff Management Page
 * For Branch Admins to Create and Manage Receptionists
 */

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { setCurrentPage } from '@/store/slices/uiSlice';
import { labStaffAPI, LabStaff } from '@/lib/api';
import toast from 'react-hot-toast';
import { Users, Plus, X, ToggleLeft, ToggleRight, Mail, User as UserIcon, AlertCircle } from 'lucide-react';

export default function StaffManagementPage() {
    const dispatch = useDispatch();
    const user = useSelector((state: RootState) => state.auth.user);
    const [staff, setStaff] = useState<LabStaff[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [tempPassword, setTempPassword] = useState('');

    useEffect(() => {
        dispatch(setCurrentPage('Staff Management'));
        if (user?.role !== 'BRANCH_ADMIN') {
            toast.error('Access denied. Branch Admin only.');
            return;
        }
        fetchStaff();
    }, [dispatch, user]);

    const fetchStaff = async () => {
        try {
            const response = await labStaffAPI.getAll();
            setStaff(response.data);
        } catch (error) {
            console.error('Failed to fetch staff:', error);
            toast.error('Failed to load staff');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user?.lab_id) {
            toast.error('Lab ID not found');
            return;
        }

        setSubmitting(true);
        try {
            const response = await labStaffAPI.create({
                name: formData.name,
                email: formData.email,
                lab_id: user.lab_id,
            });

            setTempPassword('user123');
            toast.success('Receptionist created successfully!');
            fetchStaff();
            setFormData({ name: '', email: '' });

            // Don't close modal yet, show password
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to create receptionist');
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleStatus = async (staffId: string) => {
        try {
            await labStaffAPI.toggleStatus(staffId);
            toast.success('Status updated');
            fetchStaff();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setFormData({ name: '', email: '' });
        setTempPassword('');
    };

    if (loading) {
        return (
            <div className="animate-fadeIn" style={{ textAlign: 'center', padding: '60px' }}>
                Loading...
            </div>
        );
    }

    if (user?.role !== 'BRANCH_ADMIN') {
        return (
            <div className="animate-fadeIn">
                <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                    <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 16px' }} />
                    <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>Access Denied</h2>
                    <p style={{ color: '#6b7280' }}>Only Branch Admins can manage staff</p>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fadeIn">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Staff Management</h1>
                    <p style={{ color: '#6b7280', marginTop: '4px' }}>Create and manage receptionist accounts</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={18} />
                    Add Receptionist
                </button>
            </div>

            {/* Staff List */}
            <div className="card">
                {staff.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                        <Users size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                        <p>No staff members yet. Create your first receptionist!</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {staff.map((member) => (
                            <div
                                key={member.id}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '16px',
                                    backgroundColor: '#f9fafb',
                                    borderRadius: '8px',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div
                                        style={{
                                            width: '48px',
                                            height: '48px',
                                            borderRadius: '50%',
                                            backgroundColor: member.is_active ? '#dbeafe' : '#e5e7eb',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <UserIcon size={24} color={member.is_active ? '#2563eb' : '#6b7280'} />
                                    </div>
                                    <div>
                                        <p style={{ fontWeight: 600, fontSize: '16px' }}>{member.name}</p>
                                        <p style={{ fontSize: '14px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Mail size={14} />
                                            {member.email}
                                        </p>
                                        {member.must_change_password && (
                                            <span className="badge badge-warning" style={{ marginTop: '4px', fontSize: '11px' }}>
                                                Password Change Required
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span className={`badge ${member.is_active ? 'badge-success' : 'badge-danger'}`}>
                                        {member.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                    <button
                                        className="btn btn-outline btn-sm"
                                        onClick={() => handleToggleStatus(member.id)}
                                        title={member.is_active ? 'Deactivate' : 'Activate'}
                                    >
                                        {member.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showModal && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 200,
                    }}
                >
                    <div
                        style={{
                            backgroundColor: '#ffffff',
                            borderRadius: '16px',
                            width: '100%',
                            maxWidth: '500px',
                            padding: '24px',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: 600 }}>Add New Receptionist</h2>
                            <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={24} color="#6b7280" />
                            </button>
                        </div>

                        {tempPassword ? (
                            // Show credentials after creation
                            <div>
                                <div
                                    style={{
                                        padding: '20px',
                                        backgroundColor: '#dcfce7',
                                        borderRadius: '8px',
                                        border: '1px solid #16a34a',
                                        marginBottom: '16px',
                                    }}
                                >
                                    <p style={{ fontWeight: 600, marginBottom: '12px', color: '#15803d' }}>
                                        ✓ Receptionist Created Successfully!
                                    </p>
                                    <p style={{ fontSize: '14px', color: '#15803d', marginBottom: '8px' }}>
                                        Please share these credentials with the receptionist:
                                    </p>
                                    <div style={{ backgroundColor: '#ffffff', padding: '12px', borderRadius: '6px', marginTop: '8px' }}>
                                        <p style={{ fontSize: '13px', color: '#6b7280' }}>Email</p>
                                        <p style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '16px' }}>{formData.email}</p>
                                    </div>
                                    <div style={{ backgroundColor: '#ffffff', padding: '12px', borderRadius: '6px', marginTop: '8px' }}>
                                        <p style={{ fontSize: '13px', color: '#6b7280' }}>Default Password</p>
                                        <p style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '16px' }}>{tempPassword}</p>
                                    </div>
                                    <p style={{ fontSize: '12px', color: '#15803d', marginTop: '12px' }}>
                                        ⚠️ They must change this password on first login
                                    </p>
                                </div>
                                <button className="btn btn-primary" onClick={closeModal} style={{ width: '100%' }}>
                                    Close
                                </button>
                            </div>
                        ) : (
                            // Show form
                            <form onSubmit={handleCreate}>
                                <div className="form-group">
                                    <label className="form-label">Full Name *</label>
                                    <input
                                        type="text"
                                        required
                                        className="form-input"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Enter receptionist name"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email Address *</label>
                                    <input
                                        type="email"
                                        required
                                        className="form-input"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="receptionist@example.com"
                                    />
                                </div>

                                <div
                                    style={{
                                        padding: '12px',
                                        backgroundColor: '#eff6ff',
                                        borderRadius: '8px',
                                        marginBottom: '16px',
                                    }}
                                >
                                    <p style={{ fontSize: '13px', color: '#1e40af' }}>
                                        ℹ️ Default password will be set to <strong>"user123"</strong>
                                    </p>
                                    <p style={{ fontSize: '12px', color: '#1e40af', marginTop: '4px' }}>
                                        Receptionist must change it on first login
                                    </p>
                                </div>

                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button type="button" className="btn btn-outline" onClick={closeModal} style={{ flex: 1 }}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-success" disabled={submitting} style={{ flex: 1 }}>
                                        {submitting ? 'Creating...' : 'Create Receptionist'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
