# Authentication Tests

> Detailed test cases for the authentication flow: register, login, refresh, logout, JWT validation.

The auth layer is the gatekeeper for the rest of the API — these tests must pass before anything else matters.

---

## TC-AUTH-001 — Successful registration

**Priority**: P0 · **Type**: Functional

**Preconditions**: Email not previously registered.

**Steps**:
1. POST /api/auth/register with `{"email":"new.user@example.com","password":"Password123!","fullName":"Người Mới","phone":"0900000000"}`

**Expected**:
- 201 Created
- Body: `{ user: {...}, accessToken: <JWT>, refreshToken: <UUID>, tokenType: "Bearer", expiresIn: 604800000 }`
- `accessToken` parses as a JWT (3 dot-separated base64 segments)
- `user.email == "new.user@example.com"`, `user.isActive == true`, `user.emailVerified == false`

---

## TC-AUTH-002 — Registration with missing email → 400

**Priority**: P0 · **Type**: Validation

**Steps**:
1. POST /api/auth/register with `{"password":"Password123!","fullName":"X"}`

**Expected**:
- 400 Bad Request
- Body contains `fieldErrors.email` describing the issue

---

## TC-AUTH-003 — Registration with malformed email → 400

**Priority**: P1 · **Type**: Validation

**Steps**:
1. POST /api/auth/register with `{"email":"not-an-email","password":"Password123!","fullName":"X"}`

**Expected**:
- 400 Bad Request
- `fieldErrors.email` mentions "không hợp lệ"

---

## TC-AUTH-004 — Registration with weak password → 400

**Priority**: P0 · **Type**: Validation

**Steps**:
1. POST /api/auth/register with `{"email":"u@example.com","password":"short","fullName":"X"}`

**Expected**:
- 400 Bad Request
- `fieldErrors.password` mentions "ít nhất 8 ký tự"

---

## TC-AUTH-005 — Duplicate email registration → 409

**Priority**: P0 · **Type**: Error

**Steps**:
1. POST /api/auth/register with `{"email":"admin@nguyen-family.vn","password":"Password123!","fullName":"X"}`

**Expected**:
- 409 Conflict
- Body message indicates the email is already in use

---

## TC-AUTH-006 — Successful login

**Priority**: P0 · **Type**: Functional

**Preconditions**: `admin@nguyen-family.vn` exists in seed.

**Steps**:
1. POST /api/auth/login with `{"email":"admin@nguyen-family.vn","password":"Password123!"}`

**Expected**:
- 200 OK
- Body returns valid `accessToken` and `refreshToken`
- `user.lastLoginAt` is updated to "now"

---

## TC-AUTH-007 — Login with wrong password → 401

**Priority**: P0 · **Type**: Security

**Steps**:
1. POST /api/auth/login with `{"email":"admin@nguyen-family.vn","password":"WRONG"}`

**Expected**:
- 401 Unauthorized
- Body message: "Email hoặc mật khẩu không chính xác"

---

## TC-AUTH-008 — Login with non-existent email → 401

**Priority**: P0 · **Type**: Security

**Steps**:
1. POST /api/auth/login with `{"email":"nobody@example.com","password":"Password123!"}`

**Expected**:
- 401 Unauthorized
- Same error message as wrong-password (no email enumeration leak)

---

## TC-AUTH-009 — Login rate-limited after N failures → 429

**Priority**: P1 · **Type**: Security

**Steps**:
1. POST /api/auth/login 12 times in quick succession with a wrong password from the same IP

**Expected**:
- 11th or so request returns 429 Too Many Requests
- Body message indicates throttling
- Wait for the cooldown window; retry should succeed (with the correct password)

---

## TC-AUTH-010 — Refresh with valid token

**Priority**: P0 · **Type**: Functional

**Steps**:
1. POST /api/auth/login → capture `refreshToken1`
2. POST /api/auth/refresh with `{"refreshToken":"refreshToken1"}` → capture `refreshToken2` and `accessToken2`

**Expected**:
- Both calls return 200
- `refreshToken1 !== refreshToken2`
- `accessToken2` is a valid JWT

---

## TC-AUTH-011 — Refresh with old (rotated) token → 401

**Priority**: P0 · **Type**: Security

**Steps**:
1. POST /api/auth/login → capture `refreshToken1`
2. POST /api/auth/refresh with `refreshToken1` → capture `refreshToken2`
3. POST /api/auth/refresh with `refreshToken1` (the rotated-out one)

**Expected**:
- Step 3 returns 401 Unauthorized
- The error message indicates "invalid" or "expired"

---

## TC-AUTH-012 — Refresh with garbage token → 401

**Priority**: P1 · **Type**: Security

**Steps**:
1. POST /api/auth/refresh with `{"refreshToken":"not-a-uuid"}`

**Expected**:
- 400 Bad Request (validation), or
- 401 Unauthorized if the server is lenient on format

---

## TC-AUTH-013 — Logout

**Priority**: P1 · **Type**: Functional

**Steps**:
1. POST /api/auth/login → capture `refreshToken`
2. POST /api/auth/logout with `{"refreshToken":"<refreshToken>"}`
3. POST /api/auth/refresh with the same `refreshToken`

**Expected**:
- Step 2 returns 200 OK with `{"message":"Đăng xuất thành công"}`
- Step 3 returns 401 Unauthorized (refresh token was revoked)

