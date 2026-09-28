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
 * ## Shape
 *
 * A section's `body` is a list of blocks: a string is a paragraph, an object
 * `{ list: [...] }` is a bulleted list. `LegalDocument` renders both.
 *
 * ## Every statement here is a claim about the backend
 *
 * The numbers (30 days, 180 days, 90 days, 7 days, 200 characters, 20
 * messages) are read from `noHarmBack` — `core/config.py`,
 * `messageService.py`, `docker/backup-db.sh`, `docker/compose.host.yaml`. When
 * one of those changes, the sentence here that states it is now false.
 *
 * ## Publishing a change
 *
 * In force since 28 September 2026 as TERMS_VERSION / PRIVACY_VERSION
 * "2026-09-28". No postal address, deliberately: the LGPD asks for the
 * controller's identity and a contact, and the email is that contact. Every
 * email in the app is the one mailbox, `PRIVACY_EMAIL`.
 *
 * To change a document, and it is easy to do half of it:
 *   1. edit the sections here and set `EFFECTIVE`
 *   2. mirror the same text into `public/terms.html` / `public/privacy.html` —
 *      the copies served without a login, and the URL an app store review
 *      opens
 *   3. bump the matching version in the backend config, which is what asks
 *      every existing account to accept it
 */

const CONTROLLER = "Leonardo da Silva Gotardo";
const PRIVACY_EMAIL = "noharm@leogotardo.com.br";
const SUPPORT_EMAIL = PRIVACY_EMAIL;
const EFFECTIVE = "28 September 2026";

