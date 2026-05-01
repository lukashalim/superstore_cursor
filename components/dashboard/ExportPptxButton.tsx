"use client";

import { FileDown } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

export type DashboardExportTabProp = "descriptive" | "prescriptive" | "annotations";

interface ExportPptxLinkProps {
  tab: DashboardExportTabProp;
}

function ExportPptxLink({ tab }: ExportPptxLinkProps) {
  const searchParams = useSearchParams();
  const qs = new URLSearchParams(searchParams.toString());
  qs.set("tab", tab);
  const href = `/api/dashboard/export/pptx?${qs.toString()}`;

  return (
    <a
      href={href}
      download
      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm transition-colors hover:bg-slate-100"
    >
      <FileDown size={16} aria-hidden />
      Export PowerPoint
    </a>
  );
}

export function ExportPptxButton(props: ExportPptxLinkProps) {
  return (
    <Suspense
      fallback={
        <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-500">
          <FileDown size={16} aria-hidden />
          Export PowerPoint
        </span>
      }
    >
      <ExportPptxLink {...props} />
    </Suspense>
  );
}
