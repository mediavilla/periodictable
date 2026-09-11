# Local submissions admin

Private review UI for FAQ questions, roadmap suggestions, and site feedback.

## Rules

- Bind only to `127.0.0.1`
- Keep `SUBMISSIONS_REVIEW_DATABASE_URL` in `.env.local`
- Do not deploy this app to Vercel
- Do not put this under the public site `pages/` tree

## Setup

```bash
cd tools/submissions-admin
cp .env.example .env.local
# fill SUBMISSIONS_REVIEW_DATABASE_URL with the reviewer role connection string
npm install
npm run dev
```

Or from the repo root:

```bash
npm run submissions:admin
```

Open http://127.0.0.1:3025/

## Capabilities

- Filter by kind and status
- Read message and optional email
- Update status and reviewer notes

Hard deletes and public publishing are intentionally out of scope for v1.
