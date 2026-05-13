import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api.js';

export const useChats = () =>
  useQuery({ queryKey: ['chats'], queryFn: () => api.get('/chats').then(r => r.data) });

export const useMessages = (chatId: string) =>
  useQuery({
    queryKey: ['messages', chatId],
    queryFn: () => api.get(`/messages/chat/${chatId}`).then(r => r.data),
    enabled: !!chatId,
  });

export const useSendMessage = (chatId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => api.post('/messages', { chatId, content }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['messages', chatId] }),
  });
};

export const useGetMessages = (chatId: string) =>
  useQuery({ queryKey: ['messages', chatId], queryFn: () => api.get(`/messages/chat/${chatId}`).then(r => r.data) });

export const useMarkChatRead = () =>
  useMutation({
    mutationFn: (chatId: string) => api.put(`/messages/chat/${chatId}/read`),
  });