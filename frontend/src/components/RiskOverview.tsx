import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'
import type { AnomalyPoint, SeverityCount } from '../lib/api'

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#f87171',
  high: '#fb923c',
  medium: '#fbbf24',
  low: '#60a5fa',
  info: '#94a3b8',
}

export default function RiskOverview({
  severities,
  anomalies,
}: {
  severities: SeverityCount[]
  anomalies: AnomalyPoint[]
}) {
  const anomalyPoints = anomalies.map((a) => ({
    ...a,
    z: a.z_score,
    label: `#${a.scan_id}`,
  }))
  const hasAnomaly = anomalies.some((a) => a.is_anomaly)

  return (
    <section className="rounded-xl border border-surface-700 bg-surface-800/60 p-5">
      <h2 className="text-sm font-semibold text-white mb-3">Risk &amp; Anomaly Overview</h2>

      <div className="h-36">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={severities} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="severity" stroke="#64748b" fontSize={10} />
            <YAxis stroke="#64748b" fontSize={10} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                background: '#101a2e',
                border: '1px solid #17253f',
                borderRadius: 8,
                color: '#e2e8f0',
              }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {severities.map((s) => (
                <Cell key={s.severity} fill={SEVERITY_COLORS[s.severity] ?? '#94a3b8'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-xs font-medium text-slate-300">Open ports vs baseline (z-score)</h3>
          {hasAnomaly && (
            <span className="rounded-full border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-[10px] text-red-300">
              anomaly detected
            </span>
          )}
        </div>
        {anomalyPoints.length < 2 ? (
          <p className="text-xs text-slate-500">Needs ≥2 completed scans to build a baseline.</p>
        ) : (
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="label" stroke="#64748b" fontSize={9} />
                <YAxis dataKey="z" stroke="#64748b" fontSize={9} />
                <ZAxis range={[30, 60]} />
                <Tooltip
                  contentStyle={{
                    background: '#101a2e',
                    border: '1px solid #17253f',
                    borderRadius: 8,
                    color: '#e2e8f0',
                    fontSize: 11,
                  }}
                  formatter={(value: number | string, name: string) => [value, name === 'z' ? 'z-score' : name]}
                />
                <ReferenceLine y={0} stroke="#475569" strokeDasharray="4 4" />
                <ReferenceLine y={3} stroke="#f87171" strokeDasharray="4 4" />
                <ReferenceLine y={-3} stroke="#f87171" strokeDasharray="4 4" />
                <Scatter data={anomalyPoints}>
                  {anomalyPoints.map((p) => (
                    <Cell key={p.scan_id} fill={p.is_anomaly ? '#f87171' : '#38bdf8'} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}
        <p className="mt-2 text-[10px] text-slate-500">
          |z| ≥ 3 vs the deployment's own baseline is flagged as anomalous.
        </p>
      </div>
    </section>
  )
}
