import {
  assertLocalhost,
  assertSameOrigin,
  getReviewSql,
  parseListQuery,
} from "../../lib/admin";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }
  if (!assertLocalhost(req, res)) return;
  if (!assertSameOrigin(req, res)) return;

  const parsed = parseListQuery(req.query);
  if (!parsed.ok) {
    return res.status(400).json({ error: parsed.error });
  }

  try {
    const sql = getReviewSql();
    let items;

    if (parsed.kind && parsed.status) {
      items = await sql`
        SELECT
          id, kind, subject, message, contact_email, source_path,
          status, reviewer_notes, created_at, updated_at, reviewed_at
        FROM user_submissions
        WHERE kind = ${parsed.kind}::submission_kind
          AND status = ${parsed.status}::submission_status
        ORDER BY created_at DESC
        LIMIT ${parsed.limit}
        OFFSET ${parsed.offset}
      `;
    } else if (parsed.kind) {
      items = await sql`
        SELECT
          id, kind, subject, message, contact_email, source_path,
          status, reviewer_notes, created_at, updated_at, reviewed_at
        FROM user_submissions
        WHERE kind = ${parsed.kind}::submission_kind
        ORDER BY created_at DESC
        LIMIT ${parsed.limit}
        OFFSET ${parsed.offset}
      `;
    } else if (parsed.status) {
      items = await sql`
        SELECT
          id, kind, subject, message, contact_email, source_path,
          status, reviewer_notes, created_at, updated_at, reviewed_at
        FROM user_submissions
        WHERE status = ${parsed.status}::submission_status
        ORDER BY created_at DESC
        LIMIT ${parsed.limit}
        OFFSET ${parsed.offset}
      `;
    } else {
      items = await sql`
        SELECT
          id, kind, subject, message, contact_email, source_path,
          status, reviewer_notes, created_at, updated_at, reviewed_at
        FROM user_submissions
        ORDER BY created_at DESC
        LIMIT ${parsed.limit}
        OFFSET ${parsed.offset}
      `;
    }

    return res.status(200).json({ items });
  } catch (error) {
    console.error("admin_list_failed", error?.code || error?.message || "error");
    return res.status(500).json({ error: "Could not load submissions." });
  }
}
