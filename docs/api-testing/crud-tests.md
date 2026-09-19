# CRUD Test Cases

> Generic CRUD test templates — apply them to **any** resource in CâyGiaPhảSố: users, families, members, recipes, stories, time capsules, events, albums, photos, chats, achievements, …

CRUD = **C**reate, **R**ead, **U**pdate, **D**elete. For each resource you should have at least these cases. The specific UUIDs and bodies below use **family** as the canonical example; substitute any resource.

---

## Create

### TC-CRUD-C1 — Create with valid data → 201

**Priority**: P0 · **Type**: Functional

**Preconditions**: Authenticated as `admin@nguyen-family.vn`.

**Steps**:
1. POST /api/families with `{"name":"Họ Test","foundedYear":2000,"motto":"Test"}`

**Expected**:
- 201 Created
- Body contains `family.id` (UUID), `family.name == "Họ Test"`, `family.createdBy == currentUserId`
- GET /api/families now includes the new family with `role == "ADMIN"`

---

### TC-CRUD-C2 — Create with missing required field → 400

**Priority**: P0 · **Type**: Validation

**Steps**:
1. POST /api/families with `{"foundedYear":2000}` (missing `name`)

**Expected**:
- 400 Bad Request
- Body contains `fieldErrors.name`

---

### TC-CRUD-C3 — Create with invalid type → 400

**Priority**: P1 · **Type**: Validation

**Steps**:
1. POST /api/families with `{"name":"X","foundedYear":"two-thousand"}`

**Expected**:
- 400 Bad Request
- Body contains a type-conversion error for `foundedYear`

---

### TC-CRUD-C4 — Create with oversized string → 400

**Priority**: P2 · **Type**: Validation

**Steps**:
1. POST /api/families with `{"name":"<a 10000-character string>"}`

**Expected**:
- 400 Bad Request
- Body contains `fieldErrors.name` mentioning max length (255)

---

### TC-CRUD-C5 — Create with duplicate unique field → 409

**Priority**: P1 · **Type**: Error

**Steps**:
1. POST /api/auth/register with `{"email":"admin@nguyen-family.vn",...}` (already exists)

**Expected**:
- 409 Conflict

---

### TC-CRUD-C6 — Create while unauthenticated → 401

**Priority**: P0 · **Type**: Security

**Steps**:
1. POST /api/families with no Authorization header

**Expected**:
- 401 Unauthorized

---

### TC-CRUD-C7 — Create while unauthorized → 403

**Priority**: P0 · **Type**: Security

**Steps**:
1. Login as user A, create family F (A is ADMIN)
2. Logout; login as user B
3. POST /api/families/{F.id}/generations with `{"generationNumber":99,...}` (B tries to add a generation to F)

**Expected**:
- 403 Forbidden (B is not a member of F, or not ADMIN)

---

## Read

### TC-CRUD-R1 — Read existing entity → 200

**Priority**: P0 · **Type**: Functional

**Steps**:
1. GET /api/families/aaaaaaaa-0000-0000-0000-000000000001

**Expected**:
- 200 OK
- Body contains `family.id == aaaaaaaa-...`, generations list, heritages list, stats

---

### TC-CRUD-R2 — Read non-existent entity → 404

**Priority**: P0 · **Type**: Error

**Steps**:
1. GET /api/families/00000000-0000-0000-0000-000000000000

**Expected**:
- 404 Not Found

---

### TC-CRUD-R3 — Read entity in another tenant → 403

**Priority**: P0 · **Type**: Security

**Steps**:
1. Login as `admin@nguyen-family.vn` (member of Họ Nguyễn)
2. GET /api/families/bbbbbbbb-0000-0000-0000-000000000002 (Họ Trần, not a member)

**Expected**:
- 403 Forbidden

---

### TC-CRUD-R4 — Read with malformed UUID → 400

**Priority**: P2 · **Type**: Validation

**Steps**:
1. GET /api/families/not-a-uuid

