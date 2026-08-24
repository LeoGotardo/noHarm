# Proxy — noHarm → backend privado

Implementação da Fase 2 do handoff de backend. Cópia canônica do plano em
`noHarmBack/docs/FRONTEND_PROXY_MIGRATION.md`.

O backend fica privado, alcançável só a partir de projetos Vercel autorizados via
Trusted Sources. Como o `noHarm` é build estático, ele não tem runtime para
apresentar o token OIDC — as funções em `api/` são o que torna este projeto uma
origem legítima. Elas vivem no mesmo deploy dos estáticos, então o token é
emitido para este projeto.

## O que foi criado

| Arquivo | Papel |
|---|---|
| `api/[...path].ts` | Proxy REST: `/api/*` → `${BACKEND_ORIGIN}/*` |
| `api/ws.ts` | Relay de WebSocket para `${BACKEND_ORIGIN}/ws/socket.io/` |
| `vercel.json` | Rewrite `/ws/:path*` → `/api/ws` |
| `vite.config.js` | Mesmo par de rotas no dev server, para `npm run dev` não precisar de `vercel dev` |
| `.env.example` | Todas as variáveis, das duas pontas |
| `.env.mobile` | Override do build Capacitor |

O app não mudou de forma: `VITE_API_URL=/api` e `VITE_SOCKET_URL` vazio, e os
conectores já liam esses valores.

## Variáveis

No projeto Vercel (server side, nunca expostas ao cliente):

```
BACKEND_ORIGIN=https://noharm-back.vercel.app
```

Opcionais, com default no código:

```
BACKEND_OIDC_HEADER=x-vercel-trusted-oidc-idp-token
BACKEND_SOCKET_PATH=/ws/socket.io/
WS_MAX_PAYLOAD=2097152
```

No build (Vite):

```
VITE_API_URL=/api
VITE_SOCKET_URL=            # definida e vazia — ver abaixo
VITE_DEV_BACKEND_ORIGIN=http://localhost:8080   # só dev
```

`VITE_SOCKET_URL` precisa existir **vazia**, não ausente. O conector cai para
`VITE_API_URL` quando ela falta, e `/api` não é origem de socket — socket.io lê
a barra inicial como namespace. Há uma guarda em `src/connectors/socket.js` que
converte qualquer valor relativo em same-origin, mas depender dela é pedir para
o próximo esquecer o motivo.

## Decisões que divergem do handoff

**Header do token OIDC.** O handoff manda em `x-vercel-trusted-oidc-idp-token`.
A doc da Vercel para "connect to your own API" usa `Authorization: Bearer`, que
aqui já carrega o JWT do usuário — os dois não cabem no mesmo slot. Segui o
handoff, mas o nome saiu para `BACKEND_OIDC_HEADER`: se o backend validar em
outro header, é mudança de config, não deploy.

**WebSocket com `ws` nativo, não `experimental_upgradeWebSocket`.** A própria
doc da Vercel recomenda APIs nativas do Node fora do Next.js ("gives you less
control over the request lifecycle"). Decisivo aqui: `maxPayload` fica sob nosso
controle. O `experimental_upgradeWebSocket` corta frames em 256 KiB e o backend
aceita 2 MB — é exatamente o descasamento que o handoff alerta. `WS_MAX_PAYLOAD`
já nasce em 2 MB, alinhado com `max_http_buffer_size`.

**`X-Forwarded-For` é sobrescrito, nunca concatenado**, nas duas funções. Junto
com ele caem todos os `x-forwarded-*` e `x-vercel-*` que o cliente mandou, antes
de reescrever a partir do que a borda observou. Preservar qualquer parte do valor
do cliente reabre o furo de rate limit que a Fase 1 fechou — um APK modificado
injetaria um hop falso.

## Antes de fazer o deploy

1. **Fluid compute** precisa estar ligado — WebSocket na Vercel exige. É o
   default para projetos criados a partir de 23/04/2025.
2. **Permissão de WebSockets** no plano/time. A doc marca a página como gated.
3. **Trusted Sources** no projeto do backend, com o token deste projeto na lista.
4. **`maxDuration` da função de WS.** Deliberadamente fora do `vercel.json`: o
   teto varia por plano e um valor alto demais faz o deploy falhar. Toda conexão
   morre quando a função atinge o limite, então vale subir para o máximo do plano
   depois de confirmar qual é — em `vercel.json`:

   ```json
   "functions": { "api/ws.ts": { "maxDuration": 300 } }
   ```

   O cliente já reconecta, mas com `reconnectionAttempts: 5` em
   `src/connectors/socket.js`: com `maxDuration` curto, cinco tentativas acabam
   rápido. Vale revisar junto.

## Build mobile

```bash
npm run build:mobile     # vite build --mode mobile
```

O app Capacitor não tem "própria origem" — carrega de `capacitor://` ou do
filesystem — então URL relativa não resolve. `.env.mobile` aponta para a URL
absoluta do proxy. A precedência do Vite coloca `.env.mobile` acima de
`.env.local`, então o build mobile não interfere no dev.

Ajuste o domínio em `.env.mobile` antes do primeiro build de verdade; hoje está
com o placeholder `https://noharm.vercel.app`.

## Cadência de deploy

Web e mobile passam a compartilhar o proxy: um deploy do front que quebre o
contrato derruba o app junto, e quem está no APK não tem rollback. O handoff
recomenda começar junto e separar se doer — separar é copiar `api/` para um
projeto novo e adicionar o token dele aos trusted sources.

## O que não foi resolvido

Duas confirmações de infra continuam em aberto do lado de lá, e o código foi
escrito para não travar em nenhuma das duas:

- **Gating de plano do Trusted Sources**, não confirmado nos docs.
- **Custo do relay de WebSocket** — cada sessão segura duas funções abertas.
  Se a medição condenar, `api/ws.ts` é o arquivo inteiro que some ao mover o
  socket para um processo longo (container); nada mais da migração depende dele.
  O `docker/compose.yaml` do backend já roda essa configuração.

## Testes

A suíte E2E roda contra o dev server, que agora proxia `/api` e `/ws` igual à
produção — 67/67 passando nessa configuração. Isso exercita o **formato de
rotas**, não as funções da Vercel: `api/[...path].ts` e `api/ws.ts` só executam
num deploy. O que dá para verificar localmente é que o app funciona inteiro em
URLs relativas, e verifica.

O dev server loga `[vite] ws proxy socket error: ECONNRESET` durante os testes de
socket. É o `http-proxy` reagindo a socket fechado abruptamente no teardown —
vem do logger interno do Vite, não indica falha.
