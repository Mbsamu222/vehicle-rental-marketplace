"""admin-editable SEO settings per route + per-vehicle SEO overrides

Revision ID: 0012_seo_settings
Revises: 0011_drivers
Create Date: 2026-08-02

"""
from typing import Sequence, Union

from alembic import op

revision: str = "0012_seo_settings"
down_revision: Union[str, None] = "0011_drivers"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS seo_settings (
            id VARCHAR(36) PRIMARY KEY,
            path VARCHAR NOT NULL UNIQUE,
            title VARCHAR(200),
            description VARCHAR(400),
            keywords TEXT,
            og_image_url VARCHAR,
            no_index BOOLEAN NOT NULL DEFAULT FALSE,
            updated_by_id VARCHAR(36) REFERENCES users(id),
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_seo_settings_path ON seo_settings (path)")
    op.execute("ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS seo_title VARCHAR(200)")
    op.execute("ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS seo_description VARCHAR(400)")


def downgrade() -> None:
    op.execute("ALTER TABLE vehicles DROP COLUMN IF EXISTS seo_description")
    op.execute("ALTER TABLE vehicles DROP COLUMN IF EXISTS seo_title")
    op.execute("DROP TABLE IF EXISTS seo_settings")
