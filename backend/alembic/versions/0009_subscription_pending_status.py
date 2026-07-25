"""subscription pending status

Revision ID: 0009_subscription_pending_status
Revises: 0008_cancellation_late_return
Create Date: 2026-07-24

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0009_subscription_pending_status"
down_revision: Union[str, None] = "0008_cancellation_late_return"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Adds the offline-payment-confirm flow's PENDING status (partner requests a
    # plan -> PENDING -> admin confirms payment received -> ACTIVE), mirroring
    # the BankDetail/BusinessDocument admin-review pattern. Postgres 16 (this
    # project's target) supports ADD VALUE outside a preceding transaction block
    # without special handling.
    op.execute("ALTER TYPE subscription_status ADD VALUE IF NOT EXISTS 'PENDING'")


def downgrade() -> None:
    # Postgres has no `DROP VALUE` for enum types — leaving `PENDING` in the
    # type on downgrade is the accepted tradeoff, same as 0008's LATE_RETURN_FEE.
    pass
