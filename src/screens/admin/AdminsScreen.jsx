import {
  CONFIRM_COPY,
  ConfirmSheet,
  EmptyState,
  hashHue,
  Header,
  PersonRow,
  Screen,
} from "@components";
import { Card, Divider, Skeleton } from "@ui";
import { Fragment, useEffect, useState } from "react";
import { demoteAdmin, listAdmins } from "../../services/api/admin.js";

const SOURCE_LABEL = {
  official: "Official account",
  env: "Set in server config",
  granted: "Promoted in the app",
};

/**
 * Who can moderate, for an official account.
 *
 * Promoting happens on a profile (its ⋯ menu), where the person is already in
 * front of you; this screen is the overview and the way back. Only accounts
 * promoted in the app can be removed here — the others come from the server
 * configuration, and the backend refuses to touch them.
 */
export function AdminsScreen({ onBack, onOpenProfile, onError }) {
  const [rows, setRows] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const load = () =>
    listAdmins()
      .then(setRows)
      .catch((e) => {
        setRows([]);
        onError?.(e);
      });

  useEffect(() => {
    load();
  }, []);

  return (
    <Screen geo="profile" padTop={56}>
      <Header title="Administrators" onBack={onBack} />
      <div style={{ padding: "14px var(--pad-x) 0" }}>
        <div
          style={{
            fontSize: 13,
            color: "var(--ink-3)",
            padding: "0 4px 12px",
            lineHeight: 1.5,
          }}
        >
          Admins review reports, sanction accounts, remove posts and see the
          admin board. To add one, open their profile and use the ⋯ menu.
        </div>

        {rows === null ? (
          <Card pad={14}>
            <Skeleton h={48} />
          </Card>
        ) : rows.length === 0 ? (
          <EmptyState
            icon="shield"
            title="No administrators"
            sub="Open someone's profile to make them an admin."
            pad="50px 24px"
          />
        ) : (
          <Card pad={6}>
            {rows.map((r, i) => {
              const name = r.username ?? r.id.slice(0, 8);
              return (
                <Fragment key={r.id}>
                  {i > 0 && <Divider />}
                  <div style={{ padding: "0 8px" }}>
                    <PersonRow
                      person={{
                        id: r.id,
                        username: name,
                        role: r.source === "official" ? "official" : "admin",
                        hue: hashHue(name),
                      }}
                      onClick={() => onOpenProfile?.(r.id)}
                      sub={SOURCE_LABEL[r.source] ?? r.source}
                      right={
                        r.source === "granted" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirm({ id: r.id, name });
                            }}
                            style={{
                              padding: "8px 14px",
                              borderRadius: 11,
                              background: "var(--surface-2)",
                              border: "none",
                              color: "var(--ink-2)",
                              fontSize: 13,
                              fontWeight: 600,
                              cursor: "pointer",
                              fontFamily: "var(--font-body)",
                            }}
                          >
                            Remove
                          </button>
                        )
                      }
                    />
                  </div>
                </Fragment>
              );
            })}
          </Card>
        )}
      </div>

      <ConfirmSheet
        open={!!confirm}
        onClose={() => setConfirm(null)}
        {...(confirm ? CONFIRM_COPY.removeAdmin(confirm.name) : {})}
        onConfirm={async () => {
          try {
            await demoteAdmin(confirm.id);
            setRows((prev) => prev?.filter((r) => r.id !== confirm.id) ?? prev);
          } catch (e) {
            onError?.(e);
            load();
          }
        }}
      />
    </Screen>
  );
}
