'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { setCurrentPage } from '@/store/slices/uiSlice';
import { reportsAPI, transactionsAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { Upload, FileText, CheckCircle } from 'lucide-react';

interface Transaction {
    id: string;
    receipt_number: string;
    test_name: string;
    user: { name: string; email: string };
}

export default function ReportsPage() {
    const dispatch = useDispatch();
    const user = useSelector((state: RootState) => state.auth.user);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        dispatch(setCurrentPage('Upload Reports'));
        fetchPendingTransactions();
    }, [dispatch]);

    const fetchPendingTransactions = async () => {
        try {
            // Fetch transactions that might need reports
            const response = await transactionsAPI.getAll({ limit: 50 });
            setTransactions(response.data.transactions);
        } catch (error) {
            console.error('Failed to fetch transactions:', error);
        }
    };

    const handleUpload = async () => {
        if (!selectedTx || !file) {
            toast.error('Please select a transaction and file');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('transaction_id', selectedTx.id);

            await reportsAPI.upload(formData);
            toast.success('Report uploaded successfully! Email notification sent to patient.');
            setSuccess(true);
            setFile(null);
            setSelectedTx(null);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to upload report');
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
                <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '12px' }}>Report Uploaded!</h1>
                <p style={{ color: '#6b7280', marginBottom: '24px' }}>
                    The patient has been notified via email.
                </p>
                <button className="btn btn-primary" onClick={() => setSuccess(false)}>
                    Upload Another Report
                </button>
            </div>
        );
    }

    return (
        <div className="animate-fadeIn">
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Upload Report</h1>
                <p style={{ color: '#6b7280', marginTop: '4px' }}>Upload test reports for patients (max 10MB)</p>
            </div>

            <div className="card" style={{ maxWidth: '600px' }}>
                {/* Select Transaction */}
                <div className="form-group">
                    <label className="form-label">Select Transaction</label>
                    <select
                        className="form-select"
                        value={selectedTx?.id || ''}
                        onChange={(e) => {
                            const tx = transactions.find(t => t.id === e.target.value);
                            setSelectedTx(tx || null);
                        }}
                    >
                        <option value="">Select a transaction...</option>
                        {transactions.map(tx => (
                            <option key={tx.id} value={tx.id}>
                                {tx.receipt_number} - {tx.user.name} - {tx.test_name}
                            </option>
                        ))}
                    </select>
                </div>

                {selectedTx && (
                    <div style={{ padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '8px', marginBottom: '20px' }}>
                        <p><strong>Patient:</strong> {selectedTx.user.name}</p>
                        <p><strong>Email:</strong> {selectedTx.user.email}</p>
                        <p><strong>Test:</strong> {selectedTx.test_name}</p>
                    </div>
                )}

                {/* File Upload */}
                <div className="form-group">
                    <label className="form-label">Select Report File</label>
                    <div
                        style={{
                            border: '2px dashed #e5e7eb',
                            borderRadius: '12px',
                            padding: '40px 20px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            backgroundColor: file ? '#f0fdf4' : '#f9fafb',
                        }}
                        onClick={() => document.getElementById('file-input')?.click()}
                    >
                        {file ? (
                            <>
                                <FileText size={40} color="#16a34a" style={{ margin: '0 auto 12px' }} />
                                <p style={{ fontWeight: 500 }}>{file.name}</p>
                                <p style={{ fontSize: '13px', color: '#6b7280' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </>
                        ) : (
                            <>
                                <Upload size={40} color="#9ca3af" style={{ margin: '0 auto 12px' }} />
                                <p style={{ fontWeight: 500 }}>Click to select file</p>
                                <p style={{ fontSize: '13px', color: '#6b7280' }}>PDF, DOC, TXT, JPEG, PNG (max 10MB)</p>
                            </>
                        )}
                    </div>
                    <input
                        id="file-input"
                        type="file"
                        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.webp"
                        style={{ display: 'none' }}
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                </div>

                <button
                    className="btn btn-success"
                    onClick={handleUpload}
                    disabled={!selectedTx || !file || loading}
                    style={{ width: '100%' }}
                >
                    <Upload size={18} />
                    {loading ? 'Uploading...' : 'Upload & Notify Patient'}
                </button>
            </div>
        </div>
    );
}
