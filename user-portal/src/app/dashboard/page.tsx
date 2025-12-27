'use client';

/**
 * Enhanced User Profile Display
 * Shows all user information including new fields
 */

import { useEffect, useState } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Heart, Users, DollarSign, FileText, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error('Failed to fetch profile');

            const data = await response.json();
            setUser(data.user);
        } catch (error) {
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <p style={{ color: '#6b7280' }}>Loading profile...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <p style={{ color: '#ef4444' }}>Failed to load profile</p>
            </div>
        );
    }

    return (
        <div className="animate-fadeIn">
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 700 }}>My Profile</h1>
                <p style={{ color: '#6b7280', marginTop: '4px' }}>Your personal information and health card details</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                {/* Health Card Info */}
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <CreditCard size={24} color="#1a73e8" />
                        <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Health Card</h2>
                    </div>
                    <InfoRow label="Serial Number" value={user.health_card?.serial_number || 'N/A'} mono />
                    <InfoRow label="Status" value={user.health_card?.status || 'N/A'} badge={user.health_card?.status} />
                    <InfoRow label="Issue Date" value={user.health_card?.issue_date ? new Date(user.health_card.issue_date).toLocaleDateString() : 'N/A'} />
                    <InfoRow label="Expiry Date" value={user.health_card?.expiry_date ? new Date(user.health_card.expiry_date).toLocaleDateString() : 'N/A'} />
                </div>

                {/* Personal Information */}
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <User size={24} color="#1a73e8" />
                        <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Personal Information</h2>
                    </div>
                    <InfoRow label="Full Name" value={user.name} />
                    <InfoRow label="Father's Name" value={user.father_name} />
                    <InfoRow label="Guardian Name" value={user.guardian_name} />
                    <InfoRow label="CNIC" value={user.cnic} mono />
                    <InfoRow label="Date of Birth" value={user.dob ? new Date(user.dob).toLocaleDateString() : 'N/A'} />
                    <InfoRow label="Gender" value={user.gender} />
                    <InfoRow label="Blood Group" value={user.blood_group} />
                </div>

                {/* Contact Information */}
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <Phone size={24} color="#1a73e8" />
                        <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Contact Information</h2>
                    </div>
                    <InfoRow label="Email" value={user.email} icon={<Mail size={16} />} />
                    <InfoRow label="Phone" value={user.phone} icon={<Phone size={16} />} />
                    <InfoRow label="WhatsApp" value={user.whatsapp_number} />
                    <InfoRow label="Alternative" value={user.alternative_number} />
                    <InfoRow label="Address" value={user.address} icon={<MapPin size={16} />} />
                    <InfoRow label="Town/Area" value={user.town} />
                </div>

                {/* Eligibility & Disability */}
                {(user.eligibility_type || user.disability_type) && (
                    <div className="card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                            <Heart size={24} color="#1a73e8" />
                            <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Eligibility & Disability</h2>
                        </div>
                        <InfoRow label="Eligibility Type" value={user.eligibility_type?.replace('_', ' ')} />
                        <InfoRow label="Disability Type" value={user.disability_type} />
                        {user.disability_type === 'OTHER' && (
                            <InfoRow label="Details" value={user.disability_other_comment} />
                        )}
                        <InfoRow
                            label="Disability Certificate"
                            value={user.has_disability_certificate ? 'Yes' : 'No'}
                            badge={user.has_disability_certificate ? 'Yes' : 'No'}
                        />
                    </div>
                )}

                {/* Financial & Family */}
                {(user.monthly_income || user.family_members_count) && (
                    <div className="card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                            <DollarSign size={24} color="#1a73e8" />
                            <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Financial & Family</h2>
                        </div>
                        <InfoRow label="Monthly Income" value={user.monthly_income ? `Rs. ${Number(user.monthly_income).toLocaleString()}` : 'N/A'} />
                        <InfoRow label="Family Members" value={user.family_members_count} icon={<Users size={16} />} />
                    </div>
                )}

                {/* Health Condition */}
                {user.current_health_condition && (
                    <div className="card" style={{ gridColumn: '1 / -1' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <FileText size={24} color="#1a73e8" />
                            <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Current Health Condition</h2>
                        </div>
                        <p style={{ color: '#374151', lineHeight: '1.6' }}>{user.current_health_condition}</p>
                    </div>
                )}

                {/* Documents */}
                {(user.cnic_front_photo || user.cnic_back_photo || user.disability_certificate_photo || user.passport_photo) && (
                    <div className="card" style={{ gridColumn: '1 / -1' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Uploaded Documents</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
                            {user.cnic_front_photo && <DocumentCard label="CNIC Front" url={user.cnic_front_photo} />}
                            {user.cnic_back_photo && <DocumentCard label="CNIC Back" url={user.cnic_back_photo} />}
                            {user.disability_certificate_photo && <DocumentCard label="Disability Cert" url={user.disability_certificate_photo} />}
                            {user.passport_photo && <DocumentCard label="Passport Photo" url={user.passport_photo} />}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Info Row Component
function InfoRow({ label, value, mono, badge, icon }: {
    label: string;
    value?: string | number | null;
    mono?: boolean;
    badge?: string;
    icon?: React.ReactNode;
}) {
    if (!value && value !== 0) return null;

    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
            <span style={{ fontSize: '14px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {icon}
                {label}
            </span>
            {badge ? (
                <span className={`badge ${badge === 'ACTIVE' || badge === 'Yes' ? 'badge-success' : 'badge-neutral'}`}>
                    {value}
                </span>
            ) : (
                <span style={{ fontSize: '14px', fontWeight: 500, fontFamily: mono ? 'monospace' : 'inherit', color: '#1f2937' }}>
                    {value}
                </span>
            )}
        </div>
    );
}

// Document Card Component
function DocumentCard({ label, url }: { label: string; url: string }) {
    const isImage = url.match(/\.(jpg|jpeg|png|webp)$/i);

    return (
        <a
            href={`${process.env.NEXT_PUBLIC_API_URL}${url}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
                display: 'block',
                padding: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                textAlign: 'center',
                textDecoration: 'none',
                transition: 'all 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = '#1a73e8'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
        >
            {isImage ? (
                <img
                    src={`${process.env.NEXT_PUBLIC_API_URL}${url}`}
                    alt={label}
                    style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '4px', marginBottom: '8px' }}
                />
            ) : (
                <FileText size={40} color="#6b7280" style={{ margin: '0 auto 8px' }} />
            )}
            <p style={{ fontSize: '12px', color: '#6b7280', fontWeight: 500 }}>{label}</p>
        </a>
    );
}
