"""Add updated_at to entities

Revision ID: 108721919bc3
Revises: 322dac5a514b
Create Date: 2026-08-24 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '108721919bc3'
down_revision = '21c2c4c62054'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('entities', schema=None) as batch_op:
        batch_op.add_column(sa.Column('updated_at', sa.DateTime(), nullable=True))
    op.execute("UPDATE entities SET updated_at = created_at")


def downgrade():
    with op.batch_alter_table('entities', schema=None) as batch_op:
        batch_op.drop_column('updated_at')
