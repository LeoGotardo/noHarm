import { Avatar, Icon } from "@ui";

export function PersonRow({ person, right, onClick, sub }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 13,
        padding: "11px 4px",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <Avatar
        name={person.username}
        size={48}
        hue={person.hue}
        online={person.online}
        src={person.profile_picture}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15.5, fontWeight: 600, color: "var(--ink)" }}>
          {person.username}
        </div>
        <div
          style={{
            fontSize: 13,
            color: "var(--ink-3)",
            marginTop: 1,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {sub ??
            (person.streak != null ? (
              <>
                <Icon name="flame" size={13} color="var(--primary)" sw={1.6} />
                <span>{person.streak} day streak</span>
                {person.online === false && person.lastSeen && (
                  <span>· {person.lastSeen}</span>
                )}
              </>
            ) : (
              <span>{person.online ? "Online now" : "Offline"}</span>
            ))}
        </div>
      </div>
      {right}
    </div>
  );
}
