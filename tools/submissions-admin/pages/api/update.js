import {
  assertLocalhost,
  assertSameOrigin,
  getReviewSql,
  isUuid,
  validateStatusUpdate,
} from "../../lib/admin";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }
  if (!assertLocalhost(req, res)) return;
  if (!assertSameOrigin(req, res)) return;

  const body = req.body || {};
  if (!isUuid(body.id)) {
    return res.status(400).json({ error: "Invalid submission id." });
  }

  const validated = validateStatusUpdate({
    status: body.status,
    reviewerNotes: body.reviewerNotes,
  });
  if (!validated.ok) {
    return res.status(400).json({
      error: "Validation failed.",
      fields: validated.errors,
    });
  }

  try {
    const sql = getReviewSql();
    const rows = await sql`
      UPDATE user_submissions
      SET
        status = ${validated.value.status}::submission_status,
        reviewer_notes = ${validated.value.reviewerNotes},
        reviewed_at = now()
      WHERE id = ${body.id}::uuid
      RETURNING id, status, reviewer_notes, reviewed_at, updated_at
    `;

    if (!rows.length) {
      return res.status(404).json({ error: "Submission not found." });
    }

    return res.status(200).json({ item: rows[0] });
  } catch (error) {
    console.error("admin_update_failed", error?.code || error?.message || "error");
    return res.status(500).json({ error: "Could not update submission." });
  }
}
