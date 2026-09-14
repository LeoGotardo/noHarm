/**
 * Runs once, after the suite.
 *
 * A green run ends with the database exactly as it found it. Without this the
 * directory grows by a few hundred accounts every run — which the friend-search
 * tests have to page through, and the moderation queue has to list.
 */
import { purgeE2EData } from "./helpers/cleanup.js";

export default async function globalTeardown() {
  await purgeE2EData("after");
}
