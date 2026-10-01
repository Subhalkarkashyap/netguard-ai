"""AI-style finding explanations (heuristic, no external calls required).

Generates a short "why this matters" narrative per finding. Optionally uses
OPENAI_API_KEY if configured; otherwise a deterministic template explainer is
used so the feature works offline.
"""

from __future__ import annotations

import os

from sqlalchemy import select

from app.core.logging import get_logger
from app.models import Finding

logger = get_logger("app.ai.explainer")


def _heuristic_explanation(f: Finding) -> str:
    bits: list[str] = []
    sev = f.severity
    if sev in ("high", "critical"):
        bits.append(f"This {sev}-severity exposure on {f.title.split(' on ')[-1]} is a likely first stop for an attacker mapping your network")
    elif sev == "medium":
        bits.append("This service is commonly found in attacker recon and may expose sensitive functionality")
    else:
        bits.append("Low direct risk, but it adds to your exposed surface")
    if f.rule_id.startswith("sensitive-port"):
        bits.append("confirm the service is intended to be reachable at this location")
    if f.rule_id == "legacy-cleartext-remote-access":
        bits.append("credentials crossing this path are interceptable, so remediation should be prioritised")
    if f.rule_id == "wide-attack-surface":
        bits.append("each additional listener increases the chance one is misconfigured")
    bits.append("verify ownership, then restrict or patch as recommended")
    return "; ".join(bits).capitalize() + "."


async def explain_finding(finding: Finding) -> str:
    """Produce an explanation string. Uses OpenAI if available, else heuristics."""
    if os.environ.get("OPENAI_API_KEY"):
        try:
            return await _llm_explanation(finding)
        except Exception as exc:  # noqa: BLE001
            logger.warning("LLM explanation failed, falling back to heuristic: %s", exc)
    return _heuristic_explanation(finding)


async def _llm_explanation(finding: Finding) -> str:
    """Optional LLM path. Kept behind an env flag; never required."""
    import httpx

    api_key = os.environ["OPENAI_API_KEY"]
    prompt = (
        "You are a defensive security analyst. In 2 sentences, explain why this "
        "finding matters and the main mitigation, for a network owner.\n"
        f"Title: {finding.title}\nSeverity: {finding.severity}\n"
        f"Description: {finding.description}\nRecommendation: {finding.recommendation}"
    )
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}"},
            json={
                "model": os.environ.get("OPENAI_MODEL", "gpt-4o-mini"),
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 160,
                "temperature": 0.2,
            },
        )
        resp.raise_for_status()
        data = resp.json()
    return (data["choices"][0]["message"]["content"] or "").strip()


async def enrich_scan_findings(scan_id: int) -> None:
    """Populate ai_explanation for all findings of a scan (best-effort)."""
    from app.core.db import session_scope

    async with session_scope() as session:
        result = await session.execute(select(Finding).where(Finding.scan_id == scan_id))
        findings = result.scalars().all()
        for f in findings:
            if not f.ai_explanation:
                f.ai_explanation = await explain_finding(f)
                f.ai_prioritised = True
