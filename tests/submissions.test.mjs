import assert from "node:assert/strict";
import test from "node:test";
import {
  SUBMISSION_KINDS,
  SUBMISSION_TYPES,
  validateStatusUpdate,
  validateSubmissionInput,
} from "../data/submission-types.js";

const validKey = "11111111-1111-4111-8111-111111111111";

function base(overrides = {}) {
  return {
    kind: "faq_question",
    subject: "Shells",
    message: "How do electron shells work on this site?",
    contactEmail: "person@example.com",
    sourcePath: "/faq/",
    website: "",
    idempotencyKey: validKey,
    ...overrides,
  };
}

test("submission types cover all kinds", () => {
  for (const kind of SUBMISSION_KINDS) {
    assert.ok(SUBMISSION_TYPES[kind]);
    assert.equal(SUBMISSION_TYPES[kind].kind, kind);
  }
});

test("accepts a valid submission payload", () => {
  const result = validateSubmissionInput(base());
  assert.equal(result.ok, true);
  assert.equal(result.value.kind, "faq_question");
  assert.equal(result.value.contactEmail, "person@example.com");
});

test("accepts a contact message payload", () => {
  const result = validateSubmissionInput(
    base({
      kind: "contact_message",
      sourcePath: "/contact/",
      message: "I would like to collaborate on the project.",
    }),
  );
  assert.equal(result.ok, true);
  assert.equal(result.value.kind, "contact_message");
  assert.equal(result.value.sourcePath, "/contact/");
});

test("normalizes whitespace and lowercases email", () => {
  const result = validateSubmissionInput(
    base({
      subject: "  Hello   world  ",
      message: "  Need   more\n\n\ndetail  ",
      contactEmail: "Person@Example.COM",
    }),
  );
  assert.equal(result.ok, true);
  assert.equal(result.value.subject, "Hello world");
  assert.equal(result.value.message, "Need more\n\ndetail");
  assert.equal(result.value.contactEmail, "person@example.com");
});

test("rejects unknown fields", () => {
  const result = validateSubmissionInput(base({ extra: true }));
  assert.equal(result.ok, false);
});

test("rejects invalid kind and mismatched source path", () => {
  const kind = validateSubmissionInput(base({ kind: "other" }));
  assert.equal(kind.ok, false);
  const path = validateSubmissionInput(
    base({ kind: "site_feedback", sourcePath: "/faq/" }),
  );
  assert.equal(path.ok, false);
});

test("rejects short messages and bad emails", () => {
  const short = validateSubmissionInput(base({ message: "hi" }));
  assert.equal(short.ok, false);
  const email = validateSubmissionInput(base({ contactEmail: "not-an-email" }));
  assert.equal(email.ok, false);
});

test("flags honeypot completions quietly", () => {
  const result = validateSubmissionInput(base({ website: "http://spam.test" }));
  assert.equal(result.ok, false);
  assert.equal(result.honeypot, true);
});

test("requires a uuid idempotency key", () => {
  const result = validateSubmissionInput(base({ idempotencyKey: "abc" }));
  assert.equal(result.ok, false);
});

test("validates moderation status updates", () => {
  const ok = validateStatusUpdate({
    status: "accepted",
    reviewerNotes: "Add to FAQ later",
  });
  assert.equal(ok.ok, true);
  const bad = validateStatusUpdate({ status: "publish" });
  assert.equal(bad.ok, false);
});
