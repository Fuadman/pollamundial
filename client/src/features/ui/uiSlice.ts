import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Notification, NotificationType } from '../../types';

interface UIState {
  notifications: Notification[];
  isSimulationMode: boolean;
  sidebarOpen: boolean;
}

const initialState: UIState = {
  notifications: [],
  isSimulationMode: false,
  sidebarOpen: false,
};

let notifCounter = 0;

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    addNotification(
      state,
      action: PayloadAction<{ type: NotificationType; message: string }>,
    ) {
      state.notifications.push({
        id: String(++notifCounter),
        type: action.payload.type,
        message: action.payload.message,
      });
    },
    removeNotification(state, action: PayloadAction<string>) {
      state.notifications = state.notifications.filter((n) => n.id !== action.payload);
    },
    setSimulationMode(state, action: PayloadAction<boolean>) {
      state.isSimulationMode = action.payload;
    },
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
  },
});

export const { addNotification, removeNotification, setSimulationMode, toggleSidebar } =
  uiSlice.actions;
export default uiSlice.reducer;
