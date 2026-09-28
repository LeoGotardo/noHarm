// Regenerates public/terms.html and public/privacy.html from
// src/screens/legal/legalContent.js — the in-app text is the source, and the
// public copies (served without a login, and the URL an app store review
// opens) must never say something different. Run after editing the content:
//
//   npm run legal
//
// Only the part after `<p class="meta">` is rewritten; the head, the styles
// and the inline logo stay as they are in each file.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { LEGAL_DOCUMENTS } from "../src/screens/legal/legalContent.js";

const esc = (t) =>
  t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const DRAFT =
  '<div class="draft">\n  This is a draft awaiting review. It describes how NoHarm works today, but it\n  is not yet the final text.\n</div>\n';

for (const key of ["terms", "privacy"]) {
  const doc = LEGAL_DOCUMENTS[key];
  const path = fileURLToPath(new URL(`../public/${key}.html`, import.meta.url));
  const html = readFileSync(path, "utf8");

  const sections = doc.sections
    .map((s) => {
      const blocks = s.body.map((b) =>
        typeof b === "string"
          ? `<p>${esc(b)}</p>`
          : `<ul>\n${b.list.map((i) => `  <li>${esc(i)}</li>`).join("\n")}\n</ul>`,
      );
      return `<h2>${esc(s.heading)}</h2>\n${blocks.join("\n")}`;
    })
    .join("\n\n");

  const meta = html.indexOf('<p class="meta">');
  if (meta < 0) throw new Error(`${path}: no <p class="meta"> to anchor on`);
  const head = html.slice(0, html.indexOf("\n", meta) + 1);

  writeFileSync(
    path,
    `${head}\n${doc.draft ? DRAFT + "\n" : ""}${sections}\n</body>\n</html>\n`,
  );
  console.log(`wrote ${path}`);
}
