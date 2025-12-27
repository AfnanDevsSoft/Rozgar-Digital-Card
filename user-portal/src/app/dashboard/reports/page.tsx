'use client';

import { useEffect, useState } from 'react';
import { userAPI, getFileUrl } from '@/lib/api';
import { FileText, Download, Calendar } from 'lucide-react';

interface Report {
    id: string;
    file_name: string;
    file_url: string;
    status: string;
    uploaded_at: string;
    lab: { name: string };
    transaction: { test_name: string; receipt_number: string };
}

export default function ReportsPage() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const response = await userAPI.getReports();
            setReports(response.data.reports || []);
        } catch (error) {
            console.error('Failed to fetch reports:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fadeIn">
            <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>My Reports</h1>
            <p style={{ color: '#6b7280', marginBottom: '32px' }}>View and download your lab reports</p>

            {loading ? (
                <p>Loading...</p>
            ) : reports.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <FileText size={48} color="#9ca3af" style={{ margin: '0 auto 16px' }} />
                    <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>No Reports Yet</h3>
                    <p style={{ color: '#6b7280' }}>Your lab reports will appear here once they are uploaded.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2">
                    {reports.map((report) => (
                        <div key={report.id} className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <FileText size={24} color="#2563eb" />
                                    </div>
                                    <div>
                                        <h3 style={{ fontWeight: 600, marginBottom: '4px' }}>{report.transaction?.test_name || 'Lab Report'}</h3>
                                        <p style={{ fontSize: '13px', color: '#6b7280' }}>{report.lab?.name || 'Lab'}</p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
                                            <Calendar size={14} />
                                            {new Date(report.uploaded_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                                <a
                                    href={getFileUrl(report.file_url)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-primary"
                                    style={{ padding: '8px 12px' }}
                                >
                                    <Download size={16} />
                                    Download
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

