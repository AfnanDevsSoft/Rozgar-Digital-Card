'use client';

/**
 * Reports Page
 */

import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setCurrentPage } from '@/store/slices/uiSlice';
import { reportsAPI } from '@/lib/api';
import { FileText, Download, Eye } from 'lucide-react';

interface Report {
    id: string;
    file_name: string;
    file_url: string;
    file_type: string;
    file_size: number;
    status: string;
    uploaded_at: string;
    user: { name: string; email: string };
    lab: { name: string };
    transaction: { test_name: string; receipt_number: string };
}

export default function ReportsPage() {
    const dispatch = useDispatch();
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });

    useEffect(() => {
        dispatch(setCurrentPage('Reports'));
        fetchReports();
    }, [dispatch, pagination.page, statusFilter]);

    const fetchReports = async () => {
        try {
            const response = await reportsAPI.getAll({
                page: pagination.page,
                limit: pagination.limit,
                status: statusFilter || undefined,
            });
            setReports(response.data.reports);
            setPagination(response.data.pagination);
        } catch (error) {
            console.error('Failed to fetch reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'UPLOADED': return 'badge-success';
            case 'PENDING': return 'badge-warning';
            case 'DELIVERED': return 'badge-info';
            default: return 'badge-neutral';
        }
    };

    return (
        <div className="animate-fadeIn">
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Reports</h1>
                <p style={{ color: '#6b7280', marginTop: '4px' }}>View all uploaded lab reports</p>
            </div>

            {/* Filter */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="form-select"
                    style={{ maxWidth: '200px' }}
                >
                    <option value="">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="UPLOADED">Uploaded</option>
                    <option value="DELIVERED">Delivered</option>
                </select>
            </div>

            {/* Reports Table */}
            <div className="card">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>File</th>
                                <th>Patient</th>
                                <th>Lab</th>
                                <th>Test</th>
                                <th>Status</th>
                                <th>Uploaded</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>Loading...</td>
                                </tr>
                            ) : reports.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                                        No reports found
                                    </td>
                                </tr>
                            ) : (
                                reports.map((report) => (
                                    <tr key={report.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '8px',
                                                    backgroundColor: '#f3f4f6',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}>
                                                    <FileText size={20} color="#6b7280" />
                                                </div>
                                                <div>
                                                    <p style={{ fontWeight: 500, fontSize: '14px' }}>{report.file_name}</p>
                                                    <p style={{ fontSize: '12px', color: '#6b7280' }}>{formatFileSize(report.file_size)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p style={{ fontWeight: 500 }}>{report.user.name}</p>
                                        </td>
                                        <td>{report.lab.name}</td>
                                        <td>{report.transaction.test_name}</td>
                                        <td>
                                            <span className={`badge ${getStatusColor(report.status)}`}>
                                                {report.status}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '13px', color: '#6b7280' }}>
                                            {new Date(report.uploaded_at).toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {pagination.pages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                        <p style={{ fontSize: '14px', color: '#6b7280' }}>
                            Page {pagination.page} of {pagination.pages}
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
        </div>
    );
}
