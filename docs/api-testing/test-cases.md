# Sample Test Cases

> A representative subset of test cases covering each major endpoint. Use them as templates — copy and adapt for new endpoints.

Conventions:

- **Priority**: P0 (must-pass, blocks release) / P1 (should-pass) / P2 (nice-to-have) / P3 (exploratory)
- **Type**: Functional / Validation / Error / Security / Integration / Performance

---

## TC-AUTH-001 — Login with valid credentials

**Module**: Auth
**Priority**: P0
**Type**: Functional

**Preconditions**:
- DB seeded; `admin@nguyen-family.vn` exists.

**Steps**:
1. POST /api/auth/login with `{"email":"admin@nguyen-family.vn","password":"Password123!"}`

**Expected**:
- 200 OK
- Body contains `accessToken` (JWT, three dot-separated parts), `refreshToken` (UUID), `tokenType: "Bearer"`, `expiresIn: 604800000`
- `user.email == "admin@nguyen-family.vn"`, `user.emailVerified == true`, `user.isActive == true`

**Notes**: The returned `accessToken` must be usable for `GET /api/auth/me`.

---

## TC-AUTH-002 — Login with wrong password

**Module**: Auth
**Priority**: P0
**Type**: Error / Security

**Steps**:
1. POST /api/auth/login with `{"email":"admin@nguyen-family.vn","password":"wrong"}`

**Expected**:
- 401 Unauthorized
- Body message: "Email hoặc mật khẩu không chính xác" (or similar Vietnamese text)

---

## TC-AUTH-003 — Register with duplicate email

**Module**: Auth
**Priority**: P1
**Type**: Error

**Steps**:
1. POST /api/auth/register with an already-registered email

**Expected**:
- 409 Conflict
- Body message: "Email đã được sử dụng" (or similar)

---

## TC-AUTH-004 — Refresh with valid token

**Module**: Auth
**Priority**: P1
**Type**: Functional

**Steps**:
1. POST /api/auth/login (capture `refreshToken1`)
2. POST /api/auth/refresh with `refreshToken1` (capture `refreshToken2`)

**Expected**:
- Both calls return 200 with a fresh access token
- `refreshToken1 !== refreshToken2` (rotation)
- A subsequent call to /refresh with `refreshToken1` returns 401

---

## TC-AUTH-005 — Access without JWT

**Module**: Auth
**Priority**: P0
**Type**: Security

**Steps**:
1. GET /api/auth/me with no Authorization header

**Expected**:
- 401 Unauthorized
- No body content leaks

---

## TC-AUTH-006 — Access with malformed JWT

**Module**: Auth
**Priority**: P1
**Type**: Security

**Steps**:
1. GET /api/auth/me with `Authorization: Bearer not-a-jwt`

**Expected**:
- 401 Unauthorized
- Body message indicates "invalid token"

---

## TC-USER-001 — Update profile with valid data

**Module**: Users
**Priority**: P1
**Type**: Functional

**Steps**:
1. Login as `lan@nguyen-family.vn`
2. PUT /api/users/me with `{"bio":"Cập nhật tiểu sử"}`
3. GET /api/auth/me

**Expected**:
- 200 OK on PUT
- Step 3 returns the updated `bio`

---

## TC-USER-002 — Search by name substring

**Module**: Users
**Priority**: P2
**Type**: Functional

**Steps**:
1. Login
2. GET /api/users/search?q=Nguyễn

**Expected**:
- 200 OK
- Array of users whose `fullName` contains "Nguyễn" (case-insensitive)
- The current user is included in the results

---

## TC-FAMILY-001 — Create family and become ADMIN

**Module**: Families
**Priority**: P0
**Type**: Functional

**Steps**:
1. Login
2. POST /api/families with `{"name":"Họ Test","foundedYear":2000}`
3. GET /api/families

**Expected**:
- 201 Created on step 2 with the new family object
- Step 3 returns at least one family, and the new family's `role == "ADMIN"`

---

## TC-FAMILY-002 — Update family as non-admin → 403

**Module**: Families
**Priority**: P0
**Type**: Security

