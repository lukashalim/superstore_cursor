"use client";

import clsx from "clsx";
import { geoAlbersUsa, geoPath } from "d3-geo";
import { MapPinned } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { feature, mesh } from "topojson-client";
import usAtlas from "us-atlas/states-10m.json";

interface StateMapFilterProps {
  states: string[];
  stateRegionMap: Record<string, string>;
}

const fipsToStateName: Record<string, string> = {
  "01": "Alabama",
  "02": "Alaska",
  "04": "Arizona",
  "05": "Arkansas",
  "06": "California",
  "08": "Colorado",
  "09": "Connecticut",
  "10": "Delaware",
  "11": "District of Columbia",
  "12": "Florida",
  "13": "Georgia",
  "15": "Hawaii",
  "16": "Idaho",
  "17": "Illinois",
  "18": "Indiana",
  "19": "Iowa",
  "20": "Kansas",
  "21": "Kentucky",
  "22": "Louisiana",
  "23": "Maine",
  "24": "Maryland",
  "25": "Massachusetts",
  "26": "Michigan",
  "27": "Minnesota",
  "28": "Mississippi",
  "29": "Missouri",
  "30": "Montana",
  "31": "Nebraska",
  "32": "Nevada",
  "33": "New Hampshire",
  "34": "New Jersey",
  "35": "New Mexico",
  "36": "New York",
  "37": "North Carolina",
  "38": "North Dakota",
  "39": "Ohio",
  "40": "Oklahoma",
  "41": "Oregon",
  "42": "Pennsylvania",
  "44": "Rhode Island",
  "45": "South Carolina",
  "46": "South Dakota",
  "47": "Tennessee",
  "48": "Texas",
  "49": "Utah",
  "50": "Vermont",
  "51": "Virginia",
  "53": "Washington",
  "54": "West Virginia",
  "55": "Wisconsin",
  "56": "Wyoming",
};

type GeoFeature = {
  id: string | number;
  type: "Feature";
  properties: Record<string, unknown>;
  geometry: unknown;
};

export function StateMapFilter({ states, stateRegionMap }: StateMapFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeState = searchParams.get("state") ?? "All";
  const activeRegion = searchParams.get("region") ?? "All";

  const setStateFilter = (stateName: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (stateName === "All") {
      params.delete("state");
      params.delete("region");
    } else {
      params.set("state", stateName);
      const region = stateRegionMap[stateName];
      if (region) params.set("region", region);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const availableStates = useMemo(() => new Set(states), [states]);
  const projection = useMemo(() => geoAlbersUsa().scale(920).translate([487.5, 305]), []);
  const pathGenerator = useMemo(() => geoPath(projection), [projection]);

  const geographies = useMemo(() => {
    const topology = usAtlas as unknown as {
      objects: { states: unknown };
    };
    const statesFeatureCollection = feature(topology as never, topology.objects.states as never);
    return (statesFeatureCollection as unknown as { features: GeoFeature[] }).features;
  }, []);

  const borders = useMemo(() => {
    const topology = usAtlas as unknown as {
      objects: { states: unknown };
    };
    return mesh(topology as never, topology.objects.states as never, (a, b) => a !== b);
  }, []);

  return (
    <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <MapPinned size={16} />
        State Map Filter
      </div>
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setStateFilter("All")}
          className={clsx(
            "rounded-lg border px-3 py-1.5 text-xs font-medium",
            activeState === "All"
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-300 bg-slate-50 text-slate-700"
          )}
        >
          All States
        </button>
        <span className="text-xs text-slate-500">
          Active: {activeState === "All" ? "All" : `${activeState} (${activeRegion})`}
        </span>
      </div>
      <div className="rounded-xl bg-slate-100 p-3">
        <svg viewBox="0 0 975 610" className="h-[230px] w-full">
          <g>
            {geographies.map((geo) => {
              const fips = String(geo.id).padStart(2, "0");
              const stateName = fipsToStateName[fips];
              if (!stateName || !availableStates.has(stateName)) return null;

              const isActive = activeState === stateName;
              const isDimmed = activeState !== "All" && !isActive;

              return (
                <path
                  key={fips}
                  d={pathGenerator(geo as never) ?? ""}
                  fill={isActive ? "#2f6178" : "#d9d9d9"}
                  fillOpacity={isDimmed ? 0.35 : 1}
                  stroke="#ffffff"
                  strokeWidth={0.8}
                  className="cursor-pointer transition-opacity hover:opacity-80"
                  onClick={() => setStateFilter(stateName)}
                >
                  <title>{stateName}</title>
                </path>
              );
            })}
            <path d={pathGenerator(borders as never) ?? ""} fill="none" stroke="#ffffff" strokeWidth={0.8} />
          </g>
        </svg>
      </div>
    </section>
  );
}
