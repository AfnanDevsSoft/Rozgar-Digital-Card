'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import { setUser } from '@/store/slices/authSlice';
import { authAPI } from '@/lib/api';
import { Eye, EyeOff, LogIn, CreditCard } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const dispatch = useDispatch();
    const [serial, setSerial] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!serial || !password) {
            toast.error('Please enter serial number and password');
            return;
        }

        setIsLoading(true);
        try {
            const response = await authAPI.login(serial.toUpperCase(), password);
            const { token, user } = response.data;
            Cookies.set('user_token', token, { expires: 1 });
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            dispatch(setUser(user));
            toast.success(`Welcome, ${user.name}!`);

            // Check if password change is required
            if (user.must_change_password) {
                router.push('/change-password');
            } else {
                router.push('/dashboard');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0a0a', padding: '20px' }}>
            <div style={{ width: '100%', maxWidth: '420px', backgroundColor: '#ffffff', borderRadius: '16px', padding: '40px' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{ width: '64px', height: '64px', margin: '0 auto 16px', backgroundColor: '#2563eb', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CreditCard size={32} color="#fff" />
                    </div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700 }}>My Health Card</h1>
                    <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>Access your reports and transaction history</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>Card Serial Number</label>
                        <input
                            type="text"
                            value={serial}
                            onChange={(e) => setSerial(e.target.value.toUpperCase())}
                            placeholder="DCD251234567"
                            style={{ width: '100%', padding: '14px', fontSize: '16px', fontFamily: 'monospace', border: '2px solid #e5e7eb', borderRadius: '10px', outline: 'none', textAlign: 'center', letterSpacing: '2px' }}
                        />
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                style={{ width: '100%', padding: '14px', paddingRight: '48px', fontSize: '14px', border: '2px solid #e5e7eb', borderRadius: '10px', outline: 'none' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
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
                            backgroundColor: '#2563eb',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '10px',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            opacity: isLoading ? 0.7 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                        }}
                    >
                        <LogIn size={20} />
                        {isLoading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div style={{ marginTop: '24px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '8px', textAlign: 'center' }}>
                    <p style={{ fontSize: '12px', color: '#6b7280' }}>
                        Your login credentials were sent to you via email when your card was issued.
                    </p>
                </div>
            </div>
        </div>
    );
}
