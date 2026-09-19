# Notifications API

> Per-user notifications. All require JWT.

A **notification** is a system-generated message for a user:

- Type: `INVITATION`, `EVENT_REMINDER`, `TIME_CAPSULE_UNLOCKED`, `RECIPE_COMMENT`, `ACHIEVEMENT_AWARDED`, `MENTION`, etc.
- Title, body, link to the entity that triggered it.
- Read state: `is_read`, `read_at`.

Notifications are user-scoped (not family-scoped). The server fans them out when a relevant event happens (e.g. when a time capsule unlocks, all family members get one).

---

## Notification types (enum)

```text
INVITATION
JOIN_REQUEST
EVENT_REMINDER
EVENT_RSVP
TIME_CAPSULE_UNLOCKED
RECIPE_COMMENT
RECIPE_REACTION
STORY_COMMENT
ACHIEVEMENT_AWARDED
MENTION
```

---

## GET /notifications

List notifications for the current user.

### Request

**Headers**: `Authorization: Bearer <accessToken>` (required)

**Query parameters** (all optional):
| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `unreadOnly` | boolean | false | If true, return only unread notifications |
| `page` | int | 0 | Zero-based page |
| `size` | int | 20 | Page size |

### Response — `200 OK`

```json
{
  "notifications": [
    {
      "id": "...",
      "userId": "33333333-3333-3333-3333-333333333333",
      "type": "TIME_CAPSULE_UNLOCKED",
      "title": "Time capsule unlocked",
      "body": "Lá thư gửi tương lai của bác An đã được mở",
      "linkUrl": "/families/aaaaaaaa-.../time-capsules/<id>",
      "isRead": false,
      "readAt": null,
      "createdAt": "2025-09-19T10:00:00+07:00",
      "metadata": {
        "capsuleId": "<capsule-uuid>",
        "familyId": "aaaaaaaa-..."
      }
    }
  ],
  "page": 0,
  "size": 20,
  "totalItems": 12,
  "totalPages": 1,
  "unreadCount": 5
}
```

### Errors

- `401 Unauthorized` — missing token

### Example

```bash
# All notifications
curl http://localhost:8080/api/notifications \
  -H "Authorization: Bearer <accessToken>"

# Only unread
curl "http://localhost:8080/api/notifications?unreadOnly=true" \
  -H "Authorization: Bearer <accessToken>"
```

### Notes

- Notifications are returned newest first.
- The `metadata` map is type-specific — see the enum values above for what to expect.

---

## POST /notifications/{notificationId}/read

Mark a single notification as read.

### Request

**Path parameters**: `notificationId` (UUID, required)

### Response — `200 OK`

```json
{
  "notification": {
    "id": "...",
    "isRead": true,
    "readAt": "2026-09-19T03:14:15+07:00",
    ...
  }
}
```

### Errors

- `401 Unauthorized`
- `403 Forbidden` — the notification belongs to a different user
- `404 Not Found` — notification missing

### Example

```bash
curl -X POST http://localhost:8080/api/notifications/<notification-uuid>/read \
  -H "Authorization: Bearer <accessToken>"
```

### Notes

- Idempotent — calling `/read` on an already-read notification is a no-op (no error).

---

## POST /notifications/read-all

Mark all of the current user's notifications as read.

### Request

**Headers**: `Authorization: Bearer <accessToken>` (required)

### Response — `200 OK`

```json
{
  "message": "Đã đánh dấu tất cả thông báo là đã đọc",
  "markedCount": 5
}
```

### Errors

- `401 Unauthorized`

### Example

```bash
curl -X POST http://localhost:8080/api/notifications/read-all \
  -H "Authorization: Bearer <accessToken>"
```

### Notes

- Returns the count of notifications that transitioned from `unread → read`. Zero is a valid response.

---

## See also

- [time-capsules.md](./time-capsules.md) — `TIME_CAPSULE_UNLOCKED` notifications
- [recipes.md](./recipes.md) — `RECIPE_COMMENT`, `RECIPE_REACTION` notifications
- [achievements.md](./achievements.md) — `ACHIEVEMENT_AWARDED` notifications