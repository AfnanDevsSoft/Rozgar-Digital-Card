/**
 * API Client for Lab Portal
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const api: AxiosInstance = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
    const token = Cookies.get('lab_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        if (error.response?.status === 401) {
            Cookies.remove('lab_token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Types
export interface User {
    id: string;
    name: string;
    email: string;
    phone: string;
    cnic: string;
    dob?: string;
    gender?: string;
    blood_group?: string;
}

export interface HealthCard {
    serial_number: string;
    status: string;
    issue_date: string;
    expiry_date: string;
}

export interface Test {
    id: string;
    name: string;
    category: string;
    price: number;
    discount_percent?: number;
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
    user: { name: string };
}

// API Methods
export const authAPI = {
    loginBranchAdmin: (email: string, password: string) =>
        api.post('/auth/admin/login', { email, password }),
    loginStaff: (email: string, password: string) =>
        api.post('/auth/staff/login', { email, password }),
    getProfile: () => api.get('/auth/me'),
};

export const cardsAPI = {
    verify: (serial: string) => api.get(`/cards/verify/${serial}`),
};

export const transactionsAPI = {
    create: (data: {
        serial_number: string;
        test_name: string;
        original_amount: number;
        discount_percentage?: number;
        discount_amount?: number;
        final_amount?: number;
    }) =>
        api.post('/transactions', data),
    calculate: (original_amount: number) =>
        api.post('/transactions/calculate', { original_amount }),
    getAll: (params?: any) => api.get('/transactions', { params }),
    getReceipt: (id: string) => api.get(`/transactions/${id}/receipt`),
    getStats: () => api.get('/transactions/stats/overview'),
};

export const testsAPI = {
    getByLab: (labId: string) => api.get(`/test-catalog/lab/${labId}`),
    getCategories: (labId: string) => api.get(`/test-catalog/lab/${labId}/categories`),
    create: (data: { name: string; category: string; price: number; discount_percent?: number; lab_id: string }) =>
        api.post('/test-catalog', data),
    update: (id: string, data: any) => api.put(`/test-catalog/${id}`, data),
    toggleStatus: (id: string) => api.patch(`/test-catalog/${id}/toggle-status`),
};

export const reportsAPI = {
    upload: (formData: FormData) =>
        api.post('/reports', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    getAll: (params?: any) => api.get('/reports', { params }),
    getStats: () => api.get('/reports/stats/overview'),
};

export const discountAPI = {
    calculate: (amount: number, lab_id?: string) =>
        api.post('/discount/calculate', { amount, lab_id }),
};

export default api;
