import json
from functools import lru_cache
from pathlib import Path
from typing import Any

from backend.portfolio_schemas import ExperienceItem, ExperienceListResponse, ProfileResponse

CONTENT_DIR = Path(__file__).resolve().parent / "content"


def _load_json(filename: str) -> Any:
    return json.loads((CONTENT_DIR / filename).read_text(encoding="utf-8"))


@lru_cache
def load_profile() -> ProfileResponse:
    return ProfileResponse.model_validate(_load_json("profile.json"))


@lru_cache
def load_experience() -> ExperienceListResponse:
    items = [ExperienceItem.model_validate(item) for item in _load_json("experience.json")]
    return ExperienceListResponse(items=items)
