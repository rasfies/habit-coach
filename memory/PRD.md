# PRD.md — AI Habit Coach

## STRATEGY SECTION (STRATEGIST Agent)

### App Overview
An AI-powered habit coaching web and mobile app for self-improvement-oriented adults who want more than a passive streak counter. Users set daily habits, track streaks, receive personalized AI coaching messages that adapt to their actual progress (not generic nudges), and join accountability groups where members can see each other's streaks in real time. The app is entirely free — growth is driven by social word-of-mouth and group referrals rather than paid acquisition or advertising.

---

### Ideal Customer Profile (ICP)
- **Demographics:** Adults 18–45, college-educated, urban/suburban, digitally native. Skews toward knowledge workers, students, and fitness-minded individuals. Comfortable with mobile apps and open to AI-assisted tools.
- **Core pain point:** They know what habits they want to build but can't make them stick past 2–3 weeks. They start strong, miss one day, feel guilt, and quietly abandon the app. Generic reminder notifications don't help — they become noise.
- **Why they leave other apps:** Habit apps feel hollow after the novelty wears off. Streaks break and there's no recovery mechanic. AI "coaching" in competitors is templated and impersonal. Accountability features are either absent or opt-in afterthoughts. No one notices when they fall off.
- **What hooks them:** Real social stakes (group members can see your streaks), AI messages that reference their specific habits and recent behavior (not generic "keep it up!"), and visible progress data that makes them feel measurably better over time.

---

### Competitive Landscape
| App | Strength | Gap we exploit |
|-----|----------|----------------|
| **Habitica** | Strong gamification (RPG quests, avatars), active community | Gamification is childish for 25–40 adults; no real AI coaching; social layer is game-guild-based, not accountability-focused |
| **Streaks** (iOS) | Beautiful iOS-native UX, tight Apple Health integration, simplicity | Solo-only, no social/accountability layer, no AI coaching, iOS-only locks out Android/web users |
| **Fabulous** | Science-backed habit stacking, polished onboarding, strong retention rituals | No real social accountability, AI coaching is scripted (not adaptive), subscription paywall alienates users |
| **Beachbody / BODi** | Strong community, coach-assigned accountability groups, fitness niche | Fitness-only vertical, expensive subscription, human coaches don't scale, no general habit tracking |
| **Notion/Spreadsheets** | Full flexibility, power-user favorite | No reminders, no AI, no social layer, requires manual setup — too much friction for casual users |

---

### Unique Value Proposition
The only free habit app that combines genuinely adaptive AI coaching (messages that respond to your actual streak data and behavior patterns) with real social accountability groups — so you're never just accountable to an algorithm, you're accountable to people who notice when you stop.

---

### Must-Have Activation Features (top 3)
1. **Personalized AI Coaching Message on Day 1** — Within the first session, the AI references the user's specific habits by name and sets an expectation ("You've committed to 3 habits. I'll check in with you tomorrow after your morning run."). This immediately differentiates from generic apps and creates anticipation for the next interaction.
2. **Group Join / Create Flow at Onboarding** — Prompt users to either join an existing accountability group or invite friends to create one before they leave the onboarding screen. Embedding social stakes at signup dramatically increases D7 retention because leaving means letting a group down, not just abandoning an app.
3. **First Streak Milestone Celebration (Day 3 & Day 7)** — Surface a meaningful in-app moment at 3-day and 7-day streaks with a personalized AI message reviewing what the user has accomplished. This is the "aha moment" that converts curious signups into retained users.

---

### Retention Loop
- **Habit mechanic:** Daily check-in with variable AI feedback — the message content changes based on streak length, recent consistency, and habit type, creating a "what will it say today?" pull that functions like a variable reward schedule. Streak recovery ("compassion mode" — one grace day per week) removes the all-or-nothing churn trigger that kills other apps.
- **Switching cost:** Over time, the AI accumulates behavioral context — it knows your history, your patterns, your best and worst days. This history is not easily exportable or reproducible in another app. The longer a user stays, the smarter their coach feels, and the higher the cost of starting over elsewhere.
- **Network effect:** Accountability groups create direct social switching cost. Leaving the app means disappearing from your group's leaderboard and breaking social commitments. Groups can only grow within the app — friends who want to join must sign up, driving organic viral growth. Group streak visibility creates FOMO and passive re-engagement for users who drift.

