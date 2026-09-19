# Authentication API

> All authentication endpoints live under `/api/auth`. The `register`, `login`, and `refresh` endpoints are public; `logout` and `me` require a JWT.

CâyGiaPhảSố uses a JWT access-token + opaque refresh-token pair:

- **Access token** — JWT signed with `JWT_SECRET`, valid for 7 days by default (`JWT_EXPIRATION=604_800_000` ms). Send it as `Authorization: Bearer <token>` on every authenticated request.
- **Refresh token** — opaque UUID stored server-side. Use it to obtain a new access token without re-entering the password. Send as plain string in the body of `POST /auth/refresh`.

---

## POST /auth/register

Create a new user account and immediately log them in (returns the same payload as `login`).

### Request

**Headers**:
- `Content-Type: application/json`

**Body**:
```json
{
  "email": "new.user@example.com",
  "password": "Password123!",
  "fullName": "Nguyen Van Moi",
  "phone": "0912345678"
}
```

| Field | Type | Required | Validation |
| --- | --- | --- | --- |
| `email` | string | yes | RFC 5322 email |
| `password` | string | yes | 8-128 chars |
| `fullName` | string | yes | max 255 chars |
| `phone` | string | no | max 32 chars |

### Response — `201 Created`

```json
{
  "user": {
    "id": "99999999-9999-9999-9999-999999999999",
    "email": "new.user@example.com",
    "fullName": "Nguyen Van Moi",
    "avatarUrl": null,
    "phone": "0912345678",
    "bio": null,
    "emailVerified": false,
    "isActive": true,
    "createdAt": "2026-09-19T03:14:15Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "9f8e7d6c-5b4a-3210-fedc-ba9876543210",
  "tokenType": "Bearer",
  "expiresIn": 604800000
}
```

### Errors

- `400 Bad Request` — validation error (missing email/password, weak password, etc.)
- `409 Conflict` — email already registered
- `429 Too Many Requests` — registration throttling

### Example

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "new.user@example.com",
    "password": "Password123!",
    "fullName": "Nguyen Van Moi",
    "phone": "0912345678"
  }'
```

### Notes

- The newly-created user is **not** a member of any family yet. Call `POST /api/families` to create a family, or `POST /api/families/join` with an invite code.
- The default password policy is enforced at validation time (>= 8 chars).
- `bcrypt` is used for hashing; the hash is stored in `users.password_hash`.

---

## POST /auth/login

Exchange email/password for JWT tokens.

### Request

**Headers**:
- `Content-Type: application/json`

**Body**:
```json
{
  "email": "admin@nguyen-family.vn",
  "password": "Password123!"
}
```

| Field | Type | Required | Validation |
| --- | --- | --- | --- |
| `email` | string | yes | non-blank, valid email |
| `password` | string | yes | non-blank |

### Response — `200 OK`

Same shape as `/register` — see above. `lastLoginAt` on the user is updated server-side.

### Errors

- `400 Bad Request` — validation error
- `401 Unauthorized` — wrong email or password
- `429 Too Many Requests` — login throttling (10 attempts / 15 minutes by default)

### Example

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nguyen-family.vn","password":"Password123!"}'
```

### Notes

- The returned `accessToken` is the JWT to send in `Authorization: Bearer <token>` on every subsequent call.
- The returned `refreshToken` is opaque (UUID) and must be sent as a plain string in `POST /auth/refresh`.
- All seed accounts use the password `Password123!`. They live in `caygiaphaso.users`.

---

## POST /auth/refresh

Exchange a valid refresh token for a new access token (and rotate the refresh token).

### Request

**Headers**:
- `Content-Type: application/json`

**Body**:
```json
{
  "refreshToken": "9f8e7d6c-5b4a-3210-fedc-ba9876543210"
}
```

| Field | Type | Required | Validation |
| --- | --- | --- | --- |
| `refreshToken` | string (UUID) | yes | non-blank |

### Response — `200 OK`

Same shape as `/login`. A **new** access token and a **new** refresh token are returned. The old refresh token is invalidated.

### Errors

- `400 Bad Request` — missing or malformed refresh token
- `401 Unauthorized` — refresh token not found, expired, revoked, or already used

### Example

```bash
curl -X POST http://localhost:8080/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"9f8e7d6c-5b4a-3210-fedc-ba9876543210"}'
```

### Notes

- Refresh tokens are stored in `caygiaphaso.refresh_tokens` with `expires_at` and `revoked_at` columns.
- Calling `/refresh` rotates the token — the previous refresh token cannot be reused after rotation.

---

## POST /auth/logout

Invalidate the supplied refresh token and clear any server-side session state for the current user.

### Request

**Headers**:
- `Authorization: Bearer <accessToken>` (required)
- `Content-Type: application/json`

**Body** (optional — if omitted, the server logs out the user without revoking a specific token):
```json
{
  "refreshToken": "9f8e7d6c-5b4a-3210-fedc-ba9876543210"
}
```

### Response — `200 OK`

```json
{
  "message": "Đăng xuất thành công"
}
```

### Errors

- `401 Unauthorized` — missing or invalid access token

### Example

```bash
curl -X POST http://localhost:8080/api/auth/logout \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"9f8e7d6c-5b4a-3210-fedc-ba9876543210"}'
```

### Notes

- The current access token remains valid until it expires — logout only revokes the refresh token. Discard the access token client-side.
- Subsequent calls with the revoked refresh token will return `401`.

---

## GET /auth/me

Return the currently authenticated user.

### Request

**Headers**:
- `Authorization: Bearer <accessToken>` (required)

### Response — `200 OK`

```json
{
  "id": "11111111-1111-1111-1111-111111111111",
  "email": "admin@nguyen-family.vn",
  "fullName": "Nguyễn Văn An",
  "avatarUrl": "https://i.pravatar.cc/300?u=an",
  "phone": "0901234567",
  "bio": "Trưởng họ Nguyễn, đời thứ 5. Yêu thích nấu ăn truyền thống và lịch sử dòng tộc.",
  "emailVerified": true,
  "isActive": true,
  "lastLoginAt": "2026-09-19T03:00:00+07:00",
  "createdAt": "2024-01-01T00:00:00+07:00",
  "updatedAt": "2026-09-19T03:00:00+07:00"
}
```

### Errors

- `401 Unauthorized` — missing or invalid access token

### Example

```bash
curl http://localhost:8080/api/auth/me \
  -H "Authorization: Bearer <accessToken>"
```

### Notes

- This endpoint is the canonical "am I logged in?" probe.
- It is used by the frontend's `useCurrentUser` hook to seed the React Query cache on app start.

---

## Sample Postman sequence

1. `POST /auth/login` with seed credentials → capture `accessToken` into the environment variable.
2. `GET /auth/me` to verify the token works.
3. `POST /auth/refresh` with the old `refreshToken` to demonstrate rotation.
4. `POST /auth/logout` with the old `refreshToken` to invalidate it; subsequent `POST /auth/refresh` should fail with `401`.

See [../postman/README.md](../postman/README.md) for the importable collection.