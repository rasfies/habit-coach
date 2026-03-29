-- Migration: 002_groups_is_active.sql
-- Adds is_active soft-delete flag to groups table.
-- When the last member leaves, the group is marked inactive rather than deleted.

ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_groups_is_active ON public.groups(is_active) WHERE is_active = FALSE;
