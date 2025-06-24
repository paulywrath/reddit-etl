SET search_path TO public, reddit_etl;

CREATE TABLE IF NOT EXISTS posts (
  id            TEXT PRIMARY KEY,
  title         TEXT    NOT NULL,
  author        TEXT    NOT NULL,
  created_utc   TIMESTAMP NOT NULL,
  raw_json      JSONB   NOT NULL
);

CREATE TABLE IF NOT EXISTS terms (
  post_id   TEXT    REFERENCES posts(id) ON DELETE CASCADE,
  term      TEXT    NOT NULL
);