// Rasterise the mark into the source images @capacitor/assets expects in
// assets/, from which it generates every Android (and iOS) launcher icon and
// splash screen:
//
//   node scripts/build-app-icons.mjs
//
// Run it again only when the logo or the brand colours change; the PNGs it
// writes are committed. The release build (scripts/build-android-release.sh)
// feeds them to `capacitor-assets generate` after creating android/, which is
// what replaces Capacitor's default icon and splash with these.
//
// Through Chromium (Playwright), never ImageMagick: `convert` drops
// stroke-dasharray, closing the ring — and the open ring is the logo.
//
// The geometry is the mark's (src/components/Logo.jsx, public/icon.svg).
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "assets");

// Hex on purpose, like public/icon.svg: these files are read by tooling far
// older than the app's browsers.
const PRIMARY = "#558969";
const ON_PRIMARY = "#f9fdfa";
const LIGHT_BG = "#f3f7f2"; // manifest background_color
const DARK_BG = "#18241d"; // sage dark --bg, oklch(0.215 0.016 158)

/** The mark on a 100×100 box: track, open ring, check. */
const mark = (color, trackOpacity) => `
  <circle cx="50" cy="50" r="42" fill="none" stroke="${color}" stroke-width="6" opacity="${trackOpacity}"/>
  <circle cx="50" cy="50" r="42" fill="none" stroke="${color}" stroke-width="7" stroke-linecap="round"
    stroke-dasharray="264" stroke-dashoffset="79" transform="rotate(-90 50 50)"/>
  <path d="M32 52 L44 64 L70 34" fill="none" stroke="${color}" stroke-width="8"
    stroke-linecap="round" stroke-linejoin="round"/>`;

/** An SVG of `size` px with an optional ground and the mark at `fraction` of the side. */
function svg(size, { ground, color, trackOpacity, fraction }) {
  const box = size * fraction;
  const offset = (size - box) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${ground ? `<rect width="${size}" height="${size}" fill="${ground}"/>` : ""}
    <g transform="translate(${offset} ${offset}) scale(${box / 100})">${mark(color, trackOpacity)}</g>
  </svg>`;
}

const IMAGES = [
  // Legacy (non-adaptive) icon: full bleed — the launcher applies its own mask,
  // and rounded corners drawn here would show as transparent notches.
  ["icon-only.png", 1024, { ground: PRIMARY, color: ON_PRIMARY, trackOpacity: 0.32, fraction: 0.575 }],
  // Adaptive icon: the launcher crops to a circle or squircle and may move the
  // layers, so the mark keeps inside the 66/108 safe zone (ring ≈ 47% here).
  ["icon-foreground.png", 1024, { ground: null, color: ON_PRIMARY, trackOpacity: 0.32, fraction: 0.56 }],
  ["icon-background.png", 1024, { ground: PRIMARY, color: PRIMARY, trackOpacity: 0, fraction: 0 }],
  // Splash: the mark small on the app's own background, light and dark.
  ["splash.png", 2732, { ground: LIGHT_BG, color: PRIMARY, trackOpacity: 0.22, fraction: 0.2 }],
  ["splash-dark.png", 2732, { ground: DARK_BG, color: "#8fc4a3", trackOpacity: 0.22, fraction: 0.2 }],
];

await mkdir(out, { recursive: true });
const browser = await chromium.launch();
try {
  for (const [file, size, opts] of IMAGES) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent(
      `<html><body style="margin:0;background:transparent">${svg(size, opts)}</body></html>`,
    );
    await page.locator("svg").screenshot({ path: path.join(out, file), omitBackground: true });
    await page.close();
    console.log(`assets/${file}  ${size}×${size}`);
  }
} finally {
  await browser.close();
}
