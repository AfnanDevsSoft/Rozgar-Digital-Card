'use client';

/**
 * Enhanced User Form Component
 * Includes all 18+ new fields, file uploads, and conditional logic
 */

import { useState, useEffect } from 'react';
import { X, Upload, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';

interface EnhancedUserFormProps {
    onClose: () => void;
    onSuccess: () => void;
    user?: any; // Optional user data for edit mode
}

interface FormData {
    // Basic Info
    name: string;
    father_name: string;
    email: string;

    // Contact Info
    phone: string;
    alternative_number: string;

    // Identity
    cnic: string;
    dob: string;
    gender: string;
    blood_group: string;

    // Address
    address: string;
    town: string;
    town_code: string;  // Town code for card serial number

    // Eligibility & Disability
    eligibility_type: string;
    disability_type: string;
    disability_other_comment: string;
    has_disability_certificate: boolean;

    // Financial & Family
    monthly_income: string;
    family_members_count: string;
    current_health_condition: string;

    // Card Info
    expiry_date: string;
}

export default function EnhancedUserForm({ onClose, onSuccess, user }: EnhancedUserFormProps) {
    const isEditMode = !!user;
    const [loading, setLoading] = useState(false);
    const [towns, setTowns] = useState<Array<{ id: string, name: string, code: string }>>([]);
    const [formData, setFormData] = useState<FormData>({
        name: user?.name || '',
        father_name: user?.father_name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        alternative_number: user?.alternative_number || '',
        cnic: user?.cnic || '',
        dob: user?.dob ? user.dob.split('T')[0] : '',
        gender: user?.gender || '',
        blood_group: user?.blood_group || '',
        address: user?.address || '',
        town: user?.town || '',
        town_code: user?.town_code || '1',
        eligibility_type: user?.eligibility_type || '',
        disability_type: user?.disability_type || '',
        disability_other_comment: user?.disability_other_comment || '',
        has_disability_certificate: user?.has_disability_certificate || false,
        monthly_income: user?.monthly_income?.toString() || '',
        family_members_count: user?.family_members_count?.toString() || '',
        current_health_condition: user?.current_health_condition || '',
        expiry_date: user?.health_card?.expiry_date
            ? user.health_card.expiry_date.split('T')[0]
            : (() => {
                const date = new Date();
                date.setFullYear(date.getFullYear() + 1);
                return date.toISOString().split('T')[0];
            })(),
    });

    // Load towns on mount
    useEffect(() => {
        loadTowns();
    }, []);

    const loadTowns = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/towns?active=true`, {
                headers: {
                    'Authorization': `Bearer ${Cookies.get('admin_token')}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setTowns(data);
            }
        } catch (error) {
            console.error('Failed to load towns:', error);
        }
    };

    // File uploads
    const [files, setFiles] = useState({
        cnic_front: null as File | null,
        cnic_back: null as File | null,
        disability_certificate: null as File | null,
        passport_photo: null as File | null,
    });

    const [uploadedPaths, setUploadedPaths] = useState({
        cnic_front_photo: '',
        cnic_back_photo: '',
        disability_certificate_photo: '',
        passport_photo: '',
    });

    const handleFileChange = (field: keyof typeof files, file: File | null) => {
        setFiles({ ...files, [field]: file });
    };

    const uploadFiles = async () => {
        const formDataUpload = new FormData();
        let hasFiles = false;

        if (files.cnic_front) {
            formDataUpload.append('cnic_front', files.cnic_front);
            hasFiles = true;
        }
        if (files.cnic_back) {
            formDataUpload.append('cnic_back', files.cnic_back);
            hasFiles = true;
        }
        if (files.disability_certificate) {
            formDataUpload.append('disability_certificate', files.disability_certificate);
            hasFiles = true;
        }
        if (files.passport_photo) {
            formDataUpload.append('passport_photo', files.passport_photo);
            hasFiles = true;
        }

        if (!hasFiles) return {};

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload/user-documents`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${Cookies.get('admin_token')}`,
                },
                body: formDataUpload,
            });

            if (!response.ok) throw new Error('File upload failed');

            const data = await response.json();
            return data.files || {};
        } catch (error) {
            console.error('Upload error:', error);
            throw error;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate Gmail email
        const gmailPattern = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
        if (!gmailPattern.test(formData.email)) {
            toast.error('Only Gmail addresses (@gmail.com) are accepted');
            return;
        }

        // Validate CNIC format
        const cnicPattern = /^\d{5}-\d{7}-\d{1}$/;
        if (!cnicPattern.test(formData.cnic)) {
            toast.error('CNIC must be in format: XXXXX-XXXXXXX-X (e.g., 42101-3003303-2)');
            return;
        }

        setLoading(true);

        try {
            // Upload files first
            const uploadedFiles = await uploadFiles();

            // Prepare user data
            const userData = {
                ...formData,
                monthly_income: formData.monthly_income ? parseFloat(formData.monthly_income) : undefined,
                family_members_count: formData.family_members_count ? parseInt(formData.family_members_count) : undefined,
                cnic_front_photo: uploadedFiles.cnic_front || undefined,
                cnic_back_photo: uploadedFiles.cnic_back || undefined,
                disability_certificate_photo: uploadedFiles.disability_certificate || undefined,
                passport_photo: uploadedFiles.passport_photo || undefined,
            };

            // Remove empty optional fields
            Object.keys(userData).forEach(key => {
                if (userData[key as keyof typeof userData] === '' || userData[key as keyof typeof userData] === undefined) {
                    delete userData[key as keyof typeof userData];
                }
            });

            const response = await fetch(
                isEditMode
                    ? `${process.env.NEXT_PUBLIC_API_URL}/users/${user.id}`
                    : `${process.env.NEXT_PUBLIC_API_URL}/users`,
                {
                    method: isEditMode ? 'PUT' : 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${Cookies.get('admin_token')}`,
                    },
                    body: JSON.stringify(userData),
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || (isEditMode ? 'Failed to update user' : 'Failed to create user'));
            }

            const result = await response.json();

            toast.success(isEditMode ? 'User updated successfully!' : 'User created successfully!');

            // Show credentials
            if (result.credentials) {
                toast((t) => (
                    <div>
                        <p><strong>Serial Number:</strong> {result.credentials.serial_number}</p>
                        <p><strong>Password:</strong> {result.credentials.password}</p>
                        <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                            User must change password on first login
                        </p>
                    </div>
                ), { duration: 15000 });
            }

            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.message || 'Failed to create user');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            padding: '20px',
        }}>
            <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '900px',
                maxHeight: '90vh',
                overflow: 'auto',
            }}>
                {/* Header */}
                <div style={{
                    padding: '24px',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    position: 'sticky',
                    top: 0,
                    backgroundColor: '#ffffff',
                    zIndex: 10,
                }}>
                    <div>
                        <h2 style={{ fontSize: '20px', fontWeight: 600 }}>
                            {isEditMode ? 'Edit User' : 'Create New User & Health Card'}
                        </h2>
                        <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                            {isEditMode ? 'Update user details' : 'Fill in user details. Default password: '}<code>{isEditMode ? '' : 'user123'}</code>
                        </p>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <X size={24} color="#6b7280" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
                    {/* Personal Information */}
                    <div style={{ marginBottom: '32px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: '#1f2937' }}>
                            Personal Information
                        </h3>
                        <div className="grid grid-cols-2">
                            <div className="form-group">
                                <label className="form-label">Full Name *</label>
                                <input
                                    type="text"
                                    required
                                    className="form-input"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Father's Name/Guardian Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.father_name}
                                    onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">CNIC *</label>
                                <input
                                    type="text"
                                    required
                                    className="form-input"
                                    placeholder="42101-3003303-2"
                                    pattern="^\d{5}-\d{7}-\d{1}$"
                                    title="CNIC must be in format: XXXXX-XXXXXXX-X (e.g., 42101-3003303-2)"
                                    value={formData.cnic}
                                    onChange={(e) => {
                                        // Auto-format CNIC with dashes
                                        let value = e.target.value.replace(/[^0-9]/g, '');
                                        if (value.length > 5) {
                                            value = value.slice(0, 5) + '-' + value.slice(5);
                                        }
                                        if (value.length > 13) {
                                            value = value.slice(0, 13) + '-' + value.slice(13);
                                        }
                                        if (value.length > 15) {
                                            value = value.slice(0, 15);
                                        }
                                        setFormData({ ...formData, cnic: value });
                                    }}
                                    maxLength={15}
                                />
                                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                                    Format: XXXXX-XXXXXXX-X (e.g., 42101-3003303-2)
                                </p>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Date of Birth</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={formData.dob}
                                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Gender</label>
                                <select
                                    className="form-select"
                                    value={formData.gender}
                                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                >
                                    <option value="">Select</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Blood Group</label>
                                <select
                                    className="form-select"
                                    value={formData.blood_group}
                                    onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                                >
                                    <option value="">Select</option>
                                    <option value="A+">A+</option>
                                    <option value="A-">A-</option>
                                    <option value="B+">B+</option>
                                    <option value="B-">B-</option>
                                    <option value="AB+">AB+</option>
                                    <option value="AB-">AB-</option>
                                    <option value="O+">O+</option>
                                    <option value="O-">O-</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div style={{ marginBottom: '32px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: '#1f2937' }}>
                            Contact Information
                        </h3>
                        <div className="grid grid-cols-2">
                            <div className="form-group">
                                <label className="form-label">Email * (Gmail only)</label>
                                <input
                                    type="email"
                                    required
                                    className="form-input"
                                    placeholder="example@gmail.com"
                                    pattern="^[a-zA-Z0-9._%+-]+@gmail\.com$"
                                    title="Only Gmail addresses are accepted (e.g., example@gmail.com)"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                                    Only @gmail.com addresses are accepted
                                </p>
                            </div>
                            <div className="form-group">
                                <label className="form-label">WhatsApp Number/Phone Number *</label>
                                <input
                                    type="tel"
                                    required
                                    className="form-input"
                                    placeholder="03XX-XXXXXXX"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Alternative Number</label>
                                <input
                                    type="tel"
                                    className="form-input"
                                    placeholder="03XX-XXXXXXX"
                                    value={formData.alternative_number}
                                    onChange={(e) => setFormData({ ...formData, alternative_number: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Address</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Town *</label>
                            <select
                                className="form-select"
                                value={formData.town_code}
                                onChange={(e) => {
                                    const selectedTown = towns.find(t => t.code === e.target.value);
                                    setFormData({
                                        ...formData,
                                        town_code: e.target.value,
                                        town: selectedTown?.name || ''
                                    });
                                }}
                                required
                            >
                                <option value="">Select Town</option>
                                {towns.map(town => (
                                    <option key={town.id} value={town.code}>
                                        {town.name} ({town.code})
                                    </option>
                                ))}
                            </select>
                            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                                This will be used for card serial number generation
                            </p>
                        </div>
                    </div>

                    {/* Eligibility & Disability */}
                    <div style={{ marginBottom: '32px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: '#1f2937' }}>
                            Eligibility & Disability Information
                        </h3>
                        <div className="grid grid-cols-2">
                            <div className="form-group">
                                <label className="form-label">Eligibility Type</label>
                                <select
                                    className="form-select"
                                    value={formData.eligibility_type}
                                    onChange={(e) => setFormData({ ...formData, eligibility_type: e.target.value })}
                                >
                                    <option value="">Select</option>
                                    <option value="DIFFERENTIABLE_PERSON">Differentiable Person</option>
                                    <option value="LOW_INCOME_FAMILY">Low Income Family</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Disability Type</label>
                                <select
                                    className="form-select"
                                    value={formData.disability_type}
                                    onChange={(e) => setFormData({ ...formData, disability_type: e.target.value })}
                                >
                                    <option value="">Select</option>
                                    <option value="PHYSICAL">Physical</option>
                                    <option value="VISUAL">Visual</option>
                                    <option value="HEARING">Hearing</option>
                                    <option value="MENTALLY">Mentally</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>
                        </div>

                        {/* Conditional: Show comment field if "OTHER" is selected */}
                        {formData.disability_type === 'OTHER' && (
                            <div className="form-group">
                                <label className="form-label">Disability Details (Other)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Please specify the disability type"
                                    value={formData.disability_other_comment}
                                    onChange={(e) => setFormData({ ...formData, disability_other_comment: e.target.value })}
                                />
                            </div>
                        )}

                        <div className="form-group">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={formData.has_disability_certificate}
                                    onChange={(e) => setFormData({ ...formData, has_disability_certificate: e.target.checked })}
                                    style={{ width: '18px', height: '18px' }}
                                />
                                <span>Has Disability Certificate</span>
                            </label>
                        </div>
                    </div>

                    {/* Financial & Family */}
                    <div style={{ marginBottom: '32px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: '#1f2937' }}>
                            Financial & Family Information
                        </h3>
                        <div className="grid grid-cols-2">
                            <div className="form-group">
                                <label className="form-label">Monthly Income (PKR)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    placeholder="e.g., 25000"
                                    value={formData.monthly_income}
                                    onChange={(e) => setFormData({ ...formData, monthly_income: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Family Members Count</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    placeholder="e.g., 5"
                                    value={formData.family_members_count}
                                    onChange={(e) => setFormData({ ...formData, family_members_count: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Current Health Condition</label>
                            <textarea
                                className="form-input"
                                rows={3}
                                placeholder="Any chronic conditions, allergies, or ongoing treatments"
                                value={formData.current_health_condition}
                                onChange={(e) => setFormData({ ...formData, current_health_condition: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Document Uploads */}
                    <div style={{ marginBottom: '32px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: '#1f2937' }}>
                            Document Uploads
                        </h3>
                        <div className="grid grid-cols-2">
                            <FileUploadField
                                label="CNIC Front Photo"
                                file={files.cnic_front}
                                onChange={(file) => handleFileChange('cnic_front', file)}
                            />
                            <FileUploadField
                                label="CNIC Back Photo"
                                file={files.cnic_back}
                                onChange={(file) => handleFileChange('cnic_back', file)}
                            />
                            <FileUploadField
                                label="Disability Certificate"
                                file={files.disability_certificate}
                                onChange={(file) => handleFileChange('disability_certificate', file)}
                            />
                            <FileUploadField
                                label="Passport Photo"
                                file={files.passport_photo}
                                onChange={(file) => handleFileChange('passport_photo', file)}
                            />
                        </div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '8px',
                            padding: '12px',
                            backgroundColor: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            borderRadius: '8px',
                            fontSize: '13px',
                            color: '#1e40af',
                            marginTop: '12px'
                        }}>
                            <AlertCircle size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                            <p>Maximum file size: 5MB. Supported formats: JPEG, PNG, WebP, PDF</p>
                        </div>
                    </div>

                    {/* Card Information */}
                    <div style={{ marginBottom: '32px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: '#1f2937' }}>
                            Health Card Information
                        </h3>
                        <div className="form-group">
                            <label className="form-label">Card Expiry Date *</label>
                            <input
                                type="date"
                                required
                                className="form-input"
                                value={formData.expiry_date}
                                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                                min={new Date().toISOString().split('T')[0]}
                            />
                            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                                Recommended: Set to 1 year from today
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        justifyContent: 'flex-end',
                        paddingTop: '24px',
                        borderTop: '1px solid #e5e7eb',
                        position: 'sticky',
                        bottom: 0,
                        backgroundColor: '#ffffff',
                        margin: '0 -24px -24px -24px',
                        padding: '24px'
                    }}>
                        <button
                            type="button"
                            className="btn btn-outline"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-success"
                            disabled={loading}
                        >
                            {loading
                                ? (isEditMode ? 'Updating...' : 'Creating...')
                                : (isEditMode ? 'Update User' : 'Create User & Generate Card')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// File Upload Field Component
function FileUploadField({ label, file, onChange }: {
    label: string;
    file: File | null;
    onChange: (file: File | null) => void;
}) {
    return (
        <div className="form-group">
            <label className="form-label">{label}</label>
            <div style={{ position: 'relative' }}>
                <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                    onChange={(e) => onChange(e.target.files?.[0] || null)}
                    style={{ display: 'none' }}
                    id={`file-${label.replace(/\s+/g, '-').toLowerCase()}`}
                />
                <label
                    htmlFor={`file-${label.replace(/\s+/g, '-').toLowerCase()}`}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px',
                        border: '2px dashed #d1d5db',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        backgroundColor: file ? '#f0fdf4' : '#f9fafb',
                        transition: 'all 0.2s',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.borderColor = '#10b981'}
                    onMouseOut={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                >
                    <Upload size={18} color={file ? '#10b981' : '#6b7280'} />
                    <span style={{ fontSize: '14px', color: file ? '#10b981' : '#6b7280' }}>
                        {file ? file.name : 'Choose file'}
                    </span>
                </label>
                {file && (
                    <button
                        type="button"
                        onClick={() => onChange(null)}
                        style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                        }}
                    >
                        <X size={14} />
                    </button>
                )}
            </div>
        </div>
    );
}
