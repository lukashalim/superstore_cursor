"use client";

import clsx from "clsx";
import { MapPinned } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface RegionMapFilterProps {
  regions: string[];
}

const layoutOrder = ["West", "Central", "South", "East"];

interface RegionTileProps {
  region: string;
  activeRegion: string;
}

function RegionTile({ region, activeRegion }: RegionTileProps) {
  const isActive = activeRegion === region;
  const dimmed = activeRegion !== "All" && !isActive;
  const fill = isActive ? "#2f6178" : "#d9d9d9";
  const stroke = isActive ? "#245064" : "#cfcfcf";
  const opacity = dimmed ? 0.45 : 1;

  // Stylized US silhouette split into four macro regions
  const westPath =
    "M10 30 L22 22 L28 24 L34 20 L40 22 L44 28 L42 38 L34 44 L22 46 L14 40 Z";
  const centralPath =
    "M44 28 L54 26 L60 24 L66 26 L68 34 L64 42 L56 44 L46 42 L42 38 Z";
  const southPath =
    "M42 38 L50 44 L58 46 L66 48 L74 50 L72 56 L64 58 L56 56 L50 52 L44 48 L38 44 Z";
  const eastPath =
    "M66 26 L74 22 L82 24 L90 22 L98 26 L102 32 L100 40 L94 44 L86 44 L78 40 L72 34 Z";

  return (
    <svg viewBox="0 0 112 72" className="h-16 w-full" role="img" aria-label={`${region} map`}>
      <path
        d="M8 30 L22 20 L36 18 L48 20 L62 18 L76 18 L92 20 L104 26 L104 40 L96 48 L80 50 L72 60 L54 60 L38 52 L24 50 L12 42 Z"
        fill="#f1f1f1"
        stroke="#d7d7d7"
        strokeWidth="1.5"
      />
      <path d={westPath} fill={region === "West" ? fill : "#e3e3e3"} stroke={stroke} opacity={opacity} />
      <path
        d={centralPath}
        fill={region === "Central" ? fill : "#e3e3e3"}
        stroke={stroke}
        opacity={opacity}
      />
      <path d={southPath} fill={region === "South" ? fill : "#e3e3e3"} stroke={stroke} opacity={opacity} />
      <path d={eastPath} fill={region === "East" ? fill : "#e3e3e3"} stroke={stroke} opacity={opacity} />
    </svg>
  );
}

export function RegionMapFilter({ regions }: RegionMapFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeRegion = searchParams.get("region") ?? "All";
  const orderedRegions = [
    ...layoutOrder.filter((region) => regions.includes(region)),
    ...regions.filter((region) => !layoutOrder.includes(region)),
  ];

  const setRegion = (region: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (region === "All") params.delete("region");
    else params.set("region", region);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <MapPinned size={16} />
        Region Map Filter
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <button
          type="button"
          onClick={() => setRegion("All")}
          className={clsx(
            "rounded-xl border px-3 py-2 text-sm font-medium",
            activeRegion === "All"
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-300 bg-slate-50 text-slate-700"
          )}
        >
          All Regions
        </button>
        {orderedRegions.map((region) => (
          <button
            type="button"
            key={region}
            onClick={() => setRegion(region)}
            className={clsx(
              "rounded-xl border p-2 text-sm font-medium transition-colors",
              activeRegion === region
                ? "border-[#2f6178] bg-slate-50 text-slate-900"
                : "border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100"
            )}
          >
            <RegionTile region={region} activeRegion={activeRegion} />
            <span className="mt-1 block text-xs">{region}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
