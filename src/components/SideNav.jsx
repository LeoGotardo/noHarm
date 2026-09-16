import { Icon } from "@ui/Icon.jsx";
import { useGuardedCallback } from "@ui/guards.js";
import { Logo } from "./Logo.jsx";
import { TABS } from "./TabBar.jsx";

/**
 * The desktop counterpart of TabBar: the same five roots, down the left edge.
 *
 * It sits inside `#nh-screen` rather than beside it, so every sheet, banner and
 * modal — all of them `position: absolute; inset: 0` in that same layer — keeps
 * covering the rail too. A dialog that dims the screen but leaves the
 * navigation lit reads as still clickable.
 *
 * Unlike the tab bar, this stays visible while a screen is pushed on the
 * stack: the bar is hidden there because a phone has no room for both, and a
 * desktop does.
 */
export function SideNav({ active, onChange, badges = {} }) {
  return (
    <nav
      aria-label="Main"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        bottom: 0,
        width: "var(--nav-w)",
        zIndex: 40,
        display: "flex",
        flexDirection: "column",
        gap: 4,
        padding: "22px 14px",
        background: "var(--tabbar-solid)",
        borderRight: "1px solid var(--border)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 11,
          padding: "0 8px 18px",
        }}
      >
        <Logo size={32} />
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: "var(--display-weight)",
            fontSize: 20,
            color: "var(--ink)",
            letterSpacing: -0.4,
          }}
        >
          No<span style={{ color: "var(--primary)" }}>Harm</span>
        </div>
      </div>

      {TABS.map((t) => (
        <NavItem
          key={t.id}
          tab={t}
          on={active === t.id}
          badge={badges[t.id]}
          onSelect={onChange}
        />
      ))}
    </nav>
  );
}

function NavItem({ tab, on, badge, onSelect }) {
  // Same guard the tab bar gets through resetTo — a double click must not
  // replay the tab change mid-animation.
  const select = useGuardedCallback(() => onSelect(tab.id));
  return (
    <button
      className="nh-navitem"
      onClick={select}
      aria-current={on ? "page" : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: "100%",
        padding: "11px 12px",
        border: "none",
        borderRadius: 14,
        cursor: "pointer",
        textAlign: "left",
        background: on ? "var(--primary-soft)" : "transparent",
        color: on ? "var(--primary)" : "var(--ink-2)",
      }}
    >
      <Icon
        name={tab.icon}
        size={22}
        color={on ? "var(--primary)" : "var(--ink-3)"}
        sw={on ? 2.1 : 1.8}
        fill={on ? "var(--primary-soft)" : "none"}
      />
      <span style={{ flex: 1, fontSize: 14.5, fontWeight: on ? 700 : 600 }}>
        {tab.label}
      </span>
      {badge ? (
        <span
          className="nh-tabbadge"
          style={{
            minWidth: 20,
            height: 20,
            padding: "0 6px",
            borderRadius: 99,
            background: "var(--accent)",
            color: "#fff",
            fontSize: 11,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {badge}
        </span>
      ) : null}
    </button>
  );
}
