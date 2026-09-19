# Error-Case Tests

> Coverage for every error code CâyGiaPhảSố returns. The right HTTP status with a clear message is a feature.

## Status-code matrix

| Endpoint class | 200 | 201 | 400 | 401 | 403 | 404 | 409 | 429 | 5xx |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `POST /auth/register` | – | ✓ | ✓ | – | – | – | ✓ (dup email) | ✓ | possible |
| `POST /auth/login` | ✓ | – | ✓ | ✓ | – | – | – | ✓ | possible |
| `POST /auth/refresh` | ✓ | – | ✓ | ✓ | – | – | – | – | possible |
| `POST /auth/logout` | ✓ | – | – | ✓ | – | – | – | – | possible |
| `GET /auth/me` | ✓ | – | – | ✓ | – | – | – | – | possible |
| `GET /users/{id}` | ✓ | – | – | ✓ | ✓ (other tenant) | ✓ | – | – | possible |
| `PUT /users/me` | ✓ | – | ✓ | ✓ | – | – | – | – | possible |
| `GET /users/search` | ✓ | – | ✓ (no q) | ✓ | – | – | – | – | possible |
| `POST /families` | – | ✓ | ✓ | ✓ | – | – | – | – | possible |
| `GET /families` | ✓ | – | – | ✓ | – | – | – | – | possible |
| `POST /families/join` | ✓ | – | ✓ | ✓ | – | ✓ (bad code) | ✓ (already member) | – | possible |
| `GET /families/{id}` | ✓ | – | – | ✓ | ✓ | ✓ | – | – | possible |
| `PUT /families/{id}` | ✓ | – | ✓ | ✓ | ✓ (not ADMIN) | ✓ | – | – | possible |
| `POST /families/{id}/generations` | – | ✓ | ✓ | ✓ | ✓ | ✓ | – | – | possible |
| `DELETE /generations/{id}` | ✓ | – | – | ✓ | ✓ | ✓ | – | – | possible |
| `GET /families/{id}/tree` ⭐ | ✓ | – | – | ✓ | ✓ | ✓ | – | – | possible |
| `POST /relationships` | – | ✓ | ✓ | ✓ | ✓ | ✓ | – | – | possible |
| `POST /recipes` | – | ✓ | ✓ | ✓ | ✓ | ✓ (member not in family) | – | – | possible |
| `GET /recipes/{id}` | ✓ | – | – | ✓ | ✓ | ✓ | – | – | possible |
| `GET /recipes/{id}/genealogy-tree` ⭐ | ✓ | – | – | ✓ | ✓ | ✓ | – | – | possible |
| `POST /time-capsules/{id}/open` ⭐ | ✓ | – | – | ✓ | **✓ (locked)** | ✓ | – | – | possible |
| `POST /notifications/read-all` | ✓ | – | – | ✓ | – | – | – | – | possible |

---

## 400 Bad Request — validation errors

### TC-ERR-400-1 — Missing required body field

**Endpoint**: any POST/PUT

**Steps**:
1. POST /api/auth/register with `{"password":"Password123!","fullName":"X"}` (missing `email`)

**Expected**:
- 400
- Body:
  ```json
  {
    "status": 400,
    "error": "Bad Request",
    "message": "Validation failed",
    "fieldErrors": {
      "email": "Email không được để trống"
    },
    "path": "/api/auth/register"
  }
  ```

---

### TC-ERR-400-2 — Multiple field errors at once

**Steps**:
1. POST /api/families with `{}`

**Expected**:
- 400
- `fieldErrors.name` describes the missing field
- No other `fieldErrors.*` are present (since only `name` is required)

---

### TC-ERR-400-3 — Invalid UUID in path

**Steps**:
1. GET /api/families/not-a-uuid

**Expected**:
- 400 Bad Request (path variable conversion failure)
- Body indicates the path variable that failed

---

