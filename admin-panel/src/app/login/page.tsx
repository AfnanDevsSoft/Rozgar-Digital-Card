'use client';

/**
 * Login Page
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import { setUser } from '@/store/slices/authSlice';
import { authAPI } from '@/lib/api';
import { Eye, EyeOff, LogIn } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const dispatch = useDispatch();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            toast.error('Please enter email and password');
            return;
        }

        setIsLoading(true);

        try {
            const response = await authAPI.login({ email, password });
            const { token, user } = response.data;

            // Save token
            Cookies.set('admin_token', token, { expires: 1 }); // 1 day

            // Update Redux state
            dispatch(setUser(user));

            toast.success(`Welcome back, ${user.name}!`);
            router.push('/dashboard');
        } catch (error: any) {
            const message = error.response?.data?.error || 'Login failed';
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#0a0a0a',
                padding: '20px',
            }}
        >
            <div
                style={{
                    width: '100%',
                    maxWidth: '420px',
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    padding: '40px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                }}
            >
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div
                        style={{
                            width: '64px',
                            height: '64px',
                            margin: '0 auto 16px',
                            backgroundColor: '#0a0a0a',
                            borderRadius: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '32px',
                        }}
                    >
                        🏥
                    </div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0a0a0a' }}>
                        Admin Portal
                    </h1>
                    <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
                        Digital Health Card System
                    </p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '20px' }}>
                        <label
                            style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: 500,
                                color: '#0a0a0a',
                                marginBottom: '8px',
                            }}
                        >
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@system.com"
                            style={{
                                width: '100%',
                                padding: '14px',
                                fontSize: '14px',
                                border: '2px solid #e5e7eb',
                                borderRadius: '10px',
                                outline: 'none',
                                transition: 'border-color 0.2s',
                            }}
                            onFocus={(e) => (e.target.style.borderColor = '#0a0a0a')}
                            onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
                        />
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label
                            style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: 500,
                                color: '#0a0a0a',
                                marginBottom: '8px',
                            }}
                        >
                            Password
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    paddingRight: '48px',
                                    fontSize: '14px',
                                    border: '2px solid #e5e7eb',
                                    borderRadius: '10px',
                                    outline: 'none',
                                    transition: 'border-color 0.2s',
                                }}
                                onFocus={(e) => (e.target.style.borderColor = '#0a0a0a')}
                                onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '14px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#6b7280',
                                }}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            width: '100%',
                            padding: '14px',
                            fontSize: '16px',
                            fontWeight: 600,
                            backgroundColor: '#0a0a0a',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '10px',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            opacity: isLoading ? 0.7 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            transition: 'opacity 0.2s',
                        }}
                    >
                        {isLoading ? (
                            <>
                                <span
                                    style={{
                                        width: '20px',
                                        height: '20px',
                                        border: '2px solid #ffffff40',
                                        borderTopColor: '#ffffff',
                                        borderRadius: '50%',
                                        animation: 'spin 1s linear infinite',
                                    }}
                                />
                                Signing in...
                            </>
                        ) : (
                            <>
                                <LogIn size={20} />
                                Sign In
                            </>
                        )}
                    </button>
                </form>
            </div>

            <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}
