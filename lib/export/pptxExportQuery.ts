import { z } from "zod";
import { descriptiveFiltersSchema, type DescriptiveFilters } from "@/lib/filters/descriptiveFilters";

export const pptxExportTabSchema = z.enum(["descriptive", "prescriptive", "annotations"]);

export const pptxExportQuerySchema = descriptiveFiltersSchema.extend({
  tab: pptxExportTabSchema,
});

export type PptxExportQuery = z.infer<typeof pptxExportQuerySchema>;

export function parsePptxExportQuery(searchParams: URLSearchParams): PptxExportQuery {
  const raw: Record<string, string | undefined> = {};
  searchParams.forEach((value, key) => {
    if (raw[key] === undefined) raw[key] = value;
  });

  const parsed = pptxExportQuerySchema.safeParse({
    tab: raw.tab,
    region: raw.region,
    state: raw.state,
    segment: raw.segment,
    category: raw.category,
    year: raw.year === undefined || raw.year === "" ? undefined : raw.year,
  });

  if (!parsed.success) {
    throw parsed.error;
  }

  return parsed.data;
}

export function descriptiveFiltersFromExportQuery(query: PptxExportQuery): DescriptiveFilters {
  return {
    region: query.region,
    state: query.state,
    segment: query.segment,
    category: query.category,
    year: query.year,
  };
}
