import { Icon, useBackHandler } from "@ui";
import { useEffect, useId, useRef, useState } from "react";

const THEMES = [
  { id: "sage", name: "Sage", sub: "Calm green, clean type" },
  { id: "dawn", name: "Dawn", sub: "Warm clay, soft serif" },
];

/**
 * The visual direction, as a dropdown whose every entry previews its theme.
 *
 * Each preview carries its own `data-dir` / `data-mode`: the theme tokens in
 * theme.css are attribute-only selectors, so the custom properties resolve on
 * the preview itself and it shows the real theme — in the current light or
 * dark mode — rather than a description of it.
 *
 * A listbox in the WAI-ARIA sense: the button opens it, arrows move, Enter or
 * Space picks, Escape and a click outside close it without changing anything.
 * The menu floats below the button (the settings card does not clip) and
 * closes on any pick, so the page under it never has to reflow.
 */
export function ThemePicker({ value, mode, onChange }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(() => indexOf(value));
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const listId = useId();
  const current = THEMES[indexOf(value)];
  // Android's back closes the list, like Escape, without changing anything.
  useBackHandler(open, () => setOpen(false));

  // Close on a click or tap anywhere else.
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const openMenu = () => {
    setActive(indexOf(value));
    setOpen(true);
  };

  const pick = (id) => {
    setOpen(false);
    buttonRef.current?.focus();
    if (id !== value) onChange(id);
  };

  const onKeyDown = (e) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActive((i) => (i + 1) % THEMES.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setActive((i) => (i - 1 + THEMES.length) % THEMES.length);
        break;
      case "Home":
        e.preventDefault();
        setActive(0);
        break;
      case "End":
        e.preventDefault();
        setActive(THEMES.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        pick(THEMES[active].id);
        break;
      case "Escape":
        // Stops here: Escape also pops the screen (app.jsx), and closing the
        // menu should not close Settings with it.
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  };

  return (
    <div ref={rootRef} style={{ position: "relative", padding: "6px 4px" }}>
      <div
        style={{
          fontSize: 12.5,
          fontWeight: 600,
          color: "var(--ink-3)",
          padding: "0 2px 6px",
        }}
        id={`${listId}-label`}
      >
        Theme
      </div>

      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={`${listId}-label ${listId}-value`}
        aria-activedescendant={open ? `${listId}-${THEMES[active].id}` : undefined}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
        className="nh-tap"
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: 8,
          borderRadius: 14,
          border: `1.5px solid ${open ? "var(--primary)" : "var(--border)"}`,
          background: "var(--surface)",
          cursor: "pointer",
          textAlign: "left",
          fontFamily: "var(--font-body)",
          transition: "border-color .15s",
        }}
      >
        <Preview theme={current.id} mode={mode} />
        <span id={`${listId}-value`} style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontWeight: 700, fontSize: 15, color: "var(--ink)" }}>
            {current.name}
          </span>
          <span style={{ display: "block", fontSize: 12.5, color: "var(--ink-3)", marginTop: 1 }}>
            {current.sub}
          </span>
        </span>
        <span
          aria-hidden
          style={{
            display: "flex",
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform .18s",
          }}
        >
          <Icon name="chevD" size={18} color="var(--ink-3)" />
        </span>
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-labelledby={`${listId}-label`}
          className="nh-rise"
          style={{
            position: "absolute",
            left: 4,
            right: 4,
            top: "calc(100% - 2px)",
            zIndex: 20,
            margin: 0,
            padding: 6,
            listStyle: "none",
            borderRadius: 16,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "0 14px 34px -14px rgba(0,0,0,0.35)",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {THEMES.map((t, i) => {
            const selected = t.id === value;
            return (
              <li
                key={t.id}
                id={`${listId}-${t.id}`}
                role="option"
                aria-selected={selected}
                // Keeps focus on the button: the option is reached through
                // aria-activedescendant, and a mousedown here must not blur it.
                onPointerDown={(e) => e.preventDefault()}
                onPointerEnter={() => setActive(i)}
                onClick={() => pick(t.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: 8,
                  borderRadius: 12,
                  cursor: "pointer",
                  background: i === active ? "var(--surface-2)" : "transparent",
                }}
              >
                <Preview theme={t.id} mode={mode} large />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontWeight: 700, fontSize: 15, color: "var(--ink)" }}>
                    {t.name}
                  </span>
                  <span style={{ display: "block", fontSize: 12.5, color: "var(--ink-3)", marginTop: 1 }}>
                    {t.sub}
                  </span>
                </span>
                {selected && <Icon name="check" size={18} color="var(--primary)" sw={2.5} />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function indexOf(id) {
  const i = THEMES.findIndex((t) => t.id === id);
  return i === -1 ? 0 : i;
}

/**
 * A miniature of the theme: its background, a card on it with the streak
 * number in the display face, and the three accent colours. `data-dir` and
 * `data-mode` on the outer box are what make every `var()` inside resolve to
 * that theme rather than the active one.
 */
function Preview({ theme, mode, large = false }) {
  const w = large ? 86 : 64;
  const h = large ? 56 : 44;
  return (
    <span
      aria-hidden
      data-preview={theme}
      data-dir={theme}
      data-mode={mode}
      style={{
        flex: "none",
        width: w,
        height: h,
        borderRadius: 10,
        background: "var(--bg)",
        border: "1px solid var(--border)",
        padding: large ? 6 : 5,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        overflow: "hidden",
      }}
    >
      <span
        style={{
          alignSelf: "flex-start",
          background: "var(--surface)",
          borderRadius: 6,
          padding: large ? "2px 7px" : "1px 5px",
          fontFamily: "var(--font-display)",
          fontWeight: "var(--display-weight)",
          fontSize: large ? 17 : 13,
          lineHeight: 1.15,
          color: "var(--ink)",
        }}
      >
        42
      </span>
      <span style={{ display: "flex", gap: 3 }}>
        {["--primary", "--accent", "--primary-soft"].map((token) => (
          <span
            key={token}
            style={{
              width: large ? 11 : 8,
              height: large ? 11 : 8,
              borderRadius: "50%",
              background: `var(${token})`,
            }}
          />
        ))}
      </span>
    </span>
  );
}
