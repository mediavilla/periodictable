-- Add contact form kind for existing databases created from 001.
-- Run as a single statement in the Neon SQL Editor.

ALTER TYPE submission_kind ADD VALUE IF NOT EXISTS 'contact_message';
