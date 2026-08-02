from __future__ import annotations

from pathlib import Path

import tomllib


def must(cond: bool, msg: str) -> None:
    if not cond:
        raise SystemExit(msg)


PROJECT = "richmiles-xyz"
IMAGE = "ghcr.io/miles-automation/richmiles-xyz-app"


def main() -> None:
    for p in ("AGENTS.md", "CLAUDE.md", "Dockerfile", ".env.example", "deploy/pack.toml"):
        must(Path(p).exists(), f"missing {p}")

    # Verify health endpoints exist in backend
    main_py = Path("backend/main.py").read_text()
    must("/healthz" in main_py, "backend/main.py missing /healthz")
    must("/api/v1/healthz" in main_py, "backend/main.py missing /api/v1/healthz")

    pack_path = Path("deploy/pack.toml")
    pack = tomllib.loads(pack_path.read_text())
    must(pack.get("project", {}).get("key") == PROJECT, "deploy pack project.key mismatch")

    services = pack.get("services") or []
    must(isinstance(services, list) and services, "deploy pack missing [[services]]")
    must(services[0].get("image") == IMAGE, "deploy pack services[0].image mismatch")

    checks = (pack.get("checks") or {}).get("staging") or []
    must(any("/healthz" in str(c.get("url", "")) for c in checks), "deploy pack missing /healthz check")
    must(any("/api/v1/healthz" in str(c.get("url", "")) for c in checks), "deploy pack missing /api/v1/healthz check")

    workflow_stage_path = Path(".github/workflows/ephemeral-staging.yml")
    if workflow_stage_path.exists():
        workflow_stage = workflow_stage_path.read_text()
        must("deploy/pack.toml" in workflow_stage, "ephemeral-staging.yml must reference deploy/pack.toml")

    for doc_name in ("AGENTS.md", "CLAUDE.md"):
        doc = Path(doc_name).read_text()
        must("/healthz" in doc, f"{doc_name} missing /healthz")
        must("/api/v1/healthz" in doc, f"{doc_name} missing /api/v1/healthz")
        must("deploy/pack.toml" in doc, f"{doc_name} missing deploy/pack.toml mention")
        must("RICHMILES_XYZ_IMAGE_TAG" in doc, f"{doc_name} missing RICHMILES_XYZ_IMAGE_TAG mention")

    print("check_contract ok")


if __name__ == "__main__":
    main()