**Steps**:
1. Login as user A, create a family F (A is ADMIN)
2. Logout; login as user B (a different seed user)
3. PUT /api/families/{F.id} with `{"motto":"hacked"}`

**Expected**:
- 403 Forbidden
- The motto is unchanged

---

## TC-FAMILY-003 — Get family tree returns nested structure

**Module**: Families
**Priority**: P0
**Type**: Functional (⭐ NOVEL)

**Steps**:
1. Login as `admin@nguyen-family.vn`
2. GET /api/families/aaaaaaaa-0000-0000-0000-000000000001/tree

**Expected**:
- 200 OK
- Body has 5 generations (Họ Nguyễn seed)
- Each generation has ≥1 member
- The deepest member has a `children` array with at least one entry
- The totalMembers matches the count of `family_members` rows for this family

---

## TC-MEMBER-001 — Create member with valid data

**Module**: Members
**Priority**: P1
**Type**: Functional

**Steps**:
1. Login as `admin@nguyen-family.vn`
2. POST /api/families/{familyId}/members with `{"fullName":"Người Test","gender":"MALE","generationId":"aaaa1111-0000-0000-0000-000000000005"}`

**Expected**:
- 201 Created
- Body contains `member.id` (UUID), `member.familyId == {familyId}`

---

## TC-MEMBER-002 — Create member with missing required field → 400

**Module**: Members
**Priority**: P1
**Type**: Validation

**Steps**:
1. Login
2. POST /api/families/{familyId}/members with `{"fullName":"X"}` (missing `gender`, `generationId`)

**Expected**:
- 400 Bad Request
- Body contains field-level errors for `gender` and `generationId`

---

## TC-MEMBER-003 — Delete member cascades to relationships

**Module**: Members
**Priority**: P2
**Type**: Integration

**Steps**:
1. Create member M and a relationship R involving M
2. DELETE /api/members/{M.id}
3. GET the relationships list (or fetch a member that referenced M)

**Expected**:
- 200 on DELETE
- The relationship R is gone (cascade)

---

## TC-RECIPE-001 — Create recipe with ingredients, steps, origins (atomic)

**Module**: Recipes (⭐ NOVEL)
**Priority**: P0
**Type**: Integration

**Steps**:
1. Login
2. POST /api/families/{familyId}/recipes with title, ingredients, steps, origins
3. GET /api/recipes/{recipeId}

**Expected**:
- 201 Created on step 2
- Step 3 returns the recipe with `ingredients.length == N`, `steps.length == M`, `origins.length == K`
- All origins reference members of the same family

---

## TC-RECIPE-002 — Recipe genealogy tree

**Module**: Recipes (⭐ NOVEL)
**Priority**: P0
**Type**: Functional

**Steps**:
1. Login
2. GET /api/recipes/aaaa2222-0000-0000-0000-000000000001/genealogy-tree

**Expected**:
- 200 OK
- `tree.member.fullName == "Nguyễn Văn Hùng"` (root of Bánh chưng)
- `tree.children` is non-empty
- `totalGenerations >= 2`

---

## TC-RECIPE-003 — Add reaction toggles

**Module**: Recipes
**Priority**: P2
**Type**: Functional

**Steps**:
1. Login
2. POST /api/recipes/{recipeId}/reactions with `{"reactionType":"LOVE"}`
3. POST again with `{"reactionType":"YUM"}`
4. DELETE /api/recipes/{recipeId}/reactions
5. GET /api/recipes/{recipeId}/reactions

**Expected**:
- Step 2 returns reaction counts with `love` increased
- Step 3 returns counts with `love` decreased and `yum` increased
- Step 4 returns 200 OK
- Step 5 returns counts with the current user's reaction absent

---

## TC-RECIPE-004 — Public recipe search

**Module**: Recipes
**Priority**: P2
**Type**: Functional

**Steps**:
1. GET /api/recipes/public?cuisine=Miền%20Bắc (no auth)

**Expected**:
- 200 OK
- Returns only recipes where `isPublic == true`

---

## TC-STORY-001 — Create story with tags and media

**Module**: Stories
**Priority**: P2
**Type**: Functional

**Steps**:
1. Login
2. POST /api/families/{familyId}/stories with title, content, tagIds, media

