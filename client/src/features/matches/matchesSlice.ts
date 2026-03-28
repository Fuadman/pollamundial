import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Match, MatchPhase, MatchStatus } from '../../types';
import { matchService, type MatchFilters } from '../../services/match.service';

interface MatchesState {
  items: Match[];
  currentMatch: Match | null;
  loading: boolean;
  error: string | null;
  filters: {
    phase?: MatchPhase;
    status?: MatchStatus;
    group?: string;
  };
}

const initialState: MatchesState = {
  items: [],
  currentMatch: null,
  loading: false,
  error: null,
  filters: {},
};

export const fetchMatches = createAsyncThunk(
  'matches/fetchAll',
  async (filters?: MatchFilters) => {
    const response = await matchService.getMatches(filters);
    return response.data;
  },
);

export const fetchMatch = createAsyncThunk(
  'matches/fetchOne',
  async (matchId: string) => {
    const response = await matchService.getMatch(matchId);
    return response.data;
  },
);

export const fetchGroupSchedule = createAsyncThunk('matches/fetchGroup', async () => {
  const response = await matchService.getGroupSchedule();
  return response.data;
});

export const fetchEliminationSchedule = createAsyncThunk(
  'matches/fetchElimination',
  async () => {
    const response = await matchService.getEliminationSchedule();
    return response.data;
  },
);

const matchesSlice = createSlice({
  name: 'matches',
  initialState,
  reducers: {
    setFilters(state, action: PayloadAction<MatchesState['filters']>) {
      state.filters = action.payload;
    },
    updateMatchInList(state, action: PayloadAction<Match>) {
      const idx = state.items.findIndex((m) => m.id === action.payload.id);
      if (idx !== -1) state.items[idx] = action.payload;
    },
  },
  extraReducers: (builder) => {
    const loadingReducer = (state: MatchesState) => {
      state.loading = true;
      state.error = null;
    };
    builder
      .addCase(fetchMatches.pending, loadingReducer)
      .addCase(fetchMatches.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchMatches.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Error cargando partidos';
      })
      .addCase(fetchMatch.pending, loadingReducer)
      .addCase(fetchMatch.fulfilled, (state, action) => {
        state.loading = false;
        state.currentMatch = action.payload;
      })
      .addCase(fetchMatch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Error cargando partido';
      })
      .addCase(fetchGroupSchedule.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchEliminationSchedule.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      });
  },
});

export const { setFilters, updateMatchInList } = matchesSlice.actions;
export default matchesSlice.reducer;