**Expected**:
- 400 Bad Request (path variable type mismatch)

---

### TC-CRUD-R5 — List with pagination

**Priority**: P1 · **Type**: Functional

**Steps**:
1. GET /api/families/{familyId}/recipes?page=0&size=5
2. GET /api/families/{familyId}/recipes?page=1&size=5

**Expected**:
- Step 1 returns at most 5 items, `page == 0`, `totalItems >= 5`
- Step 2 returns the next page (different items)
- No overlap between pages

---

### TC-CRUD-R6 — List with filter

**Priority**: P1 · **Type**: Functional

**Steps**:
1. GET /api/families/{familyId}/recipes?difficulty=EASY

**Expected**:
- All returned items have `difficulty == "EASY"`
- `totalItems` is the count of EASY recipes only

---

### TC-CRUD-R7 — Read with invalid auth token → 401

**Priority**: P0 · **Type**: Security

**Steps**:
1. GET /api/families/{familyId} with `Authorization: Bearer bad-token`

**Expected**:
- 401 Unauthorized

---

## Update

### TC-CRUD-U1 — Update with valid data → 200

**Priority**: P0 · **Type**: Functional

**Steps**:
1. PUT /api/families/{familyId} with `{"motto":"New motto"}`

**Expected**:
- 200 OK
- Body contains the updated `motto`
- A subsequent GET returns the updated value

---

### TC-CRUD-U2 — Update with no fields (empty body) → 400

**Priority**: P1 · **Type**: Validation

**Steps**:
1. PUT /api/families/{familyId} with `{}`

**Expected**:
- 400 Bad Request (no updatable fields provided), **or**
- 200 OK (no-op) — depends on server policy

---

### TC-CRUD-U3 — Update with unauthorized user → 403

**Priority**: P0 · **Type**: Security

**Steps**:
1. Login as ADMIN (user A), update a family
2. Login as user B (non-member)
3. PUT /api/families/{familyId} with `{"motto":"hacked"}`

**Expected**:
- 403 Forbidden
- The motto remains unchanged

---

### TC-CRUD-U4 — Update non-existent entity → 404

**Priority**: P1 · **Type**: Error

**Steps**:
1. PUT /api/families/00000000-0000-0000-0000-000000000000 with `{"motto":"X"}`

**Expected**:
- 404 Not Found

---

### TC-CRUD-U5 — Update with invalid data → 400

**Priority**: P1 · **Type**: Validation

**Steps**:
1. PUT /api/families/{familyId} with `{"foundedYear":-100}` or `{"motto":<too long>}`

**Expected**:
- 400 Bad Request

---

### TC-CRUD-U6 — PATCH-like partial update

**Priority**: P2 · **Type**: Functional

**Steps**:
1. PUT /api/families/{familyId} with `{"name":"Only this field"}`

**Expected**:
- 200 OK
- Only `name` changed; `description`, `motto`, etc. remain unchanged

---

## Delete

### TC-CRUD-D1 — Delete with valid user → 200

**Priority**: P0 · **Type**: Functional

**Steps**:
1. Login as ADMIN
2. Create a new family
3. DELETE /api/families/{familyId}
4. GET /api/families/{familyId}

**Expected**:
- 200 OK on DELETE
- Step 4 returns 404 Not Found

---

### TC-CRUD-D2 — Delete non-existent entity → 404

**Priority**: P1 · **Type**: Error

**Steps**:
1. DELETE /api/families/00000000-0000-0000-0000-000000000000

**Expected**:
- 404 Not Found

---

### TC-CRUD-D3 — Delete with unauthorized user → 403

**Priority**: P0 · **Type**: Security

**Steps**:
1. Login as ADMIN, create a family
2. Login as non-member
3. DELETE /api/families/{familyId}

**Expected**:
- 403 Forbidden
- The family is not deleted

---

### TC-CRUD-D4 — Delete with cascading effects

**Priority**: P0 · **Type**: Integration

