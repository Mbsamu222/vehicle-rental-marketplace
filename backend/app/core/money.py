"""Monetary rounding.

Every amount persisted to a `NUMERIC(10, 2)` column must be quantised the same
way, or totals drift by a paisa between the value computed in one module and the
value recomputed in another. This was previously duplicated as a private
`_round2` in three modules (bookings, payouts, rental_partners), which is exactly
how such drift starts.
"""

from decimal import ROUND_HALF_UP, Decimal

# Two-place quantum matching the NUMERIC(10, 2) columns in app/db/models.py.
_CENTS = Decimal("0.01")


def round_money(value: Decimal) -> Decimal:
    """Rounds to 2 decimal places, half-up.

    Half-up (not banker's rounding) because that is what customers, invoices,
    and payment gateways expect: ₹0.125 becomes ₹0.13, never ₹0.12.
    """
    return Decimal(value).quantize(_CENTS, rounding=ROUND_HALF_UP)
