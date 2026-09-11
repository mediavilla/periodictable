import assert from "node:assert/strict";
import test from "node:test";
import { POST } from "../api/submissions.js";

const origin = "http://127.0.0.1:3000";

function request(body, headers = {}) {
  return new Request(`${origin}/api/submissions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin,
      host: "127.0.0.1:3000",
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const valid = {
  kind: "site_feedback",
  subject: "Nav",
  message: "The footer links are hard to reach on a small phone.",
  contactEmail: "",
  sourcePath: "/feedback/",
  website: "",
  idempotencyKey: "22222222-2222-4222-8222-222222222222",
};

test("rejects cross-origin posts", async () => {
  process.env.SUBMISSIONS_BOTID_DISABLED = "1";
  const response = await POST(
    request(valid, { origin: "https://evil.example" }),
  );
  assert.equal(response.status, 403);
});

test("rejects non-json content types", async () => {
  process.env.SUBMISSIONS_BOTID_DISABLED = "1";
  const response = await POST(
    request(valid, { "content-type": "text/plain" }),
  );
  assert.equal(response.status, 415);
});

test("rejects malformed json", async () => {
  process.env.SUBMISSIONS_BOTID_DISABLED = "1";
  const response = await POST(request("{", { "content-type": "application/json" }));
  assert.equal(response.status, 400);
});

test("rejects invalid payloads with field errors", async () => {
  process.env.SUBMISSIONS_BOTID_DISABLED = "1";
  const response = await POST(request({ ...valid, message: "x" }));
  assert.equal(response.status, 400);
  const body = await response.json();
  assert.equal(body.error, "Validation failed.");
  assert.ok(Array.isArray(body.fields));
});

test("honeypot returns quiet success without requiring a database", async () => {
  process.env.SUBMISSIONS_BOTID_DISABLED = "1";
  delete process.env.SUBMISSIONS_DATABASE_URL;
  const response = await POST(request({ ...valid, website: "bot" }));
  assert.equal(response.status, 201);
  const body = await response.json();
  assert.equal(body.ok, true);
});

test("fails closed when database url is missing", async () => {
  process.env.SUBMISSIONS_BOTID_DISABLED = "1";
  delete process.env.SUBMISSIONS_DATABASE_URL;
  const response = await POST(request(valid));
  assert.equal(response.status, 500);
});
