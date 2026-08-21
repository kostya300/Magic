"""add_paid_at_to_orders

Revision ID: a1b2c3d4e5f6
Revises: cab343273030
Create Date: 2026-08-21

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'cab343273030'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add paid_at column to orders table."""
    op.add_column('orders', sa.Column('paid_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    """Remove paid_at column from orders table."""
    op.drop_column('orders', 'paid_at')
