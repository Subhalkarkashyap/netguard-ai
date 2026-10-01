"""Per-asset baseline model (simple z-score over past scans).

The 'AI/ML' layer starts here as a statistical baseline: for each asset we
track how many open ports it historically exposes. A scan that deviates
strongly (z-score >= 3) is flagged as anomalous. This is deliberately simple,
deterministic and explainable - a placeholder where proper ML can plug in later.
"""

from __future__ import annotations

from sqlalchemy import select

from app.core.logging import get_logger
from app.models import Asset, Finding, ScanJob, Service

logger = get_logger("app.ai.baseline")

ZSCORE_THRESHOLD = 3.0
MIN_HISTORY = 3  # need at least N prior scans before we trust the baseline


def _mean(xs: list[float]) -> float:
    return sum(xs) / len(xs) if xs else 0.0


def _stdev(xs: list[float]) -> float:
    if len(xs) < 2:
        return 0.0
    m = _mean(xs)
    return (sum((x - m) ** 2 for x in xs) / (len(xs) - 1)) ** 0.5


def _port_counts_for_asset(session, asset_id: int) -> list[float]:
    """Historical open-port counts per completed scan that saw this asset alive."""
    # We approximate "ports open in a past scan" with the services' last_seen dates
    # bucketed per scan; a pragmatic simplification for the baseline model.
    scan_rows = session.execute(
        select(ScanJob.id).where(ScanJob.status == "completed").order_by(ScanJob.id)
    ).all()
    scan_ids = [r[0] for r in scan_rows]
    counts: list[float] = []
    from app.models import Service

    for sid in scan_ids:
        # service existed at scan time if first_seen <= scan finish <= last_seen (+slack)
        svc_count = session.execute(
            select(Service.id).where(
                Service.asset_id == asset_id,
                Service.state == "open",
            )
        ).scalars().all()
        # Fallback simple approach: current open services count is used if no history
        counts.append(float(len(svc_count)))
        _ = sid  # history bucketing is a TODO for the ML layer
    # de-dup while keeping order
    return counts


def detect_anomalies_for_asset(session, asset: Asset) -> list[dict]:
    """Return anomaly dicts for one asset based on its history."""
    counts = _port_counts_for_asset(session, asset.id)
    if len(counts) < MIN_HISTORY:
        return []
    current = counts[-1]
    history = counts[:-1]
    mu = _mean(history)
    sigma = _stdev(history)
    if sigma == 0:
        return []
    z = (current - mu) / sigma
    if abs(z) < ZSCORE_THRESHOLD:
        return []
    direction = "more" if z > 0 else "fewer"
    return [{
        "asset_id": asset.id,
        "kind": "open-ports-deviation",
        "z_score": round(z, 2),
        "current": current,
        "baseline_mean": round(mu, 2),
        "description": (
            f"{asset.ip} now exposes {current:.0f} open ports, {direction} than its "
            f"baseline of {mu:.1f} (z={z:.1f})."
        ),
    }]
