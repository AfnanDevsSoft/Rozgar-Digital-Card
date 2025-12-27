'use client';

/**
 * Users Management Page
 */

import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setCurrentPage } from '@/store/slices/uiSlice';
import { usersAPI, User } from '@/lib/api';
import toast from 'react-hot-toast';
import EnhancedUserForm from '@/components/EnhancedUserForm';
import {
    Plus,
    Search,
    Eye,
    Edit,
    UserX,
    UserCheck,
    KeyRound,
    X,
    Printer,
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

    const handlePrintCard = async (user: User) => {
        if (!user.health_card) {
            toast.error('No health card found');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/cards/${user.health_card.id}/print`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) throw new Error('Failed to generate card');

            const data = await response.json();
            toast.success('Card PDF generated!');

            // Open PDF in new tab
            window.open(`${process.env.NEXT_PUBLIC_API_URL}${data.file_url}`, '_blank');
        } catch (error) {
            toast.error('Failed to print card');
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
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    onClick={() => handlePrintCard(user)}
                                                    title="Print Card"
                                                    disabled={!user.health_card}
                                                >
                                                    <Printer size={16} />
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

            {/* Enhanced User Form Modal */}
            {showModal && (
                <EnhancedUserForm
                    onClose={() => setShowModal(false)}
                    onSuccess={fetchUsers}
                />
            )}
        </div>
    );
}
