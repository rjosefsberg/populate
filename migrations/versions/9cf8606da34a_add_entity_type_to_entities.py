"""Add entity_type to entities

Revision ID: 9cf8606da34a
Revises: d904c29dcef5
Create Date: 2026-08-23 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '9cf8606da34a'
down_revision = 'd904c29dcef5'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('entities', schema=None) as batch_op:
        batch_op.add_column(sa.Column('entity_type', sa.String(length=20), nullable=False, server_default='person'))


def downgrade():
    with op.batch_alter_table('entities', schema=None) as batch_op:
        batch_op.drop_column('entity_type')
