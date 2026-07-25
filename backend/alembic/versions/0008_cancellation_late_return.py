"""cancellation fee, late-return fee

Revision ID: 0008_cancellation_late_return
Revises: 0007_booking_time_fees
Create Date: 2026-07-24

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0008_cancellation_late_return"
down_revision: Union[str, None] = "0007_booking_time_fees"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Guarded — see 0002/0004/0005/0006/0007 for why: 0001's create_all() already
    # creates these columns on a database initialized fresh after this model
    # change landed.
    op.execute("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_fee_amount NUMERIC(10, 2) NOT NULL DEFAULT 0")
    op.execute("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS actual_return_at TIMESTAMPTZ")
    op.execute("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS late_return_fee_amount NUMERIC(10, 2) NOT NULL DEFAULT 0")
    # Postgres enum-value additions can't run inside the same transaction block
    # as other DDL on older versions — this statement stands alone in the
    # migration for that reason (Postgres 16 here supports it fine either way).
    op.execute("ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'LATE_RETURN_FEE'")


def downgrade() -> None:
    # Postgres has no `DROP VALUE` for enum types — leaving `LATE_RETURN_FEE`
    # in the type on downgrade is the accepted tradeoff (matches Postgres's own
    # limitations, not an oversight).
    op.execute("ALTER TABLE bookings DROP COLUMN IF EXISTS late_return_fee_amount")
    op.execute("ALTER TABLE bookings DROP COLUMN IF EXISTS actual_return_at")
    op.execute("ALTER TABLE bookings DROP COLUMN IF EXISTS cancellation_fee_amount")
