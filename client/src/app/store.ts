import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import matchesReducer from '../features/matches/matchesSlice';
import predictionsReducer from '../features/predictions/predictionsSlice';
import leaderboardReducer from '../features/leaderboard/leaderboardSlice';
import uiReducer from '../features/ui/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    matches: matchesReducer,
    predictions: predictionsReducer,
    leaderboard: leaderboardReducer,
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
