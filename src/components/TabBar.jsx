import { Icon } from "@ui/Icon.jsx";

// The five tab roots, in order. SideNav renders the same list on desktop, so
// they live here rather than inside a component: two copies drift, and the
// order is what the user learns.
export const TABS = [
  { id: "home", icon: "home", label: "Home" },
  { id: "friends", icon: "friends", label: "Friends" },
  { id: "chat", icon: "chat", label: "Chat" },
  { id: "badges", icon: "badges", label: "Badges" },
  { id: "profile", icon: "profile", label: "Profile" },
];

export function TabBar({ active, onChange, badges = {} }) {
  const tabs = TABS;
  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        display: "flex",
        justifyContent: "space-around",
        alignItems: "flex-start",
        padding: "10px 8px 26px",
        background: "var(--tabbar-bg)",
        backdropFilter: "blur(22px) saturate(170%)",
        WebkitBackdropFilter: "blur(22px) saturate(170%)",
        borderTop: "1px solid var(--border)",
      }}
    >
      {tabs.map((t) => {
        const on = active === t.id;
        const badge = badges[t.id];
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              padding: "4px 0",
              position: "relative",
            }}
          >
            <div style={{ position: "relative" }}>
              <Icon
                name={t.icon}
                size={25}
                color={on ? "var(--primary)" : "var(--ink-3)"}
                sw={on ? 2.1 : 1.8}
                fill={on ? "var(--primary-soft)" : "none"}
              />
              {badge ? (
                <span
                  className="nh-tabbadge"
                  style={{
                    position: "absolute",
                    top: -5,
                    right: -8,
                    minWidth: 17,
                    height: 17,
                    padding: "0 4px",
                    borderRadius: 99,
                    background: "var(--accent)",
                    color: "#fff",
                    fontSize: 10.5,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px solid var(--tabbar-solid)",
                  }}
                >
                  {badge}
                </span>
              ) : null}
            </div>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: on ? 700 : 500,
                color: on ? "var(--primary)" : "var(--ink-3)",
              }}
            >
              {t.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
