import type { OverviewStats } from '../lib/api'

export default function StatCards({ stats }: { stats: OverviewStats | null }) {
  const cards = [
    { label: 'Live Hosts', value: stats?.alive_assets ?? '—', accent: 'text-emerald-400' },
    { label: 'Known Assets', value: stats?.total_assets ?? '—', accent: 'text-sky-400' },
    { label: 'Open Services', value: stats?.total_services ?? '—', accent: 'text-indigo-400' },
    { label: 'Open Findings', value: stats?.open_findings ?? '—', accent: 'text-amber-400' },
    { label: 'High/Critical', value: stats?.high_or_critical_findings ?? '—', accent: 'text-red-400' },
    { label: 'Scans (24h)', value: stats?.scans_24h ?? '—', accent: 'text-slate-200' },
    { label: 'Max Risk', value: stats ? `${stats.max_risk_score}/100` : '—', accent: 'text-orange-400' },
    { label: 'Avg Risk', value: stats ? stats.avg_risk_score.toFixed(1) : '—', accent: 'text-teal-400' },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border border-surface-700 bg-surface-800/60 p-4">
          <div className={`text-2xl font-semibold ${c.accent}`}>{c.value}</div>
          <div className="mt-1 text-xs text-slate-400">{c.label}</div>
        </div>
      ))}
    </div>
  )
}
