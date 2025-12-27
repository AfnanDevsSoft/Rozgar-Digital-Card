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
        cnic?: string;
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
        // SHIFA SAHULAT CARD - 300mm × 200mm (Horizontal/Landscape) with background images
        const printWindow = window.open('', '_blank', 'width=1200,height=700');
        if (!printWindow) return;

        // Get absolute URLs for images
        const baseUrl = window.location.origin;
        const frontImageUrl = `${baseUrl}/card/front.jpg`;
        const backImageUrl = `${baseUrl}/card/back.jpg`;

        const cardHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Shifa Sahulat Card - ${card.serial_number}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Inter', Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: #f5f5f5;
            padding: 20px;
        }
        
        .card-container {
            display: flex;
            flex-direction: row;
            gap: 30px;
            align-items: center;
            flex-wrap: wrap;
            justify-content: center;
        }
        
        .card {
            width: 300mm;
            height: 200mm;
            position: relative;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
        }
        
        .card-front {
            background-image: url('${frontImageUrl}');
        }
        
        .card-back {
            background-image: url('${backImageUrl}');
        }
        
        /* Data overlay positioning for BACK card */
        .data-overlay {
            position: absolute;
            width: 100%;
            height: 100%;
        }
        
        /* Adjust these positions based on your horizontal card design */
        .sr-number {
            position: absolute;
            top: 85mm;
            left: 95mm;
            font-size: 18pt;
            font-weight: 700;
            color: #000;
            font-family: 'Inter', Arial, sans-serif;
        }
        
        .name {
            position: absolute;
            top: 100mm;
            left: 95mm;
            font-size: 18pt;
            font-weight: 700;
            color: #000;
            text-transform: uppercase;
            font-family: 'Inter', Arial, sans-serif;
        }
        
        .cnic {
            position: absolute;
            top: 115mm;
            left: 95mm;
            font-size: 18pt;
            font-weight: 700;
            color: #000;
            font-family: 'Inter', Arial, sans-serif;
        }
        
        .valid-thru {
            position: absolute;
            top: 140mm;
            left: 95mm;
            font-size: 16pt;
            font-weight: 700;
            color: #000;
            text-transform: uppercase;
            font-family: 'Inter', Arial, sans-serif;
        }
        
        .button-container {
            width: 100%;
            text-align: center;
            margin-top: 20px;
        }
        
        .print-button {
            padding: 15px 40px;
            background: #1a5f3f;
            color: #fff;
            border: none;
            border-radius: 8px;
            font-size: 18px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(26, 95, 63, 0.3);
        }
        
        .print-button:hover { background: #0d4029; }
        
        @media print {
            body { 
                background: #fff; 
                padding: 0;
                margin: 0;
            }
            .print-button { display: none; }
            .button-container { display: none; }
            .card { 
                box-shadow: none; 
                margin: 0;
                page-break-after: always;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            @page { 
                margin: 0; 
                size: 300mm 200mm landscape; 
            }
        }
    </style>
</head>
<body>
    <div style="width: 100%;">
        <div class="card-container">
            <!-- FRONT CARD (Background Image Only) -->
            <div class="card card-front"></div>
            
            <!-- BACK CARD (Background Image + Data Overlay) -->
            <div class="card card-back">
                <div class="data-overlay">
                    <div class="sr-number">${card.serial_number}</div>
                    <div class="name">${card.user.name.toUpperCase()}</div>
                    <div class="cnic">${card.user.cnic || '_____-_______-_'}</div>
                    <div class="valid-thru">${new Date(card.expiry_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}</div>
                </div>
            </div>
        </div>
        
        <div class="button-container">
            <button class="print-button" onclick="window.print()">🖨️ Print Card</button>
        </div>
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
