# Testes E2E — NoHarm

Suíte Playwright que automatiza o checklist do [`TESTING.md`](../TESTING.md).
Roda contra o app real (Vite em `:5173`) e o backend real (`:8080`).

```bash
npm run test:e2e            # roda tudo (headless)
npm run test:e2e -- --ui    # modo interativo
npm run test:e2e:report     # abre o último relatório HTML
npx playwright test tests/chat.spec.js          # um arquivo
npx playwright test -g "Relapse"                # por nome
```

Pré-requisitos: backend em `http://localhost:8080` (`docker compose up`) e nada
mais — o Playwright sobe o `npm run dev` sozinho se ainda não estiver de pé.
Sobrescreva com `E2E_API_URL`, `E2E_SOCKET_URL` e `E2E_WEB_URL`.

O browser não fala mais direto com o backend: o app usa URLs relativas (`/api`,
`/ws`) e o dev server proxia, espelhando o que `api/[...path].ts` e `api/ws.ts`
fazem em produção (ver [`../PROXY.md`](../PROXY.md)). Os helpers em Node
continuam batendo direto em `E2E_API_URL`, sem passar pelo proxy.

Durante os testes de socket o dev server loga
`[vite] ws proxy socket error: ECONNRESET`: é o teardown fechando o socket de
supetão, não falha.

## Como a suíte contorna o login com Google

`RegisterScreen` / `LoginScreen` abrem um popup do Google, que o Google bloqueia
em automação. E `POST /auth/login` / `/auth/register` não recebem mais `{uid,
email}`: recebem `{idToken}` e mandam para `firebase_admin.auth.verify_id_token`
— uid, email, `email_verified` e foto saem das claims verificadas, não do corpo
da requisição. Mandar `{uid, email}` hoje é `422`; mandar um token de outro
projeto é `401`.

O que torna a suíte possível é o **modo emulador do próprio firebase-admin**:
com `FIREBASE_AUTH_EMULATOR_HOST` setado, ele pula a checagem de assinatura e de
expiração, mas continua exigindo `aud == <project_id>`, `iss ==
https://securetoken.google.com/<project_id>` e um `sub` não vazio. `fakeIdToken()`
em `helpers/api.js` monta um JWT de três segmentos com essas claims — assinatura
qualquer, já que ninguém a confere nesse modo.

> **Aviso:** `FIREBASE_AUTH_EMULATOR_HOST` é bypass total de autenticação —
> qualquer um autentica como qualquer um. Vale só para dev e teste
> (`docker/compose.yaml` do backend). Nunca em produção. O backend loga um aviso
> no boot quando a variável está setada.

Cada teste registra uma conta descartável via REST com um desses tokens, escreve
`nh_access` / `nh_refresh` no `localStorage` e recarrega a página: é exatamente o
estado em que o app fica após um login real. A conta é apagada no teardown.

O `project_id` esperado vem de `E2E_FIREBASE_PROJECT_ID` (default `noharm-6cc9d`)
e precisa bater com o `FIREBASE_PROJECT_ID` do backend. Se não bater, o register
volta `401`; se o container do backend estiver sem `FIREBASE_AUTH_EMULATOR_HOST`,
o token falha na verificação de assinatura e volta `401` — ou `503`
`AUTH_UNAVAILABLE`, se ele também não tiver credencial de service account.

Consequência: nenhuma conta sua é usada. O banco ainda acumula as contas descartáveis,
porque o backend só faz soft delete — ver "Estado que a suíte deixa no banco".

## Rate limit: por que existe um `FLUSH` de contadores

O backend limita **todas** as rotas a 60 requisições/minuto por IP, com janela de
60 s guardada no Redis sob `rl:*`. Um carregamento de tela custa ~10 requisições,
então a suíte inteira não cabe num balde só.

