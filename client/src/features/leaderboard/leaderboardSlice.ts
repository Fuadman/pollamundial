import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { LeaderboardEntry, LeaderboardPhase } from '../../types';
import { leaderboardService } from '../../services/leaderboard.service';

interface LeaderboardState {
  entries: LeaderboardEntry[];
  total: number;
  page: number;
  phase: LeaderboardPhase;
  loading: boolean;
  error: string | null;
}

const initialState: LeaderboardState = {
  entries: [],
  total: 0,
  page: 1,
  phase: 'all',
  loading: false,
  error: null,
};

export const fetchLeaderboard = createAsyncThunk(
  'leaderboard/fetch',
  async ({ phase, page }: { phase?: LeaderboardPhase; page?: number }) => {
    const response = await leaderboardService.getLeaderboard(phase, page);
    return response.data;
  },
);

const leaderboardSlice = createSlice({
  name: 'leaderboard',
  initialState,
  reducers: {
    setPhase(state, action: PayloadAction<LeaderboardPhase>) {
      state.phase = action.payload;
      state.page = 1;
    },
    setPage(state, action: PayloadAction<number>) {
      state.page = action.payload;
    },
    updateEntries(state, action: PayloadAction<LeaderboardEntry[]>) {
      state.entries = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeaderboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeaderboard.fulfilled, (state, action) => {
        state.loading = false;
        state.entries = action.payload.data;
        state.total = action.payload.total;
      })
      .addCase(fetchLeaderboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Error cargando tabla de posiciones';
      });
  },
});

export const { setPhase, setPage, updateEntries } = leaderboardSlice.actions;
export default leaderboardSlice.reducer;
