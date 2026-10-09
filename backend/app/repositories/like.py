"""Escape helper for PostgreSQL LIKE and ILIKE patterns."""


def like_pattern(term: str) -> str:
    """Return a LIKE pattern that matches term anywhere, escaping wildcards."""
    escaped = term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    return f"%{escaped}%"
