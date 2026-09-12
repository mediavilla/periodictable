export const SUBMISSION_KINDS = Object.freeze([
  "faq_question",
  "roadmap_suggestion",
  "site_feedback",
  "contact_message",
]);

export const SUBMISSION_STATUSES = Object.freeze([
  "new",
  "reviewed",
  "accepted",
  "declined",
  "spam",
  "archived",
]);

export const SUBMISSION_LIMITS = Object.freeze({
  subjectMax: 160,
  messageMin: 8,
  messageMax: 4000,
  emailMax: 254,
  sourcePathMax: 200,
  notesMax: 4000,
  bodyBytesMax: 12_000,
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const SUBMISSION_TYPES = Object.freeze({
  faq_question: Object.freeze({
    kind: "faq_question",
    path: "/faq/",
    title: "FAQ",
    eyebrow: "Ask a question",
    description:
      "Browse common questions about exploring the table, or send one of your own.",
    formTitle: "Ask about the site",
    formHelp:
      "Questions go into a private review queue. They are never published automatically.",
    subjectLabel: "Subject (optional)",
    subjectPlaceholder: "Electron shells, table designs, accessibility…",
    messageLabel: "Your question",
    messagePlaceholder: "What would you like to know?",
    submitLabel: "Send question",
    successTitle: "Question received",
    successBody:
      "Thanks. Your question is in the review queue and will be considered for the FAQ.",
    links: Object.freeze([
      { href: "/roadmap/", label: "Suggest a roadmap item" },
      { href: "/feedback/", label: "Send site feedback" },
    ]),
  }),
  roadmap_suggestion: Object.freeze({
    kind: "roadmap_suggestion",
    path: "/roadmap/",
    title: "Roadmap",
    eyebrow: "Suggest an idea",
    description:
      "See where the project is heading and suggest features that would help you most.",
    formTitle: "Suggest a roadmap item",
    formHelp:
      "Suggestions are reviewed privately. Accepted ideas may appear on the public roadmap later.",
    subjectLabel: "Short title (optional)",
    subjectPlaceholder: "More table designs, offline mode, print layout…",
    messageLabel: "Your suggestion",
    messagePlaceholder: "Describe the idea and why it would help.",
    submitLabel: "Send suggestion",
    successTitle: "Suggestion received",
    successBody:
      "Thanks. Your idea is in the review queue and will help shape the roadmap.",
    links: Object.freeze([
      { href: "/faq/", label: "Ask a FAQ question" },
      { href: "/feedback/", label: "Send site feedback" },
    ]),
  }),
  site_feedback: Object.freeze({
    kind: "site_feedback",
    path: "/feedback/",
    title: "Feedback",
    eyebrow: "Share feedback",
    description:
      "Tell us what works, what is confusing, or what broke while exploring the elements.",
    formTitle: "Send feedback",
    formHelp:
      "Feedback stays in a private review queue. Optional email is only used if a reply would help.",
    subjectLabel: "Topic (optional)",
    subjectPlaceholder: "Navigation, performance, content…",
    messageLabel: "Your feedback",
    messagePlaceholder: "Share what happened and what you expected.",
    submitLabel: "Send feedback",
    successTitle: "Feedback received",
    successBody: "Thanks. Your note is in the review queue.",
    links: Object.freeze([
      { href: "/faq/", label: "Ask a FAQ question" },
      { href: "/roadmap/", label: "Suggest a roadmap item" },
    ]),
  }),
  contact_message: Object.freeze({
    kind: "contact_message",
    path: "/contact/",
    title: "Contact",
    eyebrow: "Get in touch",
    description:
      "For collaborations, press, or anything that does not belong on FAQ, roadmap, or feedback.",
    formTitle: "Send a message",
    formHelp:
      "Messages go into a private review queue. Optional email is only used if a reply would help.",
    subjectLabel: "Subject (optional)",
    subjectPlaceholder: "Collaboration, press, something else…",
    messageLabel: "Your message",
    messagePlaceholder: "What would you like to say?",
    submitLabel: "Send message",
    successTitle: "Message received",
    successBody: "Thanks. Your note is in the review queue.",
    links: Object.freeze([
      { href: "/faq/", label: "Ask a FAQ question" },
      { href: "/feedback/", label: "Send site feedback" },
    ]),
  }),
});

export function getSubmissionType(kind) {
  return SUBMISSION_TYPES[kind] || null;
}

export function normalizeWhitespace(value) {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/[^\S\n]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function isUuid(value) {
  return typeof value === "string" && UUID_RE.test(value);
}

function fieldError(field, message) {
  return { field, message };
}

export function validateSubmissionInput(raw, options = {}) {
  const allowHoneypot = options.allowHoneypot !== false;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      ok: false,
      errors: [fieldError("body", "Request body must be a JSON object.")],
    };
  }

  const allowed = new Set([
    "kind",
    "subject",
    "message",
    "contactEmail",
    "sourcePath",
    "idempotencyKey",
    "website",
  ]);
  const unknown = Object.keys(raw).filter((key) => !allowed.has(key));
  if (unknown.length) {
    return {
      ok: false,
      errors: [fieldError("body", "Unknown fields are not allowed.")],
    };
  }

  if (allowHoneypot && normalizeWhitespace(raw.website)) {
    return { ok: false, honeypot: true, errors: [] };
  }

  const errors = [];
  const kind = raw.kind;
  if (!SUBMISSION_KINDS.includes(kind)) {
    errors.push(fieldError("kind", "Choose a valid submission type."));
  }

  const subject =
    raw.subject == null || raw.subject === ""
      ? null
      : normalizeWhitespace(raw.subject);
  if (subject && subject.length > SUBMISSION_LIMITS.subjectMax) {
    errors.push(
      fieldError(
        "subject",
        `Keep the subject under ${SUBMISSION_LIMITS.subjectMax} characters.`,
      ),
    );
  }

  const message = normalizeWhitespace(raw.message);
  if (
    message.length < SUBMISSION_LIMITS.messageMin ||
    message.length > SUBMISSION_LIMITS.messageMax
  ) {
    errors.push(
      fieldError(
        "message",
        `Write between ${SUBMISSION_LIMITS.messageMin} and ${SUBMISSION_LIMITS.messageMax} characters.`,
      ),
    );
  }

  const contactEmail =
    raw.contactEmail == null || raw.contactEmail === ""
      ? null
      : normalizeWhitespace(raw.contactEmail).toLowerCase();
  if (contactEmail) {
    if (
      contactEmail.length > SUBMISSION_LIMITS.emailMax ||
      !EMAIL_RE.test(contactEmail)
    ) {
      errors.push(fieldError("contactEmail", "Enter a valid email address."));
    }
  }

  const sourcePath = normalizeWhitespace(raw.sourcePath);
  const expected = kind ? SUBMISSION_TYPES[kind]?.path : null;
  if (
    !sourcePath ||
    sourcePath.length > SUBMISSION_LIMITS.sourcePathMax ||
    (expected && sourcePath !== expected)
  ) {
    errors.push(fieldError("sourcePath", "Source path is invalid."));
  }

  const idempotencyKey = raw.idempotencyKey;
  if (!isUuid(idempotencyKey)) {
    errors.push(fieldError("idempotencyKey", "Idempotency key must be a UUID."));
  }

  if (errors.length) return { ok: false, errors };

  return {
    ok: true,
    value: {
      kind,
      subject,
      message,
      contactEmail,
      sourcePath,
      idempotencyKey,
    },
  };
}

export function validateStatusUpdate(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      ok: false,
      errors: [fieldError("body", "Request body must be a JSON object.")],
    };
  }

  const allowed = new Set(["status", "reviewerNotes"]);
  const unknown = Object.keys(raw).filter((key) => !allowed.has(key));
  if (unknown.length) {
    return {
      ok: false,
      errors: [fieldError("body", "Unknown fields are not allowed.")],
    };
  }

  const errors = [];
  if (!SUBMISSION_STATUSES.includes(raw.status)) {
    errors.push(fieldError("status", "Choose a valid status."));
  }

  const reviewerNotes =
    raw.reviewerNotes == null || raw.reviewerNotes === ""
      ? null
      : normalizeWhitespace(raw.reviewerNotes);
  if (reviewerNotes && reviewerNotes.length > SUBMISSION_LIMITS.notesMax) {
    errors.push(
      fieldError(
        "reviewerNotes",
        `Keep notes under ${SUBMISSION_LIMITS.notesMax} characters.`,
      ),
    );
  }

  if (errors.length) return { ok: false, errors };
  return { ok: true, value: { status: raw.status, reviewerNotes } };
}
