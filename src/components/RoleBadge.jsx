import { Icon } from "@ui";

// The mark beside a name. `role` comes from the backend on every user object
// (UserResponse.role, derived from its allowlists — see noHarmBack
// core/roles.py): "official" for NoHarm's own accounts, "admin" for
// moderators, null for everyone else, who get nothing drawn.
//
// Official is filled and admin is outlined, so the two read apart at a glance
// and in every theme without a colour of their own: the fill is the theme's
// --primary, which is also why it follows sage and dawn.
const ROLES = {
  official: {
    label: "Official",
    icon: "official",
    title: "Official NoHarm account",
    style: { background: "var(--primary)", color: "var(--on-primary)" },
  },
  admin: {
    label: "Admin",
    icon: "shield",
    title: "NoHarm moderator",
    style: {
      background: "var(--surface-2)",
      color: "var(--ink-2)",
      boxShadow: "inset 0 0 0 1px var(--border)",
    },
  },
};

export function RoleBadge({ role, size = "sm" }) {
  const r = ROLES[role];
  if (!r) return null;
  const md = size === "md";
  return (
    <span
      title={r.title}
      className="nh-role"
      data-role={role}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: md ? 5 : 3,
        padding: md ? "3px 10px 3px 7px" : "2px 7px 2px 5px",
        borderRadius: 99,
        fontSize: md ? 12.5 : 10.5,
        fontWeight: 700,
        letterSpacing: 0.2,
        lineHeight: 1.2,
        whiteSpace: "nowrap",
        flexShrink: 0,
        verticalAlign: "middle",
        ...r.style,
      }}
    >
      <Icon name={r.icon} size={md ? 14 : 12} sw={2.2} />
      {r.label}
    </span>
  );
}
