# Achievements API

> Per-member awards. Achievements are catalog items ("Người kể chuyện", "Đầu bếp gia đình", ...) that can be awarded to family members.

There are two entities:

- **`achievements`** — the catalog (e.g. "Người kể chuyện gia đình", "Lưu giữ 100+ ảnh", "Nấu ăn truyền thống"). Global, not per family.
- **`member_achievements`** — the join: who earned what, when, and an optional note.

---

## Achievement schema (catalog)

```text
id            UUID
code          string  unique slug, e.g. "family_storyteller"
name          string  e.g. "Người kể chuyện gia đình"
description   string
iconUrl       string
points        int     default 0
category      string  e.g. "STORY", "RECIPE", "PHOTO", "TIME_CAPSULE"
rarity        string  COMMON | RARE | EPIC | LEGENDARY
```

---

## GET /achievements

List the achievement catalog.

### Request

**Headers**: `Authorization: Bearer <accessToken>` (required)

### Response — `200 OK`

```json
{
  "achievements": [
    {
      "id": "...",
      "code": "family_storyteller",
      "name": "Người kể chuyện gia đình",
      "description": "Đã viết 5 câu chuyện gia đình",
      "iconUrl": "https://example.com/badges/storyteller.png",
      "points": 50,
      "category": "STORY",
      "rarity": "RARE",
      "awardedCount": 3
    }
  ]
}
```

### Errors

- `401 Unauthorized`

### Example

```bash
curl http://localhost:8080/api/achievements \
  -H "Authorization: Bearer <accessToken>"
```

### Notes

- `awardedCount` is the number of members currently holding the achievement.
- The catalog is currently read-only — there is no `POST /achievements` endpoint in this version.

---

## GET /members/{memberId}/achievements

List achievements awarded to a specific family member.

### Request

**Headers**: `Authorization: Bearer <accessToken>` (required)

**Path parameters**: `memberId` (UUID, required)

### Response — `200 OK`

```json
{
  "achievements": [
    {
      "id": "...",
      "achievementId": "...",
      "memberId": "a0000007-0000-0000-0000-000000000007",
      "awardedBy": "11111111-1111-1111-1111-111111111111",
      "awardedAt": "2026-09-19T03:14:15+07:00",
      "note": "Đã kể 10+ câu chuyện cho con cháu.",
      "achievement": {
        "code": "family_storyteller",
        "name": "Người kể chuyện gia đình",
        "iconUrl": "https://example.com/badges/storyteller.png",
        "rarity": "RARE",
        "points": 50
      }
    }
  ]
}
```

### Errors

- `401 Unauthorized`
- `403 Forbidden` — caller is not in the same family as the member
- `404 Not Found`

### Example

```bash
curl http://localhost:8080/api/members/a0000007-0000-0000-0000-000000000007/achievements \
  -H "Authorization: Bearer <accessToken>"
```

---

## POST /members/{memberId}/achievements

Award an achievement to a member.

### Request

**Body**:
```json
{
  "achievementId": "...",
  "note": "Đã đóng góp 50+ ảnh vào album gia đình."
}
```

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `achievementId` | UUID | yes | id from `GET /achievements` |
| `note` | string | no | – |

### Response — `201 Created`

```json
{
  "memberAchievement": {
    "id": "...",
    "achievementId": "...",
    "memberId": "...",
    "awardedBy": "...",
    "awardedAt": "2026-09-19T03:14:15+07:00",
    "note": "Đã đóng góp 50+ ảnh vào album gia đình."
  }
}
```

### Errors

- `400 Bad Request`
- `401 Unauthorized`
- `403 Forbidden` — only ADMINs of the family can award
- `404 Not Found` — member or achievement missing
- `409 Conflict` — member already holds this achievement (unique constraint)

### Example

```bash
curl -X POST http://localhost:8080/api/members/a0000007-0000-0000-0000-000000000007/achievements \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "achievementId":"<achievement-uuid>",
    "note":"Đã đóng góp 50+ ảnh vào album gia đình."
  }'
```

### Notes

- After awarding, the back-end emits an `ACHIEVEMENT_AWARDED` notification to the linked user (if any).
- There is currently no `DELETE /members/{memberId}/achievements/{id}` — call us if you need revoke.

---

## See also

- [members.md](./members.md) — `memberId` lookup
- [notifications.md](./notifications.md) — `ACHIEVEMENT_AWARDED` notifications