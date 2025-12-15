/**
 * API Client for Admin Panel
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// Create axios instance
const api: AxiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - add auth token
api.interceptors.request.use(
    (config) => {
        const token = Cookies.get('admin_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        if (error.response?.status === 401) {
            Cookies.remove('admin_token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Types
export interface LoginCredentials {
    email: string;
    password: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    phone: string;
    cnic: string;
    address?: string;
    dob?: string;
    gender?: string;
    blood_group?: string;
    is_active: boolean;
    health_card?: HealthCard;
}

export interface HealthCard {
    id: string;
    serial_number: string;
    status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'LOST';
    issue_date: string;
    expiry_date: string;
}

export interface Lab {
    id: string;
    lab_code: string;
    name: string;
    address: string;
    phone: string;
    email: string;
    license_no?: string;
    discount_rate: number;
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

export interface Admin {
    id: string;
    name: string;
    email: string;
    role: 'SUPER_ADMIN' | 'BRANCH_ADMIN';
    lab_id?: string;
    lab?: Lab;
    is_active: boolean;
}

export interface Transaction {
    id: string;
    receipt_number: string;
    test_name: string;
    original_amount: number;
    discount_percentage: number;
    discount_amount: number;
    final_amount: number;
    created_at: string;
    user: { name: string; email: string };
    lab: { name: string };
}

export interface Pagination {
    page: number;
    limit: number;
    total: number;
    pages: number;
}

// API Methods
export const authAPI = {
    login: (credentials: LoginCredentials) =>
        api.post('/auth/admin/login', credentials),
    getProfile: () => api.get('/auth/me'),
    changePassword: (current_password: string, new_password: string) =>
        api.post('/auth/change-password', { current_password, new_password }),
};

export const usersAPI = {
    getAll: (params?: { page?: number; limit?: number; search?: string; status?: string }) =>
        api.get('/users', { params }),
    getById: (id: string) => api.get(`/users/${id}`),
    create: (data: any) => api.post('/users', data),
    update: (id: string, data: any) => api.put(`/users/${id}`, data),
    deactivate: (id: string) => api.patch(`/users/${id}/deactivate`),
    activate: (id: string) => api.patch(`/users/${id}/activate`),
    resetPassword: (id: string) => api.post(`/users/${id}/reset-password`),
};

export const cardsAPI = {
    getAll: (params?: { page?: number; limit?: number; status?: string; search?: string }) =>
        api.get('/cards', { params }),
    verify: (serial: string) => api.get(`/cards/verify/${serial}`),
    updateStatus: (id: string, status: string) =>
        api.patch(`/cards/${id}/status`, { status }),
    renew: (id: string, expiry_date: string) =>
        api.patch(`/cards/${id}/renew`, { expiry_date }),
    getStats: () => api.get('/cards/stats'),
};

export const labsAPI = {
    getAll: (params?: { page?: number; limit?: number; search?: string; status?: string }) =>
        api.get('/labs', { params }),
    getById: (id: string) => api.get(`/labs/${id}`),
    create: (data: any) => api.post('/labs', data),
    update: (id: string, data: any) => api.put(`/labs/${id}`, data),
    updateStatus: (id: string, status: string) =>
        api.patch(`/labs/${id}/status`, { status }),
    getStats: () => api.get('/labs/stats/overview'),
};

export const adminsAPI = {
    getAll: () => api.get('/admins'),
    getById: (id: string) => api.get(`/admins/${id}`),
    create: (data: any) => api.post('/admins', data),
    update: (id: string, data: any) => api.put(`/admins/${id}`, data),
    toggleStatus: (id: string) => api.patch(`/admins/${id}/toggle-status`),
    resetPassword: (id: string, new_password: string) =>
        api.post(`/admins/${id}/reset-password`, { new_password }),
};

export const transactionsAPI = {
    getAll: (params?: { page?: number; limit?: number; search?: string; date_from?: string; date_to?: string }) =>
        api.get('/transactions', { params }),
    getById: (id: string) => api.get(`/transactions/${id}`),
    getReceipt: (id: string) => api.get(`/transactions/${id}/receipt`),
    getStats: () => api.get('/transactions/stats/overview'),
};

export const reportsAPI = {
    getAll: (params?: { page?: number; limit?: number; status?: string }) =>
        api.get('/reports', { params }),
    getById: (id: string) => api.get(`/reports/${id}`),
    getStats: () => api.get('/reports/stats/overview'),
};

export const discountAPI = {
    getSettings: () => api.get('/discount/settings'),
    updateSettings: (default_discount_rate: number, apply_to_expired: boolean) =>
        api.put('/discount/settings', { default_discount_rate, apply_to_expired }),
    calculate: (amount: number, lab_id?: string) =>
        api.post('/discount/calculate', { amount, lab_id }),
};

export default api;