---

## TC-AUTH-014 — Logout without refreshToken in body

**Priority**: P2 · **Type**: Functional

**Steps**:
1. POST /api/auth/login
2. POST /api/auth/logout with `{}` (empty body or no body)

**Expected**:
- 200 OK
- The current access token may still be valid until it expires (only the refresh token is revoked)

---

## TC-AUTH-015 — Access protected endpoint with valid JWT

**Priority**: P0 · **Type**: Functional

**Steps**:
1. POST /api/auth/login → capture `accessToken`
2. GET /api/auth/me with `Authorization: Bearer <accessToken>`

**Expected**:
- 200 OK
- Returns the user matching the token's `sub` claim

---

## TC-AUTH-016 — Access protected endpoint without JWT → 401

**Priority**: P0 · **Type**: Security

**Steps**:
1. GET /api/auth/me (no Authorization header)

**Expected**:
- 401 Unauthorized

---

## TC-AUTH-017 — Access protected endpoint with expired JWT → 401

**Priority**: P0 · **Type**: Security

**Setup**: Either set `JWT_EXPIRATION=1000` (1 second) and login, then wait 2 seconds; **or** generate an obviously-expired token by hand with the same secret.

**Steps**:
1. Login → capture access token
2. Wait for the token to expire
3. GET /api/auth/me with `Authorization: Bearer <expired-token>`

**Expected**:
- 401 Unauthorized
- Error message: token expired

---

## TC-AUTH-018 — Access protected endpoint with malformed JWT → 401

**Priority**: P0 · **Type**: Security

**Steps**:
1. GET /api/auth/me with `Authorization: Bearer abc.def.ghi`

**Expected**:
- 401 Unauthorized

---

## TC-AUTH-019 — Access protected endpoint with wrong-signature JWT → 401

**Priority**: P1 · **Type**: Security

**Setup**: Hand-craft a JWT signed with a different secret.

**Steps**:
1. GET /api/auth/me with the forged token

**Expected**:
- 401 Unauthorized
- No information leak about why (signature mismatch vs. expired vs. malformed)

---

## TC-AUTH-020 — Tampered JWT (changed payload) → 401

**Priority**: P1 · **Type**: Security

**Setup**: Decode a real JWT, change `userId` in the payload, re-encode (without re-signing).

**Steps**:
1. GET /api/auth/me with the tampered token

**Expected**:
- 401 Unauthorized
- The server detects the invalid signature

---

## TC-AUTH-021 — Access /api/auth/me with a JWT whose `sub` doesn't exist

**Priority**: P1 · **Type**: Error

**Setup**: Forge a JWT signed with the right secret whose `sub` is a random UUID.

**Steps**:
1. GET /api/auth/me with the forged token

**Expected**:
- 401 Unauthorized (server can't resolve the user)

---

## TC-AUTH-022 — Cross-tab logout

**Priority**: P2 · **Type**: Integration

**Steps**:
1. Login from "Tab A" → tokenA, refreshA
2. Refresh from "Tab A" → tokenB, refreshB (rotates)
3. Try to use refreshA from "Tab B"

**Expected**:
- Tab B gets 401 (rotation invalidates the older refresh token)

---

## Automation snippet (Postman test)

```js
// In the Login request's "Tests" tab:
if (pm.response.code === 200) {
    const body = pm.response.json();
    pm.collectionVariables.set('accessToken', body.accessToken);
    pm.collectionVariables.set('refreshToken', body.refreshToken);

    pm.test('accessToken is JWT', () => {
        pm.expect(body.accessToken.split('.').length).to.eql(3);
    });
    pm.test('refreshToken is UUID', () => {
        pm.expect(body.refreshToken).to.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });
    pm.test('user is active', () => {
        pm.expect(body.user.isActive).to.eql(true);
    });
}
```

---

## Checklist

| # | Test | P0 | P1 | P2 |
| --- | --- | --- | --- | --- |
| 001 | Successful registration | ✓ | | |
| 002 | Missing email | ✓ | | |
| 003 | Malformed email | | ✓ | |
| 004 | Weak password | ✓ | | |
| 005 | Duplicate email | ✓ | | |
| 006 | Successful login | ✓ | | |
| 007 | Wrong password | ✓ | | |
| 008 | Non-existent email | ✓ | | |
| 009 | Rate limiting | | ✓ | |
| 010 | Refresh success | ✓ | | |
| 011 | Refresh with rotated-out token | ✓ | | |
| 012 | Refresh with garbage token | | ✓ | |
| 013 | Logout | | ✓ | |
| 014 | Logout without body | | | ✓ |
| 015 | Valid JWT works | ✓ | | |
| 016 | No JWT → 401 | ✓ | | |
| 017 | Expired JWT → 401 | ✓ | | |
| 018 | Malformed JWT → 401 | ✓ | | |
| 019 | Wrong-signature JWT → 401 | | ✓ | |
| 020 | Tampered JWT → 401 | | ✓ | |
| 021 | JWT with non-existent user | | ✓ | |
| 022 | Cross-tab rotation | | | ✓ |

---

## See also

- [`../api/authentication.md`](../api/authentication.md) — endpoint reference
- [`error-cases.md`](./error-cases.md) — full HTTP error matrix
- [`../postman/README.md`](../postman/README.md) — Postman collection setup