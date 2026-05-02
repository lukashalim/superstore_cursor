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
 *   is on PATH (override with PYTHON_PATH). The route spawns `api/cli.py`.
 * - Vercel: POST is forwarded to `/api/build_excel` (Python runtime) when VERCEL is set.
 *   Uses the incoming request URL as the fetch origin (custom domains). If Deployment
 *   Protection is on, set VERCEL_AUTOMATION_BYPASS_SECRET in the project and the same
 *   value here so server-to-server calls are allowed.
 */
export const runtime = "nodejs";

const MAX_PAYLOAD_BYTES = 12 * 1024 * 1024;
const LOCAL_PYTHON_TIMEOUT_MS = 60_000;

function filenameFor(tab: string, isoDate: string): string {
  const safe = isoDate.replace(/:/g, "-");
  return `superstore-${tab}-${safe}.xlsx`;
}

async function buildWorkbookViaHttp(payload: unknown, requestUrl: string): Promise<Buffer> {
  const target = new URL("/api/build_excel", requestUrl).toString();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  if (bypass) {
    headers["x-vercel-protection-bypass"] = bypass;
  }
  const res = await fetch(target, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Excel builder HTTP ${res.status}: ${text.slice(0, 500)}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

function buildWorkbookViaSubprocess(payload: unknown): Promise<Buffer> {
  const pythonBin = process.env.PYTHON_PATH ?? "python";
  const cliPath = path.join(process.cwd(), "api", "cli.py");
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
            `Python api/cli.py exited ${code}: ${Buffer.concat(err).toString("utf8").slice(0, 2000)}`
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

async function buildWorkbookBuffer(payload: unknown, requestUrl: string): Promise<Buffer> {
  if (process.env.VERCEL) {
    return buildWorkbookViaHttp(payload, requestUrl);
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

    const buffer = await buildWorkbookBuffer(payload, request.url);
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
