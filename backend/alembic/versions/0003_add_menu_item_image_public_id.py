"""Add image_public_id to menu_items for Cloudinary asset tracking

Revision ID: 0003_cloudinary_public_id
Revises: 0002_razorpay_fields
Create Date: 2026-09-18

Adds a nullable VARCHAR(500) column image_public_id to menu_items.
This stores the Cloudinary public_id so we can delete old assets when
a menu item image is replaced or the item is deleted.

Backward compatibility:
  - Existing menu items with image_url only will have image_public_id = NULL (valid)
  - Existing menu items with no image will have both NULL (valid)
  - New items uploaded via Cloudinary will have both fields populated
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector

revision = '0003_cloudinary_public_id'
down_revision = '0002_razorpay_fields'
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = Inspector.from_engine(bind)
    existing_cols = [c['name'] for c in inspector.get_columns('menu_items')]

    if 'image_public_id' not in existing_cols:
        op.add_column(
            'menu_items',
            sa.Column(
                'image_public_id',
                sa.String(500),
                nullable=True,
                comment='Cloudinary public_id for managed asset cleanup'
            )
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = Inspector.from_engine(bind)
    existing_cols = [c['name'] for c in inspector.get_columns('menu_items')]

    if 'image_public_id' in existing_cols:
        op.drop_column('menu_items', 'image_public_id')
