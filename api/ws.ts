/**
 * WebSocket relay: the socket half of the same problem the REST proxy solves.
 *
 * With the backend private, neither the browser nor the Capacitor app can open
 * the socket directly — they have no OIDC token to present at the handshake.
 * This function opens the upstream connection carrying the token and pipes the
 * two sides together.
 *
 * Deliberately written against native Node APIs (`http.Server` + `ws`) rather
 * than `experimental_upgradeWebSocket`: Vercel's own reference recommends it
 * outside Next.js, and it is what puts `maxPayload` under our control — the
 * upgrade API caps frames at 256 KiB while the backend accepts 2 MB, and a
 * message in between would die mid-flight with no clear error.
 *
 * This whole file is the part that disappears if the WebSocket moves to a
 * long-running container instead. Nothing else in the migration depends on it.
 */
import http from "node:http";
import { WebSocket, WebSocketServer, type RawData } from "ws";
import { getVercelOidcToken } from "@vercel/oidc";

const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN;

/**
 * The mount path is part of the socket.io path on the backend: the middleware
 * stack stops Starlette from stripping the `/ws` prefix, so the upstream path
 * is literally `/ws/socket.io/`.
 */
const UPSTREAM_PATH = process.env.BACKEND_SOCKET_PATH ?? "/ws/socket.io/";

/** Matches `max_http_buffer_size` on the backend (2 MB). */
const MAX_PAYLOAD = Number(process.env.WS_MAX_PAYLOAD ?? 2 * 1024 * 1024);

const OIDC_HEADER =
  process.env.BACKEND_OIDC_HEADER ?? "x-vercel-trusted-oidc-idp-token";

/** Close codes a peer is allowed to send back out; 1005/1006 are local-only. */
function safeCloseCode(code: number): number {
  return code >= 1000 && code <= 4999 && code !== 1005 && code !== 1006
    ? code
    : 1000;
}

function upstreamUrl(requestUrl: string | undefined): string {
  const origin = (BACKEND_ORIGIN ?? "").replace(/\/$/, "");
  const wsOrigin = origin.replace(/^http/, "ws");
  // socket.io carries `EIO` and `transport` in the query string, and the
  // handshake fails without them — keep whatever arrived, drop the local path.
  const queryAt = requestUrl?.indexOf("?") ?? -1;
  const query = queryAt >= 0 ? requestUrl!.slice(queryAt) : "";
  return wsOrigin + UPSTREAM_PATH + query;
}

const server = http.createServer((_req, res) => {
  res.writeHead(426, { "content-type": "text/plain" });
  res.end("Expected a WebSocket upgrade");
});

const wss = new WebSocketServer({ server, maxPayload: MAX_PAYLOAD });

wss.on("connection", async (client, req) => {
  if (!BACKEND_ORIGIN) {
    client.close(1011, "backend not configured");
    return;
  }

  let token: string;
  try {
    token = await getVercelOidcToken();
  } catch {
    client.close(1011, "identity unavailable");
    return;
  }

  // The client can start sending before the upstream handshake finishes —
  // socket.io emits its first packet immediately — so hold frames until open.
  const pending: Array<{ data: RawData; isBinary: boolean }> = [];
  let open = false;

  const clientIp =
    (req.headers["x-vercel-forwarded-for"] as string | undefined) ??
    (req.headers["x-real-ip"] as string | undefined) ??
    req.socket.remoteAddress;

  const upstream = new WebSocket(upstreamUrl(req.url), {
    maxPayload: MAX_PAYLOAD,
    headers: {
      [OIDC_HEADER]: token,
      // Overwrite, never append — same reasoning as the REST proxy.
      ...(clientIp ? { "x-forwarded-for": clientIp } : {}),
      "x-forwarded-proto": "https",
    },
  });

  upstream.on("open", () => {
    open = true;
    for (const frame of pending) {
      upstream.send(frame.data, { binary: frame.isBinary });
    }
    pending.length = 0;
  });

  client.on("message", (data, isBinary) => {
    if (open) upstream.send(data, { binary: isBinary });
    else pending.push({ data, isBinary });
  });
  upstream.on("message", (data, isBinary) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data, { binary: isBinary });
    }
  });

  client.on("close", (code, reason) => {
    pending.length = 0;
    upstream.close(safeCloseCode(code), reason);
  });
  upstream.on("close", (code, reason) => {
    client.close(safeCloseCode(code), reason);
  });

  // An error on either half makes the pair useless — tear both down rather than
  // leaving a half-open socket holding the function open until max duration.
  client.on("error", () => upstream.close(1011, "client error"));
  upstream.on("error", () => {
    if (client.readyState === WebSocket.OPEN) {
      client.close(1011, "upstream error");
    }
  });
});

export default server;
