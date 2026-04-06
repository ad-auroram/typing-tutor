"use client";

type MetricCardProps = {
  label: string;
  value: string;
  helperText: string;
};

export function MetricCard({ label, value, helperText }: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">{value}</p>
      <p className="mt-1 text-sm text-zinc-500">{helperText}</p>
    </div>
  );
}
