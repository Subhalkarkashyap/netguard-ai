# NetGuard AI

**Defensive network asset scanner** — discover hosts and exposed services on networks you own, store results historically, and surface risk/anomaly insights. AI/ML hooks are included for anomaly detection and finding explanations.

> ⚠️ **Authorization notice:** NetGuard only scans private/loopback targets by default and refuses
> anything else unless explicitly allow-listed. It performs **safe, non-intrusive TCP connect
> checks only** — no stealth, no credential attacks, no exploitation, no evasion, no destructive
> testing. Scan only networks you own or are explicitly authorized to assess.

---

## Features

- **FastAPI backend** (Python 3.11+, Pydantic v2, SQLAlchemy 2 async) with structured errors and logging
- **Background scan workers** — `POST /scans` queues a job; a worker claims and executes it, with heartbeat/lease reclaim for crashed workers
- **Safe scanner core** — asyncio TCP-connect checks with bounded concurrency and timeouts; banner reads limited to plaintext greeting protocols
- **Modular discovery** — `DiscoveryBackend` protocol (default: `TcpSweepDiscovery`); add mDNS/ARP/cloud inventory later without touching the engine
- **Analysis rules** — deterministic findings for exposed databases, RDP/SMB, legacy cleartext, wide attack surface; 0–100 asset risk scoring
- **AI layer** — offline heuristic explainer per finding (optional OpenAI-powered path via env var) and a z-score baseline anomaly model over scan history
- **React + TypeScript + Tailwind + Recharts dashboard** — start scans, live progress, assets, services, findings, risk/anomaly overview, scan history
- **Progress updates** — WebSocket (`/scans/{id}/ws`) with automatic polling fallback
- **PostgreSQL in Docker**; zero-setup **SQLite fallback** for local runs
- **30 passing tests** (unit + API smoke + a real end-to-end worker scan)

## Architecture

```
frontend/               React + TS + Tailwind + Recharts (Vite)
backend/
  app/
    api/                REST routes + WebSocket progress
    core/               config (env), logging, errors, DB session
    models/             ScanJob, Asset, Service, Finding (SQLAlchemy)
    schemas/            Pydantic request/response models
    services/
      scanner/          target parsing + authz, safe TCP checks, scan engine
      discovery/        pluggable discovery backends
      analysis/         finding rules + risk scoring
      ai/               baseline anomaly model + finding explainer
    workers/            background scan worker (claim/heartbeat/execute)
  tests/                pytest suite
docker-compose.yml      Postgres + API + worker + frontend
```

**Scan flow:** `POST /scans` validates & authorizes targets → stores `ScanJob(pending)` → worker claims it → engine discovers alive hosts → probes the port set → upserts `Asset`/`Service` rows → runs analysis rules → computes risk → marks completed → AI enrichment (best-effort) → progress hub publishes to WebSocket subscribers.

## Quick start (Docker Compose)

```bash
docker compose up --build
```

- Dashboard: http://localhost:5173
- API: http://localhost:8000 (docs at http://localhost:8000/docs)
- Postgres: localhost:5432 (netguard/netguard)

The frontend calls the API directly (CORS is configured for `http://localhost:5173`).

## Local development (no Docker)

**Backend** (from `backend/`):

```bash
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# optional: copy .env.example to .env and edit
# defaults: SQLite at ./data/netguard.db, private/loopback targets allowed

uvicorn app.main:app --reload --port 8000        # terminal 1: API
python -m app.workers.scan_worker                # terminal 2: scan worker
```

**Frontend** (from `frontend/`):

```bash
npm install
npm run dev        # http://localhost:5173 (proxies /api -> :8000)
```

> SQLite note: for a clean database, delete `backend/data/netguard.db` (tables are auto-created on startup).

## Tests

```bash
cd backend
.venv/Scripts/python -m pytest ../pytest.ini --rootdir=. tests   # Windows venv layout
# or: source .venv/bin/activate && pytest ../pytest.ini --rootdir=. tests
```

Includes a real end-to-end test: a pending scan is claimed and executed against a local
ephemeral listener, asserting assets/services/finding persistence.

## Configuration (environment variables)

See [`backend/.env.example`](backend/.env.example). Highlights:

| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | `sqlite+aiosqlite:///./data/netguard.db` | Postgres in compose: `postgresql+psycopg://netguard:netguard@db:5432/netguard` |
| `CORS_ORIGINS` | `http://localhost:5173,...` | Comma-separated allowed origins |
| `SCAN_CONCURRENCY` | `64` | Max simultaneous socket checks |
| `CONNECT_TIMEOUT` | `1.5` | Seconds per TCP connect check |
| `POLL_INTERVAL` | `2.0` | Worker DB polling interval |
| `ALLOW_PRIVATE_TARGETS` | `true` | Permit RFC1918/loopback/link-local targets |
| `ALLOW_LOCALHOST` | `true` | Permit 127.0.0.0/8 and ::1 |
| `TARGET_ALLOWLIST` | *(empty)* | Extra authorized CIDRs, comma-separated |
| `MAX_HOSTS_PER_SCAN` | `4096` | Host/CIDR budget per scan |
| `MAX_PORTS_PER_SCAN` | `2000` | Port budget per host |
| `OPENAI_API_KEY` | *(empty)* | Optional: use LLM finding explanations; empty = offline heuristics |

## API overview

Base URL `http://localhost:8000` (interactive docs: `/docs`).

| Method | Path | Purpose |
|---|---|---|
| POST | `/scans` | Create/queue a scan (targets validated + authorized immediately) |
| GET | `/scans` | List scans (filter by `status`) |
| GET | `/scans/{id}` | Scan details |
| GET | `/scans/{id}/progress` | Poll scan progress |
| POST | `/scans/{id}/cancel` | Cancel a pending/running scan |
| DELETE | `/scans/{id}` | Delete scan + cascading rows |
| GET | `/scans/history?days=14` | Daily aggregates for the history chart |
| WS | `/scans/{id}/ws` | Live progress events until terminal state |
| GET | `/assets?alive_only=true` | Discovered assets + services |
| GET | `/assets/{id}` | One asset |
| GET | `/services` | All services |
| GET | `/findings?status=open` | Findings (filter by scan/severity/status) |
| PATCH | `/findings/{id}?status=resolved` | Resolve/reopen a finding |
| GET | `/stats/overview` | Dashboard headline numbers |
| GET | `/stats/severities` | Open findings by severity |
| GET | `/stats/top-ports` | Most common open ports |
| GET | `/stats/anomalies` | Per-scan z-score vs baseline |
| GET | `/health` | Liveness |

**Example:**

```bash
curl -X POST http://localhost:8000/scans \
  -H "Content-Type: application/json" \
  -d '{"targets": "127.0.0.1", "ports": "22,80,6379", "name": "My lab"}'
```

## Extending

- **New discovery method**: implement the `DiscoveryBackend` protocol in
  `backend/app/services/discovery/` and register it in `discovery/__init__.py`.
- **New analysis rule**: add to `run_analysis_rules()` in
  `backend/app/services/analysis/rules.py`; findings deduplicate per (scan, asset, rule).
- **Real ML**: swap `app/services/ai/baseline.py` for a trained model — the API surface
  (`/stats/anomalies`) stays unchanged.