A suíte antiga forjava um `X-Forwarded-For` por teste para ganhar um balde
próprio. Isso só funcionava porque o header era aceito de qualquer origem — furo
que o backend fechou: agora ele só é considerado se o peer estiver em
`TRUSTED_PROXIES`. Forjar o header virou no-op (ou, pior, funciona só na sua
máquina, onde a bridge do Docker está na lista).

No lugar disso, `helpers/ratelimit.js` zera os contadores antes de cada teste,
via uma fixture `auto` em `helpers/fixtures.js`:

```bash
docker exec redis_cache redis-cli --scan --pattern 'rl:*' | xargs -r redis-cli DEL
```

Apaga **só** `rl:*`, nunca `FLUSHDB`: o mesmo Redis guarda o registro de presença
e os contadores de socket por usuário (`ws:conn:*`, que impõem
`too_many_connections`), e um flush vindo de um worker corromperia esses dados
para os outros no meio da execução. Apagar o contador de outro worker é inofensivo
— só concede mais cota, nunca invalida asserção.

Rodando contra um backend remoto não há container para o `docker exec`: o reset é
pulado com um aviso e a suíte segue num balde só. Use `E2E_REDIS_CONTAINER` se o
container tiver outro nome.

## Testes marcados `test.fail()`

Nenhum, hoje. A convenção continua valendo para quando aparecer um bug de backend
que não dá para consertar do lado do app: o teste descreve o comportamento
**correto**, ganha `test.fail()` e um comentário `KNOWN BUG`, fica verde enquanto
o bug existir e passa a falhar — avisando — no dia em que alguém consertar. Foi
exatamente assim que os seis bugs abaixo apareceram como corrigidos.

## Achados

### Backend — corrigidos

Todos os bugs que a suíte catalogava foram resolvidos, e os testes correspondentes
viraram asserções positivas:

| Bug | Estado |
|---|---|
| `POST /streaks/end` 500 sempre (relapse quebrado) | encerra o streak e abre um novo, inclusive com `end_at` retroativo |
| `PUT /users/me` não persiste | persiste |
| WS nunca emite `new_message` | emite, para envio REST e por socket |
| `DELETE /badges` 500 deixando badge fantasma | apaga e some do `GET /badges` |
| conta deletada seguia autenticável | `GET /users/me` responde 403 `Account not found.` |
| badges nunca concedidos | concedidos em `POST /streaks/start` e `/streaks/checkin` |

### Backend — abertos

Nenhum.

### Frontend — aberto

- **Códigos de recusa do socket não são tratados** (`src/connectors/socket.js`).
  O backend passou a devolver o motivo real em `connect_error` —
  `missing_token`, `invalid_token`, `account_unavailable`,
  `too_many_connections` — antes tudo virava `"Connection refused by server"`.
  O handler ainda é um `console.warn` e o socket.io tenta 5 reconexões para
  qualquer um dos quatro; em `account_unavailable` e `too_many_connections` isso
  é ruído garantido. Sem cobertura de teste até o handler existir.

### Mudanças de contrato

**`milestone` virou inteiro.** Deixou de ser date-time e passou a ser contagem de
dias limpos. `tests/badges.spec.js` foi reescrito em cima disso, e os comentários
em `src/services/badges.js` e nas telas de badge foram atualizados. O tratamento
defensivo de `milestoneDays()` continua lá, agora como guarda contra badge
malformado — não como o contrato esperado.

**`X-Forwarded-For` só vale vindo de `TRUSTED_PROXIES`.** Ver a seção de rate
limit acima.

**`/auth/login` e `/auth/register` recebem `{idToken}`.** Antes recebiam
`{uid, email}` e acreditavam neles — como o uid do Firebase é público
(`UserResponse.id` aparece na lista de amigos e na busca), dava para logar como
qualquer usuário. Agora o backend verifica o ID token e tira a identidade das
claims. `src/connectors/firebase.js` devolve `idToken` junto do resultado do
popup, e `src/services/api/auth.js` manda só ele.

