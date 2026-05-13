import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api.js';

export const useFriendships = () =>
  useQuery({ queryKey: ['friendships'], queryFn: () => api.get('/friendships').then(r => r.data) });

export const usePendingFriendships = () =>
  useQuery({ queryKey: ['friendships', 'pending'], queryFn: () => api.get('/friendships/pending').then(r => r.data) });

export const useSendFriendRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (receiverId: string) => api.post(`/friendships/${receiverId}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['friendships'] }),
  });
};

export const useAcceptFriendship = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (friendshipId: string) => api.post(`/friendships/${friendshipId}/accept`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['friendships'] }),
  });
};

export const useRejectFriendship = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (friendshipId: string) => api.post(`/friendships/${friendshipId}/reject`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['friendships'] }),
  });
};

export const useBlockFriendship = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (friendshipId: string) => api.post(`/friendships/${friendshipId}/block`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['friendships'] }),
  });
};

export const useUnblockFriendship = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (friendshipId: string) => api.post(`/friendships/${friendshipId}/unblock`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['friendships'] }),
  });
};

export const useDeleteFriendship = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (friendshipId: string) => api.delete(`/friendships/${friendshipId}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['friendships'] }),
  });
};