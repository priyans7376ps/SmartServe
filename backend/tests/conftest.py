import pytest
import asyncio
from typing import AsyncGenerator, Dict, Any
import uuid
from unittest.mock import MagicMock
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.deps import get_db

class FakeSession:
    _storage: Dict[str, Dict[str, Any]] = {}

    @classmethod
    def clear(cls):
        cls._storage.clear()

    async def commit(self):
        pass
    async def rollback(self):
        pass
    async def close(self):
        pass

    def add(self, obj):
        tbl = getattr(obj, "__tablename__", "users")
        if tbl not in FakeSession._storage:
            FakeSession._storage[tbl] = {}
        if hasattr(obj, 'id') and obj.id:
            FakeSession._storage[tbl][str(obj.id)] = obj
        if hasattr(obj, 'user_id') and obj.user_id:
            FakeSession._storage[tbl][str(obj.user_id)] = obj
        if hasattr(obj, 'session_id') and obj.session_id:
            FakeSession._storage[tbl][str(obj.session_id)] = obj
        if hasattr(obj, 'code') and obj.code:
            FakeSession._storage[tbl][str(obj.code)] = obj
        if hasattr(obj, 'order_number') and obj.order_number:
            FakeSession._storage[tbl][str(obj.order_number)] = obj
        if hasattr(obj, 'email') and obj.email:
            FakeSession._storage[tbl][str(obj.email)] = obj
        if hasattr(obj, 'slug') and obj.slug:
            FakeSession._storage[tbl][str(obj.slug)] = obj

    async def refresh(self, obj):
        pass

    async def execute(self, statement, *args, **kwargs):
        mock_result = MagicMock()
        str_stmt = str(statement).lower()
        
        # Determine target table
        tbl = "users"
        all_tables = [
            "restaurants", "tables", "categories", "menu_items", "users", "roles",
            "carts", "cart_items", "orders", "order_items", "coupons", "coupon_usages",
            "loyalty_points", "points_transactions", "notifications", "order_status_logs"
        ]
        for t in all_tables:
            if f"from {t}" in str_stmt or f"join {t}" in str_stmt or f"into {t}" in str_stmt:
                tbl = t
                break

        tbl_store = FakeSession._storage.get(tbl, {})
        candidates = list({id(o): o for o in tbl_store.values()}.values())
        matched = None
        has_where = hasattr(statement, "_where_criteria") and len(statement._where_criteria) > 0

        if has_where:
            for clause in statement._where_criteria:
                val = None
                try:
                    if hasattr(clause, "right"):
                        right = clause.right
                        if hasattr(right, "value"):
                            val = right.value
                        elif hasattr(right, "effective_value"):
                            val = right.effective_value

                    if val is not None:
                        sval = str(val)
                        if sval in tbl_store:
                            matched = tbl_store[sval]
                            break
                        for cand in candidates:
                            if (hasattr(cand, "id") and str(cand.id) == sval) or \
                               (hasattr(cand, "email") and cand.email == sval) or \
                               (hasattr(cand, "slug") and cand.slug == sval):
                                matched = cand
                                break
                        if matched:
                            break
                except Exception:
                    pass
        else:
            matched = candidates[-1] if candidates else None

        mock_result.scalars().first.return_value = matched
        mock_result.scalars().all.return_value = [matched] if (matched and has_where) else candidates
        mock_result.scalar.return_value = len(candidates)
        return mock_result

async def override_get_db() -> AsyncGenerator[FakeSession, None]:
    yield FakeSession()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
