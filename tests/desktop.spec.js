/**
 * The desktop shell — what changes past the 900px breakpoint, and what must
 * not. Everything here is layout: the flows themselves are covered by the
 * phone-sized specs, which this project re-runs at desktop width.
 */
import { expect, openApp, tab, test } from "./helpers/fixtures.js";
import { makeFriends, sendMessage, startStreak } from "./helpers/api.js";

test.use({ viewport: { width: 1440, height: 900 } });

test.describe("Desktop shell", () => {
  test("Side rail replaces the bottom tab bar, and survives a pushed screen", async ({
    appA,
    page,
  }) => {
    const rail = page.locator("nav[aria-label='Main']");
    await expect(rail).toBeVisible();
    await expect(rail).toHaveCSS("width", "240px");

    // The tab bar is the thing with a top border pinned to the bottom; on a
    // desktop it must not be rendered at all.
    await expect(page.locator("nav[aria-label='Main'] button")).toHaveCount(5);

    // The bottom bar hides behind a pushed screen. The rail does not.
    await tab(page, "Profile").click();
    await page.locator("#nh-stage button").first().click(); // gear → Settings
    await expect(page.getByText("Appearance")).toBeVisible();
    await expect(rail).toBeVisible();
  });

  test("Content sits in a centred column, not stretched across the window", async ({
    appA,
    page,
  }) => {
    await tab(page, "Badges").click();
    await expect(page.getByText("All milestones")).toBeVisible();

    const box = await page.getByText("All milestones").boundingBox();
    // Centred in the area right of the 240px rail, and nowhere near 1440 wide.
    expect(box.x).toBeGreaterThan(240);
    expect(box.x).toBeLessThan(700);
  });

  test("Badges grid uses the width — more than the phone's three columns", async ({
    appA,
    page,
  }) => {
    await tab(page, "Badges").click();
    await expect(page.getByText("All milestones")).toBeVisible();
    const cols = await page.waitForFunction(() => {
      const grid = [...document.querySelectorAll("div")].find(
        (d) => getComputedStyle(d).display === "grid" && d.children.length > 3,
      );
      if (!grid) return false;
      return getComputedStyle(grid).gridTemplateColumns.split(" ").length;
    });
    expect(await cols.jsonValue()).toBeGreaterThan(3);
  });

  test("A sheet becomes a centred dialog", async ({ userA, page }) => {
    await openApp(page, userA, { checkedInToday: true });
    await startStreak(userA, 5);
    await page.reload();
    await page.getByText("I relapsed").click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const box = await dialog.boundingBox();
    expect(box.width).toBeLessThanOrEqual(460);
    // Centred, not pinned to the bottom edge.
    expect(box.y).toBeGreaterThan(100);
    expect(box.y + box.height).toBeLessThan(900);

    // Escape closes it — the desktop's back gesture.
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("Chat is two panes: the list stays while a conversation is open", async ({
    userA,
    userB,
    page,
  }) => {
    await makeFriends(userA, userB);
    await sendMessage(userB, { to: userA, content: "still here with you" });
    await openApp(page, userA, { checkedInToday: true });

    await tab(page, "Chat").click();
    await expect(page.getByText("Messages")).toBeVisible();

    // Nothing selected yet: the detail pane says so.
    await expect(page.getByText("No conversation open")).toBeVisible();

    await page.getByText("still here with you").first().click();
    // The transcript opened *and* the list is still on screen.
    await expect(page.getByPlaceholder("Message…")).toBeVisible();
    await expect(page.getByText("Messages")).toBeVisible();

    // Escape closes the conversation and returns the empty pane.
    await page.keyboard.press("Escape");
    await expect(page.getByText("No conversation open")).toBeVisible();
  });
});
