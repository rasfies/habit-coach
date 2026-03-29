# METRICS.md — KPIs and Analytics Events

## KPIs (5)

### 1. Activation Rate
**Definition:** Percentage of new signups who complete the full onboarding flow AND log at least one habit check-in within their first 24 hours.
Completion of onboarding alone is not activation — the first check-in is the action that signals genuine engagement intent.
**Target:** 55%+ of new signups within 24 hours of account creation.

---

### 2. D7 Retention
**Definition:** Percentage of users who return to the app and log at least one habit check-in on Day 7 (±1 day window) after their signup date.
**Target:** 35%+ D7 retention. (Industry benchmark for habit apps is ~20–25%; the group accountability mechanic should push this meaningfully above baseline.)

---

### 3. D30 Retention
**Definition:** Percentage of users who log at least one habit check-in during the 30th day (±2 day window) after signup.
**Target:** 20%+ D30 retention. Sustained D30 above 20% indicates the social layer and AI coaching are driving genuine habit formation, not just novelty.

---

### 4. Streak Completion Rate
**Definition:** Of all active habits tracked across all users in a given week, the percentage of days where the user checked in and marked the habit complete (vs. days the habit was scheduled but not logged).
Formula: `(completed check-ins) / (total scheduled check-ins across all active habits)` for a rolling 7-day window.
**Target:** 65%+ weekly streak completion rate across all active users. A drop below 50% signals that habits are being set but not followed through — trigger re-engagement AI messages.

---

### 5. Group Participation Rate
**Definition:** Percentage of active users (logged in within last 7 days) who are members of at least one accountability group AND have viewed their group's feed or interacted with a group member's streak within the same 7-day window.
This distinguishes passive group members from genuinely socially engaged users.
**Target:** 40%+ of active users meaningfully participating in a group each week. This is the core differentiator metric — if this is low, the social layer isn't working.

---

## Analytics Events to Track

All events should be tracked via PostHog with user ID, timestamp, and relevant properties as noted.

| # | Event Name | Trigger | Key Properties |
|---|-----------|---------|----------------|
| 1 | `user_signed_up` | User completes account creation | `signup_method` (email/google/apple), `platform` (web/ios/android) |
| 2 | `onboarding_completed` | User reaches end of onboarding flow | `habits_set_count`, `group_joined` (bool), `time_to_complete_seconds` |
| 3 | `habit_created` | User creates a new habit | `habit_name`, `frequency` (daily/weekdays/custom), `reminder_enabled` (bool) |
| 4 | `habit_checked_in` | User marks a habit complete for the day | `habit_id`, `streak_length`, `check_in_time`, `was_on_time` (bool — before/after scheduled reminder) |
| 5 | `habit_missed` | End of day passes with no check-in for a scheduled habit | `habit_id`, `streak_length_broken`, `had_active_streak` (bool) |
| 6 | `streak_milestone_reached` | User hits 3, 7, 14, 30, 60, 100-day streak | `habit_id`, `milestone_days`, `habit_name` |
| 7 | `streak_recovered` | User uses grace day / compassion mode to recover a broken streak | `habit_id`, `days_since_last_checkin` |
| 8 | `ai_coaching_message_delivered` | AI coaching message is sent to user | `message_type` (encouragement/warning/milestone/recovery), `trigger_event`, `streak_length` |
| 9 | `ai_coaching_message_opened` | User opens/views an AI coaching message | `message_id`, `time_to_open_seconds`, `channel` (push/in-app) |
| 10 | `group_created` | User creates a new accountability group | `group_size_at_creation`, `habits_shared` (bool) |
| 11 | `group_joined` | User joins an existing accountability group | `invite_source` (link/search/suggested), `group_id`, `group_size` |
| 12 | `group_feed_viewed` | User opens and views their accountability group feed | `group_id`, `feed_items_viewed_count`, `time_spent_seconds` |
| 13 | `group_member_streaked` | User views or reacts to a group member's streak update | `reaction_type` (viewed/cheered/commented), `target_streak_length` |
| 14 | `invite_sent` | User sends an invite to join the app or a group | `invite_method` (link/sms/email), `destination` (group_id or general) |
| 15 | `invite_converted` | An invite results in a new signup who completes onboarding | `inviter_user_id`, `invite_method`, `time_to_convert_hours` |
| 16 | `analytics_dashboard_viewed` | User opens their weekly or monthly analytics dashboard | `view_type` (weekly/monthly), `habits_with_data_count` |
| 17 | `push_notification_clicked` | User taps a push notification to open the app | `notification_type` (reminder/ai_message/group_activity/streak_alert), `time_since_sent_seconds` |
| 18 | `app_session_started` | User opens the app (foreground) | `platform`, `session_source` (direct/push/link), `days_since_last_session` |
| 19 | `habit_deleted` | User deletes a habit | `habit_age_days`, `final_streak_length`, `total_check_ins` |
| 20 | `user_churned_7d` | Computed event: no session or check-in for 7 consecutive days | `last_streak_length`, `was_in_group` (bool), `habits_active_count` — use to trigger re-engagement flow |
