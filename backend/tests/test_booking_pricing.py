"""calculate_price is a pure function — no DB/HTTP needed to test the fee math."""
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from app.modules.bookings.service import calculate_price

PICKUP = datetime(2026, 8, 1, tzinfo=timezone.utc)
ONE_DAY = PICKUP + timedelta(days=1)


def _base_kwargs(**overrides):
    kwargs = dict(
        price_per_hour=Decimal("50"),
        price_per_day=Decimal("1000"),
        security_deposit=Decimal("0"),
        pickup=PICKUP,
        ret=ONE_DAY,
    )
    kwargs.update(overrides)
    return kwargs


def test_no_fee_config_is_byte_identical_to_pre_phase4_pricing() -> None:
    result = calculate_price(**_base_kwargs())
    assert result["base_price"] == Decimal("1000.00")
    assert result["service_fee_amount"] == Decimal("0")
    assert result["extra_driver_fee_amount"] == Decimal("0")
    assert result["young_driver_fee_amount"] == Decimal("0")
    # tax = 18% of 1000 = 180; total = 1000 + 180 = 1180, unaffected by new fields
    assert result["tax_amount"] == Decimal("180.00")
    assert result["total_amount"] == Decimal("1180.00")


def test_flat_service_fee_is_additive_and_untaxed() -> None:
    result = calculate_price(**_base_kwargs(fee_config={"serviceFee": {"type": "FLAT", "value": 99}}))
    assert result["service_fee_amount"] == Decimal("99.00")
    # total = 1000 (base) + 180 (tax) + 99 (fee) = 1279, fee not itself taxed
    assert result["total_amount"] == Decimal("1279.00")


def test_percentage_service_fee_respects_cap() -> None:
    result = calculate_price(
        **_base_kwargs(fee_config={"serviceFee": {"type": "PERCENTAGE", "value": 10, "cap": 50}})
    )
    # 10% of base_price (1000) = 100, capped at 50
    assert result["service_fee_amount"] == Decimal("50.00")


def test_extra_driver_fee_scales_with_count() -> None:
    result = calculate_price(
        **_base_kwargs(extra_driver_count=3, fee_config={"extraDriverFee": {"perDriverFlat": 150}})
    )
    assert result["extra_driver_fee_amount"] == Decimal("450.00")
    assert result["extra_driver_count"] == 3


def test_extra_driver_fee_zero_when_count_is_zero() -> None:
    result = calculate_price(**_base_kwargs(extra_driver_count=0, fee_config={"extraDriverFee": {"perDriverFlat": 150}}))
    assert result["extra_driver_fee_amount"] == Decimal("0")


def test_young_driver_fee_applied_only_when_flagged() -> None:
    with_flag = calculate_price(**_base_kwargs(is_young_driver=True, fee_config={"youngDriverFee": {"flat": 200}}))
    without_flag = calculate_price(**_base_kwargs(is_young_driver=False, fee_config={"youngDriverFee": {"flat": 200}}))
    assert with_flag["young_driver_fee_amount"] == Decimal("200.00")
    assert without_flag["young_driver_fee_amount"] == Decimal("0")


def test_fees_are_independent_and_combine_additively() -> None:
    result = calculate_price(
        **_base_kwargs(
            extra_driver_count=2,
            is_young_driver=True,
            fee_config={
                "serviceFee": {"type": "FLAT", "value": 99},
                "extraDriverFee": {"perDriverFlat": 100},
                "youngDriverFee": {"flat": 150},
            },
        )
    )
    # base 1000 + tax 180 + service 99 + extraDriver 200 + youngDriver 150 = 1629
    assert result["total_amount"] == Decimal("1629.00")


def test_coupon_discount_does_not_apply_to_fees() -> None:
    coupon = {"type": "PERCENTAGE", "value": 50, "maxDiscount": None}
    result = calculate_price(
        **_base_kwargs(coupon=coupon, fee_config={"serviceFee": {"type": "FLAT", "value": 99}})
    )
    # 50% off base_price (1000) = 500 discount; taxable = 500; tax = 90; fee untouched by discount
    assert result["discount_amount"] == Decimal("500.00")
    assert result["service_fee_amount"] == Decimal("99.00")
    assert result["total_amount"] == Decimal("689.00")  # 500 + 90 + 99
