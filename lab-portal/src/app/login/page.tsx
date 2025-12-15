'use client';

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
    const [loginType, setLoginType] = useState<'admin' | 'staff'>('staff');
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
            const response = loginType === 'admin'
                ? await authAPI.loginBranchAdmin(email, password)
                : await authAPI.loginStaff(email, password);

            const { token, user, staff } = response.data;
            Cookies.set('lab_token', token, { expires: 1 });
            dispatch(setUser(user || staff));
            toast.success(`Welcome, ${(user || staff).name}!`);
            router.push('/dashboard');
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
                    <div style={{ width: '64px', height: '64px', margin: '0 auto 16px', backgroundColor: '#0a0a0a', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>
                        🔬
                    </div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Lab Portal</h1>
                    <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>Digital Health Card System</p>
                </div>

                {/* Login Type Toggle */}
                <div style={{ display: 'flex', marginBottom: '24px', backgroundColor: '#f3f4f6', borderRadius: '8px', padding: '4px' }}>
                    <button
                        type="button"
                        onClick={() => setLoginType('staff')}
                        style={{
                            flex: 1,
                            padding: '10px',
                            borderRadius: '6px',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 500,
                            fontSize: '14px',
                            backgroundColor: loginType === 'staff' ? '#0a0a0a' : 'transparent',
                            color: loginType === 'staff' ? '#ffffff' : '#6b7280',
                            transition: 'all 0.2s',
                        }}
                    >
                        Receptionist
                    </button>
                    <button
                        type="button"
                        onClick={() => setLoginType('admin')}
                        style={{
                            flex: 1,
                            padding: '10px',
                            borderRadius: '6px',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 500,
                            fontSize: '14px',
                            backgroundColor: loginType === 'admin' ? '#0a0a0a' : 'transparent',
                            color: loginType === 'admin' ? '#ffffff' : '#6b7280',
                            transition: 'all 0.2s',
                        }}
                    >
                        Branch Admin
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="receptionist@lab.com"
                            style={{ width: '100%', padding: '14px', fontSize: '14px', border: '2px solid #e5e7eb', borderRadius: '10px', outline: 'none' }}
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
                        }}
                    >
                        <LogIn size={20} />
                        {isLoading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
}
