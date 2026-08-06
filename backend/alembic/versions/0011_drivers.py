"""drivers, driver documents, driver assignments, chauffeur booking fields

Revision ID: 0011_drivers
Revises: 0010_handover_fines_extensions_gst
Create Date: 2026-08-01

"""
from typing import Sequence, Union

from alembic import op

revision: str = "0011_drivers"
down_revision: Union[str, None] = "0010_handover_fines_extensions_gst"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Guarded throughout — see 0002/0004..0010 for the rationale.

    # DRIVER joins the existing user_type enum.
    op.execute("ALTER TYPE user_type ADD VALUE IF NOT EXISTS 'DRIVER'")

    op.execute(
        "DO $$ BEGIN CREATE TYPE driver_verification_status AS ENUM "
        "('PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'SUSPENDED'); "
        "EXCEPTION WHEN duplicate_object THEN NULL; END $$"
    )
    op.execute(
        "DO $$ BEGIN CREATE TYPE driver_assignment_status AS ENUM "
        "('REQUESTED', 'ACCEPTED', 'DECLINED', 'CANCELLED', 'COMPLETED'); "
        "EXCEPTION WHEN duplicate_object THEN NULL; END $$"
    )
    op.execute(
        "DO $$ BEGIN CREATE TYPE driver_document_type AS ENUM "
        "('DRIVING_LICENSE', 'IDENTITY_PROOF', 'ADDRESS_PROOF', 'POLICE_VERIFICATION', 'PHOTO'); "
        "EXCEPTION WHEN duplicate_object THEN NULL; END $$"
    )

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS drivers (
            id VARCHAR(36) PRIMARY KEY,
            user_id VARCHAR(36) NOT NULL UNIQUE REFERENCES users(id),
            city_id VARCHAR(36) NOT NULL REFERENCES cities(id),
            license_number VARCHAR NOT NULL UNIQUE,
            license_expiry TIMESTAMPTZ NOT NULL,
            years_of_experience INTEGER NOT NULL DEFAULT 0,
            daily_rate NUMERIC(10, 2) NOT NULL,
            hourly_rate NUMERIC(10, 2) NOT NULL,
            bio TEXT,
            photo_url VARCHAR,
            languages VARCHAR,
            verification_status driver_verification_status NOT NULL DEFAULT 'PENDING',
            rejection_reason TEXT,
            is_available BOOLEAN NOT NULL DEFAULT TRUE,
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            average_rating NUMERIC(3, 2) NOT NULL DEFAULT 0,
            total_trips INTEGER NOT NULL DEFAULT 0,
            total_reviews INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_drivers_city_id ON drivers (city_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_drivers_verification_status ON drivers (verification_status)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_drivers_is_available ON drivers (is_available)")

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS driver_documents (
            id VARCHAR(36) PRIMARY KEY,
            driver_id VARCHAR(36) NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
            type driver_document_type NOT NULL,
            file_url VARCHAR NOT NULL,
            status document_status NOT NULL DEFAULT 'PENDING',
            rejection_reason TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_driver_documents_driver_id ON driver_documents (driver_id)")

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS driver_assignments (
            id VARCHAR(36) PRIMARY KEY,
            booking_id VARCHAR(36) NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
            driver_id VARCHAR(36) NOT NULL REFERENCES drivers(id),
            status driver_assignment_status NOT NULL DEFAULT 'REQUESTED',
            agreed_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
            decline_reason TEXT,
            responded_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_driver_assignments_booking_id ON driver_assignments (booking_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_driver_assignments_driver_id ON driver_assignments (driver_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_driver_assignments_status ON driver_assignments (status)")

    op.execute("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS with_driver BOOLEAN NOT NULL DEFAULT FALSE")
    op.execute("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS driver_fee_amount NUMERIC(10, 2) NOT NULL DEFAULT 0")


def downgrade() -> None:
    op.execute("ALTER TABLE bookings DROP COLUMN IF EXISTS driver_fee_amount")
    op.execute("ALTER TABLE bookings DROP COLUMN IF EXISTS with_driver")
    op.execute("DROP TABLE IF EXISTS driver_assignments")
    op.execute("DROP TABLE IF EXISTS driver_documents")
    op.execute("DROP TABLE IF EXISTS drivers")
    op.execute("DROP TYPE IF EXISTS driver_document_type")
    op.execute("DROP TYPE IF EXISTS driver_assignment_status")
    op.execute("DROP TYPE IF EXISTS driver_verification_status")
    # Postgres cannot remove a value from an enum; DRIVER stays on user_type.
