/**
 * REST proxy: the front-end's own origin becomes the only public entrance to
 * the backend.
 *
 * The backend is private and only reachable from Vercel projects authorised via
 * Trusted Sources. `noHarm` is a static build with no runtime of its own, so it
 * cannot present the OIDC token that proves which project a request comes from
 * — this function is what makes the project a legitimate origin. It runs in the
 * same deployment as the static assets, so the token is issued for this project.
 *
 * Everything under `/api/*` is forwarded verbatim to `BACKEND_ORIGIN` with the
 * `/api` prefix stripped: `/api/users/me` → `${BACKEND_ORIGIN}/users/me`.
 */
import { ipAddress } from "@vercel/functions";
import { getVercelOidcToken } from "@vercel/oidc";

/** Origin of the private backend, e.g. `https://noharm-back.vercel.app`. */
const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN;

/**
 * Header the backend reads the project's OIDC token from.
 *
 * Vercel's own "connect to your own API" guide puts the token in
 * `Authorization: Bearer`, but that slot already carries the end user's app
 * JWT, so the two cannot share it. The name lives in an env var so a mismatch
 * with the backend is a config change, not a deploy.
 */
const OIDC_HEADER =
  process.env.BACKEND_OIDC_HEADER ?? "x-vercel-trusted-oidc-idp-token";

/**
 * Headers that must never reach the backend.
 *
 * `host` would announce the proxy's domain; the hop-by-hop headers describe
 * this connection, not the next one; `content-length` is recomputed by fetch;
 * and every `x-forwarded-*` / `x-vercel-*` the client sent is unverified input
 * — the values that matter are set again below from what the edge observed.
 */
const STRIPPED = [
  "host",
  "connection",
  "keep-alive",
  "transfer-encoding",
  "upgrade",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "content-length",
];

/** Response headers that describe the upstream connection, not ours. */
const STRIPPED_RESPONSE = [
  "connection",
  "keep-alive",
  "transfer-encoding",
  // fetch already decoded the body, so announcing the original encoding (and
  // its length) would make the browser try to decode it a second time.
  "content-encoding",
  "content-length",
];

function buildHeaders(req: Request): Headers {
  const headers = new Headers(req.headers);
  for (const name of STRIPPED) headers.delete(name);
  // Collected first: deleting while iterating a Headers object is undefined.
  const unverified: string[] = [];
  headers.forEach((_value, name) => {
    if (name.startsWith("x-forwarded-") || name.startsWith("x-vercel-")) {
      unverified.push(name);
    }
  });
  for (const name of unverified) headers.delete(name);

  // Overwrite, never append. The backend reads the X-Forwarded-For chain from
  // right to left; if anything the client sent survived, a patched APK could
  // inject a fake hop and walk out of its rate-limit bucket.
  const clientIp = ipAddress(req);
  if (clientIp) headers.set("x-forwarded-for", clientIp);
  headers.set("x-forwarded-proto", "https");

  return headers;
}

async function forward(req: Request): Promise<Response> {
  if (!BACKEND_ORIGIN) {
    return Response.json(
      { message: "BACKEND_ORIGIN is not configured." },
      { status: 500 },
    );
  }

  const url = new URL(req.url);
  const target =
    BACKEND_ORIGIN.replace(/\/$/, "") +
    url.pathname.replace(/^\/api/, "") +
    url.search;

  const headers = buildHeaders(req);
  try {
    headers.set(OIDC_HEADER, await getVercelOidcToken());
  } catch {
    return Response.json(
      { message: "Could not obtain the deployment identity token." },
      { status: 502 },
    );
  }

  // GET/HEAD carry no body; anything else is streamed through, which undici
  // only allows with an explicit half-duplex declaration.
  const hasBody = req.method !== "GET" && req.method !== "HEAD";

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: req.method,
      headers,
      body: hasBody ? req.body : undefined,
      redirect: "manual",
      ...(hasBody ? { duplex: "half" } : {}),
    } as RequestInit);
  } catch (e) {
    return Response.json(
      { message: `Backend unreachable: ${(e as Error).message}` },
      { status: 502 },
    );
  }

  const responseHeaders = new Headers(upstream.headers);
  for (const name of STRIPPED_RESPONSE) responseHeaders.delete(name);

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

// One fetch handler covers every method — the app uses GET, POST, PUT and
// DELETE, and a per-method export would have to be kept in sync by hand.
export default { fetch: forward };
