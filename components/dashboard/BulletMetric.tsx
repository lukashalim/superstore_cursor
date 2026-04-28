interface BulletMetricProps {
  title: string;
  value: number;
  target: number;
  unit?: string;
}

export function BulletMetric({ title, value, target, unit = "" }: BulletMetricProps) {
  const max = Math.max(value, target, 1);
  const width = Math.min(100, (value / max) * 100);
  const targetPos = Math.min(100, (target / max) * 100);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        <p className="text-sm text-slate-500">Target {target.toFixed(2)}{unit}</p>
      </div>
      <div className="relative h-4 rounded-full bg-slate-100">
        <div className="h-4 rounded-full bg-sky-500" style={{ width: `${width}%` }} />
        <span
          className="absolute top-[-4px] h-6 w-[2px] bg-slate-700"
          style={{ left: `${targetPos}%` }}
        />
      </div>
      <p className="mt-3 text-xl font-semibold text-slate-900">
        {value.toFixed(2)}
        {unit}
      </p>
    </article>
  );
}
