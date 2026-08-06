"""Timezone normalisation for values read back from the database.

Postgres `TIMESTAMPTZ` round-trips as aware, but the SQLite test harness and
some driver paths hand back naive datetimes. Comparing a naive to an aware
datetime raises `TypeError`, so every boundary that does date arithmetic has to
normalise first.

Previously duplicated as a private `_ensure_aware` in two modules.
"""

from datetime import datetime, timezone


def ensure_aware(dt: datetime) -> datetime:
    """Returns `dt` unchanged if it already carries a tzinfo, else assumes UTC.

    UTC is the right assumption because everything is stored as TIMESTAMPTZ and
    the app never persists local wall-clock times.
    """
    return dt if dt.tzinfo is not None else dt.replace(tzinfo=timezone.utc)
