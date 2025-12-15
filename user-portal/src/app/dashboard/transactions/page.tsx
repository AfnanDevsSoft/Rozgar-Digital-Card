'use client';

import { useEffect, useState } from 'react';
import { userAPI, Transaction } from '@/lib/api';
import { Receipt, Building2 } from 'lucide-react';

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            const response = await userAPI.getTransactions();
            setTransactions(response.data.transactions || []);
        } catch (error) {
            console.error('Failed to fetch transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fadeIn">
            <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>Transaction History</h1>
            <p style={{ color: '#6b7280', marginBottom: '32px' }}>View all your lab billing history and discounts</p>

            {loading ? (
                <p>Loading...</p>
            ) : transactions.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <Receipt size={48} color="#9ca3af" style={{ margin: '0 auto 16px' }} />
                    <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>No Transactions Yet</h3>
                    <p style={{ color: '#6b7280' }}>Your billing history will appear here.</p>
                </div>
            ) : (
                <div className="card">
                    <div style={{ overflowX: 'auto' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Receipt</th>
                                    <th>Lab</th>
                                    <th>Test</th>
                                    <th>Original</th>
                                    <th>Discount</th>
                                    <th>Paid</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((tx) => (
                                    <tr key={tx.id}>
                                        <td style={{ fontSize: '13px', color: '#6b7280' }}>
                                            {new Date(tx.created_at).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <code style={{ backgroundColor: '#f3f4f6', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                                                {tx.receipt_number}
                                            </code>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Building2 size={14} color="#6b7280" />
                                                {tx.lab.name}
                                            </div>
                                        </td>
                                        <td style={{ fontWeight: 500 }}>{tx.test_name}</td>
                                        <td>Rs. {Number(tx.original_amount).toLocaleString()}</td>
                                        <td>
                                            <span className="badge badge-success">
                                                - Rs. {Number(tx.discount_amount).toLocaleString()}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 600, color: '#16a34a' }}>
                                            Rs. {Number(tx.final_amount).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Summary */}
            {transactions.length > 0 && (
                <div className="card" style={{ marginTop: '24px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Summary</h3>
                    <div className="grid grid-cols-3">
                        <div>
                            <p style={{ fontSize: '12px', color: '#6b7280' }}>Total Transactions</p>
                            <p style={{ fontSize: '24px', fontWeight: 700 }}>{transactions.length}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '12px', color: '#6b7280' }}>Total Saved</p>
                            <p style={{ fontSize: '24px', fontWeight: 700, color: '#16a34a' }}>
                                Rs. {transactions.reduce((sum, tx) => sum + Number(tx.discount_amount), 0).toLocaleString()}
                            </p>
                        </div>
                        <div>
                            <p style={{ fontSize: '12px', color: '#6b7280' }}>Total Paid</p>
                            <p style={{ fontSize: '24px', fontWeight: 700 }}>
                                Rs. {transactions.reduce((sum, tx) => sum + Number(tx.final_amount), 0).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
