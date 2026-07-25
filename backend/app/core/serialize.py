import re

from sqlalchemy import inspect

_SNAKE_RE = re.compile(r"_([a-zA-Z0-9])")

# Columns whose Python attribute name (chosen to avoid clashing with SQLAlchemy's
# reserved `Base.metadata`) doesn't reverse-camelCase back to the original Prisma
# field name.
_FIELD_RENAMES = {
    "transaction_metadata": "metadata",
    "activity_metadata": "metadata",
}


def to_camel(name: str) -> str:
    return _SNAKE_RE.sub(lambda m: m.group(1).upper(), name)


def orm_to_dict(obj, *, exclude: frozenset[str] = frozenset(), extra: dict | None = None) -> dict:
    """Convert a SQLAlchemy model instance into a camelCase dict matching the
    original Prisma/TS field names, e.g. `first_name` -> `firstName`."""
    mapper = inspect(obj.__class__)
    result: dict = {}
    for attr in mapper.column_attrs:
        key = attr.key
        if key in exclude:
            continue
        json_key = _FIELD_RENAMES.get(key, to_camel(key))
        result[json_key] = getattr(obj, key)
    if extra:
        result.update(extra)
    return result
