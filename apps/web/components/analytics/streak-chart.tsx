"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  type TooltipProps,
} from "recharts";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StreakDataPoint {
  date: string;      // "MMM D" display label
  streak: number;    // streak length on that date
}

interface StreakChartProps {
  data: StreakDataPoint[];
  habitName?: string;
  title?: string;
  className?: string;
}

// ---------------------------------------------------------------------------
// Custom tooltip
// ---------------------------------------------------------------------------

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl bg-white px-3.5 py-2.5 shadow-xl ring-1 ring-neutral-200">
      <p className="text-xs text-neutral-500 mb-1">{label}</p>
      <p className="text-2xl font-bold font-mono text-highlight-500">
        {payload[0]?.value}
      </p>
      <p className="text-xs text-neutral-400">day streak</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// StreakChart
// ---------------------------------------------------------------------------

export function StreakChart({ data, title, className }: StreakChartProps) {
  if (!data.length) {
    return (
      <div className={cn("flex h-48 items-center justify-center rounded-xl bg-neutral-50 text-sm text-neutral-400", className)}>
        No streak data yet.
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      {title && (
        <h3 className="mb-3 text-sm font-semibold text-neutral-700">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={220}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
        >
          <defs>
            <linearGradient id="streakGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#FBBF24" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#9CA3AF" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#9CA3AF" }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            width={30}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="streak"
            stroke="url(#streakGradient)"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 5, fill: "#F59E0B", stroke: "#FFF", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default StreakChart;
