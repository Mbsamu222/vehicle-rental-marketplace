"""monetization features

Revision ID: 0004_monetization_features
Revises: 0003_bank_upi_id
Create Date: 2026-07-24

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0004_monetization_features"
down_revision: Union[str, None] = "0003_bank_upi_id"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_KEYS = [
    "BOOKING_COMMISSION",
    "PAYOUT_FEE",
    "SERVICE_FEE",
    "EXTRA_DRIVER_FEE",
    "YOUNG_DRIVER_FEE",
    "LATE_RETURN_FEE",
    "CANCELLATION_FEE",
    "BOOSTED_LISTINGS",
    "SPONSORED_PLACEMENTS",
    "AFFILIATE_PROGRAM",
    "PARTNER_SUBSCRIPTIONS",
    "FLEET_ANALYTICS",
]


def upgrade() -> None:
    # Guarded throughout: on a database where 0001_initial_schema is applied for
    # the first time *after* this model already exists in models.py, the table
    # is created by 0001's create_all() already — this migration must be a
    # no-op in that case, matching the convention set by 0002/0003.
    op.execute(
        """
        DO $$ BEGIN
            CREATE TYPE monetization_feature_key AS ENUM (
                'BOOKING_COMMISSION', 'PAYOUT_FEE', 'SERVICE_FEE', 'EXTRA_DRIVER_FEE',
                'YOUNG_DRIVER_FEE', 'LATE_RETURN_FEE', 'CANCELLATION_FEE', 'BOOSTED_LISTINGS',
                'SPONSORED_PLACEMENTS', 'AFFILIATE_PROGRAM', 'PARTNER_SUBSCRIPTIONS', 'FLEET_ANALYTICS'
            );
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS monetization_features (
            id VARCHAR(36) PRIMARY KEY,
            key monetization_feature_key UNIQUE NOT NULL,
            is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
            config JSON,
            updated_by_id VARCHAR(36) REFERENCES users(id),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        """
    )
    for key in _KEYS:
        op.execute(
            f"""
            INSERT INTO monetization_features (id, key, is_enabled)
            VALUES (gen_random_uuid()::text, '{key}', FALSE)
            ON CONFLICT (key) DO NOTHING;
            """
        )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS monetization_features")
    op.execute("DROP TYPE IF EXISTS monetization_feature_key")
