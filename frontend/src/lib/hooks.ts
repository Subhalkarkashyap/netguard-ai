import { useCallback, useEffect, useRef, useState } from 'react'
import { api, type ScanProgress } from './api'

/** Poll an endpoint on an interval; returns [data, refresh, loading, error]. */
export function usePolling<T>(path: string | null, intervalMs = 4000) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mounted = useRef(true)

  const refresh = useCallback(async () => {
    if (!path) return
    setLoading(true)
    try {
      const d = await api<T>(path)
      if (mounted.current) {
        setData(d)
        setError(null)
      }
    } catch (e) {
      if (mounted.current) setError(e instanceof Error ? e.message : String(e))
    } finally {
      if (mounted.current) setLoading(false)
    }
  }, [path])

  useEffect(() => {
    mounted.current = true
    void refresh()
    if (!path) return () => { mounted.current = false }
    const t = setInterval(() => void refresh(), intervalMs)
    return () => {
      mounted.current = false
      clearInterval(t)
    }
  }, [refresh, intervalMs, path])

  return { data, refresh, loading, error }
}

/**
 * Live progress for one scan: WebSocket when served from the API origin,
 * automatic polling fallback when the WS is unavailable (e.g. dev proxy).
 */
export function useScanProgress(scanId: number | null) {
  const [progress, setProgress] = useState<ScanProgress | null>(null)
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const pollRef = useRef<number | null>(null)

  useEffect(() => {
    if (scanId == null) {
      setProgress(null)
      return
    }
    let closed = false

    const startPolling = () => {
      if (pollRef.current != null || closed) return
      const poll = async () => {
        try {
          const p = await api<ScanProgress>(`/scans/${scanId}/progress`)
          if (!closed) setProgress(p)
          if (p.status === 'completed' || p.status === 'failed' || p.status === 'cancelled') {
            if (pollRef.current != null) {
              clearInterval(pollRef.current)
              pollRef.current = null
            }
          }
        } catch {
          /* keep polling; dashboard shows the error elsewhere */
        }
      }
      void poll()
      pollRef.current = window.setInterval(() => void poll(), 1500)
    }

    const canUseWs = import.meta.env.VITE_API_BASE !== undefined
    if (canUseWs) {
      const base = import.meta.env.VITE_API_BASE as string
      const wsUrl = base.replace(/^http/, 'ws') + `/scans/${scanId}/ws`
      let ws: WebSocket
      try {
        ws = new WebSocket(wsUrl)
      } catch {
        startPolling()
        return () => { closed = true }
      }
      wsRef.current = ws
      ws.onopen = () => setConnected(true)
      ws.onmessage = (ev) => {
        try {
          const p = JSON.parse(ev.data as string) as ScanProgress
          setProgress(p)
        } catch { /* ignore malformed frames */ }
      }
      ws.onerror = () => {
        setConnected(false)
        startPolling()
      }
      ws.onclose = () => {
        setConnected(false)
        if (!closed) startPolling() // fallback to polling after close
      }
    } else {
      startPolling()
    }

    return () => {
      closed = true
      if (pollRef.current != null) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [scanId])

  return { progress, connected }
}
