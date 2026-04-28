"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";

interface FilterBarProps {
  regions: string[];
  states: string[];
  segments: string[];
  categories: string[];
  years: number[];
}

interface SelectFilterProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}

function SelectFilter({ label, value, options, onChange }: SelectFilterProps) {
  return (
    <label className="grid gap-1 text-xs font-medium text-slate-600">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
      >
        <option value="All">All</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export function FilterBar({ regions, states, segments, categories, years }: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "All") params.delete(key);
    else params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <SlidersHorizontal size={16} />
        Filters
      </div>
      <div className="grid gap-3 md:grid-cols-5">
        <SelectFilter
          label="Region"
          value={searchParams.get("region") ?? "All"}
          options={regions}
          onChange={(value) => setFilter("region", value)}
        />
        <SelectFilter
          label="State"
          value={searchParams.get("state") ?? "All"}
          options={states}
          onChange={(value) => setFilter("state", value)}
        />
        <SelectFilter
          label="Segment"
          value={searchParams.get("segment") ?? "All"}
          options={segments}
          onChange={(value) => setFilter("segment", value)}
        />
        <SelectFilter
          label="Category"
          value={searchParams.get("category") ?? "All"}
          options={categories}
          onChange={(value) => setFilter("category", value)}
        />
        <label className="grid gap-1 text-xs font-medium text-slate-600">
          Year
          <select
            value={searchParams.get("year") ?? "All"}
            onChange={(event) => setFilter("year", event.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
          >
            <option value="All">All</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
