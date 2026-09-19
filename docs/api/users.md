# Users API

> Endpoints for reading and editing user profiles. All require a valid JWT.

---

## GET /users/{id}

Fetch a public user profile by id.

### Request

**Headers**:
- `Authorization: Bearer <accessToken>` (required)

**Path parameters**:
| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | UUID | yes | The user's id |

### Response — `200 OK`

```json
{
  "id": "22222222-2222-2222-2222-222222222222",
  "email": "lan@nguyen-family.vn",
  "fullName": "Nguyễn Thị Lan",
  "avatarUrl": "https://i.pravatar.cc/300?u=lan",
  "phone": "0912345678",
  "bio": "Chuyên gia ẩm thực miền Bắc. Cháu nội cụ tổ Nguyễn Văn Hùng.",
  "emailVerified": true,
  "isActive": true,
  "lastLoginAt": "2026-09-19T01:23:00+07:00",
  "createdAt": "2024-01-01T00:00:00+07:00",
  "updatedAt": "2026-09-19T01:23:00+07:00"
}
```

### Errors

- `401 Unauthorized` — missing or invalid token
- `404 Not Found` — user id not present

### Example

```bash
curl http://localhost:8080/api/users/22222222-2222-2222-2222-222222222222 \
  -H "Authorization: Bearer <accessToken>"
```

### Notes

- The response never includes `password_hash` or other internal columns. The mapping is defined in `UserDto.fromEntity`.
- A user can always read their own record; reading someone else's profile is unrestricted in this project (no privacy toggle yet).

---

## PUT /users/me

Update the **currently authenticated** user's profile.

### Request

**Headers**:
- `Authorization: Bearer <accessToken>` (required)
- `Content-Type: application/json`

**Body** (all fields optional — only the ones you supply are updated):
```json
{
  "fullName": "Nguyễn Thị Lan (cập nhật)",
  "phone": "0912349999",
  "avatarUrl": "https://i.pravatar.cc/300?u=lan-v2",
  "bio": "Chuyên gia ẩm thực miền Bắc, đã cập nhật tiểu sử."
}
```

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `fullName` | string | no | max 255 chars |
| `phone` | string | no | max 32 chars |
| `avatarUrl` | string (URL) | no | – |
| `bio` | string | no | free text |

### Response — `200 OK`

The updated `UserDto` (same shape as `GET /auth/me`).

### Errors

- `400 Bad Request` — invalid URL, oversized fields
- `401 Unauthorized` — missing or invalid token

### Example

```bash
curl -X PUT http://localhost:8080/api/users/me \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "bio": "Đã cập nhật tiểu sử ngày 19/09/2026.",
    "phone": "0912349999"
  }'
```

### Notes

- Email, is_active, and email_verified are **not** editable through this endpoint.
- Avatar upload is delegated to the front-end (a public URL is expected here).

---

## GET /users/search

Full-text-ish search over users by name or email. Useful for the "invite member" picker.

### Request

**Headers**:
- `Authorization: Bearer <accessToken>` (required)

**Query parameters**:
| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `q` | string | yes | Search keyword (substring, case-insensitive) |

### Response — `200 OK`

```json
[
  {
    "id": "22222222-2222-2222-2222-222222222222",
    "email": "lan@nguyen-family.vn",
    "fullName": "Nguyễn Thị Lan",
    "avatarUrl": "https://i.pravatar.cc/300?u=lan",
    "isActive": true
  },
  {
    "id": "11111111-1111-1111-1111-111111111111",
    "email": "admin@nguyen-family.vn",
    "fullName": "Nguyễn Văn An",
    "avatarUrl": "https://i.pravatar.cc/300?u=an",
    "isActive": true
  }
]
```

### Errors

- `400 Bad Request` — missing `q` parameter
- `401 Unauthorized` — missing or invalid token

### Example

```bash
curl "http://localhost:8080/api/users/search?q=Nguyen" \
  -H "Authorization: Bearer <accessToken>"
```

### Notes

- Search is implemented with `ILIKE '%q%'` against `full_name` and `email`.
- Inactive users (`is_active = false`) are excluded.
- Results are capped (typically the first 50) — use pagination params in your UI if you need more.

---

## Typical flow

```bash
# 1. Login → get token
ACCESS=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nguyen-family.vn","password":"Password123!"}' \
  | jq -r '.accessToken')

# 2. Read self
curl http://localhost:8080/api/auth/me -H "Authorization: Bearer $ACCESS"

# 3. Update profile
curl -X PUT http://localhost:8080/api/users/me \
  -H "Authorization: Bearer $ACCESS" \
  -H "Content-Type: application/json" \
  -d '{"bio":"Updated via curl"}'

# 4. Search for other users
curl "http://localhost:8080/api/users/search?q=Lan" -H "Authorization: Bearer $ACCESS"
```