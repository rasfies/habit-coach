"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  type TooltipProps,
} from "recharts";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CompletionDataPoint {
  habitName: string;
  completionRate: number; // 0-100
  daysCompleted: number;
  daysPossible: number;
}

interface CompletionChartProps {
  data: CompletionDataPoint[];
  title?: string;
  className?: string;
}

// ---------------------------------------------------------------------------
// Custom tooltip
// ---------------------------------------------------------------------------

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as CompletionDataPoint;

  return (
    <div className="rounded-xl bg-white px-3.5 py-2.5 shadow-xl ring-1 ring-neutral-200">
      <p className="text-sm font-semibold text-neutral-800 mb-1">{label}</p>
      <p className="text-2xl font-bold font-mono text-brand-600">
        {d.completionRate.toFixed(0)}%
      </p>
      <p className="text-xs text-neutral-500 mt-0.5">
        {d.daysCompleted} / {d.daysPossible} days
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Color based on completion rate
// ---------------------------------------------------------------------------

function barColor(rate: number): string {
  if (rate >= 80) return "#4F46E5"; // brand-600 — great
  if (rate >= 50) return "#818CF8"; // brand-400 — ok
  return "#C7D2FE";                 // brand-200 — low
}

// ---------------------------------------------------------------------------
// CompletionChart
// ---------------------------------------------------------------------------

export function CompletionChart({ data, title, className }: CompletionChartProps) {
  if (!data.length) {
    return (
      <div className={cn("flex h-48 items-center justify-center rounded-xl bg-neutral-50 text-sm text-neutral-400", className)}>
        No data to display yet.
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      {title && (
        <h3 className="mb-3 text-sm font-semibold text-neutral-700">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={data}
          margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
          barCategoryGap="30%"
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis
            dataKey="habitName"
            tick={{ fontSize: 12, fill: "#6B7280" }}
            axisLine={false}
            tickLine={false}
            interval={0}
          />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 11, fill: "#9CA3AF" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "#F3F4F6", radius: 8 }}
          />
          <Bar dataKey="completionRate" radius={[6, 6, 0, 0]} maxBarSize={60}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={barColor(entry.completionRate)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default CompletionChart;
