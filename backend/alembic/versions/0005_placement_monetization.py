"""placement monetization: boosted listings, sponsored placements, affiliates

Revision ID: 0005_placement_monetization
Revises: 0004_monetization_features
Create Date: 2026-07-24

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0005_placement_monetization"
down_revision: Union[str, None] = "0004_monetization_features"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Guarded throughout — see 0002/0004 for why: 0001's create_all() already
    # creates these on a database that's freshly initialized after this model
    # change landed, so every statement here must be a safe no-op in that case.
    op.execute("ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE")
    op.execute("ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ")

    op.execute("ALTER TABLE hero_banner_slides ADD COLUMN IF NOT EXISTS is_sponsored BOOLEAN NOT NULL DEFAULT FALSE")
    op.execute("ALTER TABLE hero_banner_slides ADD COLUMN IF NOT EXISTS sponsor_name VARCHAR")
    op.execute("ALTER TABLE hero_banner_slides ADD COLUMN IF NOT EXISTS amount_charged NUMERIC(10, 2)")

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS vehicle_boosts (
            id VARCHAR(36) PRIMARY KEY,
            vehicle_id VARCHAR(36) NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
            granted_by_id VARCHAR(36) REFERENCES users(id),
            starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            ends_at TIMESTAMPTZ NOT NULL,
            amount_charged NUMERIC(10, 2) NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_vehicle_boosts_vehicle_id ON vehicle_boosts (vehicle_id)")

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS ad_slots (
            id VARCHAR(36) PRIMARY KEY,
            title VARCHAR NOT NULL,
            subtitle TEXT,
            image_url VARCHAR NOT NULL,
            cta_label VARCHAR,
            cta_url VARCHAR,
            sponsor_name VARCHAR,
            amount_charged NUMERIC(10, 2),
            sort_order INTEGER NOT NULL DEFAULT 0,
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        """
    )

    op.execute(
        """
        DO $$ BEGIN
            CREATE TYPE affiliate_category AS ENUM ('INSURANCE', 'ROADSIDE_ASSISTANCE', 'FUEL', 'OTHER');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS affiliate_partners (
            id VARCHAR(36) PRIMARY KEY,
            name VARCHAR NOT NULL,
            category affiliate_category NOT NULL,
            tagline TEXT,
            cta_label VARCHAR,
            referral_url VARCHAR NOT NULL,
            logo_url VARCHAR,
            sort_order INTEGER NOT NULL DEFAULT 0,
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        """
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS affiliate_partners")
    op.execute("DROP TYPE IF EXISTS affiliate_category")
    op.execute("DROP TABLE IF EXISTS ad_slots")
    op.execute("DROP TABLE IF EXISTS vehicle_boosts")
    op.execute("ALTER TABLE hero_banner_slides DROP COLUMN IF EXISTS amount_charged")
    op.execute("ALTER TABLE hero_banner_slides DROP COLUMN IF EXISTS sponsor_name")
    op.execute("ALTER TABLE hero_banner_slides DROP COLUMN IF EXISTS is_sponsored")
    op.execute("ALTER TABLE vehicles DROP COLUMN IF EXISTS featured_until")
    op.execute("ALTER TABLE vehicles DROP COLUMN IF EXISTS is_featured")
