import { spawn } from "node:child_process";
import path from "node:path";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getDescriptiveMetrics } from "@/lib/analytics/descriptiveMetrics";
import { getPrescriptiveMetrics } from "@/lib/analytics/prescriptiveMetrics";
import { getAnnotationInsights } from "@/lib/export/annotationStoryline";
import { buildExcelExportPayload } from "@/lib/export/buildExcelExportPayload";
import {
  descriptiveFiltersFromExportQuery,
  parsePptxExportQuery,
} from "@/lib/export/pptxExportQuery";
import { loadSuperstore } from "@/lib/data/loadSuperstore";

/**
 * Excel export uses Python + XlsxWriter.
 * - Local `next dev`: install deps with `pip install -r requirements.txt`, then ensure `python`
 *   is on PATH (override with PYTHON_PATH). The route spawns `excel_export/cli.py`.
 * - Vercel: POST is forwarded to `/api/build_excel` (Python runtime) when VERCEL is set.
 */
export const runtime = "nodejs";

const MAX_PAYLOAD_BYTES = 12 * 1024 * 1024;
const LOCAL_PYTHON_TIMEOUT_MS = 60_000;

function filenameFor(tab: string, isoDate: string): string {
  const safe = isoDate.replace(/:/g, "-");
  return `superstore-${tab}-${safe}.xlsx`;
}

async function buildWorkbookViaHttp(payload: unknown): Promise<Buffer> {
  const host = process.env.VERCEL_URL;
  if (!host) {
    throw new Error("VERCEL_URL is not set");
  }
  const base = host.startsWith("http") ? host : `https://${host}`;
  const res = await fetch(`${base}/api/build_excel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Excel builder HTTP ${res.status}: ${text.slice(0, 500)}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

function buildWorkbookViaSubprocess(payload: unknown): Promise<Buffer> {
  const pythonBin = process.env.PYTHON_PATH ?? "python";
  const cliPath = path.join(process.cwd(), "excel_export", "cli.py");
  const json = JSON.stringify(payload);
  if (Buffer.byteLength(json, "utf8") > MAX_PAYLOAD_BYTES) {
    return Promise.reject(new Error("Export payload too large"));
  }

  return new Promise((resolve, reject) => {
    const child = spawn(pythonBin, [cliPath], {
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    });
    const out: Buffer[] = [];
    const err: Buffer[] = [];
    const t = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error("Excel export timed out (local Python)"));
    }, LOCAL_PYTHON_TIMEOUT_MS);

    child.stdout.on("data", (c: Buffer) => out.push(c));
    child.stderr.on("data", (c: Buffer) => err.push(c));
    child.on("error", (e) => {
      clearTimeout(t);
      reject(e);
    });
    child.on("close", (code) => {
      clearTimeout(t);
      if (code !== 0) {
        reject(
          new Error(
            `Python excel_export/cli.py exited ${code}: ${Buffer.concat(err).toString("utf8").slice(0, 2000)}`
          )
        );
        return;
      }
      resolve(Buffer.concat(out));
    });

    child.stdin.write(json, "utf8");
    child.stdin.end();
  });
}

async function buildWorkbookBuffer(payload: unknown): Promise<Buffer> {
  if (process.env.VERCEL) {
    return buildWorkbookViaHttp(payload);
  }
  return buildWorkbookViaSubprocess(payload);
}

export async function GET(request: Request): Promise<Response> {
  try {
    const query = parsePptxExportQuery(new URL(request.url).searchParams);
    const filters = descriptiveFiltersFromExportQuery(query);

    const rows = await loadSuperstore();
    const descriptive = getDescriptiveMetrics(rows, filters);
    const prescriptive = getPrescriptiveMetrics(rows, filters);

    const exportedAtIsoDate = new Date().toISOString().slice(0, 10);

    const annotationInsights =
      query.tab === "annotations" ? getAnnotationInsights(descriptive) : undefined;

    const payload = buildExcelExportPayload({
      tab: query.tab,
      filters,
      descriptive,
      prescriptive,
      exportedAtIsoDate,
      annotationInsights,
    });

    const buffer = await buildWorkbookBuffer(payload);
    const filename = filenameFor(query.tab, exportedAtIsoDate);
    const body = new Uint8Array(buffer);

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
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
