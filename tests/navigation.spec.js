/** TESTING.md → "Navigation / Tabs" and "Theming" */
import { test, expect, openApp, tab, tabBadge } from "./helpers/fixtures.js";
import {
  createUser,
  makeFriends,
  sendMessage,
  sendRequest,
  startStreak,
} from "./helpers/api.js";

/**
 * Whether the navigation survives a pushed screen.
 *
 * It does not on a phone — there is no room for a bar and a screen at once —
 * and it does on a desktop, where the side rail stays put. Same rule, opposite
 * expectation, so the assertion has to know which shell it is looking at.
 */
const navSurvivesPush = () => test.info().project.name === "desktop";

async function expectNavAfterPush(page) {
  const home = tab(page, "Home");
  await (navSurvivesPush()
    ? expect(home).toBeVisible()
    : expect(home).toBeHidden());
}

/**
 * Store a theme preference the way the app does and reload, so it is read
 * both by the pre-paint script in index.html and by `loadTweaks()`.
 */
async function withStoredTheme(page, prefs) {
  await page.evaluate((p) => localStorage.setItem("nh_tweaks", JSON.stringify(p)), prefs);
  await page.reload();
}

test.describe("Brand", () => {
  test("The icon set is wired, and the tab uses the same image as the rest", async ({
    page,
  }) => {
    // `/` alone sends a visitor to the landing page; these read the app's
    // own index.html.
    await page.goto("/?start=login");

    const icons = await page.evaluate(() => ({
      favicon: document.querySelector('link[rel="icon"]')?.getAttribute("href"),
      apple: document.querySelector('link[rel="apple-touch-icon"]')?.getAttribute("href"),
      manifest: document.querySelector('link[rel="manifest"]')?.getAttribute("href"),
      themeColors: [...document.querySelectorAll('meta[name="theme-color"]')].length,
    }));
    expect(icons).toEqual({
      favicon: "/icon.svg",
      apple: "/apple-touch-icon.png",
      manifest: "/manifest.webmanifest",
      themeColors: 2,
    });

    // Every file the manifest and the head point at has to exist: a 404 here
    // is an app that installs with a blank tile and nothing says so.
    for (const path of [
      "/icon.svg",
      "/icon-192.png",
      "/icon-512.png",
      "/apple-touch-icon.png",
      "/manifest.webmanifest",
      "/noharm-mark.svg",
      "/noharm-lockup.svg",
      "/noharm-lockup.png",
      "/og-image.png",
    ]) {
      const res = await page.request.get(path);
      expect(res.status(), path).toBe(200);
    }

    // One image everywhere, the tab included. There used to be a second file
    // that dropped the ring for small sizes; a logo that changes shape by size
    // is two logos, so the tab gets the same drawing as the home screen.
    const icon = await (await page.request.get("/icon.svg")).text();
    expect(icon.match(/<circle/g)).toHaveLength(2);

    // And the simplified file is really gone. Not a 404 check: both the dev
    // server and nginx fall back to index.html for an unknown path, so the
    // question is whether anything still answers with an image.
    const stale = await page.request.get("/favicon.svg");
    expect(stale.headers()["content-type"]).not.toContain("svg");
  });

  test("One drawing: the app, the icon file and the public pages agree", async ({
    page,
  }) => {
    // The check path is the part of the mark that survives every variant, so
    // it is the cheap way to catch a logo that was edited in one place only.
    const CHECK = "M32 52 L44 64 L70 34";

    // `/` alone sends a visitor to the landing page; these read the app's
    // own index.html.
    await page.goto("/?start=login");
    await expect(page.locator(`svg path[d="${CHECK}"]`).first()).toBeVisible();

    for (const path of [
      "/icon.svg",
      "/noharm-mark.svg",
      "/noharm-lockup.svg",
      "/terms.html",
      "/privacy.html",
      "/about.html",
    ]) {
      const body = await (await page.request.get(path)).text();
      expect(body, path).toContain(CHECK);
    }
  });

  test("A shared link previews as something", async ({ page }) => {
    // `/` alone sends a visitor to the landing page; these read the app's
    // own index.html.
    await page.goto("/?start=login");
    const og = await page.evaluate(() =>
      Object.fromEntries(
        [...document.querySelectorAll('meta[property^="og:"], meta[name^="twitter:"]')].map(
          (m) => [m.getAttribute("property") ?? m.getAttribute("name"), m.content],
        ),
      ),
    );
    expect(og["og:image"]).toBe("/og-image.png");
    expect(og["og:title"]).toBe("NoHarm");
    expect(og["twitter:card"]).toBe("summary_large_image");

    // A PNG, not the lockup SVG: that file sets the wordmark in <text>, and no
    // preview renderer loads Figtree — it would draw Arial and a different logo.
    expect(og["og:image"]).not.toMatch(/\.svg$/);
  });
});

