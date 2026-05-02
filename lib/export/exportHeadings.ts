import type { DescriptiveMetrics } from "@/lib/analytics/descriptiveMetrics";
import type { DescriptiveFilters } from "@/lib/filters/descriptiveFilters";

export type DashboardExportTab = "descriptive" | "prescriptive" | "annotations";

export function tabTitle(tab: DashboardExportTab): string {
  switch (tab) {
    case "descriptive":
      return "Super: Descriptive";
    case "prescriptive":
      return "Super: Prescriptive";
    case "annotations":
      return "Super: Annotations";
    default:
      return tab;
  }
}

export function filterLines(filters: DescriptiveFilters): string[] {
  const y = filters.year !== undefined ? String(filters.year) : "All";
  return [
    `Region: ${filters.region}`,
    `State: ${filters.state}`,
    `Segment: ${filters.segment}`,
    `Category: ${filters.category}`,
    `Year: ${y}`,
  ];
}

export function formatExportCreatedOn(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00.000Z`);
  return new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" }).format(d);
}

export function yearLabelForExportTitle(
  filters: DescriptiveFilters,
  descriptive: DescriptiveMetrics
): string {
  if (filters.year !== undefined) {
    return String(filters.year);
  }
  const ys = [...descriptive.filterOptions.years].sort((a, b) => a - b);
  if (ys.length === 0) {
    return "All years";
  }
  if (ys.length === 1) {
    return String(ys[0]);
  }
  return `${ys[0]} to ${ys[ys.length - 1]}`;
}

export function buildExportPrimaryTitle(
  filters: DescriptiveFilters,
  descriptive: DescriptiveMetrics
): string {
  let head: string;
  if (filters.state !== "All") {
    head = `Superstore ${filters.state}`;
  } else if (filters.region !== "All") {
    head = `Superstore ${filters.region} Region`;
  } else {
    head = "Superstore Nationwide";
  }

  const tail: string[] = [];
  if (filters.segment !== "All") {
    tail.push(`${filters.segment} Segment`);
  }
  if (filters.category !== "All") {
    tail.push(filters.category);
  }
  tail.push(yearLabelForExportTitle(filters, descriptive));

  return `${head} - ${tail.join(" - ")}`;
}

export function exportCreatedLine(exportedAtIsoDate: string): string {
  return `Export created on ${formatExportCreatedOn(exportedAtIsoDate)}`;
}
