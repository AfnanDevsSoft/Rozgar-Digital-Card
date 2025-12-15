'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { setCurrentPage } from '@/store/slices/uiSlice';
import { testsAPI, Test } from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, X, Microscope } from 'lucide-react';

export default function TestsPage() {
    const dispatch = useDispatch();
    const user = useSelector((state: RootState) => state.auth.user);
    const [tests, setTests] = useState<Test[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', category: '', price: '' });

    useEffect(() => {
        dispatch(setCurrentPage('Test Catalog'));
        if (user?.lab_id) fetchTests();
    }, [dispatch, user]);

    const fetchTests = async () => {
        try {
            const response = await testsAPI.getByLab(user!.lab_id);
            setTests(response.data);
        } catch (error) {
            console.error('Failed to fetch tests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await testsAPI.create({
                name: formData.name,
                category: formData.category,
                price: parseFloat(formData.price),
                lab_id: user!.lab_id,
            });
            toast.success('Test added successfully!');
            setShowModal(false);
            setFormData({ name: '', category: '', price: '' });
            fetchTests();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to add test');
        }
    };

    const handleToggle = async (id: string) => {
        try {
            await testsAPI.toggleStatus(id);
            toast.success('Test status updated');
            fetchTests();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    // Group tests by category
    const groupedTests = tests.reduce((acc: Record<string, Test[]>, test) => {
        if (!acc[test.category]) acc[test.category] = [];
        acc[test.category].push(test);
        return acc;
    }, {});

    return (
        <div className="animate-fadeIn">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Test Catalog</h1>
                    <p style={{ color: '#6b7280', marginTop: '4px' }}>Manage tests available at your lab</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={18} />
                    Add Test
                </button>
            </div>

            {loading ? (
                <p>Loading...</p>
            ) : Object.keys(groupedTests).length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                    <Microscope size={48} color="#9ca3af" style={{ margin: '0 auto 16px' }} />
                    <p style={{ color: '#6b7280' }}>No tests added yet. Click "Add Test" to get started.</p>
                </div>
            ) : (
                Object.entries(groupedTests).map(([category, categoryTests]) => (
                    <div key={category} className="card" style={{ marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: '#6b7280' }}>{category}</h3>
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Test Name</th>
                                        <th>Price</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {categoryTests.map(test => (
                                        <tr key={test.id}>
                                            <td style={{ fontWeight: 500 }}>{test.name}</td>
                                            <td>Rs. {Number(test.price).toLocaleString()}</td>
                                            <td>
                                                <span className={`badge ${test.is_active ? 'badge-success' : 'badge-neutral'}`}>
                                                    {test.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    className={`btn btn-sm ${test.is_active ? 'btn-danger' : 'btn-success'}`}
                                                    onClick={() => handleToggle(test.id)}
                                                >
                                                    {test.is_active ? 'Deactivate' : 'Activate'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))
            )}

            {/* Add Test Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
                    <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '450px' }}>
                        <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: 600 }}>Add New Test</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={24} color="#6b7280" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} style={{ padding: '24px' }}>
                            <div className="form-group">
                                <label className="form-label">Test Name *</label>
                                <input type="text" required className="form-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Category *</label>
                                <input type="text" required className="form-input" placeholder="e.g., Blood Tests, Imaging" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Price (Rs.) *</label>
                                <input type="number" required min="0" className="form-input" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
                            </div>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-success">Add Test</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
