# NoHarm — Checklist de Testes

Lista de funções do app para testar manualmente. Organizada por domínio, na ordem do fluxo de uso.

## Auth / Onboarding

- [ ] **Splash** — "Get Started" abre Register; "Login" abre Login
- [ ] **Register** — criar conta (Firebase + JWT); botão voltar retorna ao splash; sucesso → app/home
- [ ] **Login** — entrar; botão voltar retorna ao splash; sucesso → app/home
- [ ] **Persistência de sessão** — reload com token salvo entra direto no app
- [ ] **Logout** (Settings) — volta ao splash, limpa a stack
- [ ] **Delete account** (Settings) — tela "Your account is gone" → "Start over" volta ao splash

## Home / Streak

- [ ] **Start streak** — bottom sheet; escolher data (máx = hoje); "Begin my streak" → confete + toast
- [ ] **Check-in** — botão; confete (se motion on); toast "Checked in — day N"; reagenda reminder
- [ ] **Check-in modal (auto)** — aparece quando `needsCheckin`; mostra dias perdidos + última data; confirmar com/sem relapses
- [ ] **Relapse** — sheet "A setback isn't the end"; reset para 0; toast compassivo
- [ ] **Streak history** — abre tela; dias atuais + data início; estado vazio quando `days === 0`
- [ ] **Personal record** — calculado a partir do `record`
- [ ] **Confete** — respeita reduce-motion (off quando motion = false)

## Friends

- [ ] **Friends list** — lista de amigos (status = accepted); contador de requests; badge no tab
- [ ] **Friend requests** — recebidos/enviados; aceitar (toast "Friend added"), recusar, cancelar
- [ ] **Friend search** — buscar; abrir perfil; enviar request (toast "Request sent")
- [ ] **Public profile** — ver perfil; relação (friend / pending_out / pending_in / none); ações: message, add, accept, remove (toast "Friend removed"), block (toast "User blocked")

## Chat

- [ ] **Chat list** — lista de conversas; contador de não-lidas (badge no tab)
- [ ] **Chat thread** — abrir conversa; enviar mensagem; typing; mark_read (WS)
- [ ] **Message person** — abre chat existente ou cria novo (a partir de friends/profile)

## Badges

- [ ] **Badges screen** — grid; status earned derivado dos dias de streak
- [ ] **Badge detail** — abre tela; dias atuais; flag `justUnlocked`
- [ ] **Next badge / milestone** — próximo badge não-ganho exibido na home

## Profile

- [ ] **My profile** — badges ganhos, dias, record, contagem, data de entrada
- [ ] **Edit profile** — salvar (toast "Profile updated") + refetch
- [ ] **Settings** — toggle dark/light, logout, delete, notificações

## Notifications

- [ ] **Permissão** — "Enable notifications" (Settings)
- [ ] **Prefs** — master, messages, friendRequests, friendAccepted, checkinReminder
- [ ] **Check-in reminder** — agenda 9 PM diário quando master + pref ativos
- [ ] **Banner in-app** — notif WS aparece como banner; tap navega (chat/etc)
- [ ] **Toast** — feedback de ações (auto-dismiss em 2,2 s)

## Navegação / Tabs

- [ ] **TabBar** — home / friends / chat / badges / profile; badges de contador (friends, chat)
- [ ] **Stack** — push / pop / resetTo; tabs escondem quando há overlay na stack
- [ ] **Animação de transição** — `nhScreenIn` na troca de tela

## Theming (TweaksPanel — canto inferior direito)

- [ ] **Direção** — sage ↔ dawn
- [ ] **Modo** — light ↔ dark
- [ ] **Motion** — liga/desliga fundo animado + confete
- [ ] **Accent** — warm (default)

---

## Integrações de API — agora ligadas

Handlers antes em stub, agora chamando o backend:

- `FriendSearch` recebe `pool` real (`getUsers`) → busca filtra usuários
- `onSendRequest` / `onAdd` → `sendFriendRequest`
- `onAccept` / `onReject` / `onCancel` (requests + PublicProfile) → `acceptFriendship` / `rejectFriendship` / `removeFriendship`
- `onRemove` / `onBlock` (PublicProfile) → `removeFriendship` / `blockFriendship`
- Delete account (Settings) → `deleteMe`
- Logout (Settings) → `signOut` + limpa tokens
- Chat "Ignore" (request recebido) → `rejectChat`
- Logout / delete account → `unregisterDeviceToken` (token FCM persistido em `nh_fcm`)

## Ainda sem integração (falta endpoint/infra)

- Upload de foto de perfil (EditProfile câmera) — sem endpoint de upload; `putMe` só aceita URL
- Settings "Privacy & safety" / "Crisis resources" — telas não existem (sem destino)
- `totalStreaks` na Dashboard — hardcoded `0` (sem campo na API)