---

### Monetization
Free app. No payments, no ads. Growth via word-of-mouth and group referrals. The group invite mechanic is the primary viral loop — every accountability group is a referral channel.

---

## PM SECTION (PM Agent)

### Problem Statement

Adults who want to build lasting habits face three compounding failures: they lose momentum after one missed day (no recovery mechanic), they have no social accountability (streak counters are private and meaningless to others), and the AI coaching they do encounter is templated and impersonal — it doesn't know them. The result is a 70%+ churn rate for habit apps within the first 30 days. Users don't fail because they lack motivation; they fail because their tools abandon them the moment they slip.

---

### Solution

An AI habit coach that gives users a genuine reason to come back every day through three interlocking systems:

1. **Adaptive AI coaching** — Claude-powered daily messages that reference the user's specific habit names, current streak length, and recent behavior. Not "great job!" — "You hit your morning run 5 days straight. Here's why that matters for the next 2 weeks."
2. **Compassion mode** — One grace day per week per habit so a single missed day doesn't erase progress. This removes the all-or-nothing psychology that causes abandonment.
3. **Live accountability groups** — Members see each other's streaks in real time. Leaving the app means disappearing from your group. The social layer makes streaks meaningful to others, not just to the algorithm.

---

### User Stories (MVP)

**Onboarding**
1. As a new user, I want to sign up with email/password or Google SSO so that I can create an account without friction.
2. As a new user, I want to be prompted to create or join an accountability group during onboarding so that social accountability is established from day one.
3. As a new user, I want to receive a personalized AI coaching message on my first day that references my specific habits by name so that the app feels immediately different from generic trackers.

**Habits**
4. As a user, I want to create a daily habit with a name, optional reminder time, and optional icon so that I can customize my routine.
5. As a user, I want to view all my habits in a single dashboard so that I can see everything I need to do today at a glance.
6. As a user, I want to mark a habit as complete for today with a single tap/click so that logging requires minimal friction.
7. As a user, I want to edit or delete a habit so that I can adjust my routine as my goals evolve.
8. As a user, I want to reorder my habits on the dashboard so that I can prioritize what I see first.

**Streaks**
9. As a user, I want to see my current streak count for each habit so that I have a clear sense of momentum.
10. As a user, I want to use one grace day per week per habit so that a single missed day doesn't reset my streak and cause me to give up.
11. As a user, I want to receive a special in-app celebration at Day 3 and Day 7 streaks so that early milestones feel meaningful and reinforce my commitment.

**AI Coaching**
12. As a user, I want to receive one personalized AI coaching message per day that references my recent habit behavior so that the feedback feels relevant and not generic.
13. As a user, I want my AI message to celebrate streak milestones (Day 3, Day 7) with specific acknowledgment of which habit I hit so that the achievement feels recognized.

**Groups**
14. As a user, I want to create an accountability group and invite others via a shareable link or code so that I can build a circle of people who hold me accountable.
15. As a user, I want to see all group members' current streaks for their habits so that social accountability is visible and real.
16. As a user, I want to join an existing group using an invite code so that I can participate in accountability circles I'm invited to.
17. As a user, I want to leave a group I no longer want to participate in so that I have control over my social context.

**Analytics**
18. As a user, I want to see a weekly analytics summary showing my completion rate per habit so that I can evaluate my consistency each week.
19. As a user, I want to see a monthly analytics summary with trend data so that I can identify patterns and adjust my habits accordingly.

---

### MVP Feature List
(Built in Phase 4)

- Email/password authentication + Google OAuth via Supabase Auth
- User profile (display name, avatar)
- Create, read, update, delete, reorder habits (max 10 per user)
- Daily habit completion logging (one log per habit per day)
- Streak calculation with compassion mode (1 grace day per week per habit)
- Day 1 welcome AI coaching message (references habit names)
- Day 3 and Day 7 streak milestone AI coaching messages
- Daily AI coaching message (Claude Haiku, one per user per day)
- Create and join accountability groups (via invite code)
- Group member streak visibility (all habits, all members)
- Leave group
- Weekly analytics summary (per-habit completion rate)
- Monthly analytics summary (trend data)
- Push notification registration and preference management
- Web app (Next.js 15)
- Mobile app (React Native + Expo)