**Expected**:
- 201 Created
- Body contains tags and media arrays populated

---

## TC-TC-001 — Time capsule is locked until unlock_date

**Module**: Time Capsules (⭐ NOVEL)
**Priority**: P0
**Type**: Security

**Steps**:
1. Login as `admin@nguyen-family.vn`
2. Create a capsule with `unlockDate = 2099-01-01`
3. POST /api/time-capsules/{capsuleId}/open

**Expected**:
- 201 on create
- 403 Forbidden on open (capsule is locked)
- Error message contains "locked" / "chưa mở khóa"

---

## TC-TC-002 — Open unlocked capsule returns content

**Module**: Time Capsules
**Priority**: P0
**Type**: Functional

**Steps**:
1. Login as `minh@nguyen-family.vn` (already opened the first capsule in seed)
2. GET /api/families/{familyId}/time-capsules → capture id of an OPENED capsule
3. POST /api/time-capsules/{capsuleId}/open

**Expected**:
- 200 OK
- Body contains `content` (non-null, the actual message)
- `isOpened == true`, `openedAt` and `openedBy` set

---

## TC-EVENT-001 — RSVP to event

**Module**: Events
**Priority**: P2
**Type**: Functional

**Steps**:
1. Login
2. POST /api/events/{eventId}/rsvp with `{"responses":[{"memberId":"...","rsvpStatus":"GOING"}]}`

**Expected**:
- 200 OK
- Response body has `summary.going >= 1`

---

## TC-CHAT-001 — Send a message

**Module**: Chat
**Priority**: P2
**Type**: Functional

**Steps**:
1. Login
2. POST /api/chats/{chatId}/messages with `{"content":"Hello"}`
3. GET /api/chats/{chatId}/messages

**Expected**:
- 201 on POST
- The new message appears at the top of the list

---

## TC-NOTIF-001 — Mark all as read

**Module**: Notifications
**Priority**: P2
**Type**: Functional

**Steps**:
1. Login (any user with notifications)
2. GET /api/notifications?unreadOnly=true → record `unreadCount`
3. POST /api/notifications/read-all
4. GET /api/notifications?unreadOnly=true

**Expected**:
- Step 3 returns `{ "markedCount": <unreadCount>, ... }`
- Step 4 returns 0 unread notifications

---

## TC-ACH-001 — Award an achievement

**Module**: Achievements
**Priority**: P2
**Type**: Functional

**Steps**:
1. Login as ADMIN
2. GET /api/achievements → capture an `achievementId`
3. POST /api/members/{memberId}/achievements with `{"achievementId":"..."}`
4. GET /api/members/{memberId}/achievements

**Expected**:
- 201 on step 3
- Step 4 includes the awarded achievement
- The linked user (if any) receives an `ACHIEVEMENT_AWARDED` notification

---

## TC-ERR-001 — Generic validation error envelope

**Module**: Cross-cutting
**Priority**: P1
**Type**: Validation

**Steps**:
1. POST /api/auth/register with missing `password`

**Expected**:
- 400 Bad Request
- Body contains `fieldErrors.password` describing the problem

---

## TC-ERR-002 — Rate limiting on login

**Module**: Auth
**Priority**: P2
**Type**: Security

**Steps**:
1. POST /api/auth/login 12 times in quick succession with a wrong password

**Expected**:
- The 11th (or so) call returns 429 Too Many Requests

---

## TC-PERF-001 — Recipe list response time

**Module**: Recipes
**Priority**: P2
**Type**: Performance

**Steps**:
1. Login
2. GET /api/families/{familyId}/recipes (cold cache)
3. Repeat 100 times

**Expected**:
- 95th percentile response time < 200ms
- No 5xx responses

See [`performance-tests.md`](./performance-tests.md) for the k6 script.

---

## How to extend

When you add a new endpoint:

1. Add **at least one P0 case** — happy path, authenticated, valid input.
2. Add **a 4xx case** — invalid input or auth.
3. Add **a 5xx case only if intentional** — most 5xx tests are for unhandled exceptions.
4. Add **a performance case** if the endpoint is list-heavy or auth-heavy.

Save new cases alongside this file with the `TC-{MODULE}-{NNN}` naming convention.