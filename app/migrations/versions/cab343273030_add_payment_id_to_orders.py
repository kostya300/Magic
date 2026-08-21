"""add_payment_id_to_orders

Revision ID: cab343273030
Revises: 5a8eac627a20
Create Date: 2026-08-17 20:36:42.967397

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cab343273030'
down_revision: Union[str, Sequence[str], None] = '5a8eac627a20'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    """Add payment_id column to orders table."""
    op.add_column('orders', sa.Column('payment_id', sa.String(length=100), nullable=True))


def downgrade() -> None:
    """Remove payment_id column from orders table."""
    op.drop_column('orders', 'payment_id')
