/**
 * UI State Slice
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
    sidebarOpen: boolean;
    currentPage: string;
    isLoading: boolean;
}

const initialState: UIState = {
    sidebarOpen: true,
    currentPage: 'Dashboard',
    isLoading: false,
};

const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        toggleSidebar: (state) => {
            state.sidebarOpen = !state.sidebarOpen;
        },
        setSidebarOpen: (state, action: PayloadAction<boolean>) => {
            state.sidebarOpen = action.payload;
        },
        setCurrentPage: (state, action: PayloadAction<string>) => {
            state.currentPage = action.payload;
        },
        setUILoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
    },
});

export const { toggleSidebar, setSidebarOpen, setCurrentPage, setUILoading } = uiSlice.actions;
export default uiSlice.reducer;
