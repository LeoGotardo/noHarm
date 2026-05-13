# Refactor Guide: Wire API + Firebase to the UI

## Step 1 — Fix `.env.local`

Create `.env.local` at project root:

```env
EXPO_PUBLIC_API_URL=https://noharmapi.vercel.app
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
```

> `EXPO_PUBLIC_` prefix is intentional (legacy). Vite needs `process.env` shimmed — add to `vite.config.ts` if env vars don't resolve:
> ```ts
> define: { 'process.env': process.env }
> ```

---

## Step 2 — Wire `AuthProvider` into `App.tsx`

Currently **not wired**. `AuthContext.jsx` exists but `App.tsx` never wraps it.

```tsx
// src/App.tsx
import { AuthProvider } from './context/AuthContext.jsx';

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        ...
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);
```

---

## Step 3 — Create `ProtectedRoute` + `LoginPage`

**`src/components/ProtectedRoute.tsx`**

```tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext.jsx';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
```

**`src/pages/LoginPage.tsx`** — call `loginWithGoogle()` from `useAuth()`.

In `App.tsx`: wrap all screens with `<ProtectedRoute>` and add a `/login` route.

---

## Step 4 — Create TanStack Query hooks

Create `src/hooks/api/` with one file per domain:

### `useUser.ts`

```ts
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
```

### `useStreak.ts`

```ts
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
```

### `useFriends.ts`

```ts
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
```

### `useChats.ts`

```ts
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

export const useMarkChatRead = () =>
  useMutation({
    mutationFn: (chatId: string) => api.put(`/messages/chat/${chatId}/read`),
  });
```

### `useBadges.ts`

```ts
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api.js';

export const useBadges = () =>
  useQuery({ queryKey: ['badges'], queryFn: () => api.get('/badges').then(r => r.data) });
```

---

## Step 5 — Wire screens to hooks

| Screen | Hook(s) | Replace |
|--------|---------|---------|
| `HomeScreen` | `useCurrentStreak`, `useMe` | hardcoded streak days + localStorage name |
| `ProfileScreen` | `useMe`, `useUpdateMe` | localStorage profile reads/writes |
| `FriendsScreen` | `useFriendships`, `usePendingFriendships` | mock friends array |
| `ChatScreen` | `useChats`, `useMessages`, `useSendMessage` | mock messages |
| `ProgressScreen` | `useStreakHistory`, `useRecordStreak`, `useBadges` | mock chart data |

Pattern per screen:

```tsx
const { data, isLoading, error } = useCurrentStreak();
if (isLoading) return <Spinner />;
if (error) return <ErrorState />;
// render data.days, data.startDate, etc.
```

---

## Step 6 — Verify token refresh in `api.js`

Current refresh uses raw `axios` (not the `api` instance) — correct, avoids infinite loop. Confirm `POST /auth/refresh` body field is `refreshToken` (matches `AuthRefreshRequest` schema).

---

## Step 7 — Real-time chat (after REST works)

Install: `bun add socket.io-client`

Create `src/services/socket.ts`:

```ts
import { io } from 'socket.io-client';

const socket = io(process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000', {
  auth: { token: localStorage.getItem('accessToken') },
  autoConnect: false,
});

export default socket;
```

In `ChatScreen`: connect socket on mount, listen for new messages, push to React Query cache via `queryClient.setQueryData`.

---

## Order to tackle

1. `.env.local` → confirm API reachable
2. `AuthProvider` in `App.tsx` + `ProtectedRoute` + `LoginPage`
3. `useMe` → wire `ProfileScreen`
4. `useCurrentStreak` → wire `HomeScreen`
5. `useFriendships` → wire `FriendsScreen`
6. `useChats` + `useMessages` → wire `ChatScreen`
7. `useStreakHistory` + `useBadges` → wire `ProgressScreen`
8. Socket.IO for live chat
