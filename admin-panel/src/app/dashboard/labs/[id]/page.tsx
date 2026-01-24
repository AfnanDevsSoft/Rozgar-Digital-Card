'use client';

/**
 * Lab Detail Page
 * Shows lab info, discount configuration, and all tests
 */

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentPage } from '@/store/slices/uiSlice';
import { RootState } from '@/store/store';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';
import {
    ArrowLeft,
    Building2,
    Plus,
    Edit,
    Trash2,
    X,
    FlaskConical
} from 'lucide-react';

interface Lab {
    id: string;
    lab_code: string;
    name: string;
    address: string;
    phone: string;
    email: string;
    discount_rate: number;
    status: string;
}

interface Test {
    id: string;
    name: string;
    category: string;
    price: number;
    discount_percent: number;
    is_active: boolean;
}

interface GroupedTests {
    [category: string]: Test[];
}

export default function LabDetailPage() {
    const params = useParams();
    const router = useRouter();
    const dispatch = useDispatch();
    const user = useSelector((state: RootState) => state.auth.user);
    const labId = params.id as string;

    const [lab, setLab] = useState<Lab | null>(null);
    const [tests, setTests] = useState<GroupedTests>({});
    const [loading, setLoading] = useState(true);
    const [showTestModal, setShowTestModal] = useState(false);
    const [editingTest, setEditingTest] = useState<Test | null>(null);

    const [testForm, setTestForm] = useState({
        name: '',
        category: '',
        price: '',
        discount_percent: '0'
    });

    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    useEffect(() => {
        dispatch(setCurrentPage('Lab Details'));
        fetchLabData();
    }, [dispatch, labId]);

    const fetchLabData = async () => {
        try {
            setLoading(true);
            const token = Cookies.get('admin_token');

            // Fetch lab details
            const labResponse = await fetch(`${API_URL}/labs/${labId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (labResponse.ok) {
                const labData = await labResponse.json();
                setLab(labData);
            }

            // Fetch tests grouped by category
            const testsResponse = await fetch(`${API_URL}/test-catalog/lab/${labId}/categories`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (testsResponse.ok) {
                const testsData = await testsResponse.json();
                setTests(testsData);
            }
        } catch (error) {
            console.error('Failed to fetch lab data:', error);
            toast.error('Failed to load lab data');
        } finally {
            setLoading(false);
        }
    };



    const handleCreateTest = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = Cookies.get('admin_token');
            const response = await fetch(`${API_URL}/test-catalog`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...testForm,
                    price: parseFloat(testForm.price),
                    discount_percent: parseFloat(testForm.discount_percent),
                    lab_id: labId
                })
            });

            if (response.ok) {
                toast.success('Test created successfully!');
                setShowTestModal(false);
                setTestForm({ name: '', category: '', price: '', discount_percent: '0' });
                fetchLabData();
            } else {
                const error = await response.json();
                toast.error(error.error || 'Failed to create test');
            }
        } catch (error) {
            toast.error('Failed to create test');
        }
    };

    const handleUpdateTest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTest) return;

        try {
            const token = Cookies.get('admin_token');
            const response = await fetch(`${API_URL}/test-catalog/${editingTest.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: testForm.name,
                    category: testForm.category,
                    price: parseFloat(testForm.price)
                })
            });

            if (response.ok) {
                toast.success('Test updated successfully!');
                setEditingTest(null);
                setShowTestModal(false);
                setTestForm({ name: '', category: '', price: '', discount_percent: '0' });
                fetchLabData();
            } else {
                toast.error('Failed to update test');
            }
        } catch (error) {
            toast.error('Failed to update test');
        }
    };

    const handleDeleteTest = async (testId: string) => {
        if (!confirm('Are you sure you want to delete this test?')) return;

        try {
            const token = Cookies.get('admin_token');
            const response = await fetch(`${API_URL}/test-catalog/${testId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                toast.success('Test deleted successfully!');
                fetchLabData();
            } else {
                toast.error('Failed to delete test');
            }
        } catch (error) {
            toast.error('Failed to delete test');
        }
    };

    const openEditModal = (test: Test) => {
        setEditingTest(test);
        setTestForm({
            name: test.name,
            category: test.category,
            price: test.price.toString(),
            discount_percent: test.discount_percent.toString()
        });
        setShowTestModal(true);
    };

    const closeModal = () => {
        setShowTestModal(false);
        setEditingTest(null);
        setTestForm({ name: '', category: '', price: '', discount_percent: '0' });
    };

    const canManageLabs = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
    const totalTests = Object.values(tests).flat().length;

    if (loading) {
        return (
            <div className="animate-fadeIn" style={{ textAlign: 'center', padding: '60px' }}>
                Loading...
            </div>
        );
    }

    if (!lab) {
        return (
            <div className="animate-fadeIn" style={{ textAlign: 'center', padding: '60px' }}>
                Lab not found
            </div>
        );
    }

    return (
        <div className="animate-fadeIn">
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                <button
                    onClick={() => router.push('/dashboard/labs')}
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
                    <h1 style={{ fontSize: '24px', fontWeight: 700 }}>{lab.name}</h1>
                    <p style={{ color: '#6b7280', marginTop: '4px' }}>{lab.lab_code}</p>
                </div>
                <span className={`badge ${lab.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
                    {lab.status}
                </span>
            </div>

            {/* Lab Info */}
            <div style={{ marginBottom: '24px' }}>
                {/* Lab Info Card */}
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            backgroundColor: '#dbeafe',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <Building2 size={24} color="#2563eb" />
                        </div>
                        <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Lab Information</h2>
                    </div>
                    <div style={{ fontSize: '14px', color: '#4b5563' }}>
                        <p style={{ marginBottom: '8px' }}>📍 <strong>Address:</strong> {lab.address}</p>
                        <p style={{ marginBottom: '8px' }}>📞 <strong>Phone:</strong> {lab.phone}</p>
                        <p>📧 <strong>Email:</strong> {lab.email}</p>
                    </div>
                </div>
            </div>

            {/* Tests Section */}
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            backgroundColor: '#f3e8ff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <FlaskConical size={24} color="#9333ea" />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Test Catalog</h2>
                            <p style={{ fontSize: '14px', color: '#6b7280' }}>{totalTests} tests available</p>
                        </div>
                    </div>
                    {canManageLabs && (
                        <button className="btn btn-primary" onClick={() => setShowTestModal(true)}>
                            <Plus size={18} /> Add Test
                        </button>
                    )}
                </div>

                {totalTests === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                        No tests found. Add your first test!
                    </div>
                ) : (
                    Object.entries(tests).map(([category, categoryTests]) => (
                        <div key={category} style={{ marginBottom: '24px' }}>
                            <h3 style={{
                                fontSize: '14px',
                                fontWeight: 600,
                                color: '#6b7280',
                                textTransform: 'uppercase',
                                marginBottom: '12px',
                                paddingBottom: '8px',
                                borderBottom: '1px solid #e5e7eb'
                            }}>
                                {category} ({categoryTests.length})
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {categoryTests.map((test) => (
                                    <div
                                        key={test.id}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '12px 16px',
                                            backgroundColor: '#f9fafb',
                                            borderRadius: '8px'
                                        }}
                                    >
                                        <div>
                                            <p style={{ fontWeight: 500 }}>{test.name}</p>
                                            <p style={{ fontSize: '12px', color: '#6b7280' }}>
                                                Price: Rs. {test.price} | Discount: {test.discount_percent}%
                                            </p>
                                        </div>
                                        {canManageLabs && (
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    className="btn btn-outline btn-sm"
                                                    onClick={() => openEditModal(test)}
                                                >
                                                    <Edit size={14} />
                                                </button>
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => handleDeleteTest(test.id)}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Test Modal */}
            {showTestModal && (
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
                            <h2 style={{ fontSize: '20px', fontWeight: 600 }}>
                                {editingTest ? 'Edit Test' : 'Add New Test'}
                            </h2>
                            <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={24} color="#6b7280" />
                            </button>
                        </div>
                        <form onSubmit={editingTest ? handleUpdateTest : handleCreateTest} style={{ padding: '24px' }}>
                            <div className="form-group">
                                <label className="form-label">Test Name *</label>
                                <input
                                    type="text"
                                    required
                                    className="form-input"
                                    value={testForm.name}
                                    onChange={(e) => setTestForm({ ...testForm, name: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Category *</label>
                                <input
                                    type="text"
                                    required
                                    className="form-input"
                                    placeholder="e.g., Blood Tests, Radiology, Pathology"
                                    value={testForm.category}
                                    onChange={(e) => setTestForm({ ...testForm, category: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2">
                                <div className="form-group">
                                    <label className="form-label">Price (Rs.) *</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        className="form-input"
                                        value={testForm.price}
                                        onChange={(e) => setTestForm({ ...testForm, price: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Discount %</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        className="form-input"
                                        value={testForm.discount_percent}
                                        onChange={(e) => setTestForm({ ...testForm, discount_percent: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="btn btn-success">
                                    {editingTest ? 'Update Test' : 'Create Test'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
