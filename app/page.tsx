import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <main className="rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Superstore Dashboard</h1>
        <p className="mt-2 text-sm text-slate-600">
          Open the Tableau-style dashboard tabs reconstructed from the workbook.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/dashboard/descriptive"
            className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            Descriptive
          </Link>
          <Link
            href="/dashboard/prescriptive"
            className="inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800"
          >
            Prescriptive
          </Link>
          <Link
            href="/dashboard/annotations"
            className="inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800"
          >
            Annotations
          </Link>
        </div>
      </main>
    </div>
  );
}
