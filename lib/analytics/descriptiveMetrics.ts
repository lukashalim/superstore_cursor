import { type DescriptiveFilters } from "@/lib/filters/descriptiveFilters";
import { type SuperstoreRow } from "@/lib/data/superstoreSchema";

export interface TrendPoint {
  month: string;
  sales: number;
  profitRatio: number;
  daysToShip: number;
}

export interface TrendComparisonPoint {
  month: string;
  cp: number;
  pp: number;
}

/** Line-level rows for a trend chart month, for drill-down UI (CP or PP year). */
export interface TrendMonthTransaction {
  rowId: string;
  orderId: string;
  productName: string;
  customerName: string;
  orderDateIso: string;
}

export interface RegionPoint {
  region: string;
  sales: number;
  profitRatio: number;
  daysToShip: number;
}

export interface DescriptiveMetrics {
  salesTotal: number;
  profitRatio: number;
  daysToShip: number;
  salesDeltaVsRegionAvg: number;
  profitRatioDeltaVsRegionAvg: number;
  daysToShipDeltaVsRegionAvg: number;
  trend: TrendPoint[];
  trendComparison: {
    sales: TrendComparisonPoint[];
    profitRatio: TrendComparisonPoint[];
    daysToShip: TrendComparisonPoint[];
  };
  /** CP = comparison year, PP = prior year; index 0 = January. */
  trendDrilldown: {
    cpYear: number;
    ppYear: number;
    cpByMonth: TrendMonthTransaction[][];
    ppByMonth: TrendMonthTransaction[][];
  };
  regionComparison: RegionPoint[];
  filterOptions: {
    regions: string[];
    states: string[];
    stateRegionMap: Record<string, string>;
    segments: string[];
    categories: string[];
    years: number[];
  };
}

