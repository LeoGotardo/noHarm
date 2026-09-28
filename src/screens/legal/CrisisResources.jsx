import { Header, Screen } from "@components";
import { Card, Icon, SectionLabel } from "@ui";
import { CRISIS_RESOURCES } from "./crisisResources.js";

/**
 * The screen the Terms point at when they say NoHarm is not medical care.
 *
 * That clause is the one sentence in the terms that must not be softened, and
 * a disclaimer with nowhere to send anyone is only half of it: telling someone
 * this is not treatment, and then offering them nothing else, is the version of
 * the sentence that helps nobody.
 *
 * It is reachable from Settings and from nothing that requires a streak, a
 * friend or a working connection to load — the numbers are in the bundle, not
 * behind a request. The screen deliberately has no illustration, no
 * encouragement and no copy about recovery: someone who opens this is not here
 * to be motivated.
 */
export function CrisisResources({ onBack }) {
  return (
    <Screen geo="history" padTop={56}>
      <Header title="Crisis resources" onBack={onBack} />

      <div
        style={{
          padding: "8px var(--pad-x) 0",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        <div
          style={{
            fontSize: 14,
            color: "var(--ink-2)",
            lineHeight: 1.6,
            padding: "0 2px",
          }}
        >
          NoHarm is a tracker and a place to talk to other people in recovery.
          It is not treatment, not a clinician and not an emergency service. If
          you are in danger or thinking of hurting yourself, use one of these
          instead.
        </div>

        <div>
          <SectionLabel>If it cannot wait</SectionLabel>
          <Card pad={8}>
            {CRISIS_RESOURCES.emergency.lines.map((line, i) => (
              <Line
                key={line.number}
                line={line}
                urgent
                last={i === CRISIS_RESOURCES.emergency.lines.length - 1}
              />
            ))}
          </Card>
        </div>

        <div>
          <SectionLabel>Someone to talk to</SectionLabel>
          <Card pad={8}>
            {CRISIS_RESOURCES.support.lines.map((line, i) => (
              <Line
                key={line.name}
                line={line}
                last={i === CRISIS_RESOURCES.support.lines.length - 1}
              />
            ))}
          </Card>
        </div>

        <div>
          <SectionLabel>Outside Brazil</SectionLabel>
          <Card pad={8}>
            {CRISIS_RESOURCES.international.lines.map((line) => (
              <Line key={line.name} line={line} last />
            ))}
          </Card>
        </div>

        <div
          style={{
            fontSize: 12,
            color: "var(--ink-3)",
            lineHeight: 1.55,
            padding: "0 4px 8px",
          }}
        >
          These services are independent of NoHarm. Nothing you do here is
          reported to them, and nothing you say to them reaches us.
        </div>
      </div>
    </Screen>
  );
}

/**
 * One resource.
 *
 * A number is a `tel:` link and the rest is a plain link — both are anchors
 * rather than buttons so a long-press can copy them, which is what someone
 * does when they want to dial from another phone.
 */
function Line({ line, urgent, last }) {
  const href = line.number ? `tel:${line.number.replace(/\s/g, "")}` : line.url;

  return (
    <a
      href={href}
      target={line.number ? undefined : "_blank"}
      rel={line.number ? undefined : "noreferrer"}
      className="nh-tap nh-tap-row"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 13,
        padding: "13px 6px",
        textDecoration: "none",
        borderBottom: last ? "none" : "1px solid var(--border)",
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 11,
          flexShrink: 0,
          background: urgent ? "var(--accent-soft)" : "var(--surface-2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon
          name={line.number ? "heart" : "share"}
          size={19}
          color={urgent ? "var(--accent-ink)" : "var(--ink-2)"}
        />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "var(--ink)",
            display: "flex",
            alignItems: "baseline",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          {line.name}
          {line.number && (
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: "var(--display-weight)",
                fontSize: 17,
                color: urgent ? "var(--accent-ink)" : "var(--primary)",
              }}
            >
              {line.number}
            </span>
          )}
        </div>
        {line.note && (
          <div
            style={{
              fontSize: 12.5,
              color: "var(--ink-3)",
              marginTop: 2,
              lineHeight: 1.45,
            }}
          >
            {line.note}
          </div>
        )}
      </div>
    </a>
  );
}
