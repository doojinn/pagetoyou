CREATE TABLE users (
 id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, display_name TEXT NOT NULL,
 salt TEXT NOT NULL, password_hash TEXT NOT NULL, created_at BIGINT NOT NULL
);
CREATE TABLE sessions (
 token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 expires_at BIGINT NOT NULL
);
CREATE INDEX sessions_expiry ON sessions(expires_at);
CREATE TABLE recovery_codes (
 code_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 expires_at BIGINT NOT NULL
);
CREATE TABLE gifts (
 id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),token TEXT UNIQUE NOT NULL,
 draft_json JSONB NOT NULL,published_json JSONB,status TEXT NOT NULL DEFAULT 'draft',
 revision INTEGER NOT NULL DEFAULT 1,published_revision INTEGER,views INTEGER NOT NULL DEFAULT 0,
 created_at BIGINT NOT NULL,updated_at BIGINT NOT NULL
);
CREATE INDEX gifts_owner ON gifts(user_id,updated_at);
CREATE TABLE media (
 id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),mime TEXT NOT NULL,
 size INTEGER NOT NULL CHECK(size>0),created_at BIGINT NOT NULL
);
CREATE INDEX media_owner ON media(user_id);
CREATE TABLE gift_media (
 gift_id TEXT NOT NULL REFERENCES gifts(id) ON DELETE CASCADE,
 media_id TEXT NOT NULL REFERENCES media(id),kind TEXT NOT NULL CHECK(kind IN ('draft','published')),
 PRIMARY KEY(gift_id,media_id,kind)
);
CREATE INDEX gift_media_asset ON gift_media(media_id);
CREATE TABLE rate_limits (key TEXT PRIMARY KEY,count INTEGER NOT NULL,reset_at BIGINT NOT NULL);
