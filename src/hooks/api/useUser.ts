import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api.js';

export const useMe = () =>
  useQuery({ queryKey: ['me'], queryFn: () => api.get('/users/me').then(r => r.data) });

export const useUpdateMe = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.put('/users/me', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  });
};

export const useGetProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => api.get(`/users/${userId}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  });
};