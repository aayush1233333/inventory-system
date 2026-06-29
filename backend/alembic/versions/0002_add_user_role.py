"""Add role column to users for RBAC

Revision ID: 0002
Revises: 0001
Create Date: 2026-06-26 00:00:00
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Postgres requires the enum TYPE to exist before a column can use it.
# CREATE TABLE compiles this automatically, but op.add_column() on an
# existing table does not — so it has to be created explicitly first.
user_role_enum = postgresql.ENUM("admin", "staff", name="userrole", create_type=False)


def upgrade() -> None:
    bind = op.get_bind()
    postgresql.ENUM("admin", "staff", name="userrole").create(bind, checkfirst=True)
    op.add_column(
        "users",
        sa.Column(
            "role",
            user_role_enum,
            nullable=False,
            server_default="staff",
        ),
    )


def downgrade() -> None:
    op.drop_column("users", "role")
    user_role_enum.drop(op.get_bind(), checkfirst=True)
