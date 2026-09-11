-- Optional helper for environments where CURRENT_DATABASE() grants are awkward.
-- Prefer 001_user_submissions.sql; use this only if you need explicit database name grants.
--
-- Example:
--   GRANT CONNECT ON DATABASE neondb TO submissions_writer, submissions_reviewer;

SELECT 'Apply role CONNECT grants against your Neon database name if needed.' AS note;
