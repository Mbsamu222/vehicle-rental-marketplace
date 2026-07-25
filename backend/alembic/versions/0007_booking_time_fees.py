"""booking-time fees: service fee, extra-driver, young-driver

Revision ID: 0007_booking_time_fees
Revises: 0006_commission_payout
Create Date: 2026-07-24

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0007_booking_time_fees"
down_revision: Union[str, None] = "0006_commission_payout"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Guarded — see 0002/0004/0005/0006 for why: 0001's create_all() already
    # creates these columns on a database initialized fresh after this model
    # change landed.
    op.execute("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS service_fee_amount NUMERIC(10, 2) NOT NULL DEFAULT 0")
    op.execute("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS extra_driver_fee_amount NUMERIC(10, 2) NOT NULL DEFAULT 0")
    op.execute("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS young_driver_fee_amount NUMERIC(10, 2) NOT NULL DEFAULT 0")
    op.execute("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS extra_driver_count INTEGER NOT NULL DEFAULT 0")
    op.execute("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS is_young_driver BOOLEAN NOT NULL DEFAULT FALSE")


def downgrade() -> None:
    op.execute("ALTER TABLE bookings DROP COLUMN IF EXISTS is_young_driver")
    op.execute("ALTER TABLE bookings DROP COLUMN IF EXISTS extra_driver_count")
    op.execute("ALTER TABLE bookings DROP COLUMN IF EXISTS young_driver_fee_amount")
    op.execute("ALTER TABLE bookings DROP COLUMN IF EXISTS extra_driver_fee_amount")
    op.execute("ALTER TABLE bookings DROP COLUMN IF EXISTS service_fee_amount")
