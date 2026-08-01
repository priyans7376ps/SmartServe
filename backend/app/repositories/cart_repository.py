from typing import Optional, List, Dict, Any
import uuid
from datetime import datetime, timezone
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.cart import Cart, CartItem
from app.repositories.base import BaseRepository

class CartRepository(BaseRepository[Cart]):
    def __init__(self, db: AsyncSession):
        super().__init__(Cart, db)

    async def get_active_cart_by_user(self, user_id: uuid.UUID) -> Optional[Cart]:
        stmt = select(Cart).where(
            and_(
                Cart.user_id == user_id,
                Cart.is_active == True,
                Cart.is_converted == False
            )
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_active_cart_by_session(self, session_id: str) -> Optional[Cart]:
        stmt = select(Cart).where(
            and_(
                Cart.session_id == session_id,
                Cart.is_active == True,
                Cart.is_converted == False
            )
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_or_create_cart(self, user_id: Optional[uuid.UUID] = None, session_id: Optional[str] = None, table_id: Optional[uuid.UUID] = None) -> Cart:
        cart = None
        if user_id:
            cart = await self.get_active_cart_by_user(user_id)
        elif session_id:
            cart = await self.get_active_cart_by_session(session_id)

        if not cart:
            cart_data = {
                "id": uuid.uuid4(),
                "user_id": user_id,
                "session_id": session_id,
                "table_id": table_id,
                "is_active": True,
                "is_converted": False,
                "discount_amount": 0.0,
            }
            cart = await self.create(cart_data)
        return cart

    async def add_item_to_cart(
        self,
        cart_id: uuid.UUID,
        menu_item_id: uuid.UUID,
        quantity: int,
        unit_price: float,
        notes: Optional[str] = None,
        variant_selected: Optional[Dict[str, Any]] = None,
        add_ons_selected: Optional[List[Dict[str, Any]]] = None,
        add_ons_total: float = 0.0
    ) -> CartItem:
        # Check if item already exists in cart with same variant/notes
        stmt = select(CartItem).where(
            and_(
                CartItem.cart_id == cart_id,
                CartItem.menu_item_id == menu_item_id,
                CartItem.is_active == True
            )
        )
        res = await self.db.execute(stmt)
        existing_item = res.scalars().first()

        if existing_item:
            existing_item.quantity += quantity
            existing_item.notes = notes or existing_item.notes
            existing_item.unit_price = unit_price
            existing_item.add_ons_total = add_ons_total
            self.db.add(existing_item)
            await self.db.commit()
            await self.db.refresh(existing_item)
            return existing_item

        new_item = CartItem(
            id=uuid.uuid4(),
            cart_id=cart_id,
            menu_item_id=menu_item_id,
            quantity=quantity,
            unit_price=unit_price,
            notes=notes,
            variant_selected=variant_selected,
            add_ons_selected=add_ons_selected or [],
            add_ons_total=add_ons_total,
            is_active=True
        )
        self.db.add(new_item)
        await self.db.commit()
        await self.db.refresh(new_item)
        return new_item

    async def update_cart_item_quantity(self, cart_item_id: uuid.UUID, quantity: int) -> Optional[CartItem]:
        stmt = select(CartItem).where(CartItem.id == cart_item_id)
        res = await self.db.execute(stmt)
        item = res.scalars().first()
        if not item:
            return None
        if quantity <= 0:
            await self.db.delete(item)
            await self.db.commit()
            return None
        item.quantity = quantity
        self.db.add(item)
        await self.db.commit()
        await self.db.refresh(item)
        return item

    async def remove_cart_item(self, cart_item_id: uuid.UUID) -> bool:
        stmt = select(CartItem).where(CartItem.id == cart_item_id)
        res = await self.db.execute(stmt)
        item = res.scalars().first()
        if item:
            await self.db.delete(item)
            await self.db.commit()
            return True
        return False

    async def clear_cart(self, cart_id: uuid.UUID) -> bool:
        cart = await self.get_by_id(cart_id)
        if not cart:
            return False
        # Remove items
        stmt = select(CartItem).where(CartItem.cart_id == cart_id)
        res = await self.db.execute(stmt)
        items = res.scalars().all()
        for item in items:
            await self.db.delete(item)
        cart.coupon_id = None
        cart.coupon_code = None
        cart.discount_amount = 0.0
        cart.notes = None
        self.db.add(cart)
        await self.db.commit()
        return True
