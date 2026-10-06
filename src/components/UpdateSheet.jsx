import { BottomSheet } from "./BottomSheet.jsx";
import { Btn, Icon } from "@ui";
import { useEffect, useState } from "react";
import { AppUpdater, checkForUpdate } from "../services/appUpdate.js";

/**
 * Offers the new APK when the app opens. Only on Android, online, and when the
 * latest GitHub release is newer than what is installed — see
 * services/appUpdate.js. Everywhere else it renders nothing, ever.
 *
 * Stages: offer → downloading → (permission) → installing, or error. Android
 * shows its own confirmation once the APK is handed over; the app cannot
 * install anything by itself, which is why "installing" keeps a button to hand
 * it over again.
 */
export function UpdateSheet() {
  const [update, setUpdate] = useState(null);
  const [stage, setStage] = useState({ kind: "offer" });

  useEffect(() => {
    let cancelled = false;
    checkForUpdate().then((found) => {
      if (!cancelled) setUpdate(found);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!update) return null;

  const busy = stage.kind === "downloading";
  const close = () => {
    if (!busy) setUpdate(null);
  };

  const install = async (path) => {
    const { granted } = await AppUpdater.canInstall();
    if (!granted) {
      setStage({ kind: "permission", path, denied: false });
      return;
    }
    setStage({ kind: "installing", path });
    try {
      await AppUpdater.install({ path });
    } catch {
      setStage({ kind: "error" });
    }
  };

  const start = async () => {
    setStage({ kind: "downloading", percent: null });
    const listener = await AppUpdater.addListener("downloadProgress", ({ loaded, total }) => {
      setStage({
        kind: "downloading",
        percent: total > 0 ? Math.round((loaded / total) * 100) : null,
      });
    });
    try {
      const { path } = await AppUpdater.download({ url: update.apkUrl, fileName: update.apkName });
      await install(path);
    } catch {
      setStage({ kind: "error" });
    } finally {
      await listener.remove();
    }
  };

  const allowSource = async (path) => {
    const { granted } = await AppUpdater.openInstallSettings();
    if (granted) await install(path);
    else setStage({ kind: "permission", path, denied: true });
  };

  const COPY = {
    offer: `NoHarm ${update.version} is ready. Your streak, friends and chats stay exactly as they are.`,
    downloading:
      stage.percent == null ? "Downloading the update…" : `Downloading the update… ${stage.percent}%`,
    permission:
      "Android needs your permission to install apps from NoHarm. Tap Allow, switch it on, and come back.",
    installing: "Confirm the installation on Android's screen.",
    error: "The update could not be downloaded or installed. Check your connection and try again.",
  };

  const later = (
    <Btn kind="ghost" size="lg" full onClick={close}>
      Not now
    </Btn>
  );
  const ACTIONS = {
    offer: (
      <Btn kind="primary" size="lg" full onClick={start}>
        Update
      </Btn>
    ),
    permission: (
      <Btn kind="primary" size="lg" full onClick={() => allowSource(stage.path)}>
        Allow
      </Btn>
    ),
    installing: (
      <Btn kind="primary" size="lg" full onClick={() => install(stage.path)}>
        Install
      </Btn>
    ),
    error: (
      <Btn kind="primary" size="lg" full onClick={start}>
        Try again
      </Btn>
    ),
  };

  return (
    <BottomSheet open onClose={busy ? undefined : close}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "var(--primary-soft)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="download" size={24} color="var(--primary)" />
          </div>
        </div>

        <div
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: "var(--ink)",
            textAlign: "center",
            fontFamily: "var(--font-display)",
          }}
        >
          A new version is available
        </div>

        <div
          style={{
            fontSize: 14,
            color: "var(--ink-2)",
            textAlign: "center",
            lineHeight: 1.55,
            padding: "6px 6px 2px",
          }}
        >
          {COPY[stage.kind]}
        </div>

        {stage.kind === "permission" && stage.denied && (
          <div
            style={{
              fontSize: 12.5,
              color: "var(--accent-ink)",
              textAlign: "center",
              padding: "6px 6px 0",
            }}
          >
            The permission is still off.
          </div>
        )}

        {busy && (
          <div
            role="progressbar"
            aria-valuenow={stage.percent ?? undefined}
            aria-valuemin={0}
            aria-valuemax={100}
            style={{
              height: 8,
              margin: "14px 2px 0",
              borderRadius: 99,
              background: "var(--surface-2)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${stage.percent ?? 5}%`,
                background: "var(--primary)",
                transition: "width .2s ease",
              }}
            />
          </div>
        )}

        {!busy && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 16 }}>
            {ACTIONS[stage.kind]}
            {later}
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
