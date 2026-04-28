"use client";

interface TrendChartProps {
  title: string;
  data: Array<{
    month: string;
    cp: number;
    pp: number;
  }>;
  unit?: string;
}

import { useMemo, useState } from "react";

export function TrendChart({ title, data, unit = "" }: TrendChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const height = 180;
  const width = 700;
  const values = data.flatMap((item) => [item.cp, item.pp]);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const range = max - min || 1;
  const stepX = width / Math.max(data.length - 1, 1);

  const cpPoints = useMemo(
    () =>
      data
        .map((entry, index) => {
          const x = (index / Math.max(data.length - 1, 1)) * width;
          const y = height - ((entry.cp - min) / range) * height;
          return `${x},${y}`;
        })
        .join(" "),
    [data, height, max, min, range, width]
  );

  const ppPoints = useMemo(
    () =>
      data
        .map((entry, index) => {
          const x = (index / Math.max(data.length - 1, 1)) * width;
          const y = height - ((entry.pp - min) / range) * height;
          return `${x},${y}`;
        })
        .join(" "),
    [data, height, max, min, range, width]
  );

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-800">{title}</h3>
        <div className="flex items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1 text-slate-600">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            CP
          </span>
          <span className="inline-flex items-center gap-1 text-slate-600">
            <span className="h-2 w-2 rounded-full bg-slate-400" />
            PP
          </span>
        </div>
      </div>
      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full"
          onMouseLeave={() => setActiveIndex(null)}
          onMouseMove={(event) => {
            const bounds = event.currentTarget.getBoundingClientRect();
            const x = event.clientX - bounds.left;
            const ratio = x / bounds.width;
            const idx = Math.min(data.length - 1, Math.max(0, Math.round(ratio * (data.length - 1))));
            setActiveIndex(idx);
          }}
        >
          <polyline fill="none" stroke="#94a3b8" strokeWidth="2.5" points={ppPoints} />
          <polyline fill="none" stroke="#3b82f6" strokeWidth="3" points={cpPoints} />
          {activeIndex !== null && (
            <line
              x1={activeIndex * stepX}
              y1={0}
              x2={activeIndex * stepX}
              y2={height}
              stroke="#cbd5e1"
              strokeDasharray="4 4"
            />
          )}
        </svg>
        {activeIndex !== null && (
          <div className="pointer-events-none absolute right-2 top-2 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-xs text-slate-700 shadow-sm">
            <p className="font-semibold text-slate-900">{data[activeIndex].month}</p>
            <p>
              CP: {data[activeIndex].cp.toLocaleString()}
              {unit}
            </p>
            <p>
              PP: {data[activeIndex].pp.toLocaleString()}
              {unit}
            </p>
          </div>
        )}
      </div>
      <div className="mt-2 text-xs text-slate-500">Hover to inspect monthly CP vs PP values.</div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
        {data.slice(-6).map((entry) => (
          <span key={entry.month} className="rounded bg-slate-100 px-2 py-1">
            {entry.month}
          </span>
        ))}
      </div>
    </article>
  );
}
