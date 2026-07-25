from decimal import Decimal

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.responses import ApiError
from app.db.enums import BookingStatus, MonetizationFeatureKey, TransactionStatus, TransactionType, UserType
from app.db.models import MonetizationFeature, RentalPartner, Transaction
from app.deps.auth import AuthUser
from app.modules.bookings.service import transition_status
from app.modules.payouts.service import create_payout, record_booking_commission
from tests.conftest import login_as
from tests.factories import make_completed_booking, make_vehicle


async def _seed_features(db_session: AsyncSession, *enabled: MonetizationFeatureKey) -> None:
    for key in MonetizationFeatureKey:
        db_session.add(MonetizationFeature(key=key, is_enabled=key in enabled))
    await db_session.commit()


async def test_no_commission_recorded_when_toggle_off(db_session: AsyncSession) -> None:
    await _seed_features(db_session)
    vehicle = await make_vehicle(db_session)
    booking = await make_completed_booking(db_session, vehicle, base_price=Decimal("1000"))

    await record_booking_commission(db_session, booking)
    await db_session.commit()

    count = (await db_session.execute(select(Transaction))).scalars().all()
    assert count == []


async def test_commission_recorded_at_partner_rate_when_enabled(db_session: AsyncSession) -> None:
    await _seed_features(db_session, MonetizationFeatureKey.BOOKING_COMMISSION)
    vehicle = await make_vehicle(db_session)  # default commission_rate = 10%
    booking = await make_completed_booking(db_session, vehicle, base_price=Decimal("1000"), discount_amount=Decimal("100"))

    await record_booking_commission(db_session, booking)
    await db_session.commit()

    txns = (await db_session.execute(select(Transaction).where(Transaction.type == TransactionType.COMMISSION))).scalars().all()
    assert len(txns) == 1
    # commission base = 1000 - 100 = 900; 10% of 900 = 90
    assert txns[0].amount == Decimal("90.00")
    assert txns[0].rental_partner_id == vehicle.rental_partner_id
    assert txns[0].reference == booking.booking_number


async def test_transition_to_completed_records_commission_via_state_machine(db_session: AsyncSession) -> None:
    await _seed_features(db_session, MonetizationFeatureKey.BOOKING_COMMISSION)
    vehicle = await make_vehicle(db_session)
    booking = await make_completed_booking(db_session, vehicle, base_price=Decimal("500"))
    booking.status = BookingStatus.RETURNING
    await db_session.commit()

    await transition_status(db_session, booking.id, BookingStatus.COMPLETED, actor_id="tester")

    txns = (await db_session.execute(select(Transaction).where(Transaction.type == TransactionType.COMMISSION))).scalars().all()
    assert len(txns) == 1
    assert txns[0].amount == Decimal("50.00")  # 10% of 500


async def test_create_payout_nets_commission_and_marks_bookings_collected(db_session: AsyncSession) -> None:
    await _seed_features(db_session, MonetizationFeatureKey.BOOKING_COMMISSION)
    vehicle = await make_vehicle(db_session)
    b1 = await make_completed_booking(db_session, vehicle, base_price=Decimal("1000"))
    b2 = await make_completed_booking(db_session, vehicle, base_price=Decimal("500"))

    payout = await create_payout(db_session, vehicle.rental_partner_id, actor_id="admin-1")

    # gross 1500, 10% commission = 150, net = 1350, no payout fee
    assert payout.amount == Decimal("1350.00")
    assert payout.type == TransactionType.PAYOUT
    assert payout.status == TransactionStatus.SUCCESS

    await db_session.refresh(b1)
    await db_session.refresh(b2)
    assert b1.payout_transaction_id == payout.id
    assert b2.payout_transaction_id == payout.id

    with pytest.raises(ApiError):
        await create_payout(db_session, vehicle.rental_partner_id, actor_id="admin-1")


async def test_create_payout_deducts_no_commission_when_toggle_disabled(db_session: AsyncSession) -> None:
    await _seed_features(db_session)  # everything off, including BOOKING_COMMISSION
    vehicle = await make_vehicle(db_session)  # commission_rate defaults to 10%
    await make_completed_booking(db_session, vehicle, base_price=Decimal("1000"))

    payout = await create_payout(db_session, vehicle.rental_partner_id, actor_id="admin-1")

    # BOOKING_COMMISSION is off, so no cut is taken — partner gets the full gross,
    # matching record_booking_commission's own gate (no silent, unrecorded cut).
    assert payout.amount == Decimal("1000.00")
    assert payout.transaction_metadata["commission"] == "0.00"


async def test_create_payout_applies_percentage_payout_fee(db_session: AsyncSession) -> None:
    await _seed_features(db_session, MonetizationFeatureKey.BOOKING_COMMISSION, MonetizationFeatureKey.PAYOUT_FEE)
    fee_feature = (
        await db_session.execute(select(MonetizationFeature).where(MonetizationFeature.key == MonetizationFeatureKey.PAYOUT_FEE))
    ).scalar_one()
    fee_feature.config = {"type": "PERCENTAGE", "value": 2}
    await db_session.commit()

    vehicle = await make_vehicle(db_session)
    await make_completed_booking(db_session, vehicle, base_price=Decimal("1000"))

    payout = await create_payout(db_session, vehicle.rental_partner_id, actor_id="admin-1")

    # gross 1000, commission 10% = 100, net-before-fee = 900, fee 2% of 900 = 18
    assert payout.amount == Decimal("882.00")
    assert payout.transaction_metadata["payoutFee"] == "18.00"


async def test_payouts_endpoints_require_correct_roles(client: AsyncClient, db_session: AsyncSession) -> None:
    await _seed_features(db_session, MonetizationFeatureKey.BOOKING_COMMISSION)
    vehicle = await make_vehicle(db_session)
    await make_completed_booking(db_session, vehicle, base_price=Decimal("1000"))

    login_as(AuthUser(id="customer-1", user_type=UserType.CUSTOMER, permissions=[]))
    forbidden = await client.post("/api/v1/payouts", json={"rentalPartnerId": vehicle.rental_partner_id})
    assert forbidden.status_code == 403

    login_as(AuthUser(id="admin-1", user_type=UserType.SUPER_ADMIN, permissions=[]))
    created = await client.post("/api/v1/payouts", json={"rentalPartnerId": vehicle.rental_partner_id})
    assert created.status_code == 201

    partner = await db_session.get(RentalPartner, vehicle.rental_partner_id)
    login_as(AuthUser(id=partner.user_id, user_type=UserType.RENTAL_PARTNER, permissions=[]))
    mine = await client.get("/api/v1/payouts/mine")
    assert mine.status_code == 200
    assert len(mine.json()["data"]) == 1
