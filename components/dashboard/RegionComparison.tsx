import { type RegionPoint } from "@/lib/analytics/descriptiveMetrics";

interface RegionComparisonProps {
  data: RegionPoint[];
}

export function RegionComparison({ data }: RegionComparisonProps) {
  const maxSales = Math.max(...data.map((entry) => entry.sales), 1);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-slate-800">Region Comparison</h3>
      <div className="space-y-4">
        {data.map((entry) => {
          const width = (entry.sales / maxSales) * 100;
          return (
            <div key={entry.region}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">{entry.region}</span>
                <span className="text-slate-500">
                  ${entry.sales.toLocaleString()} | {entry.profitRatio.toFixed(2)}% |{" "}
                  {entry.daysToShip.toFixed(2)} days
                </span>
              </div>
              <div className="h-3 rounded-full bg-slate-100">
                <div className="h-3 rounded-full bg-violet-500" style={{ width: `${width}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}
