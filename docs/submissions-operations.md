# Submissions operations

How to run, protect, and review the FAQ / roadmap / feedback intake system.

## Architecture

- Public pages: `/faq/`, `/roadmap/`, `/feedback/`
- Write endpoint: `POST /api/submissions` (standalone Vercel Function)
- Storage: Neon Postgres table `user_submissions`
- Review UI: `tools/submissions-admin` on `127.0.0.1:3025` only

## Neon setup

1. Apply [`db/migrations/001_user_submissions.sql`](../db/migrations/001_user_submissions.sql) with an admin role.
2. Replace `REPLACE_WRITER_PASSWORD` and `REPLACE_REVIEWER_PASSWORD` before or immediately after apply.
3. Create connection strings:
   - Vercel `SUBMISSIONS_DATABASE_URL` → `submissions_writer` pooled URL
   - Local admin `SUBMISSIONS_REVIEW_DATABASE_URL` → `submissions_reviewer` pooled URL
4. Prefer a preview Neon branch for tests and Vercel preview deploys.

Never commit credentials, dumps, or submission exports.

## Vercel env

| Name | Scope | Notes |
| --- | --- | --- |
| `SUBMISSIONS_DATABASE_URL` | Production / Preview | Writer role only |
| `SUBMISSIONS_BOTID_DISABLED` | Local only | Set to `1` only for local endpoint tests |

Do not expose these as `NEXT_PUBLIC_*`.

## Bot and spam controls

1. Vercel BotID Basic on `POST /api/submissions`
2. Same-origin check, JSON-only body, size limit, honeypot field
3. Strict validation and idempotency key uniqueness
4. WAF rate limit (configure in Vercel Firewall):
   - Path prefix `/api/submissions`
   - Method `POST`
   - Start in **log** mode
   - Target enforcement: about **5 requests / 10 minutes / IP**
5. Automatic platform DDoS mitigation remains the outer layer
6. Escalate to BotID Deep Analysis only if Basic is insufficient

## Local review

```bash
npm run submissions:admin:install
# copy tools/submissions-admin/.env.example → .env.local
npm run submissions:admin
```

Statuses: `new`, `reviewed`, `accepted`, `declined`, `spam`, `archived`.

Accepted items are curated manually into the public FAQ/roadmap content. Nothing is auto-published.

## Local verification (CI / pre-deploy)

```bash
npm test
npm run build
npm run verify:export
# CI also asserts out/ has no /admin routes and no secret env names
```

Browser form checks live in `tests/browser-checks.mjs` (FAQ / roadmap / feedback validation + related links). Local admin filtering helpers are covered by `tests/submissions-admin.test.mjs`.

## Rollout checklist

1. Apply migration on preview branch
2. Deploy preview with writer env var
3. Confirm Deployment Summary shows static assets + `api/submissions` only (no Next.js server runtime for pages)
4. Confirm `/admin` and listing endpoints are not public (expect 404)
5. Submit one FAQ, roadmap, and feedback entry
6. Review them in the local admin app (`npm run submissions:admin`)
7. Promote migration + env to production
8. Move WAF rule from log → enforce after reviewing traffic

## Credential rotation

1. `ALTER ROLE submissions_writer PASSWORD '…'`
2. `ALTER ROLE submissions_reviewer PASSWORD '…'`
3. Update Vercel env and local `.env.local`
4. Redeploy / restart admin

## Rollback

- Disable the public forms by reverting the FAQ/roadmap/feedback pages to placeholders, or remove `SUBMISSIONS_DATABASE_URL` so writes fail closed.
- Keep the table; do not drop it during an incident unless dumping first.