test.describe("Notifications", () => {
  test("Lists what is pending — a request and an unread message — and leads to each", async ({
    page,
    userA,
    userB,
  }) => {
    const userC = await createUser("c"); // swept by the global cleanup
    await sendRequest(userB, userA);
    await makeFriends(userA, userC);
    await sendMessage(userC, { to: userA, content: "are you around?" });
    await openApp(page, userA, { checkedInToday: true });

    // Phone: the bell on Home. Desktop: the item in the side rail.
    const opener = navSurvivesPush()
      ? page.locator("nav[aria-label='Main']").getByRole("button", { name: /Notifications/ })
      : page.getByRole("button", { name: /^Notifications/ });
    await expect(opener).toContainText("2");
    await opener.click();

    await expect(page.getByText("Wants to be your friend")).toBeVisible();
    await expect(page.getByText("are you around?")).toBeVisible();

    // A request row leads to the Requests screen, where answering it is confirmed.
    await page.getByText("Wants to be your friend").click();
    await expect(page.getByRole("button", { name: /Received/ })).toBeVisible();
  });

  test("Nothing pending — says so", async ({ appA, page }) => {
    const opener = navSurvivesPush()
      ? page.locator("nav[aria-label='Main']").getByRole("button", { name: /Notifications/ })
      : page.getByRole("button", { name: /^Notifications/ });
    await opener.click();
    await expect(page.getByText("You're all caught up")).toBeVisible();
  });
});

test.describe("Navigation / Tabs", () => {
  test("TabBar — switches between the five tabs", async ({ appA, page }) => {
    await expect(page.getByText("Begin your journey")).toBeVisible();

    await tab(page, "Friends").click();
    await expect(page.getByText("in your circle")).toBeVisible();

    await tab(page, "Chat").click();
    await expect(page.getByText("Messages")).toBeVisible();

    await tab(page, "Community").click();
    await expect(page.getByText("What's on your mind today?")).toBeVisible();

    await tab(page, "Profile").click();
    await expect(page.getByText("current streak")).toBeVisible();

    await tab(page, "Home").click();
    await expect(page.getByText("Begin your journey")).toBeVisible();
  });

  test("TabBar — badges de contador em Friends e Chat", async ({
    page,
    userA,
    userB,
  }) => {
    await makeFriends(userA, userB);
    await sendMessage(userB, { to: userA, content: "ping" });

    await openApp(page, userA, { checkedInToday: true });

    await expect(tabBadge(page, "Chat")).toHaveText("1");
    // No pending requests → no badge on Friends
    await expect(tabBadge(page, "Friends")).toHaveCount(0);
  });

  test("Stack — push esconde a TabBar no celular, rail permanece no desktop", async ({ page, userA }) => {
    await startStreak(userA, 4);
    await openApp(page, userA, { checkedInToday: true });

    await expect(tab(page, "Home")).toBeVisible();

    await page.getByText("Streak history").click();
    await expect(page.getByText("Streak history")).toBeVisible();
    await expectNavAfterPush(page);

    await page.locator("#nh-stage button").first().click();
    await expect(tab(page, "Home")).toBeVisible();
  });

  test("resetTo — switching tabs clears the stack", async ({ appA, page }) => {
    await tab(page, "Friends").click();
    await page.getByRole("button", { name: /Find friends/ }).click();
    await expect(page.getByText("Add friends")).toBeVisible();
    await expectNavAfterPush(page);

    // The bottom bar is hidden while an overlay is up, so pop first, then
    // switch — which is also a valid path on the desktop rail.
    await page.locator("#nh-stage button").first().click();
    await tab(page, "Profile").click();
    await expect(page.getByText("current streak")).toBeVisible();
  });

  test("Transition animation — nhScreenIn on screen change", async ({
    appA,
    page,
  }) => {
    const anim = await page.evaluate(() => {
      const el = document.querySelector("#nh-stage");
      return getComputedStyle(el).animationName;
    });
    expect(anim).toBe("nhScreenIn");
  });
});

