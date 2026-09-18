import sqlite3
import httpx
from app.core.security import create_access_token

conn = sqlite3.connect("smartserve.db")
cursor = conn.cursor()
cursor.execute("SELECT id, email, role FROM users WHERE role='KITCHEN' LIMIT 1")
row = cursor.fetchone()
print("User:", row)

token = create_access_token(subject=str(row[0]), extra_claims={"role": row[2], "email": row[1]})

client = httpx.Client(base_url="http://127.0.0.1:8000")

with open(r"app\uploads\01a9424fe7204785b50e78272d4446cb.jpg", "rb") as f:
    real_jpg_bytes = f.read()

print("Read real image, bytes:", len(real_jpg_bytes))

# Test upload with 'file' field
files = {"file": ("sample_dish.jpg", real_jpg_bytes, "image/jpeg")}
res = client.post("/api/v1/kitchen/menu/upload-image", headers={"Authorization": f"Bearer {token}"}, files=files)
print("Upload status (file):", res.status_code)
print("Upload response (file):", res.text)
