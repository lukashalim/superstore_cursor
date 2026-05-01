import type { DescriptiveMetrics } from "@/lib/analytics/descriptiveMetrics";

export interface AnnotationInsight {
  title: string;
  detail: string;
  impact: "High" | "Medium";
}

export function getAnnotationInsights(descriptive: DescriptiveMetrics): AnnotationInsight[] {
  return [
    {
      title: "Insight 1: Margin Pressure",
      detail: `Profit ratio is ${descriptive.profitRatio.toFixed(
        2
      )}%. Prioritize low-margin sub-categories identified in prescriptive view.`,
      impact: "High",
    },
    {
      title: "Insight 2: Shipping Friction",
      detail: `Average ship time is ${descriptive.daysToShip.toFixed(
        2
      )} days. Focus process improvements where cycle times exceed regional peers.`,
      impact: "Medium",
    },
    {
      title: "Insight 3: Revenue Concentration",
      detail: `Sales currently total $${descriptive.salesTotal.toLocaleString()}. Use regional action plans to preserve growth in top areas.`,
      impact: "Medium",
    },
  ];
}
