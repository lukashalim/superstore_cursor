import { type Metadata } from "next";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { ExportPptxButton } from "@/components/dashboard/ExportPptxButton";
import { ExportXlsxButton } from "@/components/dashboard/ExportXlsxButton";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { InsightList } from "@/components/dashboard/InsightList";
import { PrescriptiveScatter } from "@/components/dashboard/PrescriptiveScatter";
import { StateMapFilter } from "@/components/dashboard/StateMapFilter";
import { getDescriptiveMetrics } from "@/lib/analytics/descriptiveMetrics";
import { getPrescriptiveMetrics } from "@/lib/analytics/prescriptiveMetrics";
import { loadSuperstore } from "@/lib/data/loadSuperstore";
import { parseDescriptiveFilters } from "@/lib/filters/descriptiveFilters";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Superstore Prescriptive Dashboard",
    description: "Prescriptive analysis for margins, category actions, and regional recommendations.",
  };
}

export default async function PrescriptiveDashboardPage({ searchParams }: PageProps) {
  const filters = parseDescriptiveFilters(await searchParams);
  const rows = await loadSuperstore();
  const baseMetrics = getDescriptiveMetrics(rows, filters);
  const metrics = getPrescriptiveMetrics(rows, filters);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 md:px-12">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold text-slate-900">Super: Prescriptive</h1>
        <p className="mt-1 text-sm text-slate-600">
          Recommendation-focused view based on margin, demand, and regional performance.
        </p>
      </header>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <DashboardTabs activeTab="prescriptive" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportPptxButton tab="prescriptive" />
          <ExportXlsxButton tab="prescriptive" />
        </div>
      </div>
      <FilterBar
        regions={baseMetrics.filterOptions.regions}
        states={baseMetrics.filterOptions.states}
        segments={baseMetrics.filterOptions.segments}
        categories={baseMetrics.filterOptions.categories}
        years={baseMetrics.filterOptions.years}
      />
      <StateMapFilter
        states={baseMetrics.filterOptions.states}
        stateRegionMap={baseMetrics.filterOptions.stateRegionMap}
      />

      <section className="mt-5">
        <PrescriptiveScatter data={metrics.scatter} />
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-base font-semibold text-slate-800">Prescriptive Map (Region Actions)</h3>
          <div className="space-y-3">
            {metrics.regionActions.map((region) => (
              <div key={region.region} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-slate-800">{region.region}</p>
                  <p className="text-sm text-slate-500">
                    ${region.sales.toLocaleString()} sales | ${region.profit.toLocaleString()} profit
                  </p>
                </div>
                <p className="mt-1 text-sm text-slate-600">{region.recommendedAction}</p>
              </div>
            ))}
          </div>
        </article>
        <InsightList title="Prescriptive Playbook" items={metrics.playbook} />
      </section>
    </main>
  );
}
