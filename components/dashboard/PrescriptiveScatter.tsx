import { type PrescriptiveBubblePoint } from "@/lib/analytics/prescriptiveMetrics";

interface PrescriptiveScatterProps {
  data: PrescriptiveBubblePoint[];
}

export function PrescriptiveScatter({ data }: PrescriptiveScatterProps) {
  const width = 760;
  const height = 300;
  const minX = Math.min(...data.map((item) => item.sales), 0);
  const maxX = Math.max(...data.map((item) => item.sales), 1);
  const minY = Math.min(...data.map((item) => item.profitRatio), -10);
  const maxY = Math.max(...data.map((item) => item.profitRatio), 20);
  const xRange = maxX - minX || 1;
  const yRange = maxY - minY || 1;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-slate-800">Prescriptive Scatter Plot</h3>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        <line x1={0} x2={width} y1={height - 2} y2={height - 2} stroke="#cbd5e1" />
        <line x1={2} x2={2} y1={0} y2={height} stroke="#cbd5e1" />
        {data.map((point) => {
          const x = ((point.sales - minX) / xRange) * (width - 30) + 10;
          const y = height - ((point.profitRatio - minY) / yRange) * (height - 20) - 10;
          const radius = Math.max(7, Math.min(20, point.orders / 3));
          const color = point.profitRatio >= 10 ? "#14b8a6" : "#f59e0b";

          return (
            <g key={point.subCategory}>
              <circle cx={x} cy={y} r={radius} fill={color} opacity={0.75} />
              <text x={x + 10} y={y + 4} fontSize={10} fill="#334155">
                {point.subCategory}
              </text>
            </g>
          );
        })}
      </svg>
    </article>
  );
}
