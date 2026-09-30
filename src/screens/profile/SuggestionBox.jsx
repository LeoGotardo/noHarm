import { Btn } from "@ui";
import { useState } from "react";
import {
  SUGGESTION_MAX,
  SUGGESTIONS_EMAIL,
  suggestionMailto,
} from "../../services/suggestions.js";

// Hands the text to the user's mail app rather than posting it: nothing is
// stored, and they see exactly what goes out before it does. The native shell
// passes a mailto: navigation on to the system, so the same code serves both.
export function SuggestionBox() {
  const [text, setText] = useState("");
  const empty = !text.trim();

  return (
    <div style={{ padding: "8px 4px" }}>
      <label style={{ display: "block" }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--ink-2)",
            marginBottom: 7,
            letterSpacing: 0.1,
          }}
        >
          Have an idea for NoHarm?
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={SUGGESTION_MAX}
          rows={4}
          placeholder="I wish NoHarm could…"
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "14px 16px",
            fontSize: 16,
            fontFamily: "var(--font-body)",
            color: "var(--ink)",
            background: "var(--surface-2)",
            border: "1.5px solid var(--border)",
            borderRadius: 14,
            outline: "none",
            resize: "vertical",
          }}
        />
      </label>
      <div
        style={{
          fontSize: 12.5,
          color: "var(--ink-3)",
          margin: "6px 0 12px",
          lineHeight: 1.5,
        }}
      >
        Opens your email app, addressed to {SUGGESTIONS_EMAIL}. Every
        suggestion is read by a person.
      </div>
      <Btn
        full
        icon="send"
        disabled={empty}
        onClick={() => {
          if (empty) return;
          // The text stays: if no mail app opens, it is not lost.
          window.location.href = suggestionMailto(text);
        }}
      >
        Send suggestion
      </Btn>
    </div>
  );
}
