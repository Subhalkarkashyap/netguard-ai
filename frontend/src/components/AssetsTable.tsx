import { useState } from 'react'
import type { Asset } from '../lib/api'

function RiskBadge({ score }: { score: number }) {
  const color =
    score >= 70 ? 'bg-red-500/15 text-red-300' :
    score >= 40 ? 'bg-orange-500/15 text-orange-300' :
    score >= 20 ? 'bg-amber-500/15 text-amber-300' :
    'bg-emerald-500/15 text-emerald-300'
  return <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${color}`}>{score}</span>
}

export default function AssetsTable({ assets }: { assets: Asset[] }) {
  const [expanded, setExpanded] = useState<number | null>(null)

  if (assets.length === 0) {
    return (
      <div className="rounded-xl border border-surface-700 bg-surface-800/60 p-8 text-center text-sm text-slate-400">
        No live assets yet. Start a scan to discover hosts on your authorized network.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-surface-700">
      <table className="min-w-full divide-y divide-surface-700 text-sm">
        <thead className="bg-surface-800">
          <tr>
            {['IP / Host', 'Status', 'Services', 'Risk', 'First seen', 'Last seen'].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-700/60 bg-surface-800/30">
          {assets.map((a) => (
            <AssetRow
              key={a.id}
              asset={a}
              expanded={expanded === a.id}
              onToggle={() => setExpanded(expanded === a.id ? null : a.id)}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AssetRow({ asset, expanded, onToggle }: { asset: Asset; expanded: boolean; onToggle: () => void }) {
  const open = asset.services.filter((s) => s.state === 'open')
  return (
    <>
      <tr
        className="cursor-pointer hover:bg-surface-700/30"
        onClick={onToggle}
        title="Click to show services"
      >
        <td className="px-4 py-3">
          <div className="font-medium text-slate-100">{asset.ip}</div>
          {asset.hostname && <div className="text-xs text-slate-400">{asset.hostname}</div>}
        </td>
        <td className="px-4 py-3">
          <span className={`inline-flex items-center gap-1.5 text-xs ${asset.is_alive ? 'text-emerald-400' : 'text-slate-500'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${asset.is_alive ? 'bg-emerald-400' : 'bg-slate-600'}`} />
            {asset.is_alive ? 'alive' : 'offline'}
          </span>
        </td>
        <td className="px-4 py-3 text-slate-300">
          {open.length === 0 ? (
            <span className="text-slate-500">none</span>
          ) : (
            <div className="flex flex-wrap gap-1">
              {open.slice(0, 4).map((s) => (
                <span key={s.id} className="rounded bg-surface-700 px-1.5 py-0.5 text-[10px] text-slate-300">
                  {s.port}{s.service_name ? `/${s.service_name}` : ''}
                </span>
              ))}
              {open.length > 4 && (
                <span className="text-[10px] text-slate-500">+{open.length - 4} more</span>
              )}
            </div>
          )}
        </td>
        <td className="px-4 py-3"><RiskBadge score={asset.risk_score} /></td>
        <td className="px-4 py-3 text-xs text-slate-400">{fmtDate(asset.first_seen)}</td>
        <td className="px-4 py-3 text-xs text-slate-400">{fmtDate(asset.last_seen)}</td>
      </tr>
      {expanded && (
        <tr className="bg-surface-900/60">
          <td colSpan={6} className="px-4 py-3">
            <div className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-2">Services</div>
            {open.length === 0 ? (
              <p className="text-xs text-slate-500">No open services recorded.</p>
            ) : (
              <ul className="space-y-1">
                {open.map((s) => (
                  <li key={s.id} className="flex items-center gap-3 text-xs">
                    <span className="rounded bg-surface-700 px-1.5 py-0.5 font-mono text-slate-200">
                      {s.protocol.toUpperCase()}/{s.port}
                    </span>
                    <span className="text-slate-300">{s.service_name ?? 'unknown'}</span>
                    {s.banner && (
                      <span className="truncate font-mono text-slate-500" title={s.banner}>
                        {s.banner}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </td>
        </tr>
      )}
    </>
  )
}

function fmtDate(iso: string): string {
  const d = new Date(iso)
  return isNaN(d.getTime()) ? iso : d.toLocaleString()
}
