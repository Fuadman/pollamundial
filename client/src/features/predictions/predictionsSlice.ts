import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Prediction, SubmitPredictionDto } from '../../types';
import { predictionService } from '../../services/prediction.service';

interface PredictionsState {
  items: Prediction[];
  currentPrediction: Prediction | null;
  loading: boolean;
  submitting: boolean;
  error: string | null;
}

const initialState: PredictionsState = {
  items: [],
  currentPrediction: null,
  loading: false,
  submitting: false,
  error: null,
};

export const fetchUserPredictions = createAsyncThunk(
  'predictions/fetchAll',
  async (userId: string) => {
    const response = await predictionService.getUserPredictions(userId);
    return response.data;
  },
);

export const fetchPredictionForMatch = createAsyncThunk(
  'predictions/fetchForMatch',
  async (matchId: string) => {
    const response = await predictionService.getForMatch(matchId);
    return response.data;
  },
);

export const submitPrediction = createAsyncThunk(
  'predictions/submit',
  async (data: SubmitPredictionDto) => {
    const response = await predictionService.submit(data);
    return response.data;
  },
);

export const updatePrediction = createAsyncThunk(
  'predictions/update',
  async ({ predictionId, data }: { predictionId: string; data: Partial<SubmitPredictionDto> }) => {
    const response = await predictionService.update(predictionId, data);
    return response.data;
  },
);

const predictionsSlice = createSlice({
  name: 'predictions',
  initialState,
  reducers: {
    clearCurrentPrediction(state) {
      state.currentPrediction = null;
    },
    updatePredictionPoints(
      state,
      action: PayloadAction<{ predictionId: string; points: number }>,
    ) {
      const pred = state.items.find((p) => p.id === action.payload.predictionId);
      if (pred) pred.pointsEarned = action.payload.points;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserPredictions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserPredictions.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchUserPredictions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Error cargando predicciones';
      })
      .addCase(fetchPredictionForMatch.fulfilled, (state, action) => {
        state.currentPrediction = action.payload;
      })
      .addCase(submitPrediction.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(submitPrediction.fulfilled, (state, action) => {
        state.submitting = false;
        state.currentPrediction = action.payload;
        const idx = state.items.findIndex((p) => p.matchId === action.payload.matchId);
        if (idx !== -1) {
          state.items[idx] = action.payload;
        } else {
          state.items.push(action.payload);
        }
      })
      .addCase(submitPrediction.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.error.message ?? 'Error enviando predicción';
      })
      .addCase(updatePrediction.fulfilled, (state, action) => {
        state.submitting = false;
        state.currentPrediction = action.payload;
        const idx = state.items.findIndex((p) => p.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      });
  },
});

export const { clearCurrentPrediction, updatePredictionPoints } = predictionsSlice.actions;
export default predictionsSlice.reducer;
