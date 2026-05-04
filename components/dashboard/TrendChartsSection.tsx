"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TrendComparisonPoint, TrendMonthTransaction } from "@/lib/analytics/descriptiveMetrics";
import { TrendChart, type TrendPeriod } from "./TrendChart";

interface TrendChartsSectionProps {
  salesTrend: TrendComparisonPoint[];
  profitRatioTrend: TrendComparisonPoint[];
  drilldown: {
    cpYear: number;
    ppYear: number;
    cpByMonth: TrendMonthTransaction[][];
    ppByMonth: TrendMonthTransaction[][];
  };
}

interface DrillSelection {
  chartTitle: string;
  period: TrendPeriod;
  monthIndex: number;
}

const dateDisplay = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

export function TrendChartsSection({ salesTrend, profitRatioTrend, drilldown }: TrendChartsSectionProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<DrillSelection | null>(null);

  const openDrilldown = useCallback((chartTitle: string, period: TrendPeriod, monthIndex: number) => {
    setSelection({ chartTitle, period, monthIndex });
  }, []);

  useEffect(() => {
    if (!selection) return;

    const onPointerDown = (event: PointerEvent) => {
      const root = rootRef.current;
      const target = event.target;
      if (!root || !(target instanceof Node) || !root.contains(target)) {
        setSelection(null);
      }
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [selection]);

  const monthLabel =
    selection !== null &&
    selection.monthIndex >= 0 &&
    selection.monthIndex < salesTrend.length
      ? salesTrend[selection.monthIndex]?.month ?? ""
      : "";

  const detailYear = selection?.period === "pp" ? drilldown.ppYear : drilldown.cpYear;
  const detailRows: TrendMonthTransaction[] =
    selection !== null &&
    selection.monthIndex >= 0 &&
    selection.monthIndex < drilldown.cpByMonth.length
      ? selection.period === "pp"
        ? (drilldown.ppByMonth[selection.monthIndex] ?? [])
        : (drilldown.cpByMonth[selection.monthIndex] ?? [])
      : [];

  const periodShort = selection?.period === "pp" ? "PP (prior year)" : "CP (current period)";

  return (
    <div ref={rootRef} className="mt-5">
      <section className="grid gap-4 lg:grid-cols-2">
        <TrendChart
          title="Sales Trend"
          data={salesTrend}
          onMonthPointClick={(period, idx) => openDrilldown("Sales Trend", period, idx)}
        />
        <TrendChart
          title="Profit Ratio Trend"
          data={profitRatioTrend}
          unit="%"
          onMonthPointClick={(period, idx) => openDrilldown("Profit Ratio Trend", period, idx)}
        />
      </section>

      {selection !== null && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Line items</p>
              <h3 className="text-lg font-semibold text-slate-900">
                {monthLabel} {detailYear}
                <span className="ml-2 font-normal text-slate-500">· {periodShort}</span>
              </h3>
              <p className="mt-0.5 text-sm text-slate-600">{selection.chartTitle}</p>
            </div>
            <p className="text-xs text-slate-500">
              {detailRows.length} line item{detailRows.length === 1 ? "" : "s"}
            </p>
          </div>

          {detailRows.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
              No transactions in this month for the selected filters.
            </p>
          ) : (
            <div className="max-h-[min(50vh,28rem)] overflow-auto rounded-lg border border-slate-100">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="sticky top-0 z-[1] bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="border-b border-slate-200 px-3 py-2">Order ID</th>
                    <th className="border-b border-slate-200 px-3 py-2">Product</th>
                    <th className="border-b border-slate-200 px-3 py-2">Customer</th>
                    <th className="border-b border-slate-200 px-3 py-2">Order date</th>
                  </tr>
                </thead>
                <tbody className="text-slate-800">
                  {detailRows.map((row) => (
                    <tr key={row.rowId} className="border-b border-slate-100 last:border-0">
                      <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-slate-700">{row.orderId}</td>
                      <td className="px-3 py-2">{row.productName}</td>
                      <td className="px-3 py-2">{row.customerName}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                        {dateDisplay.format(new Date(row.orderDateIso))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
