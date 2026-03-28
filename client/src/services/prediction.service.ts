import apiClient from './apiClient';
import type { Prediction, SubmitPredictionDto } from '../types';

export const predictionService = {
  submit: (data: SubmitPredictionDto) =>
    apiClient.post<Prediction>('/predictions', data),

  getForMatch: (matchId: string) =>
    apiClient.get<Prediction>(`/predictions/${matchId}`),

  update: (predictionId: string, data: Partial<SubmitPredictionDto>) =>
    apiClient.put<Prediction>(`/predictions/${predictionId}`, data),

  getUserPredictions: (userId: string) =>
    apiClient.get<Prediction[]>(`/predictions/user/${userId}`),
};
