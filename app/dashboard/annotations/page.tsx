import { type Metadata } from "next";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { ExportPptxButton } from "@/components/dashboard/ExportPptxButton";
import { ExportXlsxButton } from "@/components/dashboard/ExportXlsxButton";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { InsightList } from "@/components/dashboard/InsightList";
import { StateMapFilter } from "@/components/dashboard/StateMapFilter";
import { getDescriptiveMetrics } from "@/lib/analytics/descriptiveMetrics";
import { getPrescriptiveMetrics } from "@/lib/analytics/prescriptiveMetrics";
import { loadSuperstore } from "@/lib/data/loadSuperstore";
import { getAnnotationInsights } from "@/lib/export/annotationStoryline";
import { parseDescriptiveFilters } from "@/lib/filters/descriptiveFilters";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Superstore Annotations Dashboard",
    description: "Annotated executive storyline for Superstore performance and actions.",
  };
}

export default async function AnnotationsDashboardPage({ searchParams }: PageProps) {
  const filters = parseDescriptiveFilters(await searchParams);
  const rows = await loadSuperstore();
  const descriptive = getDescriptiveMetrics(rows, filters);
  const prescriptive = getPrescriptiveMetrics(rows, filters);

  const annotationInsights = getAnnotationInsights(descriptive);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 md:px-12">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold text-slate-900">Super: Annotations</h1>
        <p className="mt-1 text-sm text-slate-600">
          Narrative layer combining descriptive metrics with prescriptive actions.
        </p>
      </header>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <DashboardTabs activeTab="annotations" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportPptxButton tab="annotations" />
          <ExportXlsxButton tab="annotations" />
        </div>
      </div>
      <FilterBar
        regions={descriptive.filterOptions.regions}
        states={descriptive.filterOptions.states}
        segments={descriptive.filterOptions.segments}
        categories={descriptive.filterOptions.categories}
        years={descriptive.filterOptions.years}
      />
      <StateMapFilter
        states={descriptive.filterOptions.states}
        stateRegionMap={descriptive.filterOptions.stateRegionMap}
      />

      <section className="mt-5 grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h3 className="mb-4 text-base font-semibold text-slate-800">Annotation Timeline</h3>
          <div className="space-y-4">
            {annotationInsights.map((item, index) => (
              <div key={item.title} className="relative rounded-xl border border-slate-200 p-4">
                <span className="absolute -left-3 top-4 rounded-full bg-slate-900 px-2 py-0.5 text-xs text-white">
                  {index + 1}
                </span>
                <h4 className="text-sm font-semibold text-slate-800">{item.title}</h4>
                <p className="mt-1 text-sm text-slate-600">{item.detail}</p>
              </div>
            ))}
          </div>
        </article>
        <InsightList title="Action Callouts" items={prescriptive.playbook} />
      </section>
    </main>
  );
}
