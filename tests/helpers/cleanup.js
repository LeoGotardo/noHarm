/**
 * Wipe everything a run leaves behind.
 *
 * The suite creates throwaway accounts by the hundred, and `DELETE /users/me`
 * is a **soft** delete — status 2 and a clock, kept for
 * `ACCOUNT_DELETION_GRACE_DAYS` so a real user can change their mind. Nothing
 * in the request path ever hard-deletes; that is `jobs/purgeAccounts.py`, which
 * refuses to touch anything inside its 30-day window. So a suite that only
 * "deleted" its accounts left every one of them in the database, along with
 * their streaks, chats, messages, reports, evidence, notices and audit trail.
 * Three thousand rows in, that is a directory the friend-search tests have to
 * page through and a `GET /reports` queue with thousands of entries.
 *
 * This is the sweep, run before and after every suite:
 *
 * - **before**, so a run that was killed mid-way (Ctrl-C, a crashed worker)
 *   does not leave its accounts for ever — nothing else would ever clean them;
 * - **after**, so an ordinary green run ends with the database as it started.
 *
 * Everything is matched on the `e2e` uid prefix that `createUser` mints, so it
 * cannot touch a real account. It is SQL rather than the API because the API
 * deliberately has no way to do this — see above.
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { API_URL, createUser, deleteBadgesByPrefix } from "./api.js";

const run = promisify(execFile);

const DB_CONTAINER = process.env.E2E_DB_CONTAINER ?? "postgres_db";
const DB_NAME = process.env.E2E_DB_NAME ?? "noharm-db";
const DB_USER = process.env.E2E_DB_USER ?? "root";
const REDIS_CONTAINER = process.env.E2E_REDIS_CONTAINER ?? "redis_cache";

/** The badge catalogue is global and its names are encrypted — see below. */
const BADGE_PREFIX = "E2E ";

/**
 * Order matters, and the foreign keys are why.
 *
 * `tb_7` (audit logs) and `tb_10` (reports) point at `tb_0` with ON DELETE SET
 * NULL, on purpose: the record that something happened has to outlive the
 * account it describes. That makes them unmatchable once the user is gone, so
 * they go first, while they still name a uid. Everything else — streaks,
 * friendships, chats and their messages, user badges, tokens, notices —
 * cascades from `tb_0` and needs no statement of its own.
 */
const STATEMENTS = [
  ["audit logs", "DELETE FROM tb_7 WHERE cl_7c LIKE 'e2e%'"],
  [
    "report evidence",
    "DELETE FROM tb_11 WHERE cl_11b IN (" +
      "SELECT cl_10a FROM tb_10 WHERE cl_10b LIKE 'e2e%' OR cl_10g LIKE 'e2e%')",
  ],
  ["reports", "DELETE FROM tb_10 WHERE cl_10b LIKE 'e2e%' OR cl_10g LIKE 'e2e%'"],
  ["moderation notices", "DELETE FROM tb_12 WHERE cl_12b LIKE 'e2e%'"],
  ["accounts (cascades the rest)", "DELETE FROM tb_0 WHERE cl_0a LIKE 'e2e%'"],
  // `DELETE /badges/{id}` is a soft delete too, and the badge catalogue is
  // global — `badges.spec.js` creates one of its own on every run and
  // "deletes" it afterwards, leaving a row the API can no longer see or
  // remove. Nothing but SQL can, so a status-2 badge is residue by
  // definition here. The awarded rows that point at it go first: tb_6's
  // foreign key into tb_5 does not cascade.
  [
    "awarded stale badges",
    "DELETE FROM tb_6 WHERE cl_6c IN (SELECT cl_5a FROM tb_5 WHERE cl_5f = 2)",
  ],
  ["deleted badges", "DELETE FROM tb_5 WHERE cl_5f = 2"],
];

let warned = false;

function warnOnce(reason) {
  if (warned) return;
  warned = true;
  console.warn(
    `[e2e] could not clean the database: ${reason}\n` +
      `[e2e] the run will leave its accounts behind. Set E2E_DB_CONTAINER if the ` +
      `container has another name; against a remote backend there is nothing to ` +
      `exec into and the purge in tests/README.md has to be run by hand.`,
  );
}

