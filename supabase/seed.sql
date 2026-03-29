-- =============================================================================
-- Seed data for local development
-- Run: supabase db reset (applies migrations + seed)
-- =============================================================================

-- NOTE: Supabase Auth users cannot be directly inserted into auth.users via seed.
-- Use the Supabase dashboard or supabase auth admin API to create test users.
-- The handle_new_user() trigger will auto-create rows in public.users.
--
-- Test user UUIDs (replace with actual UUIDs after creating via auth):
-- User A: 00000000-0000-0000-0000-000000000001
-- User B: 00000000-0000-0000-0000-000000000002

-- Uncomment after creating auth users:

/*
INSERT INTO public.users (id, email, display_name, onboarding_complete, notification_enabled)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'alice@test.local', 'Alice', TRUE, TRUE),
  ('00000000-0000-0000-0000-000000000002', 'bob@test.local', 'Bob', TRUE, TRUE);

INSERT INTO public.habits (id, user_id, name, icon, sort_order, is_active)
VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Morning Run', '🏃', 0, TRUE),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Read 30 Minutes', '📚', 1, TRUE),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'Meditate', '🧘', 0, TRUE);

-- Seed streaks (zero state)
INSERT INTO public.streaks (habit_id, user_id, current_streak, longest_streak)
VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 0, 0),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 0, 0),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 0, 0);

-- Seed a test group with known invite code
INSERT INTO public.groups (id, name, invite_code, created_by, member_count)
VALUES
  ('20000000-0000-0000-0000-000000000001', 'Dev Test Group', 'DEVTEST', '00000000-0000-0000-0000-000000000001', 2);

INSERT INTO public.group_members (group_id, user_id)
VALUES
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');
*/

-- Placeholder: seed runs but inserts nothing until auth users are created
SELECT 'Seed file loaded. Uncomment inserts after creating auth test users.' AS info;
