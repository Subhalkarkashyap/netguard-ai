export const API_BASE: string =
  import.meta.env.VITE_API_BASE ?? '/api'

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (res.status === 204) return undefined as T
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    const msg = body?.error?.message ?? `Request failed (${res.status})`
    throw new Error(msg)
  }
  return body as T
}

// ---- Types mirroring backend schemas ----

export interface Scan {
  id: number
  name: string
  target_spec: string
  port_spec: string | null
  targets: string
  total_targets: number
  completed_targets: number
  hosts_up: number
  ports_found: number
  findings_count: number
  max_risk_score: number
  avg_risk_score: number
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  error_message: string | null
  created_at: string
  started_at: string | null
  finished_at: string | null
}

export interface ScanProgress {
  scan_id: number
  status: Scan['status']
  total_targets: number
  completed_targets: number
  hosts_up: number
  ports_found: number
  findings_count: number
  error_message: string | null
  finished_at: string | null
}

export interface Service {
  id: number
  asset_id: number
  port: number
  protocol: string
  state: string
  service_name: string | null
  banner: string | null
  first_seen: string
  last_seen: string
}

export interface Asset {
  id: number
  ip: string
  hostname: string | null
  os_guess: string | null
  mac_address: string | null
  is_alive: boolean
  first_seen: string
  last_seen: string
  risk_score: number
  services: Service[]
}

export interface Finding {
  id: number
  scan_id: number
  asset_id: number | null
  rule_id: string
  title: string
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical'
  description: string
  recommendation: string
  evidence: string | null
  ai_explanation: string | null
  ai_prioritised: boolean
  status: 'open' | 'resolved'
  created_at: string
}

export interface OverviewStats {
  total_assets: number
  alive_assets: number
  total_services: number
  open_findings: number
  high_or_critical_findings: number
  scans_24h: number
  max_risk_score: number
  avg_risk_score: number
}

export interface SeverityCount {
  severity: string
  count: number
}

export interface TopOpenPort {
  port: number
  service_name: string | null
  count: number
}

export interface HistoryPoint {
  date: string
  scans: number
  hosts_up: number
  findings: number
}

export interface AnomalyPoint {
  scan_id: number
  created_at: string
  hosts_up: number
  ports_found: number
  findings_count: number
  port_delta_vs_baseline: number
  is_anomaly: boolean
  z_score: number
}
