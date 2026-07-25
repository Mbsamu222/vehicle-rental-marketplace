"""firebase auth

Revision ID: 0002_firebase_auth
Revises: 0001_initial_schema
Create Date: 2026-07-23

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0002_firebase_auth"
down_revision: Union[str, None] = "0001_initial_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Guarded with IF [NOT] EXISTS throughout: 0001_initial_schema runs
    # `Base.metadata.create_all()` against whatever models.py currently contains
    # rather than a fixed historical snapshot, so on a database where 0001 is
    # applied for the first time *after* this file's model changes already
    # landed, these columns/tables are created (or absent) by 0001 already —
    # this migration must be a no-op in that case, not a conflict.
    #
    # Nullable at the DB level even though the ORM model types it as required —
    # any pre-existing rows have no Firebase identity yet and must be backfilled
    # (or dropped, in a dev DB) before the app can look them up by firebase_uid.
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS firebase_uid VARCHAR")
    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_firebase_uid ON users (firebase_uid)")
    op.alter_column("users", "password_hash", existing_type=sa.String(), nullable=True)

    op.execute("DROP TABLE IF EXISTS otp_codes")
    op.execute("DROP TABLE IF EXISTS refresh_tokens")


def downgrade() -> None:
    op.create_table(
        "refresh_tokens",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), index=True),
        sa.Column("token_hash", sa.String(), unique=True),
        sa.Column("expires_at", sa.DateTime(timezone=True)),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_table(
        "otp_codes",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), index=True),
        sa.Column("code", sa.String()),
        sa.Column("purpose", sa.String(), index=True),
        sa.Column("expires_at", sa.DateTime(timezone=True)),
        sa.Column("consumed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.alter_column("users", "password_hash", existing_type=sa.String(), nullable=False)
    op.drop_index("ix_users_firebase_uid", table_name="users")
    op.drop_column("users", "firebase_uid")
