"""add pickup/return lat-lng columns to bookings

Revision ID: 0013_booking_locations
Revises: 0012_seo_settings
Create Date: 2026-08-10

"""
from typing import Sequence, Union

from alembic import op

revision: str = "0013_booking_locations"
down_revision: Union[str, None] = "0012_seo_settings"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS pickup_latitude NUMERIC(9, 6)")
    op.execute("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS pickup_longitude NUMERIC(9, 6)")
    op.execute("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS return_latitude NUMERIC(9, 6)")
    op.execute("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS return_longitude NUMERIC(9, 6)")


def downgrade() -> None:
    op.execute("ALTER TABLE bookings DROP COLUMN IF EXISTS return_longitude")
    op.execute("ALTER TABLE bookings DROP COLUMN IF EXISTS return_latitude")
    op.execute("ALTER TABLE bookings DROP COLUMN IF EXISTS pickup_longitude")
    op.execute("ALTER TABLE bookings DROP COLUMN IF EXISTS pickup_latitude")