**Steps**:
1. Login as ADMIN
2. Create a family, create a generation, create a member in that generation, create a relationship
3. DELETE /api/families/{familyId} (or DELETE /api/members/{memberId})

**Expected**:
- 200 OK on DELETE
- Dependent rows are deleted (cascade)
- No FK violation errors

> Note: the current schema cascades on most FKs. If you change the schema, update this test.

---

### TC-CRUD-D5 — Delete is idempotent

**Priority**: P2 · **Type**: Functional

**Steps**:
1. DELETE /api/families/{familyId} twice in a row

**Expected**:
- First call: 200 OK
- Second call: 404 Not Found

---

### TC-CRUD-D6 — Delete while logged out → 401

**Priority**: P0 · **Type**: Security

**Steps**:
1. DELETE /api/families/{familyId} with no Authorization header

**Expected**:
- 401 Unauthorized

---

## Resource-specific quick-reference

| Resource | Create | Read | Update | Delete | Special cases |
| --- | --- | --- | --- | --- | --- |
| Users | POST /auth/register | GET /users/{id}, GET /auth/me | PUT /users/me | (no delete endpoint) | Email uniqueness, password policy |
| Families | POST /families | GET /families, GET /families/{id} | PUT /families/{id} | (no delete endpoint in v1) | ADMIN-only updates |
| Members | POST /families/{id}/members | GET /members/{id} | PUT /members/{id} | DELETE /members/{id} | Cascade to relationships |
| Recipes | POST /families/{id}/recipes | GET /recipes/{id} | PUT /recipes/{id} | DELETE /recipes/{id} | **Genealogy edges**, ingredients/steps atomic |
| Stories | POST /families/{id}/stories | GET /stories/{id} | PUT /stories/{id} | DELETE /stories/{id} | Cascade to media, tag_map |
| Time Capsules | POST /families/{id}/time-capsules | GET /families/{id}/time-capsules (hides content) | (no update endpoint in v1) | DELETE /time-capsules/{id} | **POST /open returns content only if unlocked** |
| Events | POST /families/{id}/events | GET /families/{id}/events | PUT /events/{id} | DELETE /events/{id} | RSVP sub-flow |
| Albums | POST /families/{id}/albums | GET /albums/{id}/photos | (no update endpoint in v1) | (no delete endpoint in v1) | Photos are separate |
| Photos | POST /albums/{id}/photos | GET /albums/{id}/photos | (no update endpoint in v1) | (no delete endpoint in v1) | Tagged with member/event |
| Chats | POST /families/{id}/chats | GET /families/{id}/chats | (no update endpoint in v1) | (no delete endpoint in v1) | Member-scoped |
| Messages | POST /chats/{id}/messages | GET /chats/{id}/messages | (no update endpoint in v1) | (no delete endpoint in v1) | Threaded (parent_message_id) |
| Notifications | (auto-generated) | GET /notifications | POST /notifications/{id}/read | (no delete endpoint) | Mark all read |
| Achievements | POST /members/{id}/achievements | GET /achievements, GET /members/{id}/achievements | (no update endpoint in v1) | (no delete endpoint in v1) | Catalog is read-only |

---

## Idempotency matrix

| Endpoint | Idempotent? |
| --- | --- |
| POST /families | no (each call creates a new family) |
| GET /families/{id} | yes |
| PUT /families/{id} | yes (same input → same output) |
| DELETE /families/{id} | no-op on second call (returns 404) |
| POST /time-capsules/{id}/open | yes (returns same content on second call) |
| POST /recipes/{id}/reactions | no (toggles) |
| POST /recipes/{id}/comments | no (each call creates a new comment) |
| POST /notifications/read-all | yes (idempotent) |

---

## See also

- [`test-cases.md`](./test-cases.md) — concrete cases per endpoint
- [`authentication-tests.md`](./authentication-tests.md) — auth flow tests
- [`error-cases.md`](./error-cases.md) — full error-code matrix
- [`../api/README.md`](../api/README.md) — endpoint reference