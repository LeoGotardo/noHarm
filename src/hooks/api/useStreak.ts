import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api.js';

export const useCurrentStreak = () =>
  useQuery({ queryKey: ['streak', 'current'], queryFn: () => api.get('/streaks/current').then(r => r.data) });

export const useRecordStreak = () =>
  useQuery({ queryKey: ['streak', 'record'], queryFn: () => api.get('/streaks/record').then(r => r.data) });

export const useStreakHistory = () =>
  useQuery({ queryKey: ['streak', 'history'], queryFn: () => api.get('/streaks/history').then(r => r.data) });

export const useStartStreak = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/streaks/start').then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['streak'] }),
  });
};

export const useEndStreak = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/streaks/end').then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['streak'] }),
  });
};

export const useCheckin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/streaks/checkin').then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['streak'] }),
  });
};