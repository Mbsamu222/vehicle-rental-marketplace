"""bank details upi id

Revision ID: 0003_bank_upi_id
Revises: 0002_firebase_auth
Create Date: 2026-07-23

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0003_bank_upi_id"
down_revision: Union[str, None] = "0002_firebase_auth"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE bank_details ADD COLUMN IF NOT EXISTS upi_id VARCHAR")


def downgrade() -> None:
    op.execute("ALTER TABLE bank_details DROP COLUMN IF EXISTS upi_id")
