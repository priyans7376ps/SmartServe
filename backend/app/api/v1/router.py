from fastapi import APIRouter
from app.api.auth.router import router as auth_router
from app.api.admin.router import router as admin_router
from app.api.kitchen.router import router as kitchen_router
from app.api.customer.router import router as customer_router
from app.api.restaurants.router import router as restaurants_router
from app.api.tables.router import router as tables_router
from app.api.category.router import router as category_router
from app.api.menu.router import router as menu_router
from app.api.media.router import router as media_router

api_v1_router = APIRouter()
api_v1_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_v1_router.include_router(admin_router, prefix="/admin", tags=["Admin Portal"])
api_v1_router.include_router(kitchen_router, prefix="/kitchen", tags=["Kitchen Portal"])
api_v1_router.include_router(customer_router, prefix="/customer", tags=["Customer Portal"])

# Core Restaurant APIs
api_v1_router.include_router(restaurants_router, prefix="/restaurants", tags=["Restaurant Management"])
api_v1_router.include_router(tables_router, prefix="/tables", tags=["Table Management"])
api_v1_router.include_router(category_router, prefix="/categories", tags=["Categories"])
api_v1_router.include_router(menu_router, prefix="/menu", tags=["Menu Management"])
api_v1_router.include_router(media_router, prefix="/media", tags=["Media Uploads"])
