import { useState } from 'react'
import type { Finding } from '../lib/api'

const SEV_STYLES: Record<string, string> = {
  critical: 'bg-red-500/15 text-red-300 border-red-500/30',
  high: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  medium: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  low: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  info: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
}

export default function FindingsTable({ findings }: { findings: Finding[] }) {
  if (findings.length === 0) {
    return (
      <div className="rounded-xl border border-surface-700 bg-surface-800/60 p-8 text-center text-sm text-slate-400">
        No open findings. Run a scan — analysis rules run automatically on each completed scan.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {findings.map((f) => (
        <FindingCard key={f.id} finding={f} />
      ))}
    </div>
  )
}

function FindingCard({ finding }: { finding: Finding }) {
  const [open, setOpen] = useState(false)
  const sev = SEV_STYLES[finding.severity] ?? SEV_STYLES.info

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-800/60">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase ${sev}`}>
          {finding.severity}
        </span>
        <span className="flex-1 text-sm text-slate-100">{finding.title}</span>
        {finding.ai_prioritised && (
          <span className="rounded-full border border-violet-500/40 bg-violet-500/10 px-2 py-0.5 text-[10px] text-violet-300">
            AI explained
          </span>
        )}
        <span className="text-xs text-slate-500">scan #{finding.scan_id}</span>
        <span className="text-slate-500">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="border-t border-surface-700/60 px-4 py-3 space-y-2 text-sm">
          <p className="text-slate-300">{finding.description}</p>
          <p className="text-slate-400">
            <span className="font-medium text-emerald-400">Recommendation: </span>
            {finding.recommendation}
          </p>
          {finding.ai_explanation && (
            <p className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-xs text-violet-200">
              <span className="font-semibold">AI: </span>
              {finding.ai_explanation}
            </p>
          )}
          {finding.evidence && (
            <p className="rounded bg-surface-900 px-3 py-2 font-mono text-xs text-slate-400">
              {finding.evidence}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
