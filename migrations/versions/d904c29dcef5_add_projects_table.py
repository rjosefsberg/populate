"""Add projects table and entity.project_id

Revision ID: d904c29dcef5
Revises: 57f19c5e9bc6
Create Date: 2026-08-23 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd904c29dcef5'
down_revision = '57f19c5e9bc6'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('projects',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    with op.batch_alter_table('entities', schema=None) as batch_op:
        batch_op.add_column(sa.Column('project_id', sa.Integer(), nullable=True))

    # Backfill: create a default project and assign existing entities to it.
    conn = op.get_bind()
    conn.execute(sa.text(
        "INSERT INTO projects (name, created_at) VALUES ('Default', CURRENT_TIMESTAMP)"
    ))
    default_id = conn.execute(sa.text("SELECT id FROM projects WHERE name = 'Default'")).scalar()
    conn.execute(sa.text("UPDATE entities SET project_id = :pid WHERE project_id IS NULL"), {"pid": default_id})

    with op.batch_alter_table('entities', schema=None) as batch_op:
        batch_op.alter_column('project_id', existing_type=sa.Integer(), nullable=False)
        batch_op.create_foreign_key('fk_entities_project_id', 'projects', ['project_id'], ['id'], ondelete='CASCADE')


def downgrade():
    with op.batch_alter_table('entities', schema=None) as batch_op:
        batch_op.drop_constraint('fk_entities_project_id', type_='foreignkey')
        batch_op.drop_column('project_id')

    op.drop_table('projects')