async function psql(sql) {
  const { stdout } = await run("docker", [
    "exec",
    DB_CONTAINER,
    "psql",
    "-U",
    DB_USER,
    "-d",
    DB_NAME,
    "-tA",
    "-c",
    sql,
  ]);
  return stdout.trim();
}

/**
 * Delete the badges a run created.
 *
 * Not SQL: `tb_5.cl_5b` is encrypted, so the prefix is invisible to the
 * database and the catalogue is shared with every other row — a blind
 * `DELETE FROM tb_5` would take the real badges with it. The API is the only
 * thing that can read a name, so this needs an account, and it has to happen
 * before the accounts are deleted.
 */
async function sweepBadges() {
  let sweeper = null;
  try {
    sweeper = await createUser("clean");
    const removed = await deleteBadgesByPrefix(sweeper, BADGE_PREFIX);
    return removed;
  } catch {
    // The backend may simply not be up (a teardown after a failed run). The
    // SQL below still runs, and the badges are swept by the next run's
    // `beforeAll` in badges.spec.js.
    return 0;
  }
}

/**
 * Remove every trace of the suite. Best effort: never throws, so a teardown
 * can never fail a green run.
 *
 * @param {string} phase  "before" | "after", for the log line only
 */
export async function purgeE2EData(phase = "after") {
  let badges = 0;
  try {
    badges = await sweepBadges();
  } catch {
    /* covered inside */
  }

  const removed = [];
  try {
    for (const [label, sql] of STATEMENTS) {
      const out = await psql(sql);
      const count = Number(out.replace(/^DELETE\s+/, "")) || 0;
      if (count > 0) removed.push(`${count} ${label}`);
    }

    // Socket counters are left at 0 with a 24h TTL when a socket closes — the
    // decrement is right, the key just is not deleted. Harmless, but it is
    // residue, and a run that ends should end.
    await run("docker", [
      "exec",
      REDIS_CONTAINER,
      "sh",
      "-c",
      "for p in 'ws:conn:*' 'ws:conns:*'; do redis-cli --scan --pattern \"$p\" | xargs -r redis-cli DEL; done",
    ]).catch(() => {});
  } catch (e) {
    warnOnce(e.message.split("\n")[0]);
    return;
  }

  if (badges > 0) removed.push(`${badges} badges`);
  console.log(
    removed.length > 0
      ? `[e2e] cleaned ${phase} the run: ${removed.join(", ")}`
      : `[e2e] nothing to clean ${phase} the run`,
  );
}

/**
 * Erase one account, the way the global sweep erases all of them.
 *
 * Scoped to a single uid on purpose: the whole-database purge is for setup and
 * teardown, and calling it from inside a test would delete the accounts of
 * every test running in parallel.
 */
export async function purgeUid(uid) {
  if (!/^[A-Za-z0-9_-]+$/.test(uid)) throw new Error(`refusing to purge "${uid}"`);
  try {
    await psql(`DELETE FROM tb_7 WHERE cl_7c = '${uid}'`);
    await psql(`DELETE FROM tb_0 WHERE cl_0a = '${uid}'`);
  } catch (e) {
    warnOnce(e.message.split("\n")[0]);
  }
}

/** Whether a given uid is still a row in `tb_0` — soft-deleted or not. */
export async function rowsFor(uid) {
  try {
    return Number(await psql(`SELECT count(*) FROM tb_0 WHERE cl_0a = '${uid}'`));
  } catch (e) {
    warnOnce(e.message.split("\n")[0]);
    return null;
  }
}

/** How many rows the suite currently has in the database — used by its own test. */
export async function countE2EResidue() {
  const sql =
    "SELECT (SELECT count(*) FROM tb_0 WHERE cl_0a LIKE 'e2e%')" +
    " + (SELECT count(*) FROM tb_7 WHERE cl_7c LIKE 'e2e%')" +
    " + (SELECT count(*) FROM tb_10 WHERE cl_10b LIKE 'e2e%' OR cl_10g LIKE 'e2e%')" +
    " + (SELECT count(*) FROM tb_12 WHERE cl_12b LIKE 'e2e%')";
  try {
    return Number(await psql(sql));
  } catch (e) {
    warnOnce(e.message.split("\n")[0]);
    return null;
  }
}

export { API_URL };