---

### Phase 2 Features (not in MVP)

- Group admin controls (remove members, edit group name/description)
- Direct messaging within groups
- Habit templates library (pre-built habits by category)
- Apple Health / Google Fit integration
- Habit stacking (link habits in a sequence)
- Advanced AI coaching modes (deep dive weekly review, habit audit)
- Public profile / shareable streak badges
- Habit pause (temporary suspension without losing streak)
- Multiple reminder times per habit
- Rich analytics exports (CSV, PDF)
- Web push notifications
- Streak leaderboard across all groups (opt-in)
- AI-suggested habits based on onboarding answers

---

### Screens / Pages

**Web (Next.js)**

| Screen | Path | Purpose |
|--------|------|---------|
| Landing / Marketing | `/` | Unauthenticated homepage explaining the product; CTA to sign up |
| Sign Up | `/auth/signup` | Email/password + Google OAuth signup form |
| Log In | `/auth/login` | Email/password + Google OAuth login form |
| Onboarding — Habits | `/onboarding/habits` | New user creates their first 1–3 habits |
| Onboarding — Groups | `/onboarding/groups` | New user creates or joins an accountability group |
| Dashboard (Today) | `/dashboard` | All habits for today; check off completions; today's AI message |
| Habit Detail | `/habits/[id]` | Single habit view: streak history, completion calendar, AI messages |
| Create/Edit Habit | `/habits/new`, `/habits/[id]/edit` | Form to create or edit a habit |
| AI Coach | `/coach` | Full history of AI coaching messages, paginated |
| Groups List | `/groups` | All groups the user belongs to |
| Group Detail | `/groups/[id]` | Group member list with live streaks; invite link/code |
| Create Group | `/groups/new` | Form to name and create a group |
| Join Group | `/groups/join` | Enter invite code to join |
| Analytics — Weekly | `/analytics/weekly` | Weekly completion rates per habit; bar/line charts |
| Analytics — Monthly | `/analytics/monthly` | Monthly trend data; calendar heatmap |
| Settings | `/settings` | Profile edit, notification preferences, account management |
| 404 | `/404` | Not found page |

**Mobile (React Native + Expo)**

| Screen | Navigator | Purpose |
|--------|-----------|---------|
| Splash | Root | App loading / auth check |
| Sign Up | Auth Stack | Email/password + Google OAuth signup |
| Log In | Auth Stack | Email/password + Google OAuth login |
| Onboarding — Habits | Onboarding Stack | First habit creation |
| Onboarding — Groups | Onboarding Stack | Create or join group |
| Today (Dashboard) | Tab: Home | All habits for today; tap to complete; AI message card |
| Habit Detail | Home Stack | Streak calendar, history, AI messages for this habit |
| Create/Edit Habit | Modal | Full-screen form for habit create/edit |
| AI Coach | Tab: Coach | Scrollable AI message history |
| Groups | Tab: Groups | List of user's groups |
| Group Detail | Groups Stack | Member streaks; invite code; leave group |
| Create Group | Groups Stack | Form to create group |
| Join Group | Groups Stack | Enter invite code |
| Analytics | Tab: Analytics | Weekly + monthly tabs with charts |
| Settings | Tab: Settings | Profile, notifications, account |

---

### Onboarding Flow

**Step 1 — Account Creation (Screen: Sign Up)**
- User enters display name, email, password (or taps "Continue with Google")
- Supabase Auth creates account and session
- User record created in `users` table

**Step 2 — Habit Setup (Screen: Onboarding — Habits)**
- Prompt: "What habits do you want to build?" with examples
- User creates 1–3 habits (name, optional reminder time, optional icon)
- Min 1 habit required to proceed
- Each habit saved to `habits` table

**Step 3 — Group Setup (Screen: Onboarding — Groups)**
- Prompt: "Accountability works better together. Join or create a group."
- Option A: "Create a group" — user enters group name, group created, invite code generated
- Option B: "Join a group" — user enters invite code
- Option C: "Skip for now" — allowed, but deemphasized (small ghost button)
- Group membership saved to `group_members` table

