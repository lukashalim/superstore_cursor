import Link from "next/link";
import clsx from "clsx";

interface DashboardTabsProps {
  activeTab: "descriptive" | "prescriptive" | "annotations";
}

const tabs: Array<{ id: DashboardTabsProps["activeTab"]; label: string; href: string }> = [
  { id: "descriptive", label: "Super: Descriptive", href: "/dashboard/descriptive" },
  { id: "prescriptive", label: "Super: Prescriptive", href: "/dashboard/prescriptive" },
  { id: "annotations", label: "Super: Annotations", href: "/dashboard/annotations" },
];

export function DashboardTabs({ activeTab }: DashboardTabsProps) {
  return (
    <nav className="mb-5 flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          className={clsx(
            "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
            tab.id === activeTab
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