### TC-ERR-400-4 — Invalid query parameter type

**Steps**:
1. GET /api/families/{id}/recipes?page=abc

**Expected**:
- 400 Bad Request
- Body indicates `page` must be an integer

---

### TC-ERR-400-5 — Past unlock_date on a time capsule

**Steps**:
1. POST /api/families/{id}/time-capsules with `unlockDate = "1990-01-01"`

**Expected**:
- 400 Bad Request
- Body mentions "ngày trong quá khứ" (past date) or similar

---

## 401 Unauthorized

### TC-ERR-401-1 — No Authorization header

See [`authentication-tests.md`](./authentication-tests.md) TC-AUTH-016.

### TC-ERR-401-2 — Expired JWT

See TC-AUTH-017.

### TC-ERR-401-3 — Wrong-signature JWT

See TC-AUTH-019.

---

## 403 Forbidden

### TC-ERR-403-1 — Non-member accessing a family

**Steps**:
1. Login as `admin@nguyen-family.vn`
2. GET /api/families/bbbbbbbb-0000-0000-0000-000000000002 (Họ Trần, not a member)

**Expected**:
- 403 Forbidden
- Body: `"message": "Bạn không phải thành viên của gia tộc này"`

---

### TC-ERR-403-2 — Non-ADMIN updating a family

See TC-CRUD-U3.

### TC-ERR-403-3 — Time Capsule locked ⭐ NOVEL

**Steps**:
1. Login
2. Create a time capsule with `unlockDate = 2099-01-01`
3. POST /api/time-capsules/{capsuleId}/open

**Expected**:
- 403 Forbidden
- Body: `"message": "Capsule đang bị khóa, chưa đến ngày mở"` (or similar)
- `content` is **not** included in the body

> This is the most important error case for the time-capsule feature. A test that misses it is a security bug.

---

### TC-ERR-403-4 — Updating a recipe authored by another user

**Steps**:
1. Login as user A, create a recipe
2. Login as user B
3. PUT /api/recipes/{recipeId}

**Expected**:
- 403 Forbidden (B is neither author nor ADMIN of the family)

---

### TC-ERR-403-5 — Awarding an achievement as non-ADMIN

**Steps**:
1. Login as user A, create a family
2. Login as user B (a regular member of the same family)
3. POST /api/members/{memberId}/achievements with `{"achievementId":"..."}`

**Expected**:
- 403 Forbidden

---

## 404 Not Found

### TC-ERR-404-1 — Non-existent UUID

**Steps**:
1. GET /api/families/00000000-0000-0000-0000-000000000000

**Expected**:
- 404 Not Found

---

### TC-ERR-404-2 — Resource exists but caller can't see it

In some endpoints (e.g. recipes), the server may return **404** rather than 403 to avoid leaking existence. Both are acceptable, but be consistent:

