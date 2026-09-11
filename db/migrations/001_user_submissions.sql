-- Shared moderation queue for FAQ questions, roadmap suggestions, and site feedback.
-- Apply with a Neon admin/migration role. Role grants are intentionally least-privilege.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'submission_kind') THEN
    CREATE TYPE submission_kind AS ENUM (
      'faq_question',
      'roadmap_suggestion',
      'site_feedback'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'submission_status') THEN
    CREATE TYPE submission_status AS ENUM (
      'new',
      'reviewed',
      'accepted',
      'declined',
      'spam',
      'archived'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS user_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind submission_kind NOT NULL,
  subject text,
  message text NOT NULL,
  contact_email text,
  source_path text NOT NULL,
  status submission_status NOT NULL DEFAULT 'new',
  reviewer_notes text,
  idempotency_key uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  CONSTRAINT user_submissions_subject_length
    CHECK (subject IS NULL OR char_length(subject) BETWEEN 1 AND 160),
  CONSTRAINT user_submissions_message_length
    CHECK (char_length(message) BETWEEN 1 AND 4000),
  CONSTRAINT user_submissions_email_length
    CHECK (contact_email IS NULL OR char_length(contact_email) BETWEEN 3 AND 254),
  CONSTRAINT user_submissions_source_path_length
    CHECK (char_length(source_path) BETWEEN 1 AND 200),
  CONSTRAINT user_submissions_notes_length
    CHECK (reviewer_notes IS NULL OR char_length(reviewer_notes) <= 4000),
  CONSTRAINT user_submissions_idempotency_key_unique UNIQUE (idempotency_key)
);

CREATE INDEX IF NOT EXISTS user_submissions_status_created_idx
  ON user_submissions (status, created_at DESC);

CREATE INDEX IF NOT EXISTS user_submissions_kind_created_idx
  ON user_submissions (kind, created_at DESC);

CREATE INDEX IF NOT EXISTS user_submissions_created_idx
  ON user_submissions (created_at DESC);

CREATE OR REPLACE FUNCTION set_user_submissions_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_submissions_set_updated_at ON user_submissions;
CREATE TRIGGER user_submissions_set_updated_at
  BEFORE UPDATE ON user_submissions
  FOR EACH ROW
  EXECUTE FUNCTION set_user_submissions_updated_at();

-- Least-privilege app roles. Replace passwords before applying in production.
-- Neon Console roles get elevated privileges; create these with SQL instead.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'submissions_writer') THEN
    CREATE ROLE submissions_writer LOGIN PASSWORD 'REPLACE_WRITER_PASSWORD';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'submissions_reviewer') THEN
    CREATE ROLE submissions_reviewer LOGIN PASSWORD 'REPLACE_REVIEWER_PASSWORD';
  END IF;
END $$;

DO $$
DECLARE
  db_name text := current_database();
BEGIN
  EXECUTE format(
    'GRANT CONNECT ON DATABASE %I TO submissions_writer, submissions_reviewer',
    db_name
  );
END $$;

GRANT USAGE ON SCHEMA public TO submissions_writer, submissions_reviewer;

GRANT INSERT ON TABLE user_submissions TO submissions_writer;
REVOKE SELECT, UPDATE, DELETE, TRUNCATE ON TABLE user_submissions FROM submissions_writer;

GRANT SELECT ON TABLE user_submissions TO submissions_reviewer;
GRANT UPDATE (status, reviewer_notes, reviewed_at, updated_at)
  ON TABLE user_submissions TO submissions_reviewer;
REVOKE INSERT, DELETE, TRUNCATE ON TABLE user_submissions FROM submissions_reviewer;

REVOKE ALL ON TYPE submission_kind FROM PUBLIC;
REVOKE ALL ON TYPE submission_status FROM PUBLIC;
GRANT USAGE ON TYPE submission_kind TO submissions_writer, submissions_reviewer;
GRANT USAGE ON TYPE submission_status TO submissions_writer, submissions_reviewer;
