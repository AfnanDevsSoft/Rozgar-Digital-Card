'use client';

import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setCurrentPage } from '@/store/slices/uiSlice';
import { transactionsAPI } from '@/lib/api';
import { Search } from 'lucide-react';

interface Transaction {
    id: string;
    receipt_number: string;
    test_name: string;
    original_amount: number;
    discount_percentage: number;
    discount_amount: number;
    final_amount: number;
    created_at: string;
    user: { name: string };
}

export default function TransactionsPage() {
    const dispatch = useDispatch();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });

    useEffect(() => {
        dispatch(setCurrentPage('Transactions'));
        fetchTransactions();
    }, [dispatch, pagination.page, search]);

    const fetchTransactions = async () => {
        try {
            const response = await transactionsAPI.getAll({
                page: pagination.page,
                limit: pagination.limit,
                search: search || undefined,
            });
            setTransactions(response.data.transactions);
            setPagination(response.data.pagination);
        } catch (error) {
            console.error('Failed to fetch transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fadeIn">
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Transactions</h1>
                <p style={{ color: '#6b7280', marginTop: '4px' }}>View all billing transactions</p>
            </div>

            <div className="card" style={{ marginBottom: '24px' }}>
                <div style={{ position: 'relative', maxWidth: '400px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                    <input
                        type="text"
                        placeholder="Search by receipt number or patient..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="form-input"
                        style={{ paddingLeft: '40px' }}
                    />
                </div>
            </div>

            <div className="card">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Receipt #</th>
                                <th>Patient</th>
                                <th>Test</th>
                                <th>Original</th>
                                <th>Discount</th>
                                <th>Final</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>Loading...</td></tr>
                            ) : transactions.length === 0 ? (
                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>No transactions found</td></tr>
                            ) : (
                                transactions.map((tx) => (
                                    <tr key={tx.id}>
                                        <td><code style={{ backgroundColor: '#f3f4f6', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>{tx.receipt_number}</code></td>
                                        <td style={{ fontWeight: 500 }}>{tx.user.name}</td>
                                        <td>{tx.test_name}</td>
                                        <td>Rs. {Number(tx.original_amount).toLocaleString()}</td>
                                        <td><span className="badge badge-success">{tx.discount_percentage}%</span></td>
                                        <td style={{ fontWeight: 600, color: '#16a34a' }}>Rs. {Number(tx.final_amount).toLocaleString()}</td>
                                        <td style={{ fontSize: '13px', color: '#6b7280' }}>{new Date(tx.created_at).toLocaleString()}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {pagination.pages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                        <p style={{ fontSize: '14px', color: '#6b7280' }}>Page {pagination.page} of {pagination.pages}</p>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn btn-outline btn-sm" disabled={pagination.page === 1} onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}>Previous</button>
                            <button className="btn btn-outline btn-sm" disabled={pagination.page === pagination.pages} onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}>Next</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
