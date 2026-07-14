import re
from pathlib import Path
from typing import Any

import yaml


def slugify(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"[^a-z0-9\u4e00-\u9fff]+", "-", value)
    value = value.strip("-")
    return value or "paper"


def paper_markdown(paper_id: str, title: str, metadata: dict[str, Any], content: str) -> str:
    frontmatter = {"id": paper_id, "title": title, **metadata}
    yaml_text = yaml.safe_dump(frontmatter, allow_unicode=True, sort_keys=False).strip()
    body = content.strip()
    heading = "" if body.startswith("#") else f"# {title}\n\n"
    return f"---\n{yaml_text}\n---\n\n{heading}{body}\n"


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")

