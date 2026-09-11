import { neon } from "@neondatabase/serverless";
import {
  SUBMISSION_LIMITS,
  validateSubmissionInput,
} from "../data/submission-types.js";

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function getOrigin(request) {
  try {
    return new URL(request.url).origin;
  } catch {
    return null;
  }
}

function isSameOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const originHost = new URL(origin).host;
    const headerHost = request.headers.get("host");
    if (headerHost) return originHost === headerHost;
    return originHost === new URL(request.url).host;
  } catch {
    return false;
  }
}

function getClientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || undefined;
}

async function checkBot(request) {
  if (process.env.SUBMISSIONS_BOTID_DISABLED === "1") {
    return { isBot: false };
  }

  try {
    const { checkBotId } = await import("botid/server");
    return await checkBotId({
      advancedOptions: {
        headers: Object.fromEntries(request.headers.entries()),
        checkLevel: "basic",
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
      console.warn("BotID unavailable in local development; allowing request.");
      return { isBot: false };
    }
    console.error("botid_check_failed", error?.name || "Error");
    return { isBot: true };
  }
}

async function insertSubmission(value) {
  const databaseUrl = process.env.SUBMISSIONS_DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("missing_database_url");
  }

  const sql = neon(databaseUrl);

  try {
    // Writer role is INSERT-only. Avoid RETURNING/SELECT so least privilege holds.
    await sql`
      INSERT INTO user_submissions (
        kind,
        subject,
        message,
        contact_email,
        source_path,
        idempotency_key
      ) VALUES (
        ${value.kind}::submission_kind,
        ${value.subject},
        ${value.message},
        ${value.contactEmail},
        ${value.sourcePath},
        ${value.idempotencyKey}::uuid
      )
    `;
    return { created: true };
  } catch (error) {
    if (error?.code === "23505") {
      return { created: false };
    }
    throw error;
  }
}

export async function POST(request) {
  if (!isSameOrigin(request)) {
    return json(403, { error: "Forbidden." });
  }

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return json(415, { error: "Unsupported media type." });
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > SUBMISSION_LIMITS.bodyBytesMax) {
    return json(413, { error: "Payload too large." });
  }

  let rawText;
  try {
    rawText = await request.text();
  } catch {
    return json(400, { error: "Could not read request body." });
  }

  if (
    !rawText ||
    Buffer.byteLength(rawText, "utf8") > SUBMISSION_LIMITS.bodyBytesMax
  ) {
    return json(413, { error: "Payload too large." });
  }

  let body;
  try {
    body = JSON.parse(rawText);
  } catch {
    return json(400, { error: "Invalid JSON." });
  }

  const validated = validateSubmissionInput(body);
  if (validated.honeypot) {
    return json(201, { ok: true });
  }
  if (!validated.ok) {
    return json(400, {
      error: "Validation failed.",
      fields: validated.errors,
    });
  }

  const bot = await checkBot(request);
  if (bot?.isBot) {
    return json(403, { error: "Forbidden." });
  }

  try {
    const result = await insertSubmission(validated.value);
    console.info("submission_ok", {
      kind: validated.value.kind,
      created: result.created,
      origin: getOrigin(request),
      ipPresent: Boolean(getClientIp(request)),
    });
    return json(201, { ok: true });
  } catch (error) {
    const code = error?.code || error?.message;
    console.error("submission_failed", typeof code === "string" ? code : "error");
    return json(500, { error: "Could not save submission." });
  }
}

export default {
  async fetch(request) {
    if (request.method !== "POST") {
      return json(405, { error: "Method not allowed." });
    }
    return POST(request);
  },
};