**Entrega de eventos do socket não depende mais da sala do chat.** `new_message`,
`messages_read` e `message_read` vão para a sala pessoal `user_<id>` de cada
participante, entregues uma única vez com ou sem `join_chat`. `join_chat` segue
necessário **só** para `typing_indicator`, que continua indo para a sala do chat
com `skip_sid` — por isso `tests/chat.spec.js` ainda chama `joinChat` antes de
emitir `typing`.

**Presença é multi-dispositivo e cross-instância.** `get_online_status` lê de um
registro no Redis; o formato de `online_status` não mudou.

**Limites por usuário no socket:** `send_message` 30/min, `typing` 60/min.

### Frontend — corrigidos

| Problema | Correção |
|---|---|
| `milestone` date-time tratado como dias → nenhum badge ganho | estado de conquista passou a vir de `GET /user-badges/` (`services/badges.js`, `store/useBadges.js`) |
| `NaN days to go` e ISO cru no medalhão | `milestoneDays()` devolve `null` quando o milestone não é contagem de dias; a UI esconde a contagem |
| descrição do badge não renderizava | `badgeDescription()` aceita `description` e `desc` |
| busca de amigos só via 20 usuários | pool pagina sob demanda enquanto o usuário digita, com estado "Searching…" |
| botão de check-in inalcançável | modal só abre quando há dias em aberto; `last_checkin` do servidor virou fonte de verdade |
| falha de check-in/relapse virava toast de sucesso | `useStreak` re-lança o erro |
| "Past streaks" sem streaks passados | cabeçalho só aparece com lista não-vazia |
| typing nunca era enviado | `ChatThread` emite `setTyping` com debounce |
| aba "Sent" inalcançável | botão de requests no header de Friends |
| links mortos em Settings | marcados como "Soon" e desabilitados |
| `personalRecord` era `NaN` | `GET /streaks/record` devolve `start_at`/`end_at`; `app.jsx` lia `start`/`end` |

## Estado que a suíte deixa no banco

- Usuários: apagados no teardown. O backend faz soft delete, então as linhas
  permanecem no banco e o diretório cresce a cada execução. Para expurgar:

  ```bash
  docker exec postgres_db psql -U root -d noharm-db -c "
    DELETE FROM tb_4 WHERE cl_4c LIKE 'e2e%';
    DELETE FROM tb_3 WHERE cl_3b LIKE 'e2e%' OR cl_3c LIKE 'e2e%';
    DELETE FROM tb_2 WHERE cl_2b LIKE 'e2e%' OR cl_2c LIKE 'e2e%';
    DELETE FROM tb_1 WHERE cl_1b LIKE 'e2e%';
    DELETE FROM tb_6 WHERE cl_6b LIKE 'e2e%';
    DELETE FROM tb_7 WHERE cl_7c LIKE 'e2e%';
    DELETE FROM tb_8 WHERE cl_8b LIKE 'e2e%';
    DELETE FROM tb_9 WHERE cl_9b LIKE 'e2e%';
    DELETE FROM tb_0 WHERE cl_0a LIKE 'e2e%';"
  ```

- Badges: nenhum. `tests/badges.spec.js` cria seu catálogo no `beforeAll`, apaga no
  `afterAll` e ainda varre sobras de execuções anteriores pelo prefixo `E2E `,
  agora que o `DELETE` funciona.

- Redis: contadores `ws:conn:<userId>` ficam com valor `0` e TTL de 24 h depois
  que o socket fecha — o decremento está certo, a chave só não é apagada. Não
  afeta `too_many_connections`; some sozinho.

**Por que a busca de amigos usa diretório stubado.** O diretório real cresce a
cada execução e o app pagina sob um teto de 30 req/min em `/users`. Assim que o
total passa de uma página, uma conta recém-criada cai na página 2 e o teste vira
uma corrida contra o rate limit. Os testes de busca fixam o pool com
`stubUserDirectory`; o contrato do endpoint real fica coberto pelo teste
`GET /users — contrato do diretório que alimenta a busca`, que não passa pelo
browser.
