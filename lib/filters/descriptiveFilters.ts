import { z } from "zod";

export const descriptiveFiltersSchema = z.object({
  region: z.string().optional().default("All"),
  state: z.string().optional().default("All"),
  segment: z.string().optional().default("All"),
  category: z.string().optional().default("All"),
  year: z.coerce.number().int().optional(),
});

export interface DescriptiveFilters extends z.infer<typeof descriptiveFiltersSchema> {}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseDescriptiveFilters(
  searchParams: Record<string, string | string[] | undefined>
): DescriptiveFilters {
  return descriptiveFiltersSchema.parse({
    region: firstValue(searchParams.region),
    state: firstValue(searchParams.state),
    segment: firstValue(searchParams.segment),
    category: firstValue(searchParams.category),
    year: firstValue(searchParams.year),
  });
}
