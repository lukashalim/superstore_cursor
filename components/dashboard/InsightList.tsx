import clsx from "clsx";
import { type PrescriptiveInsight } from "@/lib/analytics/prescriptiveMetrics";

interface InsightListProps {
  title: string;
  items: PrescriptiveInsight[];
}

export function InsightList({ title, items }: InsightListProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-slate-800">{title}</h3>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.title} className="rounded-xl border border-slate-200 p-3">
            <div className="mb-1 flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-slate-800">{item.title}</h4>
              <span
                className={clsx(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  item.impact === "High"
                    ? "bg-red-50 text-red-700"
                    : "bg-amber-50 text-amber-700"
                )}
              >
                {item.impact}
              </span>
            </div>
            <p className="text-sm text-slate-600">{item.detail}</p>
          </div>
        ))}
      </div>
    </article>
  );
}
