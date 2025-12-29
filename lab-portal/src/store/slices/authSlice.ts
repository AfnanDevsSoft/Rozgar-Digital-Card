import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Lab {
    id: string;
    name: string;
    lab_code: string;
    discount_rate: number;
}

interface User {
    id: string;
    email: string;
    name: string;
    role: 'BRANCH_ADMIN' | 'RECEPTIONIST';
    lab_id: string;
    lab: Lab;
    must_change_password?: boolean;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const initialState: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: true,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setUser: (state, action: PayloadAction<User>) => {
            state.user = action.payload;
            state.isAuthenticated = true;
            state.isLoading = false;
        },
        clearAuth: (state) => {
            state.user = null;
            state.isAuthenticated = false;
            state.isLoading = false;
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
    },
});

export const { setUser, clearAuth, setLoading } = authSlice.actions;
export default authSlice.reducer;
