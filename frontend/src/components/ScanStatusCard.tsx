import type { ScanProgress } from '../lib/api'

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
  running: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  completed: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  failed: 'bg-red-500/15 text-red-300 border-red-500/30',
  cancelled: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
}

export default function ScanStatusCard({
  scanId,
  progress,
  wsConnected,
  onCancel,
}: {
  scanId: number | null
  progress: ScanProgress | null
  wsConnected: boolean
  onCancel: (id: number) => void
}) {
  if (scanId == null || !progress) {
    return (
      <section className="rounded-xl border border-surface-700 bg-surface-800/60 p-5">
        <h2 className="text-sm font-semibold text-white mb-2">Scan Status</h2>
        <p className="text-sm text-slate-400">
          No active scan. Start one on the left — progress appears here in real time.
        </p>
      </section>
    )
  }

  const pct =
    progress.total_targets > 0
      ? Math.min(100, Math.round((progress.completed_targets / progress.total_targets) * 100))
      : progress.status === 'completed'
        ? 100
        : 0

  const isActive = progress.status === 'pending' || progress.status === 'running'

  return (
    <section className="rounded-xl border border-surface-700 bg-surface-800/60 p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-white">
          Scan #{progress.scan_id} Status
        </h2>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
              STATUS_STYLES[progress.status] ?? STATUS_STYLES.pending
            }`}
          >
            {progress.status}
          </span>
          {wsConnected && isActive && (
            <span className="text-[10px] text-emerald-400" title="Live via WebSocket">● live</span>
          )}
          {isActive && (
            <button
              onClick={() => onCancel(progress.scan_id)}
              className="rounded-md border border-surface-700 px-2 py-1 text-xs text-slate-300 hover:bg-surface-700"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-700">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            progress.status === 'failed' ? 'bg-red-400' : 'bg-emerald-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2 text-center">
        <div>
          <div className="text-lg font-semibold text-slate-100">{progress.completed_targets}/{progress.total_targets}</div>
          <div className="text-[10px] text-slate-400">TARGETS</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-emerald-400">{progress.hosts_up}</div>
          <div className="text-[10px] text-slate-400">HOSTS UP</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-indigo-400">{progress.ports_found}</div>
          <div className="text-[10px] text-slate-400">PORTS OPEN</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-amber-400">{progress.findings_count}</div>
          <div className="text-[10px] text-slate-400">FINDINGS</div>
        </div>
      </div>

      {progress.error_message && (
        <p className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {progress.error_message}
        </p>
      )}
    </section>
  )
}
