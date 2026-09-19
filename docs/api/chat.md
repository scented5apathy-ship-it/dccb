# Chat API

> Per-family group chat. Each family has one or more chat threads (channels); each thread has messages. All require JWT.

A **chat thread** belongs to one family and has a `name` (e.g. "General", "Reunion planning") and a list of members (`chat_members`).

A **message** belongs to one thread and has `content`, `sender_id`, and optional `parent_message_id` for threaded replies.

---

## GET /families/{familyId}/chats

List chat threads for a family.

### Request

**Headers**: `Authorization: Bearer <accessToken>` (required)

**Path parameters**: `familyId` (UUID, required)

### Response — `200 OK`

```json
{
  "chats": [
    {
      "id": "...",
      "familyId": "aaaaaaaa-0000-0000-0000-000000000001",
      "name": "General",
      "type": "GROUP",
      "memberIds": ["11111111-...", "22222222-..."],
      "lastMessage": {
        "id": "...",
        "content": "Chào cả nhà!",
        "senderId": "11111111-...",
        "createdAt": "2026-09-19T03:00:00+07:00"
      },
      "unreadCount": 2,
      "createdAt": "2024-01-01T00:00:00+07:00"
    }
  ]
}
```

### Errors

- `401 Unauthorized`
- `403 Forbidden`
- `404 Not Found`

### Example

```bash
curl http://localhost:8080/api/families/aaaaaaaa-0000-0000-0000-000000000001/chats \
  -H "Authorization: Bearer <accessToken>"
```

---

## POST /families/{familyId}/chats

Create a new chat thread.

### Request

**Body**:
```json
{
  "name": "Reunion planning",
  "type": "GROUP",
  "memberIds": ["11111111-...", "22222222-...", "33333333-..."]
}
```

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `name` | string | yes | – |
| `type` | enum | no | `GROUP` (default) / `DIRECT` (1-1) |
| `memberIds` | UUID[] | yes | at least one user; for `DIRECT` exactly two |

### Response — `201 Created`

The created chat thread.

### Errors

- `400 Bad Request`
- `401 Unauthorized`
- `403 Forbidden`
- `404 Not Found`

### Example

```bash
curl -X POST http://localhost:8080/api/families/aaaaaaaa-0000-0000-0000-000000000001/chats \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Reunion planning",
    "type":"GROUP",
    "memberIds":["11111111-1111-1111-1111-111111111111","22222222-2222-2222-2222-222222222222"]
  }'
```

---

## GET /chats/{chatId}/messages

List messages in a thread, newest first.

### Request

**Headers**: `Authorization: Bearer <accessToken>` (required)

**Path parameters**: `chatId` (UUID, required)

**Query parameters** (all optional):
| Name | Type | Description |
| --- | --- | --- |
| `before` | UUID | Return messages **before** the message with this id (cursor pagination) |
| `limit` | int | Max messages to return (default 50, max 200) |

### Response — `200 OK`

```json
{
  "messages": [
    {
      "id": "...",
      "chatId": "...",
      "senderId": "11111111-...",
      "content": "Chào cả nhà!",
      "parentMessageId": null,
      "createdAt": "2026-09-19T03:00:00+07:00",
      "editedAt": null,
      "sender": {
        "id": "11111111-...",
        "fullName": "Nguyễn Văn An",
        "avatarUrl": "https://i.pravatar.cc/300?u=an"
      }
    }
  ],
  "hasMore": true,
  "nextCursor": "msg-uuid"
}
```

### Errors

- `401 Unauthorized`
- `403 Forbidden` — not a member of the chat
- `404 Not Found`

### Example

```bash
# Latest 50 messages
curl http://localhost:8080/api/chats/<chat-uuid>/messages \
  -H "Authorization: Bearer <accessToken>"

# 20 older messages before a cursor
curl "http://localhost:8080/api/chats/<chat-uuid>/messages?before=<msg-uuid>&limit=20" \
  -H "Authorization: Bearer <accessToken>"
```

---

## POST /chats/{chatId}/messages

Send a message.

### Request

**Body**:
```json
{
  "content": "Chào cả nhà, tối nay họp mặt nhé!",
  "parentMessageId": null
}
```

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `content` | string | yes | 1-4000 chars |
| `parentMessageId` | UUID | no | reply target |

### Response — `201 Created`

The created message (same shape as list items).

### Errors

- `400 Bad Request`
- `401 Unauthorized`
- `403 Forbidden`
- `404 Not Found`

### Example

```bash
curl -X POST http://localhost:8080/api/chats/<chat-uuid>/messages \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"content":"Chào cả nhà, tối nay họp mặt nhé!"}'
```

### Notes

- The current implementation does not push messages via WebSocket / SSE. The front-end uses `react-query` polling at a small interval (default 10s) to refresh.
- Future work: add a `/api/ws/chat` endpoint backed by Spring's STOMP support.

---

## See also

- [notifications.md](./notifications.md) — receive notifications when new chat messages arrive (if `chat_messages` triggers a notification fan-out).