"use client";

import React, { useState, useEffect } from "react";
import posthog from "posthog-js";
import { CompletionChart, type CompletionDataPoint } from "@/components/analytics/completion-chart";
import { StreakChart, type StreakDataPoint } from "@/components/analytics/streak-chart";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Period = "week" | "month";

interface SummaryStats {
  bestStreakEver: number;
  bestHabitName: string;
  totalLogged: number;
  mostConsistentHabit: string;
  mostConsistentRate: number;
}

// ---------------------------------------------------------------------------
// Mock data — TODO: replace with API calls
// ---------------------------------------------------------------------------

const WEEK_COMPLETION: CompletionDataPoint[] = [
  { habitName: "Morning Run", completionRate: 86, daysCompleted: 6, daysPossible: 7 },
  { habitName: "Read 20pg", completionRate: 57, daysCompleted: 4, daysPossible: 7 },
  { habitName: "Meditate", completionRate: 100, daysCompleted: 7, daysPossible: 7 },
];

const MONTH_COMPLETION: CompletionDataPoint[] = [
  { habitName: "Morning Run", completionRate: 77, daysCompleted: 23, daysPossible: 30 },
  { habitName: "Read 20pg", completionRate: 63, daysCompleted: 19, daysPossible: 30 },
  { habitName: "Meditate", completionRate: 90, daysCompleted: 27, daysPossible: 30 },
];

function generateStreakData(days: number): StreakDataPoint[] {
  const data: StreakDataPoint[] = [];
  let streak = 0;
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const completed = Math.random() > 0.25;
    if (completed) {
      streak++;
    } else if (Math.random() > 0.5) {
      streak = 0;
    }
    data.push({
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      streak,
    });
  }
  return data;
}

const WEEK_STREAK = generateStreakData(7);
const MONTH_STREAK = generateStreakData(30);

const MOCK_SUMMARY: SummaryStats = {
  bestStreakEver: 21,
  bestHabitName: "Morning Run",
  totalLogged: 89,
  mostConsistentHabit: "Meditate",
  mostConsistentRate: 90,
};

// ---------------------------------------------------------------------------
// Calendar heatmap
// ---------------------------------------------------------------------------

interface HeatmapDay {
  date: Date;
  rate: number; // 0-100 | -1 = no data
}

function CalendarHeatmap({ days }: { days: HeatmapDay[] }) {
  function cellColor(rate: number): string {
    if (rate < 0) return "bg-neutral-100";
    if (rate === 0) return "bg-neutral-200";
    if (rate < 40) return "bg-brand-100";
    if (rate < 70) return "bg-brand-300";
    if (rate < 90) return "bg-brand-500";
    return "bg-brand-700";
  }

  return (
    <div>
      {/* Day labels */}
      <div className="mb-1 grid grid-cols-7 gap-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-center text-xs text-neutral-400">{d}</div>
        ))}
      </div>
      {/* Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => (
          <div
            key={i}
            className={`aspect-square rounded-sm ${cellColor(day.rate)} transition-colors`}
            title={
              day.rate >= 0
                ? `${day.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}: ${day.rate}%`
                : day.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
            }
          />
        ))}
      </div>
      {/* Legend */}
      <div className="mt-2 flex items-center gap-1.5 justify-end">
        <span className="text-xs text-neutral-400">Less</span>
        {["bg-neutral-200", "bg-brand-100", "bg-brand-300", "bg-brand-500", "bg-brand-700"].map((c) => (
          <div key={c} className={`h-3 w-3 rounded-sm ${c}`} />
        ))}
        <span className="text-xs text-neutral-400">More</span>
      </div>
    </div>
  );
}

function generateHeatmapDays(count: number): HeatmapDay[] {
  const days: HeatmapDay[] = [];
  const today = new Date();
  const startDay = new Date(today);
  startDay.setDate(today.getDate() - count + 1);
  // Pad to start of week
  const firstDayOfWeek = startDay.getDay();
  for (let p = 0; p < firstDayOfWeek; p++) {
    days.push({ date: new Date(0), rate: -1 });
  }
  for (let i = 0; i < count; i++) {
    const d = new Date(startDay);
    d.setDate(startDay.getDate() + i);
    days.push({ date: d, rate: d > today ? -1 : Math.floor(Math.random() * 101) });
  }
  return days;
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl bg-white px-4 py-4 shadow-sm ring-1 ring-neutral-100">
      <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">{label}</p>
      <p className="mt-1 font-mono text-2xl font-bold text-neutral-900">{value}</p>
      {sub && <p className="mt-0.5 truncate text-xs text-neutral-500">{sub}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Analytics page
// ---------------------------------------------------------------------------

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("week");
  const [heatmapDays] = useState(() => generateHeatmapDays(28));

  useEffect(() => {
    posthog.capture("analytics_viewed", { period });
    // TODO: replace with API calls
    // fetch(`/api/analytics/${period === "week" ? "weekly" : "monthly"}`)
  }, [period]);

  const completionData = period === "week" ? WEEK_COMPLETION : MONTH_COMPLETION;
  const streakData = period === "week" ? WEEK_STREAK : MONTH_STREAK;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:px-6 md:py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Analytics</h1>

        {/* Period toggle */}
        <div className="flex items-center gap-1 rounded-xl bg-neutral-100 p-1">
          {(["week", "month"] as Period[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                period === p
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              {p === "week" ? "Week" : "Month"}
            </button>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          label="Best streak ever"
          value={`${MOCK_SUMMARY.bestStreakEver} days`}
          sub={MOCK_SUMMARY.bestHabitName}
        />
        <StatCard
          label="Total logged"
          value={MOCK_SUMMARY.totalLogged}
          sub="all time"
        />
        <StatCard
          label="Most consistent"
          value={`${MOCK_SUMMARY.mostConsistentRate}%`}
          sub={MOCK_SUMMARY.mostConsistentHabit}
        />
      </div>

      {/* Completion rate chart */}
      <div className="mb-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-100">
        <h2 className="mb-4 text-sm font-semibold text-neutral-700">
          Completion rate — {period === "week" ? "this week" : "this month"}
        </h2>
        <CompletionChart data={completionData} />
      </div>

      {/* Streak chart */}
      <div className="mb-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-100">
        <h2 className="mb-4 text-sm font-semibold text-neutral-700">
          Streak history — {period === "week" ? "last 7 days" : "last 30 days"}
        </h2>
        <StreakChart data={streakData} />
      </div>

      {/* Calendar heatmap (month only) */}
      {period === "month" && (
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-neutral-100">
          <h2 className="mb-4 text-sm font-semibold text-neutral-700">
            Activity heatmap — last 28 days
          </h2>
          <CalendarHeatmap days={heatmapDays} />
        </div>
      )}
    </div>
  );
}