**Step 4 — Day 1 AI Message (Screen: Dashboard)**
- User lands on Today dashboard
- AI coaching message is generated and displayed at the top of the screen
- Message references user's display name and each habit name by name
- Message is stored in `ai_messages` table
- User sees their habits listed below, ready to check off

**Onboarding complete.** User enters normal app loop.

---

### Data Models

#### Table: `users`
| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | uuid | NO | Primary key, matches Supabase Auth UID |
| email | text | NO | User email, unique |
| display_name | text | NO | Public display name used in groups |
| avatar_url | text | YES | URL to avatar image in Supabase Storage |
| onboarding_complete | boolean | NO | Default false; true after onboarding flow |
| notification_enabled | boolean | NO | Default true |
| reminder_time | time | YES | Global default reminder time (overridden per habit) |
| created_at | timestamptz | NO | Account creation timestamp |
| updated_at | timestamptz | NO | Last profile update timestamp |

#### Table: `habits`
| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | uuid | NO | Primary key |
| user_id | uuid | NO | FK → users.id; RLS enforced |
| name | text | NO | Habit name (e.g., "Morning Run") |
| icon | text | YES | Emoji or icon identifier |
| frequency | text | NO | "daily" (MVP only value) |
| reminder_time | time | YES | Per-habit reminder override |
| sort_order | integer | NO | User-defined sort position |
| is_active | boolean | NO | Default true; false = soft deleted |
| created_at | timestamptz | NO | Habit creation timestamp |
| updated_at | timestamptz | NO | Last update timestamp |

#### Table: `habit_logs`
| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | uuid | NO | Primary key |
| habit_id | uuid | NO | FK → habits.id; RLS enforced via habits.user_id |
| user_id | uuid | NO | Denormalized for RLS and query efficiency |
| log_date | date | NO | The calendar date of completion (not timestamp) |
| completed | boolean | NO | Default true when log exists (absence = not done) |
| is_grace_day | boolean | NO | Default false; true if this log closes a grace-day gap |
| created_at | timestamptz | NO | When the log was created |
| UNIQUE | — | — | (habit_id, log_date) — one log per habit per day |

#### Table: `streaks`
| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | uuid | NO | Primary key |
| habit_id | uuid | NO | FK → habits.id; unique per habit |
| user_id | uuid | NO | Denormalized for RLS |
| current_streak | integer | NO | Current consecutive days (with grace days counted) |
| longest_streak | integer | NO | All-time longest streak for this habit |
| grace_days_used_this_week | integer | NO | Resets each Monday; max 1 per habit per week |
| last_completed_date | date | YES | Date of most recent completion or grace day |
| last_streak_reset | date | YES | Date the last streak was broken and reset to 0 |
| updated_at | timestamptz | NO | Last recalculation timestamp |

#### Table: `groups`
| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | uuid | NO | Primary key |
| name | text | NO | Group display name |
| invite_code | text | NO | Short unique code for joining; unique |
| created_by | uuid | NO | FK → users.id |
| member_count | integer | NO | Denormalized count; updated by trigger |
| created_at | timestamptz | NO | Group creation timestamp |
| updated_at | timestamptz | NO | Last update timestamp |

#### Table: `group_members`
| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | uuid | NO | Primary key |
| group_id | uuid | NO | FK → groups.id |
| user_id | uuid | NO | FK → users.id |
| joined_at | timestamptz | NO | When the user joined |
| UNIQUE | — | — | (group_id, user_id) — one membership per user per group |

#### Table: `ai_messages`
| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | uuid | NO | Primary key |
| user_id | uuid | NO | FK → users.id; RLS enforced |
| message_date | date | NO | The day this message applies to |
| content | text | NO | Full message text from Claude API |
| message_type | text | NO | "daily", "day1_welcome", "streak_3", "streak_7" |
| habit_ids_referenced | uuid[] | YES | Array of habit IDs mentioned in the message |
| model_used | text | NO | Claude model identifier used to generate |
| prompt_tokens | integer | YES | Token count for cost tracking |
| completion_tokens | integer | YES | Token count for cost tracking |
| created_at | timestamptz | NO | Generation timestamp |
| UNIQUE | — | — | (user_id, message_date) — one message per user per day |

