import { useState } from 'react'

export default function StartScanForm({
  onStart,
}: {
  onStart: (targets: string, ports: string, name: string) => void
}) {
  const [targets, setTargets] = useState('127.0.0.1')
  const [ports, setPorts] = useState('')
  const [name, setName] = useState('')

  return (
    <section className="rounded-xl border border-surface-700 bg-surface-800/60 p-5">
      <h2 className="text-sm font-semibold text-white mb-1">Start Scan</h2>
      <p className="text-xs text-slate-400 mb-4">
        Only private/loopback targets are allowed by default. Use comma-separated IPs, CIDRs or hostnames.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onStart(targets, ports, name)
        }}
        className="space-y-3"
      >
        <div>
          <label className="block text-xs text-slate-400 mb-1" htmlFor="targets">Targets *</label>
          <input
            id="targets"
            value={targets}
            onChange={(e) => setTargets(e.target.value)}
            placeholder="127.0.0.1, 192.168.1.0/30, myhost.local"
            className="w-full rounded-lg border border-surface-700 bg-surface-900 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1" htmlFor="ports">Ports (optional)</label>
            <input
              id="ports"
              value={ports}
              onChange={(e) => setPorts(e.target.value)}
              placeholder="22,80,443,8000-8100"
              className="w-full rounded-lg border border-surface-700 bg-surface-900 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1" htmlFor="name">Name (optional)</label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Lab sweep"
              className="w-full rounded-lg border border-surface-700 bg-surface-900 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none"
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-surface-900 hover:bg-emerald-400 transition"
        >
          Start authorized scan
        </button>
      </form>
    </section>
  )
}
