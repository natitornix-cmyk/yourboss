-- YourBOSS database schema.
-- Paste this entire file into Supabase → SQL Editor → New query → Run.
-- Safe to re-run (uses IF NOT EXISTS where possible).

-- Enums --------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE deck_status AS ENUM ('uploading', 'processing', 'ready', 'failed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE highlight_color AS ENUM ('yellow', 'green', 'red');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE chat_role AS ENUM ('user', 'assistant', 'system');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE review_rating AS ENUM ('again', 'hard', 'good', 'easy');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Tables -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY,
  email text NOT NULL UNIQUE,
  display_name text,
  preferred_language text NOT NULL DEFAULT 'en',
  gemini_api_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  color text DEFAULT '#0E7C7B',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS courses_user_idx ON courses(user_id);

CREATE TABLE IF NOT EXISTS decks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  storage_path text NOT NULL,
  page_count integer NOT NULL DEFAULT 0,
  status deck_status NOT NULL DEFAULT 'uploading',
  summary text,
  outline jsonb,
  topic_tags jsonb DEFAULT '[]'::jsonb,
  high_yield_concepts jsonb DEFAULT '[]'::jsonb,
  processing_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS decks_course_idx ON decks(course_id);
CREATE INDEX IF NOT EXISTS decks_user_idx ON decks(user_id);

CREATE TABLE IF NOT EXISTS slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id uuid NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  page_number integer NOT NULL,
  title text,
  content text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS slides_deck_page_idx ON slides(deck_id, page_number);

CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id uuid NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  stem text NOT NULL,
  options jsonb NOT NULL,
  correct_index integer NOT NULL,
  explanation text NOT NULL,
  distractor_rationales jsonb DEFAULT '[]'::jsonb,
  slide_refs jsonb DEFAULT '[]'::jsonb,
  topic_tags jsonb DEFAULT '[]'::jsonb,
  difficulty text DEFAULT 'medium',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS questions_deck_idx ON questions(deck_id);

CREATE TABLE IF NOT EXISTS question_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_index integer,
  is_correct boolean NOT NULL,
  flagged boolean NOT NULL DEFAULT false,
  time_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS attempts_user_idx ON question_attempts(user_id);
CREATE INDEX IF NOT EXISTS attempts_question_idx ON question_attempts(question_id);

CREATE TABLE IF NOT EXISTS flashcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id uuid NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  front text NOT NULL,
  back text NOT NULL,
  slide_refs jsonb DEFAULT '[]'::jsonb,
  topic_tags jsonb DEFAULT '[]'::jsonb,
  due timestamptz NOT NULL DEFAULT now(),
  stability real NOT NULL DEFAULT 0,
  difficulty real NOT NULL DEFAULT 0,
  elapsed_days integer NOT NULL DEFAULT 0,
  scheduled_days integer NOT NULL DEFAULT 0,
  reps integer NOT NULL DEFAULT 0,
  lapses integer NOT NULL DEFAULT 0,
  state integer NOT NULL DEFAULT 0,
  last_review timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS flashcards_deck_idx ON flashcards(deck_id);
CREATE INDEX IF NOT EXISTS flashcards_user_due_idx ON flashcards(user_id, due);

CREATE TABLE IF NOT EXISTS flashcard_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flashcard_id uuid NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating review_rating NOT NULL,
  time_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS reviews_card_idx ON flashcard_reviews(flashcard_id);

CREATE TABLE IF NOT EXISTS chat_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id uuid REFERENCES decks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'New chat',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
  role chat_role NOT NULL,
  content text NOT NULL,
  citations jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS chat_msg_thread_idx ON chat_messages(thread_id);

CREATE TABLE IF NOT EXISTS highlights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id uuid NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  page_number integer NOT NULL,
  color highlight_color NOT NULL,
  text text NOT NULL,
  rects jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS hl_deck_idx ON highlights(deck_id);

CREATE TABLE IF NOT EXISTS topic_coverage (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_code text NOT NULL,
  deck_count integer NOT NULL DEFAULT 0,
  questions_attempted integer NOT NULL DEFAULT 0,
  questions_correct integer NOT NULL DEFAULT 0,
  coverage real NOT NULL DEFAULT 0,
  accuracy real NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, topic_code)
);
