/**
 * Runs once, before the suite.
 *
 * Cleans up whatever a previous run left behind — a run killed with Ctrl-C
 * never reaches its teardown, and nothing else in the system would ever remove
 * those accounts (the backend only soft-deletes; the purge job refuses
 * anything inside its 30-day grace window).
 */
import { purgeE2EData } from "./helpers/cleanup.js";

export default async function globalSetup() {
  await purgeE2EData("before");
}
