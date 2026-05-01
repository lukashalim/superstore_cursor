import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getDescriptiveMetrics } from "@/lib/analytics/descriptiveMetrics";
import { getPrescriptiveMetrics } from "@/lib/analytics/prescriptiveMetrics";
import { buildDashboardPptx } from "@/lib/export/buildDashboardPptx";
import {
  descriptiveFiltersFromExportQuery,
  parsePptxExportQuery,
} from "@/lib/export/pptxExportQuery";
import { loadSuperstore } from "@/lib/data/loadSuperstore";

export const runtime = "nodejs";

function filenameFor(tab: string, isoDate: string): string {
  const safe = isoDate.replace(/:/g, "-");
  return `superstore-${tab}-${safe}.pptx`;
}

export async function GET(request: Request): Promise<Response> {
  try {
    const query = parsePptxExportQuery(new URL(request.url).searchParams);
    const filters = descriptiveFiltersFromExportQuery(query);

    const rows = await loadSuperstore();
    const descriptive = getDescriptiveMetrics(rows, filters);
    const prescriptive = getPrescriptiveMetrics(rows, filters);

    const exportedAtIsoDate = new Date().toISOString().slice(0, 10);

    const buffer = await buildDashboardPptx({
      tab: query.tab,
      filters,
      descriptive,
      prescriptive,
      exportedAtIsoDate,
    });

    const filename = filenameFor(query.tab, exportedAtIsoDate);

    const body = new Uint8Array(buffer);

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    throw error;
  }
}
