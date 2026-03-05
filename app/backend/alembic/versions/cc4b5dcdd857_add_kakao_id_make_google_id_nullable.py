"""add_kakao_id_make_google_id_nullable

Revision ID: cc4b5dcdd857
Revises: f464dcce400d
Create Date: 2026-03-05 10:15:41.054809

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cc4b5dcdd857'
down_revision: Union[str, Sequence[str], None] = 'f464dcce400d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("users", sa.Column("kakao_id", sa.String(128), nullable=True))
    op.create_unique_constraint("uq_users_kakao_id", "users", ["kakao_id"])
    op.alter_column("users", "google_id", existing_type=sa.String(128), nullable=True)


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column("users", "google_id", existing_type=sa.String(128), nullable=False)
    op.drop_constraint("uq_users_kakao_id", "users", type_="unique")
    op.drop_column("users", "kakao_id")
