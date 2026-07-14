import json
from typing import Any


def load_metadata(value: str | None) -> dict[str, Any]:
    if not value:
        return {}
    try:
        loaded = json.loads(value)
    except json.JSONDecodeError:
        return {}
    return loaded if isinstance(loaded, dict) else {}


def dump_metadata(value: dict[str, Any] | None) -> str:
    return json.dumps(value or {}, ensure_ascii=False)

