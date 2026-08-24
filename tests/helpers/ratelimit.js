/**
 * Rate-limit reset between tests.
 *
 * There are two limiters, and both have to be cleared:
 *
 *   `rl:*`      the global middleware — 60 requests/minute per client IP
 *   `LIMITS:*`  a much tighter per-route limiter, e.g. `POST /auth/register`
 *               at 5/min, `/auth/login` at 10/min, `/users/me` at 5/min
 *
 * A single screen load costs ~10 requests, so the whole suite does not fit in
 * one bucket.
 *
 * Tests used to dodge this by sending a per-test `X-Forwarded-For`. That only
 * worked while the backend trusted the header from anyone — it now honours it
 * only from a peer inside `TRUSTED_PROXIES`, so forging it is at best a no-op
 * and at worst a dev-only accident. The supported move is to clear the counter
 * between tests instead.
 *
 * Only those two prefixes are deleted, never the whole database. The same Redis
 * holds `jti:*` (issued JWT ids) and `ws:conn:*` (per-user socket counters
 * enforcing `too_many_connections`) — a `FLUSHDB` would invalidate live sessions
 * and corrupt socket accounting for every other worker mid-run.
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);

const CONTAINER = process.env.E2E_REDIS_CONTAINER ?? "redis_cache";

/** Set once the reset is known to be impossible, so we warn only one time. */
let disabled = false;

/**
 * Drop every rate-limit counter.
 *
 * Deleting another worker's counter is harmless — it only ever grants more
 * quota, it cannot invalidate an assertion.
 *
 * Best effort: against a remote backend there is no local container to exec
 * into, so the reset is skipped with a single warning rather than failing the
 * run.
 */
export async function clearRateLimit() {
  if (disabled) return;
  try {
    await run("docker", [
      "exec",
      CONTAINER,
      "sh",
      "-c",
      "for p in 'rl:*' 'LIMITS:*'; do " +
        "redis-cli --scan --pattern \"$p\" | xargs -r redis-cli DEL; done",
    ]);
  } catch (e) {
    disabled = true;
    console.warn(
      `[e2e] could not reset the rate limit via "docker exec ${CONTAINER}": ` +
        `${e.message.split("\n")[0]}\n` +
        `[e2e] the suite shares one 60 req/min bucket — expect 429s. ` +
        `Set E2E_REDIS_CONTAINER if the container has another name.`,
    );
  }
}
