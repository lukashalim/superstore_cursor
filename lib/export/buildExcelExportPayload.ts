import type { DescriptiveMetrics } from "@/lib/analytics/descriptiveMetrics";
import type { PrescriptiveMetrics } from "@/lib/analytics/prescriptiveMetrics";
import type { AnnotationInsight } from "@/lib/export/annotationStoryline";
import type { DescriptiveFilters } from "@/lib/filters/descriptiveFilters";
import {
  type DashboardExportTab,
  buildExportPrimaryTitle,
  exportCreatedLine,
  filterLines,
  tabTitle,
} from "@/lib/export/exportHeadings";

export interface ExcelExportPayload {
  version: 1;
  tab: DashboardExportTab;
  meta: {
    primaryTitle: string;
    tabLabel: string;
    exportLine: string;
    filterLines: string[];
  };
  filters: DescriptiveFilters;
  descriptive: DescriptiveMetrics;
  prescriptive: PrescriptiveMetrics;
  annotations?: AnnotationInsight[];
}

export function buildExcelExportPayload(params: {
  tab: DashboardExportTab;
  filters: DescriptiveFilters;
  descriptive: DescriptiveMetrics;
  prescriptive: PrescriptiveMetrics;
  exportedAtIsoDate: string;
  annotationInsights?: AnnotationInsight[];
}): ExcelExportPayload {
  const { tab, filters, descriptive, prescriptive, exportedAtIsoDate, annotationInsights } = params;

  const payload: ExcelExportPayload = {
    version: 1,
    tab,
    meta: {
      primaryTitle: buildExportPrimaryTitle(filters, descriptive),
      tabLabel: tabTitle(tab),
      exportLine: exportCreatedLine(exportedAtIsoDate),
      filterLines: filterLines(filters),
    },
    filters,
    descriptive,
    prescriptive,
  };

  if (annotationInsights !== undefined && annotationInsights.length > 0) {
    payload.annotations = annotationInsights;
  }

  return payload;
}
