import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
    sidebarOpen: boolean;
    currentPage: string;
}

const initialState: UIState = {
    sidebarOpen: true,
    currentPage: 'Dashboard',
};

const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        toggleSidebar: (state) => { state.sidebarOpen = !state.sidebarOpen; },
        setCurrentPage: (state, action: PayloadAction<string>) => { state.currentPage = action.payload; },
    },
});

export const { toggleSidebar, setCurrentPage } = uiSlice.actions;
export default uiSlice.reducer;
