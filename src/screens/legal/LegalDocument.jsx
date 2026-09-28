import { Header, Screen } from "@components";
import { LEGAL_DOCUMENTS } from "./legalContent.js";

/**
 * Renders one legal document.
 *
 * Reachable from three places and deliberately the same screen in all three:
 * Settings, the register screen, and the consent gate. A document someone is
 * about to agree to must not be a different page from the one they can read
 * afterwards.
 *
 * `version` comes from the backend (`GET /users/me/consents` → `versions`),
 * not from the content module. The server decides which revision is in force
 * and which one a stored signature refers to; printing a second, local number
 * beside its text is how the two drift.
 */
export function LegalDocument({ docKey, version, onBack }) {
  const doc = LEGAL_DOCUMENTS[docKey];

  if (!doc) {
    return (
      <Screen geo="history" padTop={56}>
        <Header title="Not found" onBack={onBack} />
        <div
          style={{
            padding: "24px var(--pad-x)",
            fontSize: 14,
            color: "var(--ink-2)",
          }}
        >
          That document does not exist.
        </div>
      </Screen>
    );
  }

  return (
    <Screen geo="history" padTop={56}>
      <Header title={doc.title} onBack={onBack} />
      <div
        style={{
          padding: "8px var(--pad-x) 28px",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        {doc.draft && (
          <div
            style={{
              padding: "12px 14px",
              borderRadius: 14,
              background: "var(--accent-soft)",
              color: "var(--accent-ink)",
              fontSize: 13,
              lineHeight: 1.5,
              fontWeight: 500,
            }}
          >
            This document is still being written. The headings below are the
            outline; the text under them is not final and should not be relied
            on.
          </div>
        )}

        {version && (
          <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
            Version {version}
          </div>
        )}

        {doc.sections.map((section) => (
          <section key={section.heading}>
            <h2
              style={{
                fontSize: 15.5,
                fontWeight: 700,
                color: "var(--ink)",
                margin: "0 0 7px",
              }}
            >
              {section.heading}
            </h2>
            <p
              style={{
                fontSize: 14,
                lineHeight: 1.6,
                color: "var(--ink-2)",
                margin: 0,
              }}
            >
              {section.body}
            </p>
          </section>
        ))}
      </div>
    </Screen>
  );
}
