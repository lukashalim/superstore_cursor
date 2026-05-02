"use client";

import { FileSpreadsheet } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

export type DashboardExportTabProp = "descriptive" | "prescriptive" | "annotations";

interface ExportXlsxLinkProps {
  tab: DashboardExportTabProp;
}

function ExportXlsxLink({ tab }: ExportXlsxLinkProps) {
  const searchParams = useSearchParams();
  const qs = new URLSearchParams(searchParams.toString());
  qs.set("tab", tab);
  const href = `/api/dashboard/export/xlsx?${qs.toString()}`;

  return (
    <a
      href={href}
      download
      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm transition-colors hover:bg-slate-100"
    >
      <FileSpreadsheet size={16} aria-hidden />
      Export Excel
    </a>
  );
}

export function ExportXlsxButton(props: ExportXlsxLinkProps) {
  return (
    <Suspense
      fallback={
        <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-500">
          <FileSpreadsheet size={16} aria-hidden />
          Export Excel
        </span>
      }
    >
      <ExportXlsxLink {...props} />
    </Suspense>
  );
}
