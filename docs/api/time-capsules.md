# Time Capsules API ⭐

> **The other signature feature of CâyGiaPhảSố.** A *time capsule* is a sealed message addressed to a future family member. It's locked until `unlock_date` arrives, after which the recipient (or any family member) can call `/open` to read the contents.

Use cases:

- A grandfather writes a letter to his unborn grandchild, sealed until the grandchild turns 18.
- A family writes a memory capsule to be opened at the next reunion.
- A parent records a video for their child's wedding day.

A capsule has:

- `title`, `content`, optional `media_url`
- `recipient_member_id` (optional) — the member who "owns" the capsule
- `unlock_date` — the date the capsule becomes readable
- `unlock_condition` — `DATE` / `EVENT` / `MANUAL`
- `unlock_event` — free-text event name (used with `EVENT` condition)
- Server-tracked `is_opened`, `opened_at`, `opened_by`

---

## Status enum

```text
LOCKED   — unlock_date > today, never opened
UNLOCKED — unlock_date <= today, never opened
OPENED   — already opened at least once
```

---

## GET /families/{familyId}/time-capsules

List time capsules for a family.

### Request

**Headers**: `Authorization: Bearer <accessToken>` (required)

**Path parameters**: `familyId` (UUID, required)

**Query parameters** (all optional):
| Name | Type | Description |
| --- | --- | --- |
| `status` | string | `LOCKED` / `UNLOCKED` / `OPENED` |
| `recipientId` | UUID | Only capsules addressed to this member |

### Response — `200 OK`

```json
{
  "timeCapsules": [
    {
      "id": "...",
      "familyId": "aaaaaaaa-0000-0000-0000-000000000001",
      "creatorId": "11111111-1111-1111-1111-111111111111",
      "title": "Lá thư gửi tương lai của bác An",
      "content": null,
      "mediaUrl": null,
      "recipientMemberId": null,
      "unlockDate": "2025-09-19",
      "unlockCondition": "DATE",
      "unlockEvent": null,
      "isOpened": true,
      "openedAt": "2025-09-19T10:00:00+07:00",
      "openedBy": "33333333-3333-3333-3333-333333333333",
      "status": "OPENED",
      "creator":   { "id": "11111111-...", "fullName": "Nguyễn Văn An" },
      "recipient": null
    },
    {
      "id": "...",
      "familyId": "aaaaaaaa-0000-0000-0000-000000000001",
      "creatorId": "22222222-2222-2222-2222-222222222222",
      "title": "Công thức bí mật cho Mai",
      "content": null,
      "mediaUrl": "https://example.com/secret-recipe.pdf",
      "recipientMemberId": "a0000016-0000-0000-0000-000000000016",
      "unlockDate": "2033-06-20",
      "unlockCondition": "DATE",
      "unlockEvent": null,
      "isOpened": false,
      "openedAt": null,
      "openedBy": null,
      "status": "LOCKED",
      "creator":   { "id": "22222222-...", "fullName": "Nguyễn Thị Lan" },
      "recipient": { "id": "a0000016-...", "fullName": "Nguyễn Thị Mai" }
    }
  ]
}
```

> **`content` is hidden from this list response** when the capsule is still `LOCKED`. The server enforces this to avoid leaking the contents via a list endpoint. Use `/open` (or, in a separate deployment, a separate `peek` endpoint) to read it.

### Errors

- `401 Unauthorized`
- `403 Forbidden` — not a member of the family
- `404 Not Found`

### Example

```bash
# All capsules in Họ Nguyễn
curl http://localhost:8080/api/families/aaaaaaaa-0000-0000-0000-000000000001/time-capsules \
  -H "Authorization: Bearer <accessToken>"

# Only the ones already unlocked
curl "http://localhost:8080/api/families/aaaaaaaa-0000-0000-0000-000000000001/time-capsules?status=UNLOCKED" \
  -H "Authorization: Bearer <accessToken>"
```

---

## POST /families/{familyId}/time-capsules

Create a new time capsule.

### Request

**Headers**:
- `Authorization: Bearer <accessToken>` (required)
- `Content-Type: application/json`

