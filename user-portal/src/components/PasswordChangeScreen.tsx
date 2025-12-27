'use client';

/**
 * Password Change Screen
 * For first-time login password enforcement
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface PasswordChangeScreenProps {
    userType: 'user' | 'staff';
    apiUrl: string;
    redirectPath: string;
}

export default function PasswordChangeScreen({ userType, apiUrl, redirectPath }: PasswordChangeScreenProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [formData, setFormData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: '',
    });

    const [passwordStrength, setPasswordStrength] = useState({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
    });

    const handlePasswordChange = (password: string) => {
        setFormData({ ...formData, new_password: password });

        setPasswordStrength({
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.new_password !== formData.confirm_password) {
            toast.error('Passwords do not match');
            return;
        }

        if (!Object.values(passwordStrength).every(v => v)) {
            toast.error('Please meet all password requirements');
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${apiUrl}/auth/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    current_password: formData.current_password,
                    new_password: formData.new_password,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to change password');
            }

            toast.success('Password changed successfully!');

            // Small delay for user to see success message
            setTimeout(() => {
                router.push(redirectPath);
                router.refresh();
            }, 1000);
        } catch (error: any) {
            toast.error(error.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '20px',
        }}>
            <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                width: '100%',
                maxWidth: '480px',
                padding: '40px',
            }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        backgroundColor: '#ef4444',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                    }}>
                        <Lock size={32} color="#ffffff" />
                    </div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1f2937', marginBottom: '8px' }}>
                        Change Your Password
                    </h1>
                    <p style={{ color: '#6b7280', fontSize: '14px' }}>
                        You must change your temporary password before continuing
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    {/* Current Password */}
                    <div className="form-group">
                        <label className="form-label">Current Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showCurrentPassword ? 'text' : 'password'}
                                required
                                className="form-input"
                                placeholder="Enter user123"
                                value={formData.current_password}
                                onChange={(e) => setFormData({ ...formData, current_password: e.target.value })}
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#6b7280',
                                }}
                            >
                                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* New Password */}
                    <div className="form-group">
                        <label className="form-label">New Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showNewPassword ? 'text' : 'password'}
                                required
                                className="form-input"
                                placeholder="Enter new secure password"
                                value={formData.new_password}
                                onChange={(e) => handlePasswordChange(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#6b7280',
                                }}
                            >
                                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Password Requirements */}
                    <div style={{
                        backgroundColor: '#f9fafb',
                        borderRadius: '8px',
                        padding: '12px',
                        marginBottom: '16px',
                    }}>
                        <p style={{ fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                            Password must contain:
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <PasswordRequirement met={passwordStrength.length} text="At least 8 characters" />
                            <PasswordRequirement met={passwordStrength.uppercase} text="One uppercase letter (A-Z)" />
                            <PasswordRequirement met={passwordStrength.lowercase} text="One lowercase letter (a-z)" />
                            <PasswordRequirement met={passwordStrength.number} text="One number (0-9)" />
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="form-group">
                        <label className="form-label">Confirm New Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                required
                                className="form-input"
                                placeholder="Re-enter new password"
                                value={formData.confirm_password}
                                onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#6b7280',
                                }}
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                        style={{ width: '100%', marginTop: '8px' }}
                    >
                        {loading ? 'Changing Password...' : 'Change Password & Continue'}
                    </button>
                </form>

                {/* Help Text */}
                <p style={{
                    textAlign: 'center',
                    fontSize: '12px',
                    color: '#6b7280',
                    marginTop: '24px',
                }}>
                    Your new password will be used for all future logins
                </p>
            </div>
        </div>
    );
}

// Password Requirement Component
function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2
                size={14}
                color={met ? '#10b981' : '#d1d5db'}
                fill={met ? '#10b981' : 'transparent'}
            />
            <span style={{
                fontSize: '12px',
                color: met ? '#10b981' : '#6b7280',
                fontWeight: met ? 500 : 400,
            }}>
                {text}
            </span>
        </div>
    );
}
