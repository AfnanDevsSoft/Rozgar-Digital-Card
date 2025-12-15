'use client';

/**
 * Users Management Page
 */

import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setCurrentPage } from '@/store/slices/uiSlice';
import { usersAPI, User } from '@/lib/api';
import toast from 'react-hot-toast';
import {
    Plus,
    Search,
    Eye,
    Edit,
    UserX,
    UserCheck,
    KeyRound,
    X,
} from 'lucide-react';

export default function UsersPage() {
    const dispatch = useDispatch();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        cnic: '',
        address: '',
        dob: '',
        gender: '',
        blood_group: '',
        expiry_date: '',
    });

    useEffect(() => {
        dispatch(setCurrentPage('Users'));
        fetchUsers();
    }, [dispatch, pagination.page, search, statusFilter]);

    const fetchUsers = async () => {
        try {
            const response = await usersAPI.getAll({
                page: pagination.page,
                limit: pagination.limit,
                search: search || undefined,
                status: statusFilter || undefined,
            });
            setUsers(response.data.users);
            setPagination(response.data.pagination);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await usersAPI.create(formData);
            toast.success('User created successfully!');

            // Show credentials
            const { credentials } = response.data;
            toast((t) => (
                <div>
                    <p><strong>Serial:</strong> {credentials.serial_number}</p>
                    <p><strong>Password:</strong> {credentials.password}</p>
                </div>
            ), { duration: 10000 });

            setShowModal(false);
            setFormData({
                name: '', email: '', phone: '', cnic: '', address: '',
                dob: '', gender: '', blood_group: '', expiry_date: '',
            });
            fetchUsers();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to create user');
        }
    };

    const handleToggleStatus = async (user: User) => {
        try {
            if (user.is_active) {
                await usersAPI.deactivate(user.id);
                toast.success('User deactivated');
            } else {
                await usersAPI.activate(user.id);
                toast.success('User activated');
            }
            fetchUsers();
        } catch (error) {
            toast.error('Failed to update user status');
        }
    };

    const handleResetPassword = async (userId: string) => {
        try {
            const response = await usersAPI.resetPassword(userId);
            toast.success('Password reset successfully!');
            toast((t) => (
                <div>
                    <p><strong>New Password:</strong> {response.data.credentials.password}</p>
                </div>
            ), { duration: 10000 });
        } catch (error) {
            toast.error('Failed to reset password');
        }
    };

    return (
        <div className="animate-fadeIn">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Users Management</h1>
                    <p style={{ color: '#6b7280', marginTop: '4px' }}>Manage registered users and their health cards</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={18} />
                    Add User
                </button>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                            <input
                                type="text"
                                placeholder="Search by name, email, phone, CNIC, or serial..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="form-input"
                                style={{ paddingLeft: '40px' }}
                            />
                        </div>
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="form-select"
                        style={{ width: '160px' }}
                    >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
            </div>

            {/* Users Table */}
            <div className="card">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Serial Number</th>
                                <th>Phone</th>
                                <th>Card Status</th>
                                <th>Expiry</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>
                                        Loading...
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                                        No users found
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id}>
                                        <td>
                                            <div>
                                                <p style={{ fontWeight: 500 }}>{user.name}</p>
                                                <p style={{ fontSize: '13px', color: '#6b7280' }}>{user.email}</p>
                                            </div>
                                        </td>
                                        <td>
                                            <code style={{ backgroundColor: '#f3f4f6', padding: '4px 8px', borderRadius: '4px', fontSize: '13px' }}>
                                                {user.health_card?.serial_number || 'N/A'}
                                            </code>
                                        </td>
                                        <td>{user.phone}</td>
                                        <td>
                                            <span className={`badge ${user.health_card?.status === 'ACTIVE' ? 'badge-success' :
                                                    user.health_card?.status === 'EXPIRED' ? 'badge-danger' :
                                                        'badge-neutral'
                                                }`}>
                                                {user.health_card?.status || 'No Card'}
                                            </span>
                                        </td>
                                        <td>
                                            {user.health_card?.expiry_date
                                                ? new Date(user.health_card.expiry_date).toLocaleDateString()
                                                : '-'}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button className="btn btn-ghost btn-sm" title="View">
                                                    <Eye size={16} />
                                                </button>
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    onClick={() => handleToggleStatus(user)}
                                                    title={user.is_active ? 'Deactivate' : 'Activate'}
                                                >
                                                    {user.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
                                                </button>
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    onClick={() => handleResetPassword(user.id)}
                                                    title="Reset Password"
                                                >
                                                    <KeyRound size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                        <p style={{ fontSize: '14px', color: '#6b7280' }}>
                            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                        </p>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                className="btn btn-outline btn-sm"
                                disabled={pagination.page === 1}
                                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                            >
                                Previous
                            </button>
                            <button
                                className="btn btn-outline btn-sm"
                                disabled={pagination.page === pagination.pages}
                                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create User Modal */}
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
                        maxWidth: '600px',
                        maxHeight: '90vh',
                        overflow: 'auto',
                    }}>
                        <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: 600 }}>Create New User</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={24} color="#6b7280" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateUser} style={{ padding: '24px' }}>
                            <div className="grid grid-cols-2">
                                <div className="form-group">
                                    <label className="form-label">Full Name *</label>
                                    <input
                                        type="text"
                                        required
                                        className="form-input"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email *</label>
                                    <input
                                        type="email"
                                        required
                                        className="form-input"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone *</label>
                                    <input
                                        type="tel"
                                        required
                                        className="form-input"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">CNIC *</label>
                                    <input
                                        type="text"
                                        required
                                        className="form-input"
                                        placeholder="XXXXX-XXXXXXX-X"
                                        value={formData.cnic}
                                        onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Date of Birth</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={formData.dob}
                                        onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Gender</label>
                                    <select
                                        className="form-select"
                                        value={formData.gender}
                                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                    >
                                        <option value="">Select</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Blood Group</label>
                                    <select
                                        className="form-select"
                                        value={formData.blood_group}
                                        onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                                    >
                                        <option value="">Select</option>
                                        <option value="A+">A+</option>
                                        <option value="A-">A-</option>
                                        <option value="B+">B+</option>
                                        <option value="B-">B-</option>
                                        <option value="AB+">AB+</option>
                                        <option value="AB-">AB-</option>
                                        <option value="O+">O+</option>
                                        <option value="O-">O-</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Card Expiry Date *</label>
                                    <input
                                        type="date"
                                        required
                                        className="form-input"
                                        value={formData.expiry_date}
                                        onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Address</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-success">
                                    Create User & Generate Card
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
