import pytest
import io
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_image_upload_endpoint(client: AsyncClient):
    kitchen_signup = await client.post("/api/v1/auth/signup", json={
        "email": "kitchen_upload@smartserve.com",
        "password": "Password123!",
        "full_name": "Chef Upload",
        "role": "kitchen"
    })
    token = kitchen_signup.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create dummy image file
    file_bytes = b"fake image content"
    files = {"file": ("test_dish.jpg", io.BytesIO(file_bytes), "image/jpeg")}

    res = await client.post("/api/v1/media/upload", files=files, data={"folder": "dishes"}, headers=headers)
    assert res.status_code == 201
    data = res.json()
    assert "url" in data
    assert data["url"] != ""
