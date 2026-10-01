import type { Scan } from '../lib/api'

const STATUS_STYLES: Record<string, string> = {
  pending: 'text-slate-400',
  running: 'text-sky-400',
  completed: 'text-emerald-400',
  failed: 'text-red-400',
  cancelled: 'text-amber-400',
}

export default function ScanHistoryTable({
  scans,
  onCancel,
}: {
  scans: Scan[]
  onCancel: (id: number) => void
}) {
  if (scans.length === 0) {
    return (
      <div className="rounded-xl border border-surface-700 bg-surface-800/60 p-8 text-center text-sm text-slate-400">
        No scans recorded yet.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-surface-700">
      <table className="min-w-full divide-y divide-surface-700 text-sm">
        <thead className="bg-surface-800">
          <tr>
            {['#', 'Name', 'Targets', 'Status', 'Hosts up', 'Ports', 'Findings', 'Max risk', 'Created', ''].map((h) => (
              <th key={h} className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-700/60 bg-surface-800/30">
          {scans.map((s) => (
            <tr key={s.id} className="hover:bg-surface-700/30">
              <td className="px-3 py-3 text-slate-400">{s.id}</td>
              <td className="px-3 py-3 text-slate-100">{s.name}</td>
              <td className="px-3 py-3 max-w-[220px] truncate text-xs text-slate-400" title={s.target_spec}>
                {s.target_spec}
              </td>
              <td className={`px-3 py-3 text-xs font-medium ${STATUS_STYLES[s.status] ?? ''}`}>
                {s.status}
              </td>
              <td className="px-3 py-3 text-slate-300">{s.hosts_up}</td>
              <td className="px-3 py-3 text-slate-300">{s.ports_found}</td>
              <td className="px-3 py-3 text-amber-300">{s.findings_count}</td>
              <td className="px-3 py-3 text-orange-300">{s.max_risk_score}</td>
              <td className="px-3 py-3 text-xs text-slate-400">{new Date(s.created_at).toLocaleString()}</td>
              <td className="px-3 py-3">
                {(s.status === 'pending' || s.status === 'running') && (
                  <button
                    onClick={() => onCancel(s.id)}
                    className="rounded-md border border-surface-700 px-2 py-1 text-xs text-slate-300 hover:bg-surface-700"
                  >
                    Cancel
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
