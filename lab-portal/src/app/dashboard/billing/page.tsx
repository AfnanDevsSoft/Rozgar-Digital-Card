'use client';

import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'next/navigation';
import { RootState } from '@/store/store';
import { setCurrentPage } from '@/store/slices/uiSlice';
import { cardsAPI, transactionsAPI, testsAPI, Test } from '@/lib/api';
import toast from 'react-hot-toast';
import { Search, Receipt, Printer, CheckCircle, AlertCircle } from 'lucide-react';

interface CardInfo {
    card: { serial_number: string; status: string; expiry_date: string };
    user: { name: string; email: string; phone: string };
    discountEligible: boolean;
}

interface Transaction {
    receipt_number: string;
    test_name: string;
    original_amount: number;
    discount_percentage: number;
    discount_amount: number;
    final_amount: number;
    created_at: string;
}

export default function BillingPage() {
    const dispatch = useDispatch();
    const searchParams = useSearchParams();
    const user = useSelector((state: RootState) => state.auth.user);
    const receiptRef = useRef<HTMLDivElement>(null);

    const [serial, setSerial] = useState(searchParams.get('serial') || '');
    const [cardInfo, setCardInfo] = useState<CardInfo | null>(null);
    const [tests, setTests] = useState<Test[]>([]);
    const [selectedTest, setSelectedTest] = useState<Test | null>(null);
    const [loading, setLoading] = useState(false);
    const [discountPreview, setDiscountPreview] = useState<any>(null);
    const [transaction, setTransaction] = useState<Transaction | null>(null);

    useEffect(() => {
        dispatch(setCurrentPage('Billing'));
        if (user?.lab_id) fetchTests();
        if (searchParams.get('serial')) verifyCard();
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

    const handleTestSelect = async (test: Test) => {
        setSelectedTest(test);
        if (cardInfo?.discountEligible) {
            try {
                const res = await transactionsAPI.calculate(Number(test.price));
                setDiscountPreview(res.data);
            } catch (error) {
                console.error('Failed to calculate discount:', error);
            }
        } else {
            setDiscountPreview(null);
        }
    };

    const handleCreateBill = async () => {
        if (!cardInfo || !selectedTest) return;
        setLoading(true);
        try {
            const response = await transactionsAPI.create({
                serial_number: cardInfo.card.serial_number,
                test_name: selectedTest.name,
                original_amount: Number(selectedTest.price),
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
        const printContent = receiptRef.current;
        if (!printContent) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${transaction?.receipt_number}</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 20px; max-width: 400px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 20px; }
            .divider { border-top: 1px dashed #000; margin: 12px 0; }
            .row { display: flex; justify-content: space-between; margin: 8px 0; }
            .total { font-weight: bold; font-size: 18px; }
            .center { text-align: center; }
          </style>
        </head>
        <body>${printContent.innerHTML}</body>
      </html>
    `);
        printWindow.document.close();
        printWindow.print();
    };

    const handleNewBill = () => {
        setTransaction(null);
        setCardInfo(null);
        setSelectedTest(null);
        setSerial('');
        setDiscountPreview(null);
    };

    // Show receipt if transaction complete
    if (transaction) {
        return (
            <div className="animate-fadeIn">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
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

                {/* Printable Receipt */}
                <div className="card" style={{ maxWidth: '450px', margin: '0 auto' }}>
                    <div ref={receiptRef}>
                        <div className="header" style={{ textAlign: 'center', marginBottom: '20px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: 700 }}>{user?.lab?.name}</h2>
                            <p style={{ fontSize: '12px', color: '#6b7280' }}>Digital Health Card Partner</p>
                            <div style={{ borderTop: '2px dashed #e5e7eb', margin: '16px 0' }}></div>
                            <p style={{ fontSize: '14px', fontFamily: 'monospace' }}>Receipt: <strong>{transaction.receipt_number}</strong></p>
                            <p style={{ fontSize: '12px', color: '#6b7280' }}>{new Date(transaction.created_at).toLocaleString()}</p>
                        </div>

                        <div style={{ borderTop: '1px dashed #e5e7eb', margin: '16px 0' }}></div>

                        <div style={{ marginBottom: '16px' }}>
                            <p style={{ fontSize: '12px', color: '#6b7280' }}>Patient</p>
                            <p style={{ fontWeight: 500 }}>{cardInfo?.user.name}</p>
                            <p style={{ fontSize: '12px', color: '#6b7280', fontFamily: 'monospace' }}>{cardInfo?.card.serial_number}</p>
                        </div>

                        <div style={{ borderTop: '1px dashed #e5e7eb', margin: '16px 0' }}></div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span>Test: {transaction.test_name}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span>Original Amount</span>
                            <span>Rs. {Number(transaction.original_amount).toLocaleString()}</span>
                        </div>
                        {Number(transaction.discount_amount) > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#16a34a' }}>
                                <span>Discount ({transaction.discount_percentage}%)</span>
                                <span>- Rs. {Number(transaction.discount_amount).toLocaleString()}</span>
                            </div>
                        )}

                        <div style={{ borderTop: '2px solid #0a0a0a', margin: '16px 0' }}></div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 700 }}>
                            <span>Total</span>
                            <span>Rs. {Number(transaction.final_amount).toLocaleString()}</span>
                        </div>

                        <div style={{ borderTop: '1px dashed #e5e7eb', margin: '20px 0' }}></div>
                        <p style={{ textAlign: 'center', fontSize: '12px', color: '#6b7280' }}>Thank you for choosing us!</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fadeIn">
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Create Bill</h1>
                <p style={{ color: '#6b7280', marginTop: '4px' }}>Verify card and select test to create a discounted bill</p>
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
                                    {cardInfo.discountEligible ? `Eligible for ${user?.lab?.discount_rate}% discount` : 'Card not eligible for discount'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Step 2: Select Test */}
            {cardInfo && (
                <div className="card" style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Step 2: Select Test</h3>
                    <select
                        className="form-select"
                        value={selectedTest?.id || ''}
                        onChange={(e) => {
                            const test = tests.find(t => t.id === e.target.value);
                            if (test) handleTestSelect(test);
                        }}
                    >
                        <option value="">Select a test...</option>
                        {tests.map(test => (
                            <option key={test.id} value={test.id}>
                                {test.name} - Rs. {Number(test.price).toLocaleString()}
                            </option>
                        ))}
                    </select>

                    {selectedTest && (
                        <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span>Original Price</span>
                                <span>Rs. {Number(selectedTest.price).toLocaleString()}</span>
                            </div>
                            {discountPreview && (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#16a34a' }}>
                                        <span>Discount ({discountPreview.discount_percentage}%)</span>
                                        <span>- Rs. {Number(discountPreview.discount_amount).toLocaleString()}</span>
                                    </div>
                                    <div style={{ borderTop: '2px solid #0a0a0a', marginTop: '12px', paddingTop: '12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '18px' }}>
                                            <span>Final Amount</span>
                                            <span>Rs. {Number(discountPreview.final_amount).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Create Bill Button */}
            {cardInfo && selectedTest && (
                <button className="btn btn-success btn-lg" onClick={handleCreateBill} disabled={loading} style={{ width: '100%' }}>
                    <Receipt size={20} />
                    {loading ? 'Creating Bill...' : 'Create Bill & Generate Receipt'}
                </button>
            )}
        </div>
    );
}
