import clsx from "clsx";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string;
  delta: number;
  deltaLabel: string;
}

export function KpiCard({ title, value, delta, deltaLabel }: KpiCardProps) {
  const positive = delta >= 0;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
      <div
        className={clsx(
          "mt-3 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
          positive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
        )}
      >
        {positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        <span>{Math.abs(delta).toLocaleString()}</span>
        <span>{deltaLabel}</span>
      </div>
    </article>
  );
}
