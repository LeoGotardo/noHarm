/**
 * The text of the legal documents, and the wording of each consent.
 *
 * ## This file is content, not logic
 *
 * Nothing here decides anything. Whether an account owes a signature is
 * answered by the backend (`pending_consents` on `GET /users/me`), which
 * compares the version stored against `TERMS_VERSION` / `PRIVACY_VERSION` /
 * `HEALTH_CONSENT_VERSION` in its own config. The version is deliberately
 * **not** declared here: two sources of truth for "which revision is this" is
 * how an app ends up showing one document and recording agreement to another.
 * The screens receive the live version as a prop and display it.
 *
 * ## The documents are not written yet
 *
 * Every `body` below is a placeholder, and `draft: true` is what makes the app
 * say so out loud rather than quietly presenting an empty page as terms. The
 * headings are the real outline; filling them is a content change to this file
 * and to `public/terms.html` / `public/privacy.html`, with no code to touch.
 *
 * Publishing checklist, because it is easy to do half of it:
 *   1. write the sections here
 *   2. mirror the same text into the two files in `public/` — those are the
 *      copies served without a login, and an app store review needs a public
 *      privacy policy URL
 *   3. set `draft: false`
 *   4. bump the matching version in the backend config, which is what asks
 *      every existing account to accept it
 */

const PLACEHOLDER =
  "This section has not been written yet. Nothing in this app should be read " +
  "as a final statement of its terms until this document is complete.";

export const LEGAL_DOCUMENTS = {
  terms: {
    key: "terms",
    title: "Terms of Use",
    draft: true,
    sections: [
      { heading: "Accepting these terms", body: PLACEHOLDER },
      {
        heading: "NoHarm is not medical care",
        body:
          PLACEHOLDER +
          " This section is the one that must not be softened: NoHarm is a " +
          "tracker and a way to talk to other people in recovery. It is not " +
          "treatment, not a clinician, and not an emergency service.",
      },
      { heading: "Who can hold an account", body: PLACEHOLDER },
      { heading: "How you may and may not behave here", body: PLACEHOLDER },
      { heading: "Reporting, moderation and appeals", body: PLACEHOLDER },
      { heading: "What you write, and what we may do with it", body: PLACEHOLDER },
      { heading: "Ending your account, and us ending it", body: PLACEHOLDER },
      { heading: "Limits of our responsibility", body: PLACEHOLDER },
      { heading: "Changes to these terms", body: PLACEHOLDER },
      { heading: "Governing law", body: PLACEHOLDER },
    ],
  },

  privacy: {
    key: "privacy",
    title: "Privacy Policy",
    draft: true,
    sections: [
      { heading: "Who is responsible for your data", body: PLACEHOLDER },
      { heading: "What we collect", body: PLACEHOLDER },
      { heading: "Why we collect it, and on what basis", body: PLACEHOLDER },
      {
        heading: "How your messages are protected",
        body:
          PLACEHOLDER +
          " This section has to state plainly that messages are encrypted at " +
          "rest with a key the server holds, and that this is not end-to-end " +
          "encryption: moderation can read a conversation that is reported.",
      },
      {
        heading: "Notifications",
        body:
          PLACEHOLDER +
          " Must disclose that the first part of a message is included in the " +
          "push notification, and therefore passes through Google and Apple.",
      },
      { heading: "Who else sees your data", body: PLACEHOLDER },
      { heading: "Where your data is stored", body: PLACEHOLDER },
      { heading: "How long we keep it", body: PLACEHOLDER },
      { heading: "Your rights, and how to use them", body: PLACEHOLDER },
      { heading: "What the app stores on your device", body: PLACEHOLDER },
      { heading: "Children", body: PLACEHOLDER },
      { heading: "Security incidents", body: PLACEHOLDER },
      { heading: "Changes to this policy", body: PLACEHOLDER },
    ],
  },
};

/**
 * The words next to each checkbox.
 *
 * Kept apart from the documents because they are a different kind of writing:
 * a document is read, a consent is answered, and the sentence someone ticks is
 * the thing that has to be unambiguous on its own.
 *
 * `health_data` is separate from the other two everywhere in this system — a
 * streak is a record of someone's recovery, so its consent is given on its own,
 * refusable on its own, and withdrawable on its own.
 */
export const CONSENT_COPY = {
  terms: {
    label: "I agree to the Terms of Use",
    sub: "How this space works and what is expected of everyone in it.",
  },
  privacy: {
    label: "I agree to the Privacy Policy",
    sub: "What is collected, why, and how long it is kept.",
  },
  health_data: {
    label: "I agree to NoHarm keeping my recovery data",
    sub:
      "Your clean days, check-ins and streak history. This is health " +
      "information, so it is asked separately — the tracker needs it, nothing " +
      "else does. You can withdraw it at any time in Settings, which deletes " +
      "every streak you have.",
  },
};

/** Which documents are a condition of having an account at all. */
export const BINDING_DOCUMENTS = ["terms", "privacy"];
