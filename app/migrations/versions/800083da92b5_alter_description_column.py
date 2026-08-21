"""alter_description_column

Revision ID: 800083da92b5
Revises: 5247c581b94f
Create Date: 2026-08-17 16:02:37.806550

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '800083da92b5'
down_revision: Union[str, Sequence[str], None] = '5247c581b94f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 1. Удаляем GIN индекс
    op.execute('DROP INDEX IF EXISTS ix_products_tsv_gin')
    
    # 2. Удаляем вычисляемый столбец tsv
    op.execute('ALTER TABLE products DROP COLUMN IF EXISTS tsv')
    
    # 3. Изменяем размер колонки description
    op.alter_column('products', 'description',
                    existing_type=sa.String(500),
                    type_=sa.String(2000),
                    existing_nullable=True)
    
    # 4. Пересоздаём вычисляемый столбец tsv
    op.execute("""
        ALTER TABLE products 
        ADD COLUMN tsv TSVECTOR GENERATED ALWAYS AS (
            setweight(to_tsvector('russian', coalesce(name, '')), 'A')
            || 
            setweight(to_tsvector('russian', coalesce(description, '')), 'B')
        ) STORED
    """)
    
    # 5. Пересоздаём GIN индекс
    op.create_index('ix_products_tsv_gin', 'products', ['tsv'], unique=False, postgresql_using='gin')


def downgrade() -> None:
    """Downgrade schema."""
    op.execute('DROP INDEX IF EXISTS ix_products_tsv_gin')
    
    op.execute('ALTER TABLE products DROP COLUMN IF EXISTS tsv')
    
    op.alter_column('products', 'description',
                    existing_type=sa.String(2000),
                    type_=sa.String(500),
                    existing_nullable=True)
    
    op.execute("""
        ALTER TABLE products 
        ADD COLUMN tsv TSVECTOR GENERATED ALWAYS AS (
            setweight(to_tsvector('russian', coalesce(name, '')), 'A')
            || 
            setweight(to_tsvector('russian', coalesce(description, '')), 'B')
        ) STORED
    """)
    
    op.create_index('ix_products_tsv_gin', 'products', ['tsv'], unique=False, postgresql_using='gin')
