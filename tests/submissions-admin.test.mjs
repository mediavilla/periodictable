import assert from "node:assert/strict";
import test from "node:test";
import {
  assertLocalhost,
  assertSameOrigin,
  parseListQuery,
} from "../tools/submissions-admin/lib/admin.js";

function mockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

test("parseListQuery accepts filters and clamps pagination", () => {
  const parsed = parseListQuery({
    kind: "faq_question",
    status: "new",
    limit: "500",
    offset: "-3",
  });
  assert.equal(parsed.ok, true);
  assert.equal(parsed.kind, "faq_question");
  assert.equal(parsed.status, "new");
  assert.equal(parsed.limit, 100);
  assert.equal(parsed.offset, 0);
});

test("parseListQuery rejects unknown kind or status", () => {
  assert.equal(parseListQuery({ kind: "other" }).ok, false);
  assert.equal(parseListQuery({ status: "published" }).ok, false);
});

test("assertLocalhost allows only loopback hosts", () => {
  const ok = mockRes();
  assert.equal(assertLocalhost({ headers: { host: "127.0.0.1:3025" } }, ok), true);
  assert.equal(ok.statusCode, 200);

  const blocked = mockRes();
  assert.equal(
    assertLocalhost({ headers: { host: "example.com" } }, blocked),
    false,
  );
  assert.equal(blocked.statusCode, 403);
});

test("assertSameOrigin blocks cross-origin mutations", () => {
  const ok = mockRes();
  assert.equal(
    assertSameOrigin(
      {
        method: "POST",
        headers: {
          origin: "http://127.0.0.1:3025",
          host: "127.0.0.1:3025",
        },
      },
      ok,
    ),
    true,
  );

  const blocked = mockRes();
  assert.equal(
    assertSameOrigin(
      {
        method: "POST",
        headers: {
          origin: "https://evil.example",
          host: "127.0.0.1:3025",
        },
      },
      blocked,
    ),
    false,
  );
  assert.equal(blocked.statusCode, 403);
});
