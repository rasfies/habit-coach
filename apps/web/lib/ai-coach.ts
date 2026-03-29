import "server-only";
import { generateCoachingMessage } from "@/lib/claude";
import { isMilestone, getMilestoneLabel } from "@/lib/streak";
import type { HabitLog } from "@habit-coach/db";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface HabitContext {
  id: string;
  name: string;
  currentStreak: number;
  longestStreak: number;
  completedToday: boolean;
}

export interface CoachingContext {
  displayName: string;
  habits: HabitContext[];
  recentLogs: HabitLog[]; // last 7 days
  messageType: "daily" | "day1_welcome" | "streak_3" | "streak_7";
  milestoneHabitName?: string; // for streak_3 / streak_7
  milestoneStreak?: number;
}

export interface CoachingResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
}

// ─────────────────────────────────────────────
// Prompt builders
// ─────────────────────────────────────────────

function formatRecentActivity(
  habits: HabitContext[],
  recentLogs: HabitLog[]
): string {
  if (habits.length === 0) return "No habits tracked yet.";

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);
  const cutoff = sevenDaysAgo.toISOString().slice(0, 10);

  const lines = habits.map((h) => {
    const habitLogs = recentLogs.filter(
      (l) => l.habit_id === h.id && l.log_date >= cutoff && l.completed
    );
    const daysCompleted = new Set(habitLogs.map((l) => l.log_date)).size;
    const todayStatus = h.completedToday ? "done today" : "not yet today";
    const streakText =
      h.currentStreak > 0
        ? `${h.currentStreak}-day streak`
        : "no active streak";

    return `- "${h.name}": ${daysCompleted}/7 days last week, ${streakText}, ${todayStatus}`;
  });

  return lines.join("\n");
}

export function buildCoachingPrompt(ctx: CoachingContext): string {
  const habitList = ctx.habits.map((h) => `"${h.name}"`).join(", ");
  const activitySummary = formatRecentActivity(ctx.habits, ctx.recentLogs);

  const systemInstruction = `You are a warm, encouraging personal habit coach. Write personalized messages that:
- Reference the user's specific habit names directly
- Feel personal and genuine, not generic or corporate
- Are 2-4 sentences maximum
- Avoid clichés like "Great job!" or "Keep it up!"
- Match the tone to the situation (celebratory for milestones, supportive for daily)`;

  switch (ctx.messageType) {
    case "day1_welcome": {
      return `${systemInstruction}

User: ${ctx.displayName}
Their habits: ${habitList}

Write a warm Day 1 welcome message. Mention each habit by name. Set a positive expectation about checking in tomorrow. Make them feel they've made a real commitment, not just downloaded another app.`;
    }

    case "streak_3": {
      const label = getMilestoneLabel(3) ?? "3-Day Streak";
      return `${systemInstruction}

User: ${ctx.displayName}
Milestone: ${label} — "${ctx.milestoneHabitName}" has reached a 3-day streak!
All their habits and recent activity:
${activitySummary}

Celebrate hitting 3 consecutive days for "${ctx.milestoneHabitName}". Acknowledge that the first 3 days are the hardest. Be specific about what comes next (7 days is the next milestone). Keep it punchy and energizing.`;
    }

    case "streak_7": {
      const label = getMilestoneLabel(7) ?? "Week Warrior";
      return `${systemInstruction}

User: ${ctx.displayName}
Milestone: ${label} — "${ctx.milestoneHabitName}" has reached a 7-day streak!
All their habits and recent activity:
${activitySummary}

Celebrate one full week of "${ctx.milestoneHabitName}". Science says habits begin forming around 21 days — they're nearly 1/3 of the way there. Be genuinely celebratory but grounded. Reference their other habits briefly if relevant.`;
    }

    case "daily":
    default: {
      const highestStreak = Math.max(...ctx.habits.map((h) => h.currentStreak), 0);
      const topHabit = ctx.habits.find((h) => h.currentStreak === highestStreak);
      const allCompletedToday = ctx.habits.every((h) => h.completedToday);
      const noneCompletedToday = ctx.habits.every((h) => !h.completedToday);

      let situationNote = "";
      if (allCompletedToday) {
        situationNote = "The user has already completed ALL their habits today. Congratulate them warmly.";
      } else if (noneCompletedToday) {
        situationNote =
          "The user hasn't completed any habits yet today. Give them a gentle nudge to get started.";
      } else {
        const done = ctx.habits.filter((h) => h.completedToday).map((h) => `"${h.name}"`).join(", ");
        const remaining = ctx.habits.filter((h) => !h.completedToday).map((h) => `"${h.name}"`).join(", ");
        situationNote = `The user has completed ${done} today. Still to do: ${remaining}.`;
      }

      const nextMilestone = topHabit && highestStreak > 0
        ? (() => {
            const milestones = [3, 7, 14, 30];
            const next = milestones.find((m) => m > highestStreak);
            return next
              ? `${ctx.displayName}'s highest streak is ${highestStreak} days on "${topHabit.name}" — ${next - highestStreak} day(s) until the ${next}-day milestone.`
              : `${ctx.displayName} has a ${highestStreak}-day streak on "${topHabit.name}" — impressive!`;
          })()
        : "";

      return `${systemInstruction}

User: ${ctx.displayName}
Their habits and recent activity (last 7 days):
${activitySummary}

Today's situation: ${situationNote}
${nextMilestone ? `Streak context: ${nextMilestone}` : ""}

Write today's personalized daily coaching message. Reference specific habit names and real numbers. Be direct and warm — talk to them like a coach who knows them, not a chatbot.`;
    }
  }
}

// ─────────────────────────────────────────────
// Generation functions
// ─────────────────────────────────────────────

const MAX_TOKENS_BY_TYPE: Record<CoachingContext["messageType"], number> = {
  day1_welcome: 200,
  streak_3: 200,
  streak_7: 200,
  daily: 200,
};

/**
 * Generate a daily coaching message for a user.
 * This is the primary entry point called by the API route and cron job.
 */
export async function generateDailyCoachingMessage(
  displayName: string,
  habits: HabitContext[],
  recentLogs: HabitLog[],
  messageType: CoachingContext["messageType"] = "daily",
  milestoneHabitName?: string,
  milestoneStreak?: number
): Promise<CoachingResult> {
  const ctx: CoachingContext = {
    displayName,
    habits,
    recentLogs,
    messageType,
    milestoneHabitName,
    milestoneStreak,
  };

  const prompt = buildCoachingPrompt(ctx);
  const maxTokens = MAX_TOKENS_BY_TYPE[messageType];

  return generateCoachingMessage(prompt, maxTokens);
}

/**
 * Generate a milestone-specific message (streak_3 or streak_7).
 */
export async function generateMilestoneMessage(
  displayName: string,
  habits: HabitContext[],
  recentLogs: HabitLog[],
  habitName: string,
  streakCount: number
): Promise<CoachingResult> {
  if (!isMilestone(streakCount)) {
    throw new Error(`${streakCount} is not a recognized milestone`);
  }

  const messageType =
    streakCount === 3
      ? "streak_3"
      : streakCount === 7
      ? "streak_7"
      : "daily"; // fallback — shouldn't happen given isMilestone check

  return generateDailyCoachingMessage(
    displayName,
    habits,
    recentLogs,
    messageType as CoachingContext["messageType"],
    habitName,
    streakCount
  );
}
