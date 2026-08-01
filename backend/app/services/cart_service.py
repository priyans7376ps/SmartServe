from typing import Optional, List, Dict, Any
import uuid
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.cart_repository import CartRepository
from app.repositories.menu_repository import MenuRepository
from app.repositories.coupon_repository import CouponRepository
from app.models.cart import Cart, CartItem
from app.schemas.customer import CartResponse, CartItemResponse

class CartService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.cart_repo = CartRepository(db)
        self.menu_repo = MenuRepository(db)
        self.coupon_repo = CouponRepository(db)

    async def get_or_create_cart(self, user_id: Optional[uuid.UUID] = None, session_id: Optional[str] = None, table_id: Optional[uuid.UUID] = None) -> CartResponse:
        cart = await self.cart_repo.get_or_create_cart(user_id=user_id, session_id=session_id, table_id=table_id)
        return self._format_cart_response(cart)

    async def add_item_to_cart(
        self,
        menu_item_id: uuid.UUID,
        quantity: int = 1,
        user_id: Optional[uuid.UUID] = None,
        session_id: Optional[str] = None,
        notes: Optional[str] = None,
        variant_selected: Optional[Dict[str, Any]] = None,
        add_ons_selected: Optional[List[Dict[str, Any]]] = None
    ) -> CartResponse:
        menu_item = await self.menu_repo.get_by_id(menu_item_id)
        if not menu_item or not menu_item.is_available or not menu_item.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu item not available")

        cart = await self.cart_repo.get_or_create_cart(user_id=user_id, session_id=session_id)

        add_ons_total = 0.0
        if add_ons_selected:
            for addon in add_ons_selected:
                add_ons_total += float(addon.get("price", 0.0))

        await self.cart_repo.add_item_to_cart(
            cart_id=cart.id,
            menu_item_id=menu_item_id,
            quantity=quantity,
            unit_price=menu_item.base_price,
            notes=notes,
            variant_selected=variant_selected,
            add_ons_selected=add_ons_selected,
            add_ons_total=add_ons_total
        )

        # Refresh cart
        updated_cart = await self.cart_repo.get_by_id(cart.id)
        return self._format_cart_response(updated_cart)

    async def update_item_quantity(self, cart_item_id: uuid.UUID, quantity: int, user_id: Optional[uuid.UUID] = None, session_id: Optional[str] = None) -> CartResponse:
        cart = await self.cart_repo.get_or_create_cart(user_id=user_id, session_id=session_id)
        await self.cart_repo.update_cart_item_quantity(cart_item_id, quantity)
        updated_cart = await self.cart_repo.get_by_id(cart.id)
        return self._format_cart_response(updated_cart)

    async def remove_item(self, cart_item_id: uuid.UUID, user_id: Optional[uuid.UUID] = None, session_id: Optional[str] = None) -> CartResponse:
        cart = await self.cart_repo.get_or_create_cart(user_id=user_id, session_id=session_id)
        await self.cart_repo.remove_cart_item(cart_item_id)
        updated_cart = await self.cart_repo.get_by_id(cart.id)
        return self._format_cart_response(updated_cart)

    async def clear_cart(self, user_id: Optional[uuid.UUID] = None, session_id: Optional[str] = None) -> CartResponse:
        cart = await self.cart_repo.get_or_create_cart(user_id=user_id, session_id=session_id)
        await self.cart_repo.clear_cart(cart.id)
        updated_cart = await self.cart_repo.get_by_id(cart.id)
        return self._format_cart_response(updated_cart)

    async def apply_coupon(self, code: str, user_id: Optional[uuid.UUID] = None, session_id: Optional[str] = None) -> CartResponse:
        coupon = await self.coupon_repo.get_by_code(code)
        if not coupon or not coupon.is_valid:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired coupon code")

        cart = await self.cart_repo.get_or_create_cart(user_id=user_id, session_id=session_id)
        subtotal = cart.subtotal

        if coupon.min_order_amount and subtotal < coupon.min_order_amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Minimum order amount for coupon is ₹{coupon.min_order_amount}"
            )

        # Calculate discount
        if coupon.discount_type.value == "percentage":
            discount = (subtotal * coupon.discount_value) / 100.0
            if coupon.max_discount_amount:
                discount = min(discount, coupon.max_discount_amount)
        else:
            discount = coupon.discount_value

        discount = min(discount, subtotal)

        cart.coupon_id = coupon.id
        cart.coupon_code = coupon.code
        cart.discount_amount = discount
        self.db.add(cart)
        await self.db.commit()

        updated_cart = await self.cart_repo.get_by_id(cart.id)
        return self._format_cart_response(updated_cart)

    async def remove_coupon(self, user_id: Optional[uuid.UUID] = None, session_id: Optional[str] = None) -> CartResponse:
        cart = await self.cart_repo.get_or_create_cart(user_id=user_id, session_id=session_id)
        cart.coupon_id = None
        cart.coupon_code = None
        cart.discount_amount = 0.0
        self.db.add(cart)
        await self.db.commit()

        updated_cart = await self.cart_repo.get_by_id(cart.id)
        return self._format_cart_response(updated_cart)

    def _format_cart_response(self, cart: Cart) -> CartResponse:
        items = []
        for it in cart.items:
            if it.is_active:
                item_name = it.menu_item.name if it.menu_item else "Item"
                item_img = it.menu_item.image_url if it.menu_item else None
                items.append(
                    CartItemResponse(
                        id=it.id,
                        menu_item_id=it.menu_item_id,
                        menu_item_name=item_name,
                        menu_item_image=item_img,
                        quantity=it.quantity,
                        unit_price=it.unit_price,
                        subtotal=it.subtotal,
                        notes=it.notes,
                        variant_selected=it.variant_selected,
                        add_ons_selected=it.add_ons_selected,
                        add_ons_total=it.add_ons_total
                    )
                )

        subtotal = sum(i.subtotal for i in items)
        tax = round(subtotal * 0.05, 2)  # 5% GST
        discount = cart.discount_amount or 0.0
        total = max(0.0, subtotal + tax - discount)

        return CartResponse(
            id=cart.id,
            session_id=cart.session_id,
            user_id=cart.user_id,
            items=items,
            subtotal=round(subtotal, 2),
            tax_amount=tax,
            discount_amount=round(discount, 2),
            total=round(total, 2),
            total_items=sum(i.quantity for i in items),
            coupon_code=cart.coupon_code,
            notes=cart.notes
        )
