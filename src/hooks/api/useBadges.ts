import { useQuery } from '@tanstack/react-query';
import api from '@/services/api.js';

export const useBadges = () =>
  useQuery({ queryKey: ['badges'], queryFn: () => api.get('/badges').then(r => r.data) });