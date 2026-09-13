"""Add Razorpay payment tracking fields

Revision ID: 0002_razorpay_fields
Revises: 0001_initial_foundation
Create Date: 2026-09-13
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector

revision = '0002_razorpay_fields'
down_revision = '0001_initial_foundation'
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = Inspector.from_engine(bind)
    existing_cols = [c['name'] for c in inspector.get_columns('payments')]

    if 'provider' not in existing_cols:
        op.add_column('payments', sa.Column('provider', sa.String(50), nullable=False, server_default='razorpay'))
    if 'provider_order_id' not in existing_cols:
        op.add_column('payments', sa.Column('provider_order_id', sa.String(255), nullable=True))
        op.create_index(op.f('ix_payments_provider_order_id'), 'payments', ['provider_order_id'], unique=False)
    if 'provider_payment_id' not in existing_cols:
        op.add_column('payments', sa.Column('provider_payment_id', sa.String(255), nullable=True))
        op.create_index(op.f('ix_payments_provider_payment_id'), 'payments', ['provider_payment_id'], unique=False)
    if 'provider_signature' not in existing_cols:
        op.add_column('payments', sa.Column('provider_signature', sa.String(500), nullable=True))
    if 'failure_reason' not in existing_cols:
        op.add_column('payments', sa.Column('failure_reason', sa.Text(), nullable=True))
    if 'verified_at' not in existing_cols:
        op.add_column('payments', sa.Column('verified_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('payments', 'verified_at')
    op.drop_column('payments', 'failure_reason')
    op.drop_column('payments', 'provider_signature')
    try:
        op.drop_index(op.f('ix_payments_provider_payment_id'), table_name='payments')
    except Exception:
        pass
    op.drop_column('payments', 'provider_payment_id')
    try:
        op.drop_index(op.f('ix_payments_provider_order_id'), table_name='payments')
    except Exception:
        pass
    op.drop_column('payments', 'provider_order_id')
    op.drop_column('payments', 'provider')
