-- Bumped by a new password and by a deactivation; a token is valid only while its tv claim matches.
ALTER TABLE users ADD COLUMN token_version INTEGER NOT NULL DEFAULT 0;
