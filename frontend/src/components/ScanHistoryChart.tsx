import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { HistoryPoint } from '../lib/api'

export default function ScanHistoryChart({ data }: { data: HistoryPoint[] }) {
  return (
    <section className="rounded-xl border border-surface-700 bg-surface-800/60 p-5">
      <h2 className="text-sm font-semibold text-white mb-4">Scan History (14 days)</h2>
      {data.length === 0 ? (
        <p className="text-sm text-slate-400">No scans yet — run one to populate the chart.</p>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gHosts" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gFindings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#fbbf24" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: '#101a2e',
                  border: '1px solid #17253f',
                  borderRadius: 8,
                  color: '#e2e8f0',
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="hosts_up" name="Hosts up" stroke="#34d399" fill="url(#gHosts)" />
              <Area type="monotone" dataKey="findings" name="Findings" stroke="#fbbf24" fill="url(#gFindings)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
}
