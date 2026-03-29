-- =============================================================================
-- AI Habit Coach — Initial Schema
-- Migration: 001_initial_schema.sql
-- Created: 2026-03-28
--
-- STRUCTURE:
--   PART 1: Extensions
--   PART 2: Utility functions (triggers)
--   PART 3: All table definitions (no RLS policies yet)
--   PART 4: All indexes
--   PART 5: All triggers
--   PART 6: RLS ENABLE + all policies (after all tables exist)
--   PART 7: Business logic functions
--   PART 8: GRANTs
--
-- NOTE: RLS policies that reference group_members in subqueries
-- are defined AFTER all tables are created to avoid forward-reference errors.
-- =============================================================================

-- =============================================================================
-- PART 1: Extensions
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";     -- gen_random_bytes for invite codes
-- pg_cron: enable via Supabase dashboard (Database → Extensions) or config.toml
-- It cannot be created via migration on Supabase Cloud; use scheduled Edge Functions.

-- =============================================================================
-- PART 2: Utility trigger function
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- =============================================================================
-- PART 3: Table definitions
-- =============================================================================

-- ─── TABLE 1: users ──────────────────────────────────────────────────────────
-- Mirrors Supabase Auth users; id = auth.users.id

CREATE TABLE public.users (
  id                   UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                TEXT        NOT NULL UNIQUE,
  display_name         TEXT        NOT NULL,
  avatar_url           TEXT,
  onboarding_complete  BOOLEAN     NOT NULL DEFAULT FALSE,
  notification_enabled BOOLEAN     NOT NULL DEFAULT TRUE,
  reminder_time        TIME,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── TABLE 2: habits ─────────────────────────────────────────────────────────

CREATE TABLE public.habits (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name          TEXT        NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  icon          TEXT,
  frequency     TEXT        NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily')),
  reminder_time TIME,
  sort_order    INTEGER     NOT NULL DEFAULT 0,
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── TABLE 3: habit_logs ─────────────────────────────────────────────────────
-- One record per habit per calendar day. Absence = not completed.

CREATE TABLE public.habit_logs (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id     UUID        NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  user_id      UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  log_date     DATE        NOT NULL,
  completed    BOOLEAN     NOT NULL DEFAULT TRUE,
  is_grace_day BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT habit_logs_habit_date_unique UNIQUE (habit_id, log_date)
);

-- ─── TABLE 4: streaks ────────────────────────────────────────────────────────
-- One row per habit; upserted after every log.

CREATE TABLE public.streaks (
  id                         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id                   UUID        NOT NULL UNIQUE REFERENCES public.habits(id) ON DELETE CASCADE,
  user_id                    UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  current_streak             INTEGER     NOT NULL DEFAULT 0,
  longest_streak             INTEGER     NOT NULL DEFAULT 0,
  grace_days_used_this_week  INTEGER     NOT NULL DEFAULT 0
                               CHECK (grace_days_used_this_week >= 0 AND grace_days_used_this_week <= 1),
  grace_day_reset_date       DATE,       -- tracks last Monday the counter was reset (REVIEW_LOG finding #5)
  last_completed_date        DATE,
  last_streak_reset          DATE,
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── TABLE 5: groups ─────────────────────────────────────────────────────────

CREATE TABLE public.groups (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT        NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  invite_code  TEXT        NOT NULL UNIQUE,
  created_by   UUID        NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  member_count INTEGER     NOT NULL DEFAULT 1 CHECK (member_count >= 0),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── TABLE 6: group_members ──────────────────────────────────────────────────

CREATE TABLE public.group_members (
  id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id  UUID        NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id   UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT group_members_unique UNIQUE (group_id, user_id)
);

-- ─── TABLE 7: ai_messages ────────────────────────────────────────────────────
-- One "daily" message per user per day; milestone messages are additional rows.

CREATE TABLE public.ai_messages (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message_date          DATE        NOT NULL,
  content               TEXT        NOT NULL,
  message_type          TEXT        NOT NULL CHECK (
                          message_type IN ('daily', 'day1_welcome', 'streak_3', 'streak_7', 'streak_14', 'streak_30')
                        ),
  habit_ids_referenced  UUID[],
  model_used            TEXT        NOT NULL,
  prompt_tokens         INTEGER,
  completion_tokens     INTEGER,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ai_messages_daily_unique UNIQUE (user_id, message_date, message_type)
);

-- ─── TABLE 8: analytics_snapshots ───────────────────────────────────────────

CREATE TABLE public.analytics_snapshots (
  id              UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID           NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  snapshot_type   TEXT           NOT NULL CHECK (snapshot_type IN ('weekly', 'monthly')),
  period_start    DATE           NOT NULL,
  period_end      DATE           NOT NULL,
  habit_id        UUID           NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  completion_rate NUMERIC(5, 2)  NOT NULL CHECK (completion_rate >= 0 AND completion_rate <= 100),
  days_completed  INTEGER        NOT NULL DEFAULT 0,
  days_possible   INTEGER        NOT NULL DEFAULT 0,
  streak_at_end   INTEGER        NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

  CONSTRAINT analytics_snapshots_unique UNIQUE (user_id, habit_id, snapshot_type, period_start)
);

-- ─── TABLE 9: notification_tokens ────────────────────────────────────────────

CREATE TABLE public.notification_tokens (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token      TEXT        NOT NULL,
  platform   TEXT        NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  is_active  BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT notification_tokens_user_token_unique UNIQUE (user_id, token)
);

-- =============================================================================
-- PART 4: Indexes
-- =============================================================================

-- users
CREATE INDEX idx_users_email                ON public.users(email);

-- habits
CREATE INDEX idx_habits_user_id             ON public.habits(user_id);
CREATE INDEX idx_habits_user_active         ON public.habits(user_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_habits_sort_order          ON public.habits(user_id, sort_order);

-- habit_logs
CREATE INDEX idx_habit_logs_habit_id        ON public.habit_logs(habit_id);
CREATE INDEX idx_habit_logs_user_id         ON public.habit_logs(user_id);
CREATE INDEX idx_habit_logs_log_date        ON public.habit_logs(log_date);
CREATE INDEX idx_habit_logs_user_date       ON public.habit_logs(user_id, log_date);

-- streaks
CREATE INDEX idx_streaks_user_id            ON public.streaks(user_id);
CREATE INDEX idx_streaks_habit_id           ON public.streaks(habit_id);

-- groups
CREATE UNIQUE INDEX idx_groups_invite_code  ON public.groups(invite_code);
CREATE INDEX idx_groups_created_by          ON public.groups(created_by);

-- group_members
CREATE INDEX idx_group_members_group_id     ON public.group_members(group_id);
CREATE INDEX idx_group_members_user_id      ON public.group_members(user_id);

-- ai_messages
CREATE INDEX idx_ai_messages_user_id        ON public.ai_messages(user_id);
CREATE INDEX idx_ai_messages_message_date   ON public.ai_messages(message_date);
CREATE INDEX idx_ai_messages_user_date      ON public.ai_messages(user_id, message_date);
CREATE INDEX idx_ai_messages_type           ON public.ai_messages(message_type);

-- analytics_snapshots
CREATE INDEX idx_analytics_user_id          ON public.analytics_snapshots(user_id);
CREATE INDEX idx_analytics_habit_id         ON public.analytics_snapshots(habit_id);
CREATE INDEX idx_analytics_period           ON public.analytics_snapshots(user_id, snapshot_type, period_start);

-- notification_tokens
CREATE INDEX idx_notification_tokens_user_id ON public.notification_tokens(user_id);
CREATE INDEX idx_notification_tokens_active  ON public.notification_tokens(user_id, is_active) WHERE is_active = TRUE;

-- =============================================================================
-- PART 5: Triggers
-- =============================================================================

-- updated_at auto-stamp
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER habits_updated_at
  BEFORE UPDATE ON public.habits
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER streaks_updated_at
  BEFORE UPDATE ON public.streaks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER groups_updated_at
  BEFORE UPDATE ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER notification_tokens_updated_at
  BEFORE UPDATE ON public.notification_tokens
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- member_count auto-update
CREATE OR REPLACE FUNCTION public.handle_member_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.groups
    SET member_count = member_count + 1
    WHERE id = NEW.group_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.groups
    SET member_count = GREATEST(0, member_count - 1)
    WHERE id = OLD.group_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER group_members_count
  AFTER INSERT OR DELETE ON public.group_members
  FOR EACH ROW EXECUTE FUNCTION public.handle_member_count();

-- =============================================================================
-- PART 6: RLS — Enable + Policies
-- ALL TABLES EXIST at this point, so cross-table subqueries are safe.
-- =============================================================================

-- ─── users ───────────────────────────────────────────────────────────────────

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users: select own row"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users: insert own row"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users: update own row"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- group_members table now exists — this subquery is safe
CREATE POLICY "users: group members can read display info"
  ON public.users FOR SELECT
  USING (
    id IN (
      SELECT gm2.user_id
      FROM public.group_members gm1
      JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid()
    )
  );

-- ─── habits ──────────────────────────────────────────────────────────────────

ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "habits: all ops own rows"
  ON public.habits FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "habits: group members can read"
  ON public.habits FOR SELECT
  USING (
    user_id IN (
      SELECT gm2.user_id
      FROM public.group_members gm1
      JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid()
    )
  );

-- ─── habit_logs ──────────────────────────────────────────────────────────────

ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "habit_logs: all ops own rows"
  ON public.habit_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── streaks ─────────────────────────────────────────────────────────────────

ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "streaks: own rows"
  ON public.streaks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "streaks: group members can read"
  ON public.streaks FOR SELECT
  USING (
    user_id IN (
      SELECT gm2.user_id
      FROM public.group_members gm1
      JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid()
    )
  );

-- ─── groups ──────────────────────────────────────────────────────────────────

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "groups: members can select"
  ON public.groups FOR SELECT
  USING (
    id IN (
      SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "groups: authenticated can insert"
  ON public.groups FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND created_by = auth.uid());

CREATE POLICY "groups: creator can update"
  ON public.groups FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- ─── group_members ───────────────────────────────────────────────────────────

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "group_members: members can select same group"
  ON public.group_members FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "group_members: self insert"
  ON public.group_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "group_members: self delete"
  ON public.group_members FOR DELETE
  USING (user_id = auth.uid());

-- ─── ai_messages ─────────────────────────────────────────────────────────────

ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_messages: own rows"
  ON public.ai_messages FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── analytics_snapshots ─────────────────────────────────────────────────────

ALTER TABLE public.analytics_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "analytics_snapshots: own rows"
  ON public.analytics_snapshots FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── notification_tokens ─────────────────────────────────────────────────────

ALTER TABLE public.notification_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_tokens: own rows"
  ON public.notification_tokens FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- PART 7: Business logic functions
-- =============================================================================

-- Auto-create users row when a new Auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Generate cryptographically random invite code (6 chars, no ambiguous letters)
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  chars  TEXT    := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT    := '';
  i      INTEGER := 0;
  code   TEXT;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..6 LOOP
      result := result || substr(chars, (get_byte(gen_random_bytes(1)) % 32) + 1, 1);
    END LOOP;
    code := result;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.groups WHERE invite_code = code);
  END LOOP;
  RETURN code;
END;
$$;

-- Reconcile member_count with actual group_members rows (run in nightly maintenance)
CREATE OR REPLACE FUNCTION public.reconcile_member_counts()
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.groups g
  SET member_count = (
    SELECT COUNT(*) FROM public.group_members WHERE group_id = g.id
  );
$$;

-- =============================================================================
-- PART 8: Grants
-- =============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_invite_code() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reconcile_member_counts() TO service_role;