test.describe("Theming", () => {
  // Dark mode is switched from Settings (profile.spec.js). Direction and motion
  // have no switch in the app — these hold that a stored choice is honoured
  // and that a value the app does not know never reaches the DOM.
  test("A stored direction is applied", async ({ appA, page }) => {
    await expect(page.locator(".nh-root")).toHaveAttribute("data-dir", "sage");
    await withStoredTheme(page, { direction: "dawn" });
    await expect(page.locator(".nh-root")).toHaveAttribute("data-dir", "dawn");
    await expect(page.locator("html")).toHaveAttribute("data-dir", "dawn");
  });

  test("An unknown stored value falls back to the default", async ({ appA, page }) => {
    await withStoredTheme(page, { direction: "<script>", mode: "neon" });
    await expect(page.locator(".nh-root")).toHaveAttribute("data-dir", "sage");
    await expect(page.locator(".nh-root")).toHaveAttribute("data-mode", "light");
  });

  test("Motion off — no confetti", async ({ appA, page }) => {
    await withStoredTheme(page, { motion: false });
    await expect(page.locator(".nh-root")).toHaveAttribute("data-reduce-motion", "yes");

    await page.getByRole("button", { name: /Start my streak/ }).click();
    await page.getByRole("button", { name: "Begin my streak" }).click();
    await expect(page.getByText("Your streak has begun")).toBeVisible();

    const confetti = await page.evaluate(
      () => document.querySelectorAll('#nh-screen div[style*="z-index: 88"] span').length,
    );
    expect(confetti).toBe(0);
  });
});

test.describe("Public home page", () => {
  test("describes the app and links the documents, without a login", async ({
    page,
  }) => {
    // The page Google's OAuth review opens. What it checks: the app's name,
    // what it does, and a Privacy Policy link — on a page with no sign-in.
    await page.goto("/about.html");
    await expect(page).toHaveTitle(/NoHarm/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator('a[href="/privacy"]').first()).toBeVisible();
    await expect(page.locator('a[href="/terms"]').first()).toBeVisible();
    // Into the app through ?start= — a bare "/" would bounce a visitor with
    // no session straight back here (src/main.jsx).
    await expect(page.locator('a[href="/?start=register"]').first()).toBeVisible();
    await expect(page.locator('a[href="/?start=login"]').first()).toBeVisible();

    // Self-contained like the legal pages: nothing from another origin, so it
    // renders under the CSP and on a reviewer's machine with nothing cached.
    const external = await page.evaluate(() =>
      [...document.querySelectorAll('link[rel="stylesheet"], link[rel~="icon"], script[src], img[src]')]
        .map((el) => el.href || el.src)
        .filter((u) => new URL(u).origin !== location.origin),
    );
    expect(external).toEqual([]);
  });
});
