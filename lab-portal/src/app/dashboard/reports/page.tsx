'use client';

/**
 * Enhanced Reports Upload with Batch Support
 * Upload multiple reports per invoice with duplicate prevention
 */

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { setCurrentPage } from '@/store/slices/uiSlice';
import { transactionsAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { Upload, FileText, CheckCircle, X, AlertCircle } from 'lucide-react';

interface Transaction {
    id: string;
    receipt_number: string;
    test_name: string;
    user: { name: string; email: string };
}

export default function EnhancedReportsPage() {
    const dispatch = useDispatch();
    const user = useSelector((state: RootState) => state.auth.user);

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
    const [files, setFiles] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        dispatch(setCurrentPage('Upload Reports'));
        fetchTransactions();
    }, [dispatch]);

    const fetchTransactions = async () => {
        try {
            const response = await transactionsAPI.getAll({ limit: 100 });
            setTransactions(response.data.transactions);
        } catch (error) {
            console.error('Failed to fetch transactions:', error);
        }
    };

    const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        setFiles([...files, ...selectedFiles]);
    };

    const removeFile = (index: number) => {
        setFiles(files.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (!selectedTx) {
            toast.error('Please select a transaction');
            return;
        }

        if (files.length === 0) {
            toast.error('Please select at least one file');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();

            formData.append('transaction_id', selectedTx.id);
            formData.append('receipt_number', selectedTx.receipt_number);

            files.forEach(file => {
                formData.append('files', file);
            });

            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Upload failed');
            }

            const data = await response.json();
            toast.success(`${files.length} report(s) uploaded! Patient notified via email.`);
            setSuccess(true);
            setFiles([]);
            setSelectedTx(null);
        } catch (error: any) {
            if (error.message.includes('already uploaded')) {
                toast.error(error.message, { duration: 6000 });
            } else {
                toast.error(error.message || 'Failed to upload reports');
            }
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="animate-fadeIn" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                    <CheckCircle size={40} color="#16a34a" />
                </div>
                <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '12px' }}>Reports Uploaded!</h1>
                <p style={{ color: '#6b7280', marginBottom: '24px' }}>
                    The patient has been notified via email.
                </p>
                <button className="btn btn-primary" onClick={() => setSuccess(false)}>
                    Upload More Reports
                </button>
            </div>
        );
    }

    return (
        <div className="animate-fadeIn">
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Upload Reports</h1>
                <p style={{ color: '#6b7280', marginTop: '4px' }}>Upload multiple reports per invoice - one-time upload per invoice number</p>
            </div>

            <div className="card" style={{ maxWidth: '700px' }}>
                {/* Select Transaction/Invoice */}
                <div className="form-group">
                    <label className="form-label">Select Invoice/Transaction</label>
                    <select
                        className="form-select"
                        value={selectedTx?.id || ''}
                        onChange={(e) => {
                            const tx = transactions.find(t => t.id === e.target.value);
                            setSelectedTx(tx || null);
                        }}
                    >
                        <option value="">Select an invoice...</option>
                        {transactions.map(tx => (
                            <option key={tx.id} value={tx.id}>
                                {tx.receipt_number} - {tx.user.name} - {tx.test_name}
                            </option>
                        ))}
                    </select>
                </div>

                {selectedTx && (
                    <div style={{ padding: '16px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                            <AlertCircle size={18} color="#1e40af" style={{ marginTop: '2px', flexShrink: 0 }} />
                            <div style={{ fontSize: '13px', color: '#1e40af' }}>
                                <p style={{ fontWeight: 600, marginBottom: '4px' }}>Patient: {selectedTx.user.name}</p>
                                <p>Email: {selectedTx.user.email}</p>
                                <p>Test(s): {selectedTx.test_name}</p>
                                <p style={{ marginTop: '8px', fontSize: '12px' }}>
                                    ⚠️ This invoice can only be uploaded once. You can upload multiple report files now.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* File Upload - Multiple */}
                <div className="form-group">
                    <label className="form-label">Select Report Files</label>
                    <div
                        style={{
                            border: '2px dashed #d1d5db',
                            borderRadius: '12px',
                            padding: '40px 20px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            backgroundColor: files.length > 0 ? '#f0fdf4' : '#f9fafb',
                        }}
                        onClick={() => document.getElementById('file-input')?.click()}
                    >
                        <Upload size={40} color={files.length > 0 ? '#16a34a' : '#9ca3af'} style={{ margin: '0 auto 12px' }} />
                        <p style={{ fontWeight: 500 }}>Click to select files</p>
                        <p style={{ fontSize: '13px', color: '#6b7280' }}>PDF, JPEG, PNG (max 10MB each)</p>
                        <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>You can select multiple files at once</p>
                    </div>
                    <input
                        id="file-input"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        multiple
                        style={{ display: 'none' }}
                        onChange={handleFilesChange}
                    />
                </div>

                {/* Selected Files List */}
                {files.length > 0 && (
                    <div style={{ marginTop: '16px', marginBottom: '20px' }}>
                        <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#374151' }}>
                            Selected Files ({files.length})
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {files.map((file, index) => (
                                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                                    <FileText size={20} color="#16a34a" />
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: '14px', fontWeight: 500 }}>{file.name}</p>
                                        <p style={{ fontSize: '12px', color: '#6b7280' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                    <button
                                        onClick={() => removeFile(index)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <button
                    className="btn btn-success"
                    onClick={handleUpload}
                    disabled={!selectedTx || files.length === 0 || loading}
                    style={{ width: '100%' }}
                >
                    <Upload size={18} />
                    {loading ? 'Uploading...' : `Upload ${files.length} Report(s) & Notify Patient`}
                </button>
            </div>
        </div>
    );
}
