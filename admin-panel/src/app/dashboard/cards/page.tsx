'use client';

/**
 * Health Cards Page
 */

import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setCurrentPage } from '@/store/slices/uiSlice';
import { cardsAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { Search, RefreshCw, X, Printer } from 'lucide-react';

interface HealthCard {
    id: string;
    serial_number: string;
    status: string;
    issue_date: string;
    expiry_date: string;
    user: {
        id: string;
        name: string;
        email: string;
        phone: string;
    };
}

export default function CardsPage() {
    const dispatch = useDispatch();
    const [cards, setCards] = useState<HealthCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [renewModal, setRenewModal] = useState<HealthCard | null>(null);
    const [newExpiryDate, setNewExpiryDate] = useState('');
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });

    useEffect(() => {
        dispatch(setCurrentPage('Health Cards'));
        fetchCards();
    }, [dispatch, pagination.page, search, statusFilter]);

    const fetchCards = async () => {
        try {
            const response = await cardsAPI.getAll({
                page: pagination.page,
                limit: pagination.limit,
                search: search || undefined,
                status: statusFilter || undefined,
            });
            setCards(response.data.cards);
            setPagination(response.data.pagination);
        } catch (error) {
            console.error('Failed to fetch cards:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (card: HealthCard, newStatus: string) => {
        try {
            await cardsAPI.updateStatus(card.id, newStatus);
            toast.success(`Card ${newStatus.toLowerCase()}`);
            fetchCards();
        } catch (error) {
            toast.error('Failed to update card status');
        }
    };

    const handleRenew = async () => {
        if (!renewModal || !newExpiryDate) return;
        try {
            await cardsAPI.renew(renewModal.id, newExpiryDate);
            toast.success('Card renewed successfully!');
            setRenewModal(null);
            setNewExpiryDate('');
            fetchCards();
        } catch (error) {
            toast.error('Failed to renew card');
        }
    };

    const handlePrintCard = (card: HealthCard) => {
        // Standard credit card size: 85.6mm × 53.98mm (3.375" × 2.125")
        const printWindow = window.open('', '_blank', 'width=600,height=500');
        if (!printWindow) return;

        const cardHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Health Card - ${card.serial_number}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Inter', -apple-system, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: #f5f5f5;
            padding: 20px;
        }
        
        .card-container {
            display: flex;
            flex-direction: column;
            gap: 20px;
            align-items: center;
        }
        
        .card {
            width: 85.6mm;
            height: 53.98mm;
            border-radius: 3mm;
            padding: 5mm;
            position: relative;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }
        
        .card-front {
            background: linear-gradient(135deg, #0a0a0a 0%, #1f1f1f 50%, #0a0a0a 100%);
            color: #fff;
        }
        
        .card-back {
            background: linear-gradient(135deg, #1f1f1f 0%, #0a0a0a 100%);
            color: #fff;
        }
        
        .card-pattern {
            position: absolute;
            right: -20mm;
            top: -20mm;
            width: 50mm;
            height: 50mm;
            border-radius: 50%;
            background: rgba(255,255,255,0.05);
        }
        
        .card-pattern-2 {
            position: absolute;
            right: 10mm;
            bottom: -15mm;
            width: 35mm;
            height: 35mm;
            border-radius: 50%;
            background: rgba(255,255,255,0.03);
        }
        
        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 4mm;
        }
        
        .logo-area {
            display: flex;
            align-items: center;
            gap: 2mm;
        }
        
        .logo-icon { font-size: 5mm; }
        .logo-text { font-size: 2.5mm; font-weight: 600; letter-spacing: 0.5mm; }
        .card-type { font-size: 1.8mm; opacity: 0.7; text-transform: uppercase; letter-spacing: 0.3mm; }
        
        .serial-number {
            font-size: 4mm;
            font-family: 'Courier New', monospace;
            font-weight: 700;
            letter-spacing: 1mm;
            margin-bottom: 5mm;
        }
        
        .card-details { display: flex; gap: 8mm; }
        .detail-group { flex: 1; }
        .detail-label { font-size: 1.5mm; opacity: 0.6; text-transform: uppercase; letter-spacing: 0.2mm; margin-bottom: 0.5mm; }
        .detail-value { font-size: 2.2mm; font-weight: 500; }
        
        .status-badge {
            position: absolute;
            top: 5mm;
            right: 5mm;
            background: ${card.status === 'ACTIVE' ? '#16a34a' : '#dc2626'};
            color: #fff;
            padding: 0.8mm 2mm;
            border-radius: 1mm;
            font-size: 1.5mm;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .magnetic-strip {
            position: absolute;
            top: 8mm;
            left: 0;
            right: 0;
            height: 8mm;
            background: #333;
        }
        
        .back-content { margin-top: 18mm; padding: 0 3mm; }
        .back-info { font-size: 1.6mm; line-height: 1.6; opacity: 0.8; }
        .back-serial { margin-top: 4mm; font-family: 'Courier New', monospace; font-size: 2mm; }
        
        .print-button {
            padding: 12px 32px;
            background: #0a0a0a;
            color: #fff;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
        }
        
        .print-button:hover { background: #1f1f1f; }
        
        @media print {
            body { background: #fff; }
            .print-button { display: none; }
            .card { box-shadow: none; border: 1px solid #ddd; }
            @page { margin: 10mm; size: auto; }
        }
    </style>
</head>
<body>
    <div class="card-container">
        <!-- Front of Card -->
        <div class="card card-front">
            <div class="card-pattern"></div>
            <div class="card-pattern-2"></div>
            <div class="status-badge">${card.status}</div>
            
            <div class="card-header">
                <div class="logo-area">
                    <span class="logo-icon">🏥</span>
                    <div>
                        <div class="logo-text">DIGITAL HEALTH CARD</div>
                        <div class="card-type">Member Since ${new Date(card.issue_date).getFullYear()}</div>
                    </div>
                </div>
            </div>
            
            <div class="serial-number">${card.serial_number}</div>
            
            <div class="card-details">
                <div class="detail-group">
                    <div class="detail-label">Card Holder</div>
                    <div class="detail-value">${card.user.name.toUpperCase()}</div>
                </div>
                <div class="detail-group">
                    <div class="detail-label">Valid Until</div>
                    <div class="detail-value">${new Date(card.expiry_date).toLocaleDateString('en-US', { month: '2-digit', year: '2-digit' })}</div>
                </div>
            </div>
        </div>
        
        <!-- Back of Card -->
        <div class="card card-back">
            <div class="magnetic-strip"></div>
            <div class="back-content">
                <div class="back-info">
                    This card entitles the holder to discounts at all partner laboratories. 
                    Present this card before any test for automatic discount application.
                    <br/><br/>
                    For support: support@healthcard.com
                </div>
                <div class="back-serial">
                    ID: ${card.serial_number} | ${card.user.phone}
                </div>
            </div>
        </div>
        
        <button class="print-button" onclick="window.print()">🖨️ Print Card</button>
    </div>
</body>
</html>`;

        printWindow.document.write(cardHTML);
        printWindow.document.close();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'badge-success';
            case 'EXPIRED': return 'badge-danger';
            case 'INACTIVE': return 'badge-neutral';
            case 'LOST': return 'badge-warning';
            default: return 'badge-neutral';
        }
    };

    return (
        <div className="animate-fadeIn">
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Health Cards</h1>
                <p style={{ color: '#6b7280', marginTop: '4px' }}>Manage all issued health cards</p>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                            <input
                                type="text"
                                placeholder="Search by serial number or user name..."
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
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                        <option value="EXPIRED">Expired</option>
                        <option value="LOST">Lost</option>
                    </select>
                </div>
            </div>

            {/* Cards Table */}
            <div className="card">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Serial Number</th>
                                <th>User</th>
                                <th>Status</th>
                                <th>Issue Date</th>
                                <th>Expiry Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>Loading...</td>
                                </tr>
                            ) : cards.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                                        No cards found
                                    </td>
                                </tr>
                            ) : (
                                cards.map((card) => (
                                    <tr key={card.id}>
                                        <td>
                                            <code style={{ backgroundColor: '#0a0a0a', color: '#fff', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 500 }}>
                                                {card.serial_number}
                                            </code>
                                        </td>
                                        <td>
                                            <p style={{ fontWeight: 500 }}>{card.user.name}</p>
                                            <p style={{ fontSize: '12px', color: '#6b7280' }}>{card.user.phone}</p>
                                        </td>
                                        <td>
                                            <span className={`badge ${getStatusColor(card.status)}`}>
                                                {card.status}
                                            </span>
                                        </td>
                                        <td>{new Date(card.issue_date).toLocaleDateString()}</td>
                                        <td>
                                            <span style={{
                                                color: new Date(card.expiry_date) < new Date() ? '#dc2626' : '#0a0a0a',
                                                fontWeight: new Date(card.expiry_date) < new Date() ? 600 : 400,
                                            }}>
                                                {new Date(card.expiry_date).toLocaleDateString()}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    className="btn btn-success btn-sm"
                                                    onClick={() => handlePrintCard(card)}
                                                    title="Print Card"
                                                >
                                                    <Printer size={14} />
                                                    Print
                                                </button>
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    onClick={() => {
                                                        setRenewModal(card);
                                                        setNewExpiryDate('');
                                                    }}
                                                    title="Renew Card"
                                                >
                                                    <RefreshCw size={14} />
                                                    Renew
                                                </button>
                                                {card.status === 'ACTIVE' && (
                                                    <button
                                                        className="btn btn-warning btn-sm"
                                                        onClick={() => handleStatusChange(card, 'LOST')}
                                                    >
                                                        Mark Lost
                                                    </button>
                                                )}
                                            </div>
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

            {/* Renew Modal */}
            {renewModal && (
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
                        maxWidth: '400px',
                        padding: '24px',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: 600 }}>Renew Card</h2>
                            <button onClick={() => setRenewModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={24} color="#6b7280" />
                            </button>
                        </div>

                        <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
                            Renewing card: <strong>{renewModal.serial_number}</strong>
                        </p>

                        <div className="form-group">
                            <label className="form-label">New Expiry Date</label>
                            <input
                                type="date"
                                className="form-input"
                                value={newExpiryDate}
                                onChange={(e) => setNewExpiryDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                            <button className="btn btn-outline" onClick={() => setRenewModal(null)}>Cancel</button>
                            <button className="btn btn-success" onClick={handleRenew} disabled={!newExpiryDate}>
                                Renew Card
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
