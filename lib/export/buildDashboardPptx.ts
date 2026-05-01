import PptxGenJS from "pptxgenjs";
import type { DescriptiveMetrics } from "@/lib/analytics/descriptiveMetrics";
import type { PrescriptiveMetrics } from "@/lib/analytics/prescriptiveMetrics";
import type { DescriptiveFilters } from "@/lib/filters/descriptiveFilters";
import { getAnnotationInsights } from "@/lib/export/annotationStoryline";

export type DashboardExportTab = "descriptive" | "prescriptive" | "annotations";

type ChartData = PptxGenJS.OptsChartData[];

const CHART_BELOW_TITLE: PptxGenJS.IChartOpts = {
  x: 0.5,
  y: 0.95,
  w: 9,
  h: 4.25,
  showLegend: true,
  legendPos: "b",
  legendFontSize: 10,
};

function currency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function fmtDelta(n: number): string {
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}`;
}

function tabTitle(tab: DashboardExportTab): string {
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

function filterLines(filters: DescriptiveFilters): string[] {
  const y = filters.year !== undefined ? String(filters.year) : "All";
  return [
    `Region: ${filters.region}`,
    `State: ${filters.state}`,
    `Segment: ${filters.segment}`,
    `Category: ${filters.category}`,
    `Year: ${y}`,
  ];
}

function addTitleSlide(
  pptx: PptxGenJS,
  tab: DashboardExportTab,
  exportedAt: string
): void {
  const slide = pptx.addSlide();
  slide.addText("Superstore Dashboard", {
    x: 0.5,
    y: 1.6,
    w: 9,
    h: 1,
    fontSize: 32,
    bold: true,
    color: "0F172A",
  });
  slide.addText(tabTitle(tab), {
    x: 0.5,
    y: 2.7,
    w: 9,
    h: 0.6,
    fontSize: 18,
    color: "475569",
  });
  slide.addText(`Exported ${exportedAt}`, {
    x: 0.5,
    y: 5,
    w: 9,
    h: 0.4,
    fontSize: 11,
    color: "64748B",
  });
}

function addFilterSlide(pptx: PptxGenJS, filters: DescriptiveFilters): void {
  const slide = pptx.addSlide();
  slide.addText("Applied filters", {
    x: 0.5,
    y: 0.4,
    w: 9,
    h: 0.5,
    fontSize: 20,
    bold: true,
    color: "0F172A",
  });
  slide.addText(
    filterLines(filters).map((line) => ({ text: line, options: { bullet: true, fontSize: 14 } })),
    { x: 0.6, y: 1.1, w: 8.8, h: 4 }
  );
}

function trendLineData(
  series: Array<{ month: string; cp: number; pp: number }>
): ChartData {
  const labels = series.map((p) => p.month);
  return [
    { name: "Current year (CP)", labels, values: series.map((p) => p.cp) },
    { name: "Prior year (PP)", labels, values: series.map((p) => p.pp) },
  ];
}

function addTrendLineChartSlide(
  pptx: PptxGenJS,
  title: string,
  series: Array<{ month: string; cp: number; pp: number }>,
  valFormat: string,
  valAxisTitle: string
): void {
  const slide = pptx.addSlide();
  slide.addText(title, {
    x: 0.5,
    y: 0.35,
    w: 9,
    h: 0.45,
    fontSize: 16,
    bold: true,
    color: "0F172A",
  });
  slide.addChart(pptx.ChartType.line, trendLineData(series), {
    ...CHART_BELOW_TITLE,
    chartColors: ["3B82F6", "94A3B8"],
    lineDataSymbol: "circle",
    lineDataSymbolSize: 6,
    lineSize: 2.5,
    valAxisLabelFormatCode: valFormat,
    showValAxisTitle: true,
    valAxisTitle,
    valAxisTitleFontSize: 11,
    catAxisLabelFontSize: 9,
    catAxisLabelRotate: 45,
  });
}

function addRegionSalesBarSlide(pptx: PptxGenJS, m: DescriptiveMetrics): void {
  const slide = pptx.addSlide();
  slide.addText("Region comparison — sales (editable bar chart)", {
    x: 0.5,
    y: 0.35,
    w: 9,
    h: 0.45,
    fontSize: 16,
    bold: true,
    color: "0F172A",
  });
  if (m.regionComparison.length === 0) {
    slide.addText("No region data for current filters.", { x: 0.5, y: 2, w: 8, h: 1, fontSize: 14 });
    return;
  }
  const barData: ChartData = [
    {
      name: "Sales",
      labels: m.regionComparison.map((r) => r.region),
      values: m.regionComparison.map((r) => r.sales),
    },
  ];
  slide.addChart(pptx.ChartType.bar, barData, {
    ...CHART_BELOW_TITLE,
    barDir: "bar",
    chartColors: ["8B5CF6"],
    showLegend: false,
    valAxisLabelFormatCode: "$#,##0",
    showValAxisTitle: true,
    valAxisTitle: "Sales (USD)",
    valAxisTitleFontSize: 11,
    catAxisTitle: "Region",
    showCatAxisTitle: true,
    catAxisTitleFontSize: 11,
    dataLabelFormatCode: "$#,##0",
    showValue: true,
    dataLabelFontSize: 9,
  });
  slide.addText(
    m.regionComparison
      .map(
        (r) =>
          `${r.region}: ${r.profitRatio.toFixed(2)}% profit ratio · ${r.daysToShip.toFixed(2)} days to ship`
      )
      .join("\n"),
    { x: 0.5, y: 5.35, w: 9, h: 1.2, fontSize: 9, color: "64748B" }
  );
}

/** Charts matching the Descriptive tab (trends + region bar). */
function addDescriptiveChartSlides(pptx: PptxGenJS, m: DescriptiveMetrics): void {
  const kpi = pptx.addSlide();
  kpi.addText("Key metrics", { x: 0.5, y: 0.4, w: 9, h: 0.45, fontSize: 20, bold: true, color: "0F172A" });
  kpi.addText(
    [
      `Sales: ${currency(m.salesTotal)} (${fmtDelta(m.salesDeltaVsRegionAvg)} vs region avg)`,
      `Profit ratio: ${m.profitRatio.toFixed(2)}% (${fmtDelta(m.profitRatioDeltaVsRegionAvg)} pts vs region avg)`,
      `Days to ship: ${m.daysToShip.toFixed(2)} days (${fmtDelta(m.daysToShipDeltaVsRegionAvg)} vs region avg)`,
    ].map((t) => ({ text: t, options: { bullet: true, fontSize: 14 } })),
    { x: 0.6, y: 1, w: 8.8, h: 3 }
  );

  addTrendLineChartSlide(
    pptx,
    "Sales trend — CP vs PP by month (editable line chart)",
    m.trendComparison.sales,
    "$#,##0",
    "Sales (USD)"
  );
  addTrendLineChartSlide(
    pptx,
    "Profit ratio trend — CP vs PP by month (editable line chart)",
    m.trendComparison.profitRatio,
    "0.00",
    "Profit ratio %"
  );
  addTrendLineChartSlide(
    pptx,
    "Days to ship trend — CP vs PP by month (editable line chart)",
    m.trendComparison.daysToShip,
    "0.00",
    "Days"
  );

  const bullets = pptx.addSlide();
  bullets.addText("Bullet targets (same as dashboard)", {
    x: 0.5,
    y: 0.4,
    w: 9,
    h: 0.45,
    fontSize: 18,
    bold: true,
    color: "0F172A",
  });
  bullets.addText(
    [
      `Sales vs target $900k — actual ${currency(m.salesTotal)}`,
      `Profit ratio vs target 12% — actual ${m.profitRatio.toFixed(2)}%`,
      `Days to ship vs target 4.1d — actual ${m.daysToShip.toFixed(2)} days`,
    ].map((t) => ({ text: t, options: { bullet: true, fontSize: 14 } })),
    { x: 0.6, y: 1, w: 8.8, h: 3 }
  );

  addRegionSalesBarSlide(pptx, m);
}

function prescriptiveBubbleData(m: PrescriptiveMetrics): ChartData | null {
  if (m.scatter.length === 0) return null;
  const pts = m.scatter;
  return [
    { name: "Sales", values: pts.map((p) => p.sales) },
    {
      name: "Profit ratio %",
      values: pts.map((p) => p.profitRatio),
      sizes: pts.map((p) => Math.max(8, Math.min(40, Math.round(p.orders / 2)))),
      labels: pts.map((p) => p.subCategory),
    },
  ];
}

function addPrescriptiveScatterBubbleSlide(pptx: PptxGenJS, m: PrescriptiveMetrics): void {
  const slide = pptx.addSlide();
  slide.addText("Prescriptive scatter — sales × profit ratio (bubble size ∝ orders)", {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.55,
    fontSize: 15,
    bold: true,
    color: "0F172A",
  });
  const data = prescriptiveBubbleData(m);
  if (!data) {
    slide.addText("No sub-category data for current filters.", { x: 0.5, y: 2, w: 8, h: 1, fontSize: 14 });
    return;
  }
  const prVals = m.scatter.map((p) => p.profitRatio);
  slide.addChart(pptx.ChartType.bubble, data, {
    ...CHART_BELOW_TITLE,
    chartColors: ["14B8A6"],
    lineSize: 0,
    showLegend: true,
    showValAxisTitle: true,
    valAxisTitle: "Profit ratio %",
    valAxisTitleFontSize: 11,
    showCatAxisTitle: true,
    catAxisTitle: "Sales (USD)",
    catAxisTitleFontSize: 11,
    valAxisLabelFormatCode: "0.0",
    valAxisMinVal: Math.floor(Math.min(0, ...prVals) - 1),
    valAxisMaxVal: Math.ceil(Math.max(20, ...prVals, 10) + 1),
    showLabel: true,
    dataLabelPosition: "r",
    dataLabelFontSize: 8,
  });
}

function addPrescriptiveRegionBarSlide(pptx: PptxGenJS, m: PrescriptiveMetrics): void {
  const slide = pptx.addSlide();
  slide.addText("Regional sales — prescriptive view (editable bar chart)", {
    x: 0.5,
    y: 0.35,
    w: 9,
    h: 0.45,
    fontSize: 16,
    bold: true,
    color: "0F172A",
  });
  if (m.regionActions.length === 0) {
    slide.addText("No regional data for current filters.", { x: 0.5, y: 2, w: 8, h: 1, fontSize: 14 });
    return;
  }
  const barData: ChartData = [
    {
      name: "Sales",
      labels: m.regionActions.map((r) => r.region),
      values: m.regionActions.map((r) => r.sales),
    },
  ];
  slide.addChart(pptx.ChartType.bar, barData, {
    ...CHART_BELOW_TITLE,
    barDir: "bar",
    chartColors: ["6366F1"],
    showLegend: false,
    valAxisLabelFormatCode: "$#,##0",
    showValAxisTitle: true,
    valAxisTitle: "Sales (USD)",
    catAxisTitle: "Region",
    showCatAxisTitle: true,
    showValue: true,
    dataLabelFontSize: 9,
  });
  slide.addText(
    m.regionActions.map((r) => `${r.region}: ${r.recommendedAction}`).join("\n"),
    { x: 0.5, y: 5.35, w: 9, h: 1.2, fontSize: 9, color: "64748B" }
  );
}

/** Bubble + regional bar charts (Prescriptive tab visuals). */
function addPrescriptiveChartsOnly(pptx: PptxGenJS, m: PrescriptiveMetrics): void {
  addPrescriptiveScatterBubbleSlide(pptx, m);
  addPrescriptiveRegionBarSlide(pptx, m);
}

function addPlaybookSlide(pptx: PptxGenJS, m: PrescriptiveMetrics, heading: string): void {
  const playbookSlide = pptx.addSlide();
  playbookSlide.addText(heading, {
    x: 0.5,
    y: 0.35,
    w: 9,
    h: 0.45,
    fontSize: 18,
    bold: true,
    color: "0F172A",
  });
  const playbookBullets = m.playbook.flatMap((item) => [
    {
      text: `${item.title} (${item.impact} impact)`,
      options: { bullet: true, bold: true, fontSize: 13 },
    },
    {
      text: item.detail,
      options: { bullet: false, fontSize: 11, indentLevel: 1 },
    },
  ]);
  playbookSlide.addText(playbookBullets, { x: 0.55, y: 0.9, w: 8.9, h: 4.5 });
}

function addAnnotationsSlides(
  pptx: PptxGenJS,
  descriptive: DescriptiveMetrics,
  prescriptive: PrescriptiveMetrics
): void {
  const storySlide = pptx.addSlide();
  storySlide.addText("Annotation storyline", {
    x: 0.5,
    y: 0.35,
    w: 9,
    h: 0.45,
    fontSize: 18,
    bold: true,
    color: "0F172A",
  });
  const insights = getAnnotationInsights(descriptive);
  const blocks = insights.flatMap((item, index) => [
    {
      text: `${index + 1}. ${item.title} (${item.impact})`,
      options: { bullet: false, bold: true, fontSize: 13 },
    },
    {
      text: item.detail,
      options: { bullet: false, fontSize: 11, color: "475569" },
    },
    { text: "", options: { bullet: false, fontSize: 6 } },
  ]);
  storySlide.addText(blocks, { x: 0.55, y: 0.85, w: 8.9, h: 4.6 });

  addDescriptiveChartSlides(pptx, descriptive);
  addPrescriptiveChartsOnly(pptx, prescriptive);
  addPlaybookSlide(pptx, prescriptive, "Action callouts");
}

export async function buildDashboardPptx(params: {
  tab: DashboardExportTab;
  filters: DescriptiveFilters;
  descriptive: DescriptiveMetrics;
  prescriptive: PrescriptiveMetrics;
  exportedAtIsoDate: string;
}): Promise<Buffer> {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_16x9";
  pptx.title = "Superstore Dashboard";

  const { tab, filters, descriptive, prescriptive, exportedAtIsoDate } = params;

  addTitleSlide(pptx, tab, exportedAtIsoDate);
  addFilterSlide(pptx, filters);

  if (tab === "descriptive") {
    addDescriptiveChartSlides(pptx, descriptive);
  } else if (tab === "prescriptive") {
    addPrescriptiveChartsOnly(pptx, prescriptive);
    addPlaybookSlide(pptx, prescriptive, "Playbook");
  } else {
    addAnnotationsSlides(pptx, descriptive, prescriptive);
  }

  const out = await pptx.write({
    outputType: pptx.OutputType.nodebuffer,
    compression: true,
  });

  return Buffer.isBuffer(out) ? out : Buffer.from(out as Uint8Array);
}
