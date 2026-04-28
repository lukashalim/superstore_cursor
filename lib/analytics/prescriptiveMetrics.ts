import { type SuperstoreRow } from "@/lib/data/superstoreSchema";
import { type DescriptiveFilters } from "@/lib/filters/descriptiveFilters";

export interface PrescriptiveBubblePoint {
  subCategory: string;
  sales: number;
  profitRatio: number;
  orders: number;
}

export interface PrescriptiveRegionPoint {
  region: string;
  sales: number;
  profit: number;
  recommendedAction: string;
}

export interface PrescriptiveInsight {
  title: string;
  detail: string;
  impact: "High" | "Medium";
}

export interface PrescriptiveMetrics {
  scatter: PrescriptiveBubblePoint[];
  regionActions: PrescriptiveRegionPoint[];
  playbook: PrescriptiveInsight[];
}

function round(value: number, digits = 2): number {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

function applyFilters(rows: SuperstoreRow[], filters: DescriptiveFilters): SuperstoreRow[] {
  return rows.filter((row) => {
    const year = row.orderDate.getFullYear();
    return (
      (filters.region === "All" || row.region === filters.region) &&
      (filters.state === "All" || row.state === filters.state) &&
      (filters.segment === "All" || row.segment === filters.segment) &&
      (filters.category === "All" || row.category === filters.category) &&
      (!filters.year || filters.year === year)
    );
  });
}

export function getPrescriptiveMetrics(
  rows: SuperstoreRow[],
  filters: DescriptiveFilters
): PrescriptiveMetrics {
  const filtered = applyFilters(rows, filters);
  const bySubCategory = new Map<string, SuperstoreRow[]>();
  const byRegion = new Map<string, SuperstoreRow[]>();

  for (const row of filtered) {
    bySubCategory.set(row.subCategory, [...(bySubCategory.get(row.subCategory) ?? []), row]);
    byRegion.set(row.region, [...(byRegion.get(row.region) ?? []), row]);
  }

  const scatter = [...bySubCategory.entries()]
    .map(([subCategory, subRows]) => {
      const sales = subRows.reduce((acc, row) => acc + row.sales, 0);
      const profit = subRows.reduce((acc, row) => acc + row.profit, 0);
      const profitRatio = sales === 0 ? 0 : (profit / sales) * 100;
      return {
        subCategory,
        sales: round(sales),
        profitRatio: round(profitRatio),
        orders: subRows.length,
      };
    })
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 12);

  const regionActions = [...byRegion.entries()].map(([region, regionRows]) => {
    const sales = regionRows.reduce((acc, row) => acc + row.sales, 0);
    const profit = regionRows.reduce((acc, row) => acc + row.profit, 0);
    const profitRatio = sales === 0 ? 0 : (profit / sales) * 100;
    const recommendedAction =
      profitRatio < 8
        ? "Tighten discounting on low-margin orders."
        : "Scale high-performing categories in this region.";

    return {
      region,
      sales: round(sales),
      profit: round(profit),
      recommendedAction,
    };
  });

  const lowMargin = scatter
    .filter((item) => item.profitRatio < 8)
    .sort((a, b) => a.profitRatio - b.profitRatio)[0];
  const highVelocity = scatter.sort((a, b) => b.orders - a.orders)[0];
  const topSales = scatter.sort((a, b) => b.sales - a.sales)[0];

  const playbook: PrescriptiveInsight[] = [];

  if (lowMargin) {
    playbook.push({
      title: `Improve ${lowMargin.subCategory} margin`,
      detail: `Current profit ratio is ${lowMargin.profitRatio.toFixed(
        2
      )}%. Reduce discount depth and prioritize profitable SKUs.`,
      impact: "High",
    });
  }
  if (highVelocity) {
    playbook.push({
      title: `Protect ${highVelocity.subCategory} conversion`,
      detail: `${highVelocity.orders} orders make this a volume driver. Keep lead times and stock levels stable.`,
      impact: "Medium",
    });
  }
  if (topSales) {
    playbook.push({
      title: `Upsell around ${topSales.subCategory}`,
      detail: `${topSales.subCategory} leads revenue. Bundle adjacent products to lift contribution margin.`,
      impact: "Medium",
    });
  }

  return { scatter, regionActions, playbook };
}
