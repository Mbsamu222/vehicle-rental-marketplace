"""calculate_cancellation_fee is a pure function; the boundary behavior (which
tier applies at exactly 24h/48h) is the highest off-by-one risk in this batch."""
from decimal import Decimal

from app.modules.bookings.service import calculate_cancellation_fee

TIERS = [
    {"hoursBeforePickup": 48, "feePercentage": 0},
    {"hoursBeforePickup": 24, "feePercentage": 25},
    {"hoursBeforePickup": 0, "feePercentage": 50},
]


def _fee(hours_before_pickup: float) -> Decimal:
    return calculate_cancellation_fee(taxable_amount=Decimal("1000"), hours_before_pickup=hours_before_pickup, tiers=TIERS)


def test_no_tiers_means_no_fee() -> None:
    assert calculate_cancellation_fee(taxable_amount=Decimal("1000"), hours_before_pickup=1, tiers=[]) == Decimal("0")


def test_well_before_48h_is_free() -> None:
    assert _fee(72) == Decimal("0")


def test_exactly_at_48h_boundary_is_free() -> None:
    # >= 48 satisfies the 48h tier (0%), not just the 24h tier
    assert _fee(48) == Decimal("0")


def test_just_under_48h_falls_to_24h_tier() -> None:
    assert _fee(47.99) == Decimal("250.00")  # 25% of 1000


def test_exactly_at_24h_boundary_uses_24h_tier() -> None:
    assert _fee(24) == Decimal("250.00")


def test_just_under_24h_falls_to_0h_tier() -> None:
    assert _fee(23.99) == Decimal("500.00")  # 50% of 1000


def test_at_pickup_time_uses_strictest_tier() -> None:
    assert _fee(0) == Decimal("500.00")