**Body**:
```json
{
  "title": "Lá thư cho cháu Mai 18 tuổi",
  "content": "Mai yêu quý, khi con đọc được lá thư này thì con đã 18 tuổi...",
  "mediaUrl": null,
  "recipientMemberId": "a0000016-0000-0000-0000-000000000016",
  "unlockDate": "2033-06-20",
  "unlockCondition": "DATE",
  "unlockEvent": null
}
```

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` | string | yes | – |
| `content` | string | no | – |
| `mediaUrl` | string (URL) | no | – |
| `recipientMemberId` | UUID | no | must belong to the same family |
| `unlockDate` | date | yes | ISO `yyyy-MM-dd` |
| `unlockCondition` | string | yes | `DATE` / `EVENT` / `MANUAL` |
| `unlockEvent` | string | no | required when `unlockCondition = EVENT` |

### Response — `201 Created`

```json
{
  "timeCapsule": {
    "id": "...",
    "familyId": "...",
    "creatorId": "...",
    "title": "...",
    "content": null,
    "mediaUrl": null,
    "recipientMemberId": "...",
    "unlockDate": "2033-06-20",
    "unlockCondition": "DATE",
    "unlockEvent": null,
    "isOpened": false,
    "openedAt": null,
    "openedBy": null,
    "status": "LOCKED",
    "creator":   { "id": "...", "fullName": "..." },
    "recipient": { "id": "...", "fullName": "..." }
  }
}
```

> `content` is **never echoed back** in the response (even if you sent it). The server stores it encrypted-at-rest and only reveals it on `/open`.

### Errors

- `400 Bad Request` — missing required field, invalid date, `unlock_date` in the past
- `401 Unauthorized`
- `403 Forbidden` — caller is not a member of the family
- `404 Not Found` — `recipientMemberId` not in the family

### Example

```bash
curl -X POST http://localhost:8080/api/families/aaaaaaaa-0000-0000-0000-000000000001/time-capsules \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Lá thư cho cháu Mai 18 tuổi",
    "content": "Mai yêu quý, khi con đọc được lá thư này thì con đã 18 tuổi...",
    "recipientMemberId": "a0000016-0000-0000-0000-000000000016",
    "unlockDate": "2033-06-20",
    "unlockCondition": "DATE"
  }'
```

### Notes

- `unlock_date` cannot be in the past (use the past only for back-filled capsules).
- Use `unlock_condition = MANUAL` for capsules unlocked only by an ADMIN calling `/open` directly.

---

## POST /time-capsules/{capsuleId}/open ⭐

**Open a time capsule.** This is the only endpoint that reveals the `content` and `mediaUrl`. The server enforces the rule:

- If `unlock_condition = DATE`, the current date must be `>= unlock_date`. Otherwise `403 Forbidden`.
- If `unlock_condition = EVENT`, the back-end looks up `unlockEvent` — currently a manual flag set by an ADMIN. Otherwise `403`.
- If `unlock_condition = MANUAL`, any family member can open at any time.

After successful open:

- `is_opened = true`
- `opened_at = now`
- `opened_by = current user id`

### Request

**Headers**: `Authorization: Bearer <accessToken>` (required)

**Path parameters**: `capsuleId` (UUID, required)

### Response — `200 OK`

```json
{
  "id": "...",
  "familyId": "...",
  "title": "Lá thư gửi tương lai của bác An",
  "content": "Các cháu yêu quý, khi các cháu đọc được lá thư này thì bác đã 70 tuổi. Bác muốn các cháu nhớ rằng gia đình là gốc rễ...",
  "mediaUrl": null,
  "unlockDate": "2025-09-19",
  "unlockCondition": "DATE",
  "isOpened": true,
  "openedAt": "2026-09-19T03:14:15+07:00",
  "openedBy": "33333333-3333-3333-3333-333333333333",
  "creator":   { "id": "11111111-...", "fullName": "Nguyễn Văn An" },
  "recipient": null
}
```

### Errors

- `401 Unauthorized`
- `403 Forbidden` — capsule is still locked, or the caller is not a member of the family
- `404 Not Found` — capsule missing

### Example

```bash
# Open a capsule whose unlock date is today
curl -X POST http://localhost:8080/api/time-capsules/<capsule-uuid>/open \
  -H "Authorization: Bearer <accessToken>"
```

### Notes

- Idempotent: calling `/open` on an already-opened capsule re-returns the contents without erroring.
- This is the *only* way to read the content. Even the creator cannot see it through `GET /families/{familyId}/time-capsules` while it is locked.

---

## DELETE /time-capsules/{capsuleId}

Delete a time capsule.

### Request

**Path parameters**: `capsuleId` (UUID, required)

### Response — `200 OK`

```json
{ "message": "Đã xoá time capsule" }
```

### Errors

- `401 Unauthorized`
- `403 Forbidden` — not the creator or ADMIN
- `404 Not Found`

### Example

```bash
curl -X DELETE http://localhost:8080/api/time-capsules/<capsule-uuid> \
  -H "Authorization: Bearer <accessToken>"
```

### Notes

- Deletion is irreversible — there is no archive. Use a soft-delete flag in your own data model if you need recovery.

---

## Sample seed data

From `V2__seed_data.sql` (Họ Nguyễn):

| id (first 8 chars) | recipient | unlockDate | status |
| --- | --- | --- | --- |
| (none — opened capsule) | — | 2025-09-19 | OPENED |
| (recipient = Mai) | Nguyễn Thị Mai | 2033-06-20 | LOCKED |
| (recipient = Minh Anh) | Nguyễn Minh Anh | 2036-09-10 | LOCKED |

---

## See also

- [members.md](./members.md) — recipient member ids
- [recipes.md](./recipes.md) — the other novel feature
- [api-testing/time-capsule-tests.md](../api-testing/error-cases.md#time-capsule-locked-403) — locked vs unlocked behaviour