const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "short" });
const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function daysBetween(from: Date, to: Date): number {
  return Math.max(0, (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

function round(value: number, digits = 2): number {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((acc, value) => acc + value, 0) / values.length;
}

function filterRows(rows: SuperstoreRow[], filters: DescriptiveFilters): SuperstoreRow[] {
  return rows.filter((row) => {
    const orderYear = row.orderDate.getFullYear();
    return (
      (filters.region === "All" || row.region === filters.region) &&
      (filters.state === "All" || row.state === filters.state) &&
      (filters.segment === "All" || row.segment === filters.segment) &&
      (filters.category === "All" || row.category === filters.category) &&
      (!filters.year || orderYear === filters.year)
    );
  });
}

function filterRowsWithoutYear(rows: SuperstoreRow[], filters: DescriptiveFilters): SuperstoreRow[] {
  return rows.filter(
    (row) =>
      (filters.region === "All" || row.region === filters.region) &&
      (filters.state === "All" || row.state === filters.state) &&
      (filters.segment === "All" || row.segment === filters.segment) &&
      (filters.category === "All" || row.category === filters.category)
  );
}

function monthSeriesValue(rows: SuperstoreRow[], metric: "sales" | "profitRatio" | "daysToShip"): number {
  if (rows.length === 0) return 0;
  if (metric === "sales") return round(rows.reduce((acc, row) => acc + row.sales, 0));
  if (metric === "daysToShip") {
    return round(avg(rows.map((row) => daysBetween(row.orderDate, row.shipDate))));
  }
  const sales = rows.reduce((acc, row) => acc + row.sales, 0);
  const profit = rows.reduce((acc, row) => acc + row.profit, 0);
  return round(sales === 0 ? 0 : (profit / sales) * 100);
}

function buildTrendComparison(
  baseRows: SuperstoreRow[],
  comparisonYear: number
): DescriptiveMetrics["trendComparison"] {
  const previousYear = comparisonYear - 1;
  const cpRows = baseRows.filter((row) => row.orderDate.getFullYear() === comparisonYear);
  const ppRows = baseRows.filter((row) => row.orderDate.getFullYear() === previousYear);

  const buildMetricSeries = (
    metric: "sales" | "profitRatio" | "daysToShip"
  ): TrendComparisonPoint[] => {
    return monthLabels.map((month, monthIndex) => {
      const cpMonthRows = cpRows.filter((row) => row.orderDate.getMonth() === monthIndex);
      const ppMonthRows = ppRows.filter((row) => row.orderDate.getMonth() === monthIndex);
      return {
        month,
        cp: monthSeriesValue(cpMonthRows, metric),
        pp: monthSeriesValue(ppMonthRows, metric),
      };
    });
  };

  return {
    sales: buildMetricSeries("sales"),
    profitRatio: buildMetricSeries("profitRatio"),
    daysToShip: buildMetricSeries("daysToShip"),
  };
}

export function getDescriptiveMetrics(
  rows: SuperstoreRow[],
  filters: DescriptiveFilters
): DescriptiveMetrics {
  const filteredRows = filterRows(rows, filters);
  const baseRows = filterRowsWithoutYear(rows, filters);
  const salesTotal = filteredRows.reduce((acc, row) => acc + row.sales, 0);
  const profitTotal = filteredRows.reduce((acc, row) => acc + row.profit, 0);
  const shippingDays = filteredRows.map((row) => daysBetween(row.orderDate, row.shipDate));
  const daysToShip = avg(shippingDays);
  const profitRatio = salesTotal === 0 ? 0 : (profitTotal / salesTotal) * 100;

  const byMonth = new Map<string, SuperstoreRow[]>();
  for (const row of filteredRows) {
    const monthKey = `${row.orderDate.getFullYear()}-${row.orderDate.getMonth() + 1}`;
    byMonth.set(monthKey, [...(byMonth.get(monthKey) ?? []), row]);
  }

  const trend = [...byMonth.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([, monthRows]) => {
      const sales = monthRows.reduce((acc, row) => acc + row.sales, 0);
      const profit = monthRows.reduce((acc, row) => acc + row.profit, 0);
      const shipAvg = avg(monthRows.map((row) => daysBetween(row.orderDate, row.shipDate)));
      const profitRatioValue = sales === 0 ? 0 : (profit / sales) * 100;
      return {
        month: monthFormatter.format(monthRows[0].orderDate),
        sales: round(sales),
        profitRatio: round(profitRatioValue),
        daysToShip: round(shipAvg),
      };
    });

  const availableYears = [...new Set(baseRows.map((row) => row.orderDate.getFullYear()))].sort(
    (a, b) => a - b
  );
  const comparisonYear = filters.year ?? availableYears[availableYears.length - 1] ?? new Date().getFullYear();
  const trendComparison = buildTrendComparison(baseRows, comparisonYear);

  const previousYear = comparisonYear - 1;
  const cpYearRowsForDrilldown = baseRows.filter((row) => row.orderDate.getFullYear() === comparisonYear);
  const ppYearRowsForDrilldown = baseRows.filter((row) => row.orderDate.getFullYear() === previousYear);

  const mapMonthRows = (monthRows: SuperstoreRow[]): TrendMonthTransaction[] =>
    monthRows.map((row) => ({
      rowId: row.rowId,
      orderId: row.orderId,
      productName: row.productName,
      customerName: row.customerName,
      orderDateIso: row.orderDate.toISOString(),
    }));

  const trendDrilldown: DescriptiveMetrics["trendDrilldown"] = {
    cpYear: comparisonYear,
    ppYear: previousYear,
    cpByMonth: monthLabels.map((_, monthIndex) =>
      mapMonthRows(cpYearRowsForDrilldown.filter((row) => row.orderDate.getMonth() === monthIndex))
    ),
    ppByMonth: monthLabels.map((_, monthIndex) =>
      mapMonthRows(ppYearRowsForDrilldown.filter((row) => row.orderDate.getMonth() === monthIndex))
    ),
  };

  const regions = ["West", "East", "Central", "South"];
  const regionComparison = regions.map((region) => {
    const regionRows = filterRows(rows, { ...filters, region });
    const regionSales = regionRows.reduce((acc, row) => acc + row.sales, 0);
    const regionProfit = regionRows.reduce((acc, row) => acc + row.profit, 0);
    const regionShipDays = avg(
      regionRows.map((row) => daysBetween(row.orderDate, row.shipDate))
    );

    return {
      region,
      sales: round(regionSales),
      profitRatio: round(regionSales === 0 ? 0 : (regionProfit / regionSales) * 100),
      daysToShip: round(regionShipDays),
    };
  });

  const salesRegionAvg = avg(regionComparison.map((item) => item.sales));
  const profitRegionAvg = avg(regionComparison.map((item) => item.profitRatio));
  const shipRegionAvg = avg(regionComparison.map((item) => item.daysToShip));

  return {
    salesTotal: round(salesTotal),
    profitRatio: round(profitRatio),
    daysToShip: round(daysToShip),
    salesDeltaVsRegionAvg: round(salesTotal - salesRegionAvg),
    profitRatioDeltaVsRegionAvg: round(profitRatio - profitRegionAvg),
    daysToShipDeltaVsRegionAvg: round(daysToShip - shipRegionAvg),
    trend,
    trendComparison,
    trendDrilldown,
    regionComparison,
    filterOptions: {
      regions: [...new Set(rows.map((row) => row.region))].sort(),
      states: [...new Set(rows.map((row) => row.state))].sort(),
      stateRegionMap: Object.fromEntries(rows.map((row) => [row.state, row.region])),
      segments: [...new Set(rows.map((row) => row.segment))].sort(),
      categories: [...new Set(rows.map((row) => row.category))].sort(),
      years: [...new Set(rows.map((row) => row.orderDate.getFullYear()))].sort(),
    },
  };
}
