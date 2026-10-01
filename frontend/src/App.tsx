import { useState } from 'react'
import { usePolling, useScanProgress } from './lib/hooks'
import { api, type AnomalyPoint, type Asset, type Finding, type HistoryPoint, type Scan, type SeverityCount } from './lib/api'
import StatCards from './components/StatCards'
import StartScanForm from './components/StartScanForm'
import ScanStatusCard from './components/ScanStatusCard'
import ScanHistoryChart from './components/ScanHistoryChart'
import AssetsTable from './components/AssetsTable'
import FindingsTable from './components/FindingsTable'
import RiskOverview from './components/RiskOverview'
import ScanHistoryTable from './components/ScanHistoryTable'
import type { OverviewStats } from './lib/api'

type Tab = 'assets' | 'findings' | 'history'

export default function App() {
  const [tab, setTab] = useState<Tab>('assets')
  const [lastError, setLastError] = useState<string | null>(null)

  const stats = usePolling<OverviewStats>('/stats/overview', 5000)
  const assets = usePolling<Asset[]>('/assets?alive_only=true&limit=200', 6000)
  const findings = usePolling<Finding[]>('/findings?status=open&limit=200', 6000)
  const history = usePolling<HistoryPoint[]>('/scans/history?days=14', 15000)
  const scans = usePolling<Scan[]>('/scans?limit=50', 5000)
  const severities = usePolling<SeverityCount[]>('/stats/severities', 6000)
  const anomalies = usePolling<AnomalyPoint[]>('/stats/anomalies?limit=30', 8000)

  const [watchScanId, setWatchScanId] = useState<number | null>(null)
  const { progress, connected } = useScanProgress(watchScanId)

  const activeScan = scans.data?.find(
    (s) => s.status === 'pending' || s.status === 'running',
  )
  const shownScanId = watchScanId ?? activeScan?.id ?? null

  const startScan = async (targets: string, ports: string, name: string) => {
    try {
      const scan = await api<Scan>('/scans', {
        method: 'POST',
        body: JSON.stringify({ targets, ports: ports || null, name: name || null }),
      })
      setWatchScanId(scan.id)
      setLastError(null)
      void scans.refresh()
    } catch (e) {
      setLastError(e instanceof Error ? e.message : String(e))
    }
  }

  const cancelScan = async (id: number) => {
    try {
      await api<Scan>(`/scans/${id}/cancel`, { method: 'POST' })
      void scans.refresh()
    } catch (e) {
      setLastError(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <div className="min-h-screen bg-surface-900">
      <header className="border-b border-surface-700 bg-surface-800/60 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 grid place-items-center">
              <span className="text-emerald-400 text-lg">🛡️</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white leading-tight">NetGuard AI</h1>
              <p className="text-xs text-slate-400">Defensive network asset scanner — authorized targets only</p>
            </div>
          </div>
          <div className="text-xs text-slate-400">
            {stats.data ? (
              <span>
                {stats.data.alive_assets} live hosts · {stats.data.total_services} services ·{' '}
                {stats.data.open_findings} open findings
              </span>
            ) : (
              'connecting…'
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        {lastError && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {lastError}
          </div>
        )}
        {stats.error && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
            Cannot reach the API at <code>{import.meta.env.VITE_API_BASE ?? '/api'}</code> — is the backend
            running on port 8000?
          </div>
        )}

        <StatCards stats={stats.data} />

        <div className="grid gap-6 lg:grid-cols-2">
          <StartScanForm onStart={startScan} />
          <ScanStatusCard
            scanId={shownScanId}
            progress={progress}
            wsConnected={connected}
            onCancel={cancelScan}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ScanHistoryChart data={history.data ?? []} />
          </div>
          <RiskOverview severities={severities.data ?? []} anomalies={anomalies.data ?? []} />
        </div>

        <div>
          <div className="flex gap-1 border-b border-surface-700 mb-4">
            {(['assets', 'findings', 'history'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${
                  tab === t
                    ? 'bg-surface-800 text-white border-x border-t border-surface-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t === 'assets' ? 'Discovered Assets' : t === 'findings' ? 'Findings' : 'Scan History'}
              </button>
            ))}
          </div>

          {tab === 'assets' && <AssetsTable assets={assets.data ?? []} />}
          {tab === 'findings' && <FindingsTable findings={findings.data ?? []} />}
          {tab === 'history' && <ScanHistoryTable scans={scans.data ?? []} onCancel={cancelScan} />}
        </div>
      </main>

      <footer className="border-t border-surface-700 mt-10">
        <div className="mx-auto max-w-7xl px-4 py-4 text-xs text-slate-500">
          NetGuard AI performs safe, non-intrusive TCP checks only. Scan only networks you own or are
          explicitly authorized to assess.
        </div>
      </footer>
    </div>
  )
}
