"""handover inspections, traffic fines, booking extensions, GST invoice fields

Revision ID: 0010_handover_fines_extensions_gst
Revises: 0009_subscription_pending_status
Create Date: 2026-07-26

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0010_handover_fines_extensions_gst"
down_revision: Union[str, None] = "0009_subscription_pending_status"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Guarded with IF NOT EXISTS throughout — see 0002/0004..0008 for why: a
    # database initialized fresh from 0001's create_all() after these model
    # changes landed already has them.

    # ── Enums ─────────────────────────────────────────────────────────────
    op.execute("DO $$ BEGIN CREATE TYPE inspection_type AS ENUM ('PICKUP', 'RETURN'); EXCEPTION WHEN duplicate_object THEN NULL; END $$")
    op.execute(
        "DO $$ BEGIN CREATE TYPE fuel_level AS ENUM "
        "('EMPTY', 'QUARTER', 'HALF', 'THREE_QUARTER', 'FULL'); "
        "EXCEPTION WHEN duplicate_object THEN NULL; END $$"
    )
    op.execute(
        "DO $$ BEGIN CREATE TYPE traffic_fine_status AS ENUM "
        "('PENDING', 'NOTIFIED', 'PAID_BY_CUSTOMER', 'DEDUCTED_FROM_DEPOSIT', 'WAIVED', 'DISPUTED'); "
        "EXCEPTION WHEN duplicate_object THEN NULL; END $$"
    )
    op.execute(
        "DO $$ BEGIN CREATE TYPE extension_status AS ENUM "
        "('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'); "
        "EXCEPTION WHEN duplicate_object THEN NULL; END $$"
    )

    # ── Handover / return condition reports ───────────────────────────────
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS booking_inspections (
            id VARCHAR(36) PRIMARY KEY,
            booking_id VARCHAR(36) NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
            type inspection_type NOT NULL,
            odometer_km INTEGER NOT NULL,
            fuel_level fuel_level NOT NULL,
            exterior_notes TEXT,
            interior_notes TEXT,
            damage_notes TEXT,
            customer_acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
            recorded_by_id VARCHAR(36) REFERENCES users(id),
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT uq_inspection_booking_type UNIQUE (booking_id, type)
        )
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_booking_inspections_booking_id ON booking_inspections (booking_id)")

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS inspection_photos (
            id VARCHAR(36) PRIMARY KEY,
            inspection_id VARCHAR(36) NOT NULL REFERENCES booking_inspections(id) ON DELETE CASCADE,
            url VARCHAR NOT NULL,
            label VARCHAR,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_inspection_photos_inspection_id ON inspection_photos (inspection_id)")

    # ── Booking extensions ────────────────────────────────────────────────
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS booking_extensions (
            id VARCHAR(36) PRIMARY KEY,
            booking_id VARCHAR(36) NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
            requested_return_datetime TIMESTAMPTZ NOT NULL,
            previous_return_datetime TIMESTAMPTZ NOT NULL,
            additional_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
            status extension_status NOT NULL DEFAULT 'PENDING',
            rejection_reason TEXT,
            payment_id VARCHAR(36) REFERENCES payments(id),
            decided_by_id VARCHAR(36) REFERENCES users(id),
            decided_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_booking_extensions_booking_id ON booking_extensions (booking_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_booking_extensions_status ON booking_extensions (status)")

    # ── Traffic fines / challans ──────────────────────────────────────────
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS traffic_fines (
            id VARCHAR(36) PRIMARY KEY,
            booking_id VARCHAR(36) NOT NULL REFERENCES bookings(id),
            challan_number VARCHAR,
            violation_at TIMESTAMPTZ NOT NULL,
            amount NUMERIC(10, 2) NOT NULL,
            description TEXT,
            evidence_url VARCHAR,
            status traffic_fine_status NOT NULL DEFAULT 'PENDING',
            recorded_by_id VARCHAR(36) REFERENCES users(id),
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_traffic_fines_booking_id ON traffic_fines (booking_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_traffic_fines_challan_number ON traffic_fines (challan_number)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_traffic_fines_status ON traffic_fines (status)")

    # ── GST breakdown on invoices ─────────────────────────────────────────
    for column, ddl in [
        ("seller_gstin", "VARCHAR(15)"),
        ("customer_gstin", "VARCHAR(15)"),
        ("place_of_supply", "VARCHAR"),
        ("hsn_sac_code", "VARCHAR(10)"),
        ("taxable_amount", "NUMERIC(10, 2) NOT NULL DEFAULT 0"),
        ("cgst_amount", "NUMERIC(10, 2) NOT NULL DEFAULT 0"),
        ("sgst_amount", "NUMERIC(10, 2) NOT NULL DEFAULT 0"),
        ("igst_amount", "NUMERIC(10, 2) NOT NULL DEFAULT 0"),
        ("total_amount", "NUMERIC(10, 2) NOT NULL DEFAULT 0"),
    ]:
        op.execute(f"ALTER TABLE invoices ADD COLUMN IF NOT EXISTS {column} {ddl}")


def downgrade() -> None:
    for column in [
        "seller_gstin",
        "customer_gstin",
        "place_of_supply",
        "hsn_sac_code",
        "taxable_amount",
        "cgst_amount",
        "sgst_amount",
        "igst_amount",
        "total_amount",
    ]:
        op.execute(f"ALTER TABLE invoices DROP COLUMN IF EXISTS {column}")

    op.execute("DROP TABLE IF EXISTS traffic_fines")
    op.execute("DROP TABLE IF EXISTS booking_extensions")
    op.execute("DROP TABLE IF EXISTS inspection_photos")
    op.execute("DROP TABLE IF EXISTS booking_inspections")

    op.execute("DROP TYPE IF EXISTS extension_status")
    op.execute("DROP TYPE IF EXISTS traffic_fine_status")
    op.execute("DROP TYPE IF EXISTS fuel_level")
    op.execute("DROP TYPE IF EXISTS inspection_type")
