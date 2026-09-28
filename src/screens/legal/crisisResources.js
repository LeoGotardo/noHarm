/**
 * Where to go when the app is the wrong thing to be looking at.
 *
 * ## This list is content, and it is the one list that must be right
 *
 * Everything else in this folder can be a draft. A crisis number cannot: a
 * wrong one is worse than no screen at all, because someone acts on it at the
 * moment they have least patience for a dead end. **Verify every entry against
 * its source before shipping, and re-verify when this file is touched.**
 *
 * Brazil first, because that is where this app's users are. `emergency` is
 * listed apart from the rest — it is not a helpline, it is the thing to call
 * when waiting is not an option, and a screen that buries it under four
 * counselling services has buried the only entry that is about minutes.
 *
 * No links to anything that needs an account, a subscription or a download.
 */
export const CRISIS_RESOURCES = {
  /** Called, not read. Shown first and styled as the urgent one. */
  emergency: {
    region: "Brazil",
    lines: [
      { name: "SAMU — ambulance", number: "192", note: "Medical emergency, 24 h" },
      { name: "Emergency services", number: "190", note: "Police, 24 h" },
    ],
  },

  /** Someone to talk to. Free, confidential, and not the same as an ambulance. */
  support: {
    region: "Brazil",
    lines: [
      {
        name: "CVV — Centro de Valorização da Vida",
        number: "188",
        note: "Emotional support and suicide prevention. Free, 24 h, confidential.",
        url: "https://cvv.org.br",
      },
      {
        name: "CAPS AD",
        note:
          "Public centres for alcohol and drug care, through the SUS. Free, " +
          "no referral needed — walk in at the nearest one.",
        url: "https://www.gov.br/saude/pt-br",
      },
    ],
  },

  /**
   * Shown to anyone outside the regions above. Deliberately one line: sending
   * someone abroad to a directory they have to search is better than printing
   * a number that does not answer where they are.
   */
  international: {
    lines: [
      {
        name: "Find a helpline where you are",
        note: "A directory of crisis lines by country.",
        url: "https://findahelpline.com",
      },
    ],
  },
};
