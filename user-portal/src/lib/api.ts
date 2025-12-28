import axios, { AxiosInstance, AxiosError } from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const api: AxiosInstance = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
});

// Helper to get full URL for files
export const getFileUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;

    // API_URL is usually http://localhost:4000/api
    const baseUrl = API_URL.replace(/\/api$/, ''); // http://localhost:4000

    // Ensure path starts with /
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    // If path already contains /api/, don't add it again if the baseURL doesn't have it
    // But our backend static route is /api/uploads
    return `${baseUrl}${normalizedPath}`;
};

api.interceptors.request.use((config) => {
    const token = Cookies.get('user_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        if (error.response?.status === 401) {
            Cookies.remove('user_token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export interface HealthCard {
    serial_number: string;
    status: string;
    issue_date: string;
    expiry_date: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    phone: string;
    father_name?: string;
    guardian_name?: string;
    cnic?: string;
    dob?: string;
    gender?: string;
    blood_group?: string;
    address?: string;
    town?: string;
    whatsapp_number?: string;
    alternative_number?: string;
    eligibility_type?: string;
    disability_type?: string;
    disability_other_comment?: string;
    has_disability_certificate?: boolean;
    monthly_income?: string | number;
    family_members_count?: string | number;
    current_health_condition?: string;
    cnic_front_photo?: string;
    cnic_back_photo?: string;
    disability_certificate_photo?: string;
    passport_photo?: string;
    health_card: HealthCard | null;
}

export interface Transaction {
    id: string;
    receipt_number: string;
    test_name: string;
    original_amount: number;
    discount_amount: number;
    final_amount: number;
    created_at: string;
    lab: { name: string };
}

export interface Report {
    id: string;
    file_name: string;
    file_url: string;
    status: string;
    uploaded_at: string;
    transaction: { test_name: string; lab: { name: string } };
}

export const authAPI = {
    login: (serial_number: string, password: string) =>
        api.post('/auth/user/login', { serial_number, password }),
    getProfile: () => api.get('/auth/me'),
    changePassword: (current_password: string, new_password: string) =>
        api.post('/auth/change-password', { current_password, new_password }),
};

export const userAPI = {
    getReports: () => api.get('/reports/my'),
    getTransactions: () => api.get('/transactions/my'),
};

export default api;
