import Card from "@/components/ui/Card";

const STATS_CONFIG = [
  {
    key: "correspondences",
    label: "Total Surat",
    icon: (
      <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  },
  {
    key: "templates",
    label: "Total Template",
    icon: (
      <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    )
  }
] as const;

interface StatsSectionProps {
  statValues: Record<string, number>;
}

export default function StatsSection({ statValues }: StatsSectionProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {STATS_CONFIG.map((stat) => (
        <Card key={stat.key} glass className="text-center py-4">
          <div className="mb-2 flex justify-center">{stat.icon}</div>
          <p className="text-2xl font-bold text-slate-900">{statValues[stat.key]}</p>
          <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
        </Card>
      ))}
    </div>
  );
}