**Steps**:
1. Login as user A
2. GET /api/recipes/{some-recipe-not-in-A's-family}

**Expected**:
- 404 Not Found

---

### TC-ERR-404-3 — Soft-deleted resource

**Steps**:
1. DELETE /api/recipes/{recipeId}
2. GET /api/recipes/{recipeId}

**Expected**:
- 404 Not Found

---

### TC-ERR-404-4 — Invite code expired

**Steps**:
1. Create an invitation with `expiresInDays = 0` (or wait until expiry)
2. POST /api/families/join with the code

**Expected**:
- 404 Not Found (or 410 Gone, if implemented)

---

## 409 Conflict

### TC-ERR-409-1 — Duplicate email on register

See TC-AUTH-005.

### TC-ERR-409-2 — Duplicate achievement on same member

**Steps**:
1. POST /api/members/{memberId}/achievements with `{"achievementId":"..."}` twice

**Expected**:
- 1st call: 201 Created
- 2nd call: 409 Conflict
- Body: "Thành viên đã nhận thành tích này" (or similar)

---

### TC-ERR-409-3 — Joining a family the user already belongs to

**Steps**:
1. Login as user A, member of family F
2. Have ADMIN issue a new invite code
3. POST /api/families/join with the code

**Expected**:
- 409 Conflict

---

## 429 Too Many Requests

### TC-ERR-429-1 — Login throttling

See TC-AUTH-009.

### TC-ERR-429-2 — Register throttling

**Steps**:
1. POST /api/auth/register 6 times within a minute

**Expected**:
- After N (default ~5) calls, subsequent ones return 429

---

## 500 Internal Server Error

> Most 500s are bugs — write a test for any you find in the wild so we don't regress.

### TC-ERR-500-1 — FK violation when deleting

If you delete a parent that should cascade but doesn't (because of a missing FK ON DELETE CASCADE), the server returns 500.

**Steps**:
1. Identify a parent entity whose children lack an `ON DELETE CASCADE` clause
2. Try to delete the parent

**Expected**:
- Either the FK cascades (no error) **or** the server returns a clean 4xx (e.g. 409 with a clear message)
- A 500 is a bug — file a defect

---

### TC-ERR-500-2 — Unhandled NPE / RuntimeException

Catch-all for unhandled exceptions in production code.

**Expected**:
- 500 Internal Server Error
- Body has `"message"` (Vietnamese) but **never** leaks a stack trace

---

## Defect template

When you find an error-case bug, file it with this template:

```markdown
## BUG-{N}: {Title}

**Severity**: P0 / P1 / P2
**Endpoint**: METHOD /api/path
**Preconditions**: {user role, seed state, etc.}

**Steps to reproduce**:
1. ...
2. ...

**Expected**: { status, body }
**Actual**: { status, body }

**Logs**:
```
{stack trace from the backend log}
```

**Suggested fix**: {link to source file or describe}
```

---

## Smoke-test script

A one-shot bash script that walks the major error paths:

```bash
#!/usr/bin/env bash
set -e
BASE=http://localhost:8080/api
fail=0

assert_status() {
  local want="$1" got="$2" name="$3"
  if [ "$got" = "$want" ]; then
    echo "PASS  $name ($got)"
  else
    echo "FAIL  $name (want $want, got $got)"
    fail=$((fail+1))
  fi
}

# 401: no JWT
got=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/auth/me")
assert_status 401 "$got" "401 no JWT"

# 400: missing email on login
got=$(curl -s -o /dev/null -w '%{http_code}' -X POST -H 'Content-Type: application/json' \
  -d '{"password":"Password123!"}' "$BASE/auth/login")
assert_status 400 "$got" "400 missing email"

# 401: wrong password
got=$(curl -s -o /dev/null -w '%{http_code}' -X POST -H 'Content-Type: application/json' \
  -d '{"email":"admin@nguyen-family.vn","password":"WRONG"}' "$BASE/auth/login")
assert_status 401 "$got" "401 wrong password"

# 200: register a fresh user
got=$(curl -s -o /dev/null -w '%{http_code}' -X POST -H 'Content-Type: application/json' \
  -d "{\"email\":\"smoke-$(date +%s)@example.com\",\"password\":\"Password123!\",\"fullName\":\"Smoke\"}" \
  "$BASE/auth/register")
assert_status 201 "$got" "201 register"

# 200: public recipes
got=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/recipes/public")
assert_status 200 "$got" "200 public recipes"

if [ $fail -gt 0 ]; then
  echo
  echo "$fail check(s) failed."
  exit 1
fi
echo "All smoke checks passed."
```

Run after every backend deploy.

---

## See also

- [`test-cases.md`](./test-cases.md) — happy-path tests
- [`authentication-tests.md`](./authentication-tests.md) — JWT-specific tests
- [`crud-tests.md`](./crud-tests.md) — CRUD templates
- [`../api/time-capsules.md`](../api/time-capsules.md) — the locked-capsule error case