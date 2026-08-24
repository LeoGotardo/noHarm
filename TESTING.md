# NoHarm — Checklist de Testes

Lista de funções do app para testar manualmente. Organizada por domínio, na ordem do fluxo de uso.

> **Boa parte deste checklist já está automatizada** em `tests/` (Playwright, 67 testes).
> Rode com `npm run test:e2e`. Os itens que a automação cobre estão marcados 🤖 —
> os demais continuam sendo verificação manual (popup do Google, push nativo, etc.).
> Os bugs que a suíte encontrou — de frontend e de backend — já foram corrigidos;
> o histórico está em [`tests/README.md`](tests/README.md).

## Auth / Onboarding

- [x] 🤖 **Splash** — "Get Started" abre Register; "Login" abre Login
- [ ] **Register** — criar conta (Firebase + JWT); botão voltar retorna ao splash; sucesso → app/home _(popup do Google — manual; a criação de conta via API é testada)_
- [ ] **Login** — entrar; botão voltar retorna ao splash; sucesso → app/home _(popup do Google — manual; o login via API é testado)_
- [x] 🤖 **Persistência de sessão** — reload com token salvo entra direto no app
- [x] 🤖 **Logout** (Settings) — volta ao splash, limpa a stack
- [x] 🤖 **Delete account** (Settings) — tela "Your account is gone" → "Start over" volta ao splash

## Home / Streak

- [x] 🤖 **Start streak** — bottom sheet; escolher data (máx = hoje); "Begin my streak" → confete + toast
- [x] 🤖 **Check-in** — botão; confete (se motion on); toast "Checked in — day N"; reagenda reminder
- [x] 🤖 **Check-in modal (auto)** — aparece quando `needsCheckin`; confirmar all-clean; marcar dia de setback encerra o streak naquela data
- [x] 🤖 **Relapse** — sheet "A setback isn't the end"; reset para 0; toast compassivo; falha do servidor não celebra
- [x] 🤖 **Streak history** — abre tela; dias atuais + data início; estado vazio quando `days === 0`
- [x] 🤖 **Personal record** — calculado a partir de `GET /streaks/record` (`start_at`/`end_at`)
- [x] 🤖 **Confete** — respeita reduce-motion (off quando motion = false)

## Friends

- [x] 🤖 **Friends list** — lista de amigos (status = accepted); contador de requests; badge no tab
- [ ] **Friend requests** — recebidos/enviados 🤖; aceitar (toast "Friend added") 🤖; cancelar 🤖; **recusar** _(sem cobertura)_
- [x] 🤖 **Friend search** — buscar; abrir perfil; enviar request (toast "Request sent")
- [x] 🤖 **Public profile** — ver perfil; relação (friend / pending_out / pending_in / none); ações: message, add, accept, remove (toast "Friend removed"), block (toast "User blocked")

## Chat

- [x] 🤖 **Chat list** — lista de conversas; contador de não-lidas (badge no tab)
- [x] 🤖 **Chat thread** — abrir conversa; enviar mensagem; typing; mark_read (WS)
- [x] 🤖 **Message person** — abre chat existente ou cria novo (a partir de friends/profile)

## Badges

- [x] 🤖 **Badges screen** — grid; status earned vindo de `GET /user-badges/`; contagem "N of M earned"
- [ ] **Badge detail** — abre tela 🤖; descrição 🤖; dias restantes 🤖; data da conquista 🤖; flag `justUnlocked` _(sem cobertura)_
- [x] 🤖 **Next badge / milestone** — próximo badge não-ganho exibido na home

## Profile

- [x] 🤖 **My profile** — badges ganhos, dias, record, contagem, data de entrada
- [x] 🤖 **Edit profile** — salvar (toast "Profile updated") + refetch
- [x] 🤖 **Settings** — toggle dark/light, logout, delete, notificações

## Notifications

- [ ] **Permissão** — "Enable notifications" (Settings) _(prompt do browser — manual)_
- [ ] **Prefs** — master 🤖 e sub-toggles desabilitados sem permissão 🤖; ligar/desligar `messages`, `friendRequests`, `friendAccepted`, `checkinReminder` individualmente _(sem cobertura)_
- [ ] **Check-in reminder** — agenda 9 PM diário quando master + pref ativos _(Capacitor LocalNotifications — manual, só nativo)_
- [ ] **Banner in-app** — notif WS aparece como banner; tap navega (chat/etc) _(o backend já emite `new_message`; falta escrever o teste)_
- [x] 🤖 **Toast** — feedback de ações (auto-dismiss em 2,2 s)

## Navegação / Tabs

- [x] 🤖 **TabBar** — home / friends / chat / badges / profile; badges de contador (friends, chat)
- [x] 🤖 **Stack** — push / pop / resetTo; tabs escondem quando há overlay na stack
- [x] 🤖 **Animação de transição** — `nhScreenIn` na troca de tela

## Theming (TweaksPanel — canto inferior direito)

- [x] 🤖 **Direção** — sage ↔ dawn
- [x] 🤖 **Modo** — light ↔ dark
- [x] 🤖 **Motion** — liga/desliga fundo animado + confete
- [ ] **Accent** — warm (default) _(sem alternativa no painel)_

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

## Mudanças de contrato do backend já absorvidas

- `milestone` (badges) virou **inteiro** — contagem de dias limpos, não date-time
- badges são concedidos pelo backend em `POST /streaks/start` e `/streaks/checkin`
- `POST /streaks/end` encerra o streak e já abre o próximo (aceita `end_at` retroativo)
- conta deletada: o access token antigo passa a receber `403 Account not found.`
- `X-Forwarded-For` só é considerado vindo de um peer em `TRUSTED_PROXIES` — a suíte
  parou de forjar IP e passou a zerar os contadores de rate limit entre testes
- eventos `new_message` / `messages_read` / `message_read` vão para a sala pessoal
  `user_<id>`; `join_chat` continua necessário **só** para `typing_indicator`
- presença passou a ser multi-dispositivo e cross-instância (registro no Redis);
  o formato de `online_status` não mudou
- limites por usuário no socket: `send_message` 30/min, `typing` 60/min

## Proxy (backend privado)

Implementado — ver [`PROXY.md`](PROXY.md). O app passou a falar com a própria
origem: `VITE_API_URL=/api`, `VITE_SOCKET_URL` vazia, e `api/[...path].ts` /
`api/ws.ts` encaminham para o backend com o token OIDC do projeto. O `npm run dev`
proxia as mesmas rotas, então a suíte E2E roda sem `vercel dev`.

Efeito colateral: CORS deixou de existir para o tráfego web (mesma origem, sem
preflight), e `ALLOWED_ORIGINS` no backend para de importar para a SPA.

## Pendente no frontend por causa do backend novo

- **`src/connectors/socket.js`** — tratar os códigos reais de `connect_error`
  (`missing_token`, `invalid_token`, `account_unavailable`, `too_many_connections`).
  Hoje é `console.warn` + 5 reconexões para todos os casos.

## Ainda sem integração (falta endpoint/infra)

- Upload de foto de perfil (EditProfile câmera) — sem endpoint de upload; `putMe` só aceita URL
- Settings "Privacy & safety" / "Crisis resources" — telas não existem; as linhas agora aparecem como "Soon" e desabilitadas em vez de toque morto
- `totalStreaks` na Dashboard — hardcoded `0` (sem campo na API)
