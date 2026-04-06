"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { RoundHistoryEntry } from "../types/typing";

type TrendChartProps = {
  title: string;
  description: string;
  data: RoundHistoryEntry[];
  valueKey: "wpm" | "accuracy";
  averageKey: "averageWpm" | "averageAccuracy";
  color: string;
  averageColor: string;
  valueLabel: string;
  averageLabel: string;
  suffix?: string;
};

export function TrendChart({
  title,
  description,
  data,
  valueKey,
  averageKey,
  color,
  averageColor,
  valueLabel,
  averageLabel,
  suffix = "",
}: TrendChartProps) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white px-5 py-4">
      <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-zinc-500">{title}</h2>
      <p className="mt-1 text-sm text-zinc-500">{description}</p>

      {data.length > 0 ? (
        <div className="mt-4 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#e4e4e7" />
              <XAxis dataKey="round" stroke="#71717a" tickLine={false} axisLine={false} />
              <YAxis stroke="#71717a" tickLine={false} axisLine={false} width={34} />
              <Tooltip
                formatter={(value, name) => {
                  const numericValue = typeof value === "number" ? value : Number(value ?? 0);
                  return [`${numericValue.toFixed(1)}${suffix}`, String(name)];
                }}
                labelFormatter={(label) => `Round ${String(label)}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey={valueKey}
                name={valueLabel}
                stroke={color}
                strokeWidth={2.5}
                dot={{ r: 2 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey={averageKey}
                name={averageLabel}
                stroke={averageColor}
                strokeWidth={2.5}
                strokeDasharray="5 4"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="mt-4 text-sm text-zinc-500">Complete a round to start this chart.</p>
      )}
    </div>
  );
}
