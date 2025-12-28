'use client';

/**
 * Towns Management Page
 * Manage town codes for card serial number generation
 */

import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setCurrentPage } from '@/store/slices/uiSlice';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import Cookies from 'js-cookie';

interface Town {
    id: string;
    name: string;
    code: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export default function TownsPage() {
    const dispatch = useDispatch();
    const [towns, setTowns] = useState<Town[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingTown, setEditingTown] = useState<Town | null>(null);
    const [formData, setFormData] = useState({ name: '', code: '' });

    useEffect(() => {
        dispatch(setCurrentPage('Towns'));
        loadTowns();
    }, [dispatch]);

    const loadTowns = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/towns`, {
                headers: {
                    'Authorization': `Bearer ${Cookies.get('admin_token')}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setTowns(data);
            }
        } catch (error) {
            console.error('Failed to load towns:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/towns`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Cookies.get('admin_token')}`,
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create town');
            }

            setShowAddModal(false);
            setFormData({ name: '', code: '' });
            loadTowns();
        } catch (error: any) {
            alert(error.message);
        }
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTown) return;

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/towns/${editingTown.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Cookies.get('admin_token')}`,
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update town');
            }

            setEditingTown(null);
            setFormData({ name: '', code: '' });
            loadTowns();
        } catch (error: any) {
            alert(error.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this town?')) return;

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/towns/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${Cookies.get('admin_token')}`,
                },
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete town');
            }

            loadTowns();
        } catch (error: any) {
            alert(error.message);
        }
    };

    const toggleStatus = async (town: Town) => {
        try {
            const endpoint = town.is_active ? 'deactivate' : 'activate';
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/towns/${town.id}/${endpoint}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${Cookies.get('admin_token')}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to update status');
            }

            loadTowns();
        } catch (error) {
            alert('Failed to update town status');
        }
    };

    const openEdit = (town: Town) => {
        setEditingTown(town);
        setFormData({ name: town.name, code: town.code });
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="animate-fadeIn">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Town Management</h1>
                    <p style={{ color: '#6b7280', marginTop: '4px' }}>Manage town codes for card serial numbers</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                    <Plus size={18} />
                    Add Town
                </button>
            </div>

            {/* Towns Table */}
            <div className="card">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Town Name</th>
                            <th>Code</th>
                            <th>Status</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {towns.map((town) => (
                            <tr key={town.id}>
                                <td style={{ fontWeight: 600 }}>{town.name}</td>
                                <td>
                                    <span style={{
                                        display: 'inline-block',
                                        padding: '4px 12px',
                                        backgroundColor: '#f3f4f6',
                                        borderRadius: '6px',
                                        fontFamily: 'monospace',
                                        fontWeight: 600,
                                    }}>
                                        {town.code}
                                    </span>
                                </td>
                                <td>
                                    <button
                                        onClick={() => toggleStatus(town)}
                                        style={{
                                            padding: '4px 12px',
                                            borderRadius: '6px',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            backgroundColor: town.is_active ? '#dcfce7' : '#fee2e2',
                                            color: town.is_active ? '#16a34a' : '#dc2626',
                                        }}
                                    >
                                        {town.is_active ? 'Active' : 'Inactive'}
                                    </button>
                                </td>
                                <td>{new Date(town.created_at).toLocaleDateString()}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(town)} title="Edit">
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            className="btn btn-ghost btn-sm"
                                            onClick={() => handleDelete(town.id)}
                                            title="Delete"
                                            style={{ color: '#ef4444' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {towns.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                                    No towns found. Click "Add Town" to create one.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add/Edit Modal */}
            {(showAddModal || editingTown) && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 200,
                    padding: '20px',
                }}>
                    <div style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '16px',
                        width: '100%',
                        maxWidth: '500px',
                        maxHeight: '90vh',
                        overflow: 'auto',
                        padding: '24px',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <div>
                                <h2 style={{ fontSize: '20px', fontWeight: 600 }}>
                                    {editingTown ? 'Edit Town' : 'Add New Town'}
                                </h2>
                                <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                                    {editingTown ? 'Update town details' : 'Create a new town for card serial numbers'}
                                </p>
                            </div>
                            <button
                                onClick={() => { setShowAddModal(false); setEditingTown(null); setFormData({ name: '', code: '' }); }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                <X size={24} color="#6b7280" />
                            </button>
                        </div>

                        <form onSubmit={editingTown ? handleEdit : handleAdd}>
                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <label className="form-label">Town Name *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Karachi Central"
                                    required
                                />
                                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                                    Town code will be auto-assigned (starting from 0001)
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={() => { setShowAddModal(false); setEditingTown(null); setFormData({ name: '', code: '' }); }}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-success">
                                    {editingTown ? 'Update Town' : 'Create Town'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
