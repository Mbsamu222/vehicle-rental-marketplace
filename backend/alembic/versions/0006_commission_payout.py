"""booking payout linkage

Revision ID: 0006_commission_payout
Revises: 0005_placement_monetization
Create Date: 2026-07-24

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0006_commission_payout"
down_revision: Union[str, None] = "0005_placement_monetization"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Guarded — see 0002/0004/0005 for why: 0001's create_all() already creates
    # this column on a database initialized fresh after this model change landed.
    op.execute(
        "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payout_transaction_id VARCHAR(36) REFERENCES transactions(id)"
    )


def downgrade() -> None:
    op.execute("ALTER TABLE bookings DROP COLUMN IF EXISTS payout_transaction_id")