#### Table: `analytics_snapshots`
| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | uuid | NO | Primary key |
| user_id | uuid | NO | FK → users.id; RLS enforced |
| snapshot_type | text | NO | "weekly" or "monthly" |
| period_start | date | NO | First day of the period |
| period_end | date | NO | Last day of the period |
| habit_id | uuid | NO | FK → habits.id |
| completion_rate | numeric(5,2) | NO | Percentage, 0.00–100.00 |
| days_completed | integer | NO | Count of days completed in period |
| days_possible | integer | NO | Total active days in period |
| streak_at_end | integer | NO | Streak count at end of period |
| created_at | timestamptz | NO | Snapshot generation timestamp |

#### Table: `notification_tokens`
| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | uuid | NO | Primary key |
| user_id | uuid | NO | FK → users.id; RLS enforced |
| token | text | NO | Expo push token or FCM token |
| platform | text | NO | "ios", "android", or "web" |
| is_active | boolean | NO | Default true; set false on delivery failure |
| created_at | timestamptz | NO | Token registration timestamp |
| updated_at | timestamptz | NO | Last update |
| UNIQUE | — | — | (user_id, token) |

---

### Acceptance Criteria

**Auth — Sign Up**
- DONE when: User can create an account with email/password; Supabase session is returned; user record exists in `users` table; user is redirected to onboarding.
- DONE when: Google OAuth sign-up completes and creates the same user record.
- DONE when: Duplicate email returns a clear error message.

**Auth — Log In / Log Out**
- DONE when: User can log in and receive a valid JWT; invalid credentials return a 401 with a user-readable message.
- DONE when: Log out clears session and redirects to login screen.

**Habit Creation**
- DONE when: User can create a habit with a name; habit appears in dashboard immediately.
- DONE when: Habit creation is rejected if user already has 10 active habits (returns 422 with clear message).
- DONE when: Name is required; empty name submission is blocked at the UI and returns a 422 from the API.

**Habit Completion Logging**
- DONE when: Tapping/clicking a habit marks it complete for today; the UI updates immediately (optimistic update).
- DONE when: Logging the same habit twice for the same day is idempotent (no duplicate records, no error shown to user).
- DONE when: Habit logs are scoped to the authenticated user (RLS — user cannot log another user's habit).

**Streak Calculation**
- DONE when: Completing a habit for N consecutive days shows a streak of N.
- DONE when: Missing one day within a 7-day window where a grace day has not been used does not reset the streak; grace day is marked as used for that week.
- DONE when: Missing one day when the grace day has already been used that week resets the streak to 0.
- DONE when: Grace day counter resets every Monday.

**AI Coaching Messages**
- DONE when: A Day 1 welcome message is generated and displayed during onboarding completion; message contains the user's display name and at least one habit name.
- DONE when: One AI message is generated per user per day; a second call for the same user on the same day returns the cached message (no new Claude API call).
- DONE when: Day 3 and Day 7 streak messages are triggered when a user's streak for any habit reaches exactly 3 or 7; message references the specific habit by name.
- DONE when: AI messages are stored in `ai_messages` and visible in the coach history screen.

**Groups — Create and Join**
- DONE when: User can create a group and receive a unique invite code.
- DONE when: User can join a group by entering a valid invite code; membership appears immediately.
- DONE when: Invalid invite code returns a 404 with a user-readable message.
- DONE when: User cannot join the same group twice (idempotent or clear error).

**Group Streak Visibility**
- DONE when: Group detail screen shows all members' display names and their current streak count for each of their active habits.
- DONE when: A user who is not a group member cannot retrieve group member streak data (RLS via group_members).

**Analytics — Weekly**
- DONE when: Weekly summary shows per-habit completion rate (percentage) for the last 7 days.
- DONE when: Data is scoped to the authenticated user.

**Analytics — Monthly**
- DONE when: Monthly summary shows per-habit completion rate and streak-at-end for the last 30 days.
- DONE when: Data is scoped to the authenticated user.

**Notifications**
- DONE when: User can register a device push token; token is stored and associated with their account.
- DONE when: User can disable notifications in settings; preference is respected (no push sent to disabled users).