export const LEGAL_DOCUMENTS = {
  terms: {
    key: "terms",
    title: "Terms of Use",
    draft: false,
    sections: [
      {
        heading: "Accepting these terms",
        body: [
          `These terms are an agreement between you and ${CONTROLLER}, who runs NoHarm ("we", "us"). They apply to the NoHarm app on Android and iOS and to the website at noharm.site. Effective from ${EFFECTIVE}.`,
          "You accept them by ticking the box when you create an account. If you do not agree, do not create one. How we handle your personal data is described in the Privacy Policy, which is a separate document you accept separately.",
        ],
      },
      {
        heading: "NoHarm is not medical care",
        body: [
          "NoHarm is a tracker for clean days and a way to talk to other people in recovery. It is not treatment, therapy or medical advice, nobody in the app is a clinician, and it is not an emergency service. Nobody watches your streak or your messages to check that you are safe.",
          "If you are in danger, or thinking about hurting yourself, contact emergency services now. In Brazil that is 192 (SAMU); for emotional support, CVV answers on 188, free and 24 hours a day. More numbers, including for other countries, are under Settings → Crisis resources.",
          "Nothing in the app — a streak, a badge, a message from another person — replaces a professional who knows your situation.",
        ],
      },
      {
        heading: "Who can hold an account",
        body: [
          "You must be at least 18 years old. We ask for your date of birth when you sign up and refuse accounts below that age. If we learn that an account belongs to someone younger, we will close it.",
          "You sign in with a Google account. One person, one NoHarm account; do not create an account for someone else or pretend to be someone you are not.",
          "You are responsible for what happens on your account and for keeping the device and the Google account you use to sign in secure.",
        ],
      },
      {
        heading: "How you may and may not behave here",
        body: [
          "People come here at a vulnerable moment. You agree not to:",
          {
            list: [
              "harass, threaten, shame or intimidate anyone;",
              "offer, sell, arrange or encourage the use of drugs, alcohol or any substance or behaviour someone here is recovering from;",
              "encourage self-harm or suicide, or mock someone who is struggling;",
              "send sexual content, or any content involving minors;",
              "share another person's private information, or what someone told you in confidence, without their permission;",
              "impersonate a person or organisation, or use a username or picture meant to mislead or offend;",
              "send spam, advertising, or automated messages, or try to break, overload or get around the security of the service;",
              "use NoHarm for anything illegal.",
            ],
          },
        ],
      },
      {
        heading: "Reporting, moderation and appeals",
        body: [
          "You can report anyone from their profile. The person you report is never told that you did, and never told who did. Moderators see who filed a report, so that they can weigh it.",
          "When you report someone you have a conversation with, the app attaches the last 20 messages of that conversation, both sides, as evidence. The app copies them itself — nobody can type or edit what is attached. Only moderators can read that copy.",
          "Depending on what happened, a moderator may:",
          {
            list: [
              "close the report with no action;",
              "send you a warning, which changes nothing about your account;",
              "reset your username, after which you must choose a new one before using the app;",
              "remove your profile picture and stop a new one from being set;",
              "suspend your account for a fixed period of up to one year;",
              "close your account permanently.",
            ],
          },
          `Whenever a moderator acts on your account, the app tells you what was decided and why, without naming who reported you. If you think a decision was wrong, write to ${SUPPORT_EMAIL} and a person will look at it again.`,
        ],
      },
      {
        heading: "What you write, and what we may do with it",
        body: [
          "What you write — messages, your username — stays yours. You give us only the permission we need to run the service: to store it, deliver it to the people you send it to, and show it to a moderator when it is part of a report. We do not sell it, use it for advertising, or publish it.",
          "Messages are private between you and the other person, but they are not end-to-end encrypted. The Privacy Policy explains exactly who can read what, and when.",
        ],
      },
      {
        heading: "Ending your account, and us ending it",
        body: [
          "You can delete your account at any time in Settings. For 30 days afterwards you can change your mind by signing in again; after that it is permanently erased. Your conversations are erased with it, including the copy the other person saw.",
          "We may suspend or close an account that breaks these terms, as described above. We may also stop running NoHarm altogether; if we do, we will give you notice in the app and time to export your data first.",
        ],
      },
      {
        heading: "Limits of our responsibility",
        body: [
          "NoHarm is provided as it is, free of charge, by one person. We work to keep it available and your data safe, but we cannot promise it will always be available, free of errors, or that a message or reminder will always arrive.",
          "We are not responsible for what other users write or do, or for decisions you make based on something in the app. Nothing in these terms limits a responsibility that the law does not allow us to limit, including your rights as a consumer.",
        ],
      },
      {
        heading: "Changes to these terms",
        body: [
          "When these terms change, the app asks you to accept the new version before you continue using it, and shows you the text first. If you do not accept, you can still export your data and delete your account.",
        ],
      },
      {
        heading: "Governing law",
        body: [
          "These terms are governed by the laws of Brazil. Disputes are to be heard in the courts of the Comarca de Londrina, Paraná, Brazil. Nothing in this clause removes your right, as a consumer, to bring a claim in the courts where you live.",
          `Questions about these terms: ${SUPPORT_EMAIL}.`,
        ],
      },
    ],
  },

  privacy: {
    key: "privacy",
    title: "Privacy Policy",
    draft: false,
    sections: [
      {
        heading: "Who is responsible for your data",
        body: [
          `NoHarm is run by ${CONTROLLER}, an individual in Londrina, Paraná, Brazil, who is the controller of your personal data. Contact: ${PRIVACY_EMAIL}.`,
          `Data protection officer (encarregado, under Brazil's LGPD): ${CONTROLLER}, at ${PRIVACY_EMAIL}. Write there for anything in this policy.`,
          `This policy is effective from ${EFFECTIVE}.`,
        ],
      },
      {
        heading: "What we collect",
        body: [
          {
            list: [
              "From your Google sign-in: your email address, a Google account identifier and, if you have one, the address of your Google profile picture.",
              "What you give us: a username, your date of birth, and your answers to the consent questions, with the date and document version of each.",
              "Your recovery data: when each streak started and ended, when you last checked in, and which was your longest. This is health information.",
              "Your social activity: friend requests and friendships, blocks, and the messages you send and receive.",
              "Badges you have earned.",
              "Moderation: reports you file (with any note you add), reports about you, the evidence attached to them, and any warning or sanction and its notice.",
              "Technical data: a notification token for your device if you allow notifications, with the kinds of notification you chose, sign-in sessions, a log of security-relevant account events, and — when a request fails with a server error — the error, which may be linked to your account.",
              "Your IP address, which our web server records in its logs and uses to limit abusive traffic.",
            ],
          },
          "We do not use analytics, advertising or tracking tools, and we do not collect your location, contacts, or anything from your device beyond what is listed here.",
        ],
      },
      {
        heading: "Why we collect it, and on what basis",
        body: [
          {
            list: [
              "Your account, friends and messages: to provide the service you signed up for (performance of a contract — LGPD art. 7 V).",
              "Your recovery data: only with your specific, separate consent (LGPD art. 11 I; GDPR art. 9(2)(a)). You can decline it at sign-up and still use the rest of the app, and withdraw it at any time.",
              "Date of birth: to confirm you are old enough to hold an account.",
              "Reports, moderation, security logs, IP addresses and error logs: to keep people safe, prevent abuse and keep the service working (legitimate interests — LGPD art. 7 IX).",
              "Notification token: to send the notifications you turned on.",
            ],
          },
          "We never sell your data, and never use it for advertising or to build a profile of you.",
        ],
      },
      {
        heading: "How your messages are protected",
        body: [
          "Messages, your email address, username, date of birth, profile picture address and several other fields are encrypted in our database. Connections between the app and our server are encrypted in transit.",
          "This is not end-to-end encryption. The server holds the key, so it can read messages — that is what lets it deliver them and attach them to a report. No one reads your conversations as a matter of routine. A moderator sees the last 20 messages of a conversation only when one of its two participants reports the other.",
        ],
      },
      {
        heading: "Notifications",
        body: [
          "If you allow notifications on your phone, a new-message notification includes the first 200 characters of the message, so that you can read it from the lock screen. To reach your device, that notification passes through Google's Firebase Cloud Messaging and, on iPhone, Apple's push service. Friend-request notifications carry no personal content.",
          "In a browser, notifications are created by the page itself on your computer and do not go through a third party.",
          "You can turn notifications off in Settings, entirely or by type. On a phone that choice is sent to our server, so it applies even while the app is closed. You can also turn them off in your device's settings.",
        ],
      },
      {
        heading: "Who else sees your data",
        body: [
          "Other NoHarm users can see your username and profile picture. Only your friends see whether you are online, your current streak and how many badges you have earned. Messages are seen only by the person you send them to.",
          "We use these service providers, who process data on our behalf and only for these purposes:",
          {
            list: [
              "Amazon Web Services — hosting of our server and database.",
              "Google (Firebase Authentication) — signing you in.",
              "Google (Firebase Cloud Messaging) and Apple — delivering push notifications.",
              "Google Fonts — the app's typefaces are loaded from Google, which receives your IP address when they load. Profile pictures from Google accounts are also loaded from Google's servers.",
            ],
          },
          "We share data with authorities only when the law requires it.",
        ],
      },
      {
        heading: "Where your data is stored",
        body: [
          "Our server and database are in the United States (AWS, us-east-1), and Google's services may process data in other countries. This means your data is transferred outside Brazil. We rely on our providers' data processing terms and the safeguards the LGPD allows for international transfers (LGPD art. 33).",
        ],
      },
      {
        heading: "How long we keep it",
        body: [
          {
            list: [
              "Your account and everything in it: until you delete it. After deletion we keep it for 30 days so you can restore it, then permanently erase it, including your streaks, friendships and conversations.",
              "Recovery data: until you withdraw consent, which erases every streak immediately and cannot be undone, or until the account is erased.",
              "Evidence attached to a report: 180 days after a moderator closes the report.",
              "Reports and moderation decisions: kept as the record of what was decided, including after the account is erased.",
              "Security event log: kept, but no longer linked to you once your account is erased.",
              "Error logs: 90 days after the error was last seen.",
              "Sign-in sessions: they expire 7 days after they were last used.",
              "Web server logs, including IP addresses: rotated by size, usually a few days.",
              "Backups: taken nightly and kept for 7 days, so erased data can remain in a backup for up to a week.",
            ],
          },
          "When your account is erased, your sign-in record in our Firebase project (your email and Google account identifier) is erased with it. Your Google account itself is yours and is not affected.",
        ],
      },
      {
        heading: "Your rights, and how to use them",
        body: [
          "You have the right to know what we hold about you, get a copy, correct it, have it deleted, withdraw consent, object to how we use it, and know who we share it with (LGPD art. 18). Most of this you can do yourself:",
          {
            list: [
              "Copy of your data: Settings → Privacy & data → download. You get a file with your profile, consents, streaks, friends, badges, conversations and the notices sent to you. It does not include reports filed about you or who filed them, because that would identify the people who reported you.",
              "Correction: edit your profile.",
              "Deletion: Settings → delete account.",
              "Withdrawing recovery-data consent: Settings → Privacy & data.",
              "Notifications: Settings.",
            ],
          },
          `For anything else, write to ${PRIVACY_EMAIL}. We answer within 15 days. You can also complain to Brazil's data protection authority, the ANPD (gov.br/anpd).`,
        ],
      },
      {
        heading: "What the app stores on your device",
        body: [
          "The app keeps your sign-in session, a cache of recently loaded screens, your theme and your notification preferences in your browser's or phone's local storage. Firebase keeps your Google sign-in state there too. Signing out clears the session. We do not use advertising or tracking cookies.",
        ],
      },
      {
        heading: "Children",
        body: [
          "NoHarm is for adults. We do not knowingly hold data about anyone under 18; if we learn an account belongs to a minor, we close it and erase its data.",
        ],
      },
      {
        heading: "Security incidents",
        body: [
          "If a security incident puts your data at risk, we will tell you and Brazil's data protection authority within the time the law requires, and say what happened, what data was affected and what we are doing about it.",
        ],
      },
      {
        heading: "Changes to this policy",
        body: [
          "When this policy changes, the app asks you to accept the new version before you continue, and shows it to you first. The version you accepted and when are stored with your account and included in your data download.",
        ],
      },
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
