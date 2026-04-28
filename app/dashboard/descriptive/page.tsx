import { type Metadata } from "next";
import { BulletMetric } from "@/components/dashboard/BulletMetric";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { StateMapFilter } from "@/components/dashboard/StateMapFilter";
import { RegionComparison } from "@/components/dashboard/RegionComparison";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { getDescriptiveMetrics } from "@/lib/analytics/descriptiveMetrics";
import { loadSuperstore } from "@/lib/data/loadSuperstore";
import { parseDescriptiveFilters } from "@/lib/filters/descriptiveFilters";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Superstore Descriptive Dashboard",
    description:
      "Interactive Superstore descriptive analytics with sales, profit ratio, and shipping trend insights.",
  };
}

function currency(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

export default async function DescriptiveDashboardPage({ searchParams }: PageProps) {
  const filters = parseDescriptiveFilters(await searchParams);
  const rows = await loadSuperstore();
  const metrics = getDescriptiveMetrics(rows, filters);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 md:px-12">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold text-slate-900">Super: Descriptive</h1>
        <p className="mt-1 text-sm text-slate-600">
          Tableau-style descriptive performance dashboard for the Superstore dataset.
        </p>
      </header>
      <DashboardTabs activeTab="descriptive" />

      <FilterBar
        regions={metrics.filterOptions.regions}
        states={metrics.filterOptions.states}
        segments={metrics.filterOptions.segments}
        categories={metrics.filterOptions.categories}
        years={metrics.filterOptions.years}
      />
      <StateMapFilter
        states={metrics.filterOptions.states}
        stateRegionMap={metrics.filterOptions.stateRegionMap}
      />

      <section className="mt-5 grid gap-4 md:grid-cols-3">
        <KpiCard
          title="Sales"
          value={currency(metrics.salesTotal)}
          delta={metrics.salesDeltaVsRegionAvg}
          deltaLabel="vs region avg"
        />
        <KpiCard
          title="Profit Ratio"
          value={`${metrics.profitRatio.toFixed(2)}%`}
          delta={metrics.profitRatioDeltaVsRegionAvg}
          deltaLabel="vs region avg"
        />
        <KpiCard
          title="Days to Ship"
          value={`${metrics.daysToShip.toFixed(2)} days`}
          delta={metrics.daysToShipDeltaVsRegionAvg}
          deltaLabel="vs region avg"
        />
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-2">
        <TrendChart title="Sales Trend" data={metrics.trendComparison.sales} />
        <TrendChart title="Profit Ratio Trend" data={metrics.trendComparison.profitRatio} unit="%" />
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-3">
        <BulletMetric title="Sales Bullet" value={metrics.salesTotal} target={900000} />
        <BulletMetric title="Profit Ratio Bullet" value={metrics.profitRatio} target={12} unit="%" />
        <BulletMetric title="Days to Ship Bullet" value={metrics.daysToShip} target={4.1} unit="d" />
      </section>

      <section className="mt-5">
        <RegionComparison data={metrics.regionComparison} />
      </section>
    </main>
  );
}
