import { neon } from "@neondatabase/serverless";
import {
  SUBMISSION_KINDS,
  SUBMISSION_STATUSES,
  isUuid,
  validateStatusUpdate,
} from "../../../data/submission-types.js";

export function getReviewSql() {
  const databaseUrl = process.env.SUBMISSIONS_REVIEW_DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("SUBMISSIONS_REVIEW_DATABASE_URL is not configured.");
  }
  return neon(databaseUrl);
}

export function assertLocalhost(req, res) {
  const host = String(req.headers.host || "");
  const hostname = host.split(":")[0];
  if (hostname !== "127.0.0.1" && hostname !== "localhost") {
    res.status(403).json({ error: "Admin API is localhost only." });
    return false;
  }
  return true;
}

export function assertSameOrigin(req, res) {
  const origin = req.headers.origin;
  const host = req.headers.host;
  if (!origin || !host) {
    // Same-origin navigations and some browsers omit Origin on GET.
    if (req.method === "GET" || req.method === "HEAD") return true;
    res.status(403).json({ error: "Missing origin." });
    return false;
  }
  try {
    if (new URL(origin).host !== host) {
      res.status(403).json({ error: "Cross-origin requests are blocked." });
      return false;
    }
  } catch {
    res.status(403).json({ error: "Invalid origin." });
    return false;
  }
  return true;
}

export function parseListQuery(query) {
  const kind = query.kind || "";
  const status = query.status || "";
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 50));
  const offset = Math.max(0, Number(query.offset) || 0);

  if (kind && !SUBMISSION_KINDS.includes(kind)) {
    return { ok: false, error: "Invalid kind." };
  }
  if (status && !SUBMISSION_STATUSES.includes(status)) {
    return { ok: false, error: "Invalid status." };
  }
  return { ok: true, kind, status, limit, offset };
}

export { isUuid, validateStatusUpdate };
