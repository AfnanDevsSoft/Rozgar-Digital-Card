'use client';

/**
 * Enhanced Billing with Multi-Test Selection
 * Allows selecting multiple tests in a single transaction
 */

import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { setCurrentPage } from '@/store/slices/uiSlice';
import { cardsAPI, transactionsAPI, testsAPI, Test } from '@/lib/api';
import toast from 'react-hot-toast';
import { Search, Receipt, Printer, CheckCircle, AlertCircle, Plus, X } from 'lucide-react';

interface SelectedTest extends Test {
    quantity: number;
}

export default function EnhancedBillingPage() {
    const dispatch = useDispatch();
    const user = useSelector((state: RootState) => state.auth.user);
    const receiptRef = useRef<HTMLDivElement>(null);

    const [serial, setSerial] = useState('');
    const [cardInfo, setCardInfo] = useState<any>(null);
    const [tests, setTests] = useState<Test[]>([]);
    const [selectedTests, setSelectedTests] = useState<SelectedTest[]>([]);
    const [loading, setLoading] = useState(false);
    const [transaction, setTransaction] = useState<any>(null);

    useEffect(() => {
        dispatch(setCurrentPage('Billing'));
        if (user?.lab_id) fetchTests();
    }, [dispatch, user]);

    const fetchTests = async () => {
        try {
            const response = await testsAPI.getByLab(user!.lab_id);
            setTests(response.data);
        } catch (error) {
            console.error('Failed to fetch tests:', error);
        }
    };

    const verifyCard = async () => {
        if (!serial.trim()) return;
        setLoading(true);
        try {
            const response = await cardsAPI.verify(serial.trim());
            setCardInfo(response.data);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Card not found');
            setCardInfo(null);
        } finally {
            setLoading(false);
        }
    };

    const addTest = (test: Test) => {
        const existing = selectedTests.find(t => t.id === test.id);
        if (existing) {
            setSelectedTests(selectedTests.map(t =>
                t.id === test.id ? { ...t, quantity: t.quantity + 1 } : t
            ));
        } else {
            setSelectedTests([...selectedTests, { ...test, quantity: 1 }]);
        }
    };

    const removeTest = (testId: string) => {
        setSelectedTests(selectedTests.filter(t => t.id !== testId));
    };

    const updateQuantity = (testId: string, quantity: number) => {
        if (quantity < 1) return;
        setSelectedTests(selectedTests.map(t =>
            t.id === testId ? { ...t, quantity } : t
        ));
    };

    const calculateTotals = () => {
        let original = 0;
        let totalDiscount = 0;

        // Calculate per-test discounts
        selectedTests.forEach(test => {
            const testTotal = Number(test.price) * test.quantity;
            const testDiscountPercent = cardInfo?.discountEligible ? (Number(test.discount_percent) || 0) : 0;
            const testDiscount = (testTotal * testDiscountPercent) / 100;

            console.log('Test:', test.name,
                'Price:', test.price,
                'Discount%:', test.discount_percent,
                'Parsed:', testDiscountPercent,
                'Eligible:', cardInfo?.discountEligible);

            original += testTotal;
            totalDiscount += testDiscount;
        });

        const final = original - totalDiscount;
        const avgDiscountPercent = original > 0 ? (totalDiscount / original) * 100 : 0;

        console.log('Total calculation:', { original, totalDiscount, avgDiscountPercent, final });

        return { original, discountPercent: avgDiscountPercent, discount: totalDiscount, final };
    };

    const handleCreateBill = async () => {
        if (!cardInfo || selectedTests.length === 0) return;

        const testNames = selectedTests.map(t =>
            t.quantity > 1 ? `${t.name} (x${t.quantity})` : t.name
        ).join(', ');

        setLoading(true);
        try {
            const { original, discountPercent, discount, final } = calculateTotals();
            const response = await transactionsAPI.create({
                serial_number: cardInfo.card.serial_number,
                test_name: testNames,
                original_amount: original,
                discount_percentage: discountPercent,
                discount_amount: discount,
                final_amount: final
            });
            setTransaction(response.data.transaction);
            toast.success('Bill created successfully!');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to create bill');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleNewBill = () => {
        setTransaction(null);
        setCardInfo(null);
        setSelectedTests([]);
        setSerial('');
    };

    const totals = calculateTotals();

    // Receipt view
    if (transaction) {
        return (
            <div className="animate-fadeIn">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }} className="no-print">
                    <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Bill Created Successfully!</h1>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button className="btn btn-primary" onClick={handlePrint}>
                            <Printer size={18} />
                            Print Receipt
                        </button>
                        <button className="btn btn-outline" onClick={handleNewBill}>
                            New Bill
                        </button>
                    </div>
                </div>

                <div className="card" style={{ maxWidth: '210mm', margin: '0 auto' }}>
                    <div ref={receiptRef}>
                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                            <h2 style={{ fontSize: '24px', fontWeight: 700 }}>{user?.lab?.name}</h2>
                            <p style={{ fontSize: '14px', color: '#6b7280' }}>Digital Health Card Partner</p>
                            <div style={{ borderTop: '2px dashed #e5e7eb', margin: '16px 0' }}></div>
                            <p style={{ fontSize: '16px', fontFamily: 'monospace' }}>Receipt: <strong>{transaction.receipt_number}</strong></p>
                            <p style={{ fontSize: '12px', color: '#6b7280' }}>{new Date().toLocaleString()}</p>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <p style={{ fontSize: '12px', color: '#6b7280' }}>Patient</p>
                            <p style={{ fontWeight: 600, fontSize: '16px' }}>{cardInfo?.user.name}</p>
                            <p style={{ fontSize: '14px', color: '#6b7280', fontFamily: 'monospace' }}>{cardInfo?.card.serial_number}</p>
                        </div>

                        <div style={{ borderTop: '1px solid #e5e7eb', margin: '16px 0' }}></div>

                        <div style={{ marginBottom: '16px' }}>
                            {selectedTests.map((test, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span>{test.name} {test.quantity > 1 && `(x${test.quantity})`}</span>
                                    <span>Rs. {(Number(test.price) * test.quantity).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>

                        <div style={{ borderTop: '1px dashed #e5e7eb', margin: '12px 0' }}></div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span>Subtotal</span>
                            <span>Rs. {Number(transaction.original_amount).toLocaleString()}</span>
                        </div>
                        {Number(transaction.discount_amount) > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#16a34a' }}>
                                <span>Discount ({transaction.discount_percentage}%)</span>
                                <span>- Rs. {Number(transaction.discount_amount).toLocaleString()}</span>
                            </div>
                        )}

                        <div style={{ borderTop: '2px solid #0a0a0a', margin: '16px 0' }}></div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '24px', fontWeight: 700 }}>
                            <span>Total</span>
                            <span>Rs. {Number(transaction.final_amount).toLocaleString()}</span>
                        </div>

                        <div style={{ borderTop: '1px dashed #e5e7eb', margin: '24px 0' }}></div>
                        <p style={{ textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>Thank you for choosing us!</p>
                    </div>
                </div>

                <style jsx global>{`
                    @media print {
                        .no-print { display: none !important; }
                        @page { size: A4; margin: 20mm; }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="animate-fadeIn">
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Create Bill</h1>
                <p style={{ color: '#6b7280', marginTop: '4px' }}>Select multiple tests and create a discounted bill</p>
            </div>

            {/* Step 1: Verify Card */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Step 1: Verify Health Card</h3>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <input
                        type="text"
                        value={serial}
                        onChange={(e) => setSerial(e.target.value.toUpperCase())}
                        placeholder="Enter serial number"
                        className="form-input"
                        style={{ flex: 1 }}
                    />
                    <button className="btn btn-primary" onClick={verifyCard} disabled={loading}>
                        <Search size={18} />
                        Verify
                    </button>
                </div>

                {cardInfo && (
                    <div style={{ marginTop: '16px', padding: '16px', backgroundColor: cardInfo.discountEligible ? '#dcfce7' : '#fef3c7', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {cardInfo.discountEligible ? <CheckCircle size={24} color="#16a34a" /> : <AlertCircle size={24} color="#d97706" />}
                            <div>
                                <p style={{ fontWeight: 600 }}>{cardInfo.user.name}</p>
                                <p style={{ fontSize: '13px', color: '#6b7280' }}>
                                    {cardInfo.discountEligible ? 'Eligible for test discounts' : 'Card not eligible for discount'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Step 2: Select Tests */}
            {cardInfo && (
                <>
                    <div className="card" style={{ marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Step 2: Select Tests</h3>
                        <select
                            className="form-select"
                            onChange={(e) => {
                                const test = tests.find(t => t.id === e.target.value);
                                if (test) {
                                    addTest(test);
                                    e.target.value = '';
                                }
                            }}
                        >
                            <option value="">+ Add a test...</option>
                            {tests.map(test => (
                                <option key={test.id} value={test.id}>
                                    {test.name} - Rs. {Number(test.price).toLocaleString()}
                                    {(test.discount_percent || 0) > 0 && ` (${test.discount_percent}% off)`}
                                </option>
                            ))}
                        </select>

                        {selectedTests.length > 0 && (
                            <div style={{ marginTop: '20px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {selectedTests.map(test => (
                                        <div key={test.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                                            <div style={{ flex: 1 }}>
                                                <p style={{ fontWeight: 500 }}>{test.name}</p>
                                                <p style={{ fontSize: '13px', color: '#6b7280' }}>
                                                    Rs. {Number(test.price).toLocaleString()} each
                                                    {(test.discount_percent || 0) > 0 && (
                                                        <span style={{ color: '#16a34a', marginLeft: '8px' }}>
                                                            • {test.discount_percent}% discount
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                            <input
                                                type="number"
                                                min="1"
                                                value={test.quantity}
                                                onChange={(e) => updateQuantity(test.id, parseInt(e.target.value))}
                                                style={{ width: '70px', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db', textAlign: 'center' }}
                                            />
                                            <button
                                                onClick={() => removeTest(test.id)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Summary */}
                    {selectedTests.length > 0 && (
                        <div className="card" style={{ marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Bill Summary</h3>
                            <div style={{ padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span>Subtotal</span>
                                    <span>Rs. {totals.original.toLocaleString()}</span>
                                </div>
                                {totals.discountPercent > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#16a34a' }}>
                                        <span>Discount ({totals.discountPercent}%)</span>
                                        <span>- Rs. {totals.discount.toLocaleString()}</span>
                                    </div>
                                )}
                                <div style={{ borderTop: '2px solid #0a0a0a', marginTop: '12px', paddingTop: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '20px' }}>
                                        <span>Total</span>
                                        <span>Rs. {totals.final.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                className="btn btn-success btn-lg"
                                onClick={handleCreateBill}
                                disabled={loading}
                                style={{ width: '100%', marginTop: '16px' }}
                            >
                                <Receipt size={20} />
                                {loading ? 'Creating Bill...' : 'Create Bill & Generate Receipt'}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
