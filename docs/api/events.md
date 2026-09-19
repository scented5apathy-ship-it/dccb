# Events API

> Family events — gatherings, ceremonies, anniversaries, reunions. All require JWT.

An **event** has:

- `title`, `description`
- `event_type` (`REUNION`, `WEDDING`, `ANNIVERSARY`, `FUNERAL`, `TET`, `BIRTHDAY`, `OTHER`)
- `event_date`, optional `end_date`
- `location`, optional `latitude` / `longitude`
- Attendees (`event_attendees`) with RSVP status (`GOING`, `MAYBE`, `NOT_GOING`)
- Photos (`event_photos`)

---

## GET /families/{familyId}/events

List events for a family.

### Request

**Headers**: `Authorization: Bearer <accessToken>` (required)

**Path parameters**: `familyId` (UUID, required)

**Query parameters** (all optional):
| Name | Type | Description |
| --- | --- | --- |
| `type` | string | Filter by `event_type` |
| `upcoming` | boolean | `true` for events with `event_date >= now` |
| `past` | boolean | `true` for events with `event_date < now` |
| `page` | int | Default 0 |
| `size` | int | Default 20 |

### Response — `200 OK`

```json
{
  "events": [
    {
      "id": "...",
      "familyId": "aaaaaaaa-0000-0000-0000-000000000001",
      "creatorId": "11111111-1111-1111-1111-111111111111",
      "title": "Đám cưới cháu Mai",
      "description": "Lễ cưới cháu Mai và con Tuấn tại nhà hàng Hà Nội.",
      "eventType": "WEDDING",
      "eventDate": "2026-11-15T17:00:00+07:00",
      "endDate": "2026-11-15T23:00:00+07:00",
      "location": "Nhà hàng Vạn Hoa, Hà Nội",
      "latitude": 21.0285,
      "longitude": 105.8542,
      "rsvpSummary": { "going": 12, "maybe": 5, "notGoing": 2 },
      "photoCount": 0,
      "creator": { "id": "...", "fullName": "Nguyễn Văn An" }
    }
  ],
  "page": 0,
  "size": 20,
  "totalItems": 8,
  "totalPages": 1
}
```

### Errors

- `401 Unauthorized`
- `403 Forbidden` — not a member of the family
- `404 Not Found`

### Example

```bash
# Upcoming events
curl "http://localhost:8080/api/families/aaaaaaaa-0000-0000-0000-000000000001/events?upcoming=true" \
  -H "Authorization: Bearer <accessToken>"

# Past weddings
curl "http://localhost:8080/api/families/aaaaaaaa-0000-0000-0000-000000000001/events?type=WEDDING&past=true" \
  -H "Authorization: Bearer <accessToken>"
```

---

## POST /families/{familyId}/events

Create a new event.

### Request

**Body**:
```json
{
  "title": "Đám cưới cháu Mai",
  "description": "Lễ cưới cháu Mai và con Tuấn tại nhà hàng Hà Nội.",
  "eventType": "WEDDING",
  "eventDate": "2026-11-15T17:00:00+07:00",
  "endDate": "2026-11-15T23:00:00+07:00",
  "location": "Nhà hàng Vạn Hoa, Hà Nội",
  "latitude": 21.0285,
  "longitude": 105.8542
}
```

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` | string | yes | – |
| `description` | string | no | – |
| `eventType` | enum | yes | `REUNION` / `WEDDING` / `ANNIVERSARY` / `FUNERAL` / `TET` / `BIRTHDAY` / `OTHER` |
| `eventDate` | timestamp | yes | ISO with offset |
| `endDate` | timestamp | no | – |
| `location` | string | no | – |
| `latitude` | double | no | -90..90 |
| `longitude` | double | no | -180..180 |

### Response — `201 Created`

The created event object (same shape as list items).

### Errors

- `400 Bad Request` — validation error
- `401 Unauthorized`
- `403 Forbidden`
- `404 Not Found`

### Example

```bash
curl -X POST http://localhost:8080/api/families/aaaaaaaa-0000-0000-0000-000000000001/events \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d @new-event.json
```

---

## PUT /events/{eventId}

Update an event.

### Request

**Body** (any subset of `CreateEventRequest`):
```json
{
  "location": "Nhà hàng Vạn Hoa (sảnh A)",
  "endDate": "2026-11-15T23:30:00+07:00"
}
```

### Response — `200 OK`

Updated event.

### Errors

- `400 Bad Request`
- `401 Unauthorized`
- `403 Forbidden` — not creator / ADMIN
- `404 Not Found`

### Example

```bash
curl -X PUT http://localhost:8080/api/events/<event-uuid> \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"location":"Nhà hàng Vạn Hoa (sảnh A)"}'
```

---

## DELETE /events/{eventId}

Delete an event.

### Request

**Path parameters**: `eventId` (UUID, required)

### Response — `200 OK`

```json
{ "message": "Đã xoá sự kiện" }
```

### Errors

- `401 Unauthorized`
- `403 Forbidden`
- `404 Not Found`

### Example

```bash
curl -X DELETE http://localhost:8080/api/events/<event-uuid> \
  -H "Authorization: Bearer <accessToken>"
```

### Notes

- Cascades to `event_attendees` and `event_photos`.

---

## POST /events/{eventId}/rsvp

RSVP to an event on behalf of one or more family members.

### Request

**Body**:
```json
{
  "responses": [
    { "memberId": "a0000010-0000-0000-0000-000000000010", "rsvpStatus": "GOING" },
    { "memberId": "a0000011-0000-0000-0000-000000000011", "rsvpStatus": "MAYBE" }
  ]
}
```

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `responses` | array | yes | each: `{memberId, rsvpStatus}` |
| `rsvpStatus` | enum | yes | `GOING` / `MAYBE` / `NOT_GOING` |

### Response — `200 OK`

```json
{
  "summary": { "going": 14, "maybe": 6, "notGoing": 3 },
  "attendees": [
    { "memberId": "a0000010-...", "rsvpStatus": "GOING", "respondedAt": "2026-09-19T03:14:15+07:00" }
  ]
}
```

### Errors

- `400 Bad Request`
- `401 Unauthorized`
- `403 Forbidden` — not a member of the family
- `404 Not Found`

### Example

```bash
curl -X POST http://localhost:8080/api/events/<event-uuid>/rsvp \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "responses":[
      {"memberId":"a0000010-0000-0000-0000-000000000010","rsvpStatus":"GOING"}
    ]
  }'
```

---

## Event Photos

Attach photos to a specific event. Photos uploaded here are also stored in the matching album.

### POST /events/{eventId}/photos

```bash
curl -X POST http://localhost:8080/api/events/<event-uuid>/photos \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "photoUrl":"https://example.com/event-1.jpg",
    "caption":"Cả nhà chụp ảnh chung"
  }'
```

Response — `201 Created`:
```json
{
  "photo": {
    "id": "...",
    "eventId": "...",
    "photoUrl": "https://example.com/event-1.jpg",
    "caption": "Cả nhà chụp ảnh chung",
    "uploadedBy": "<user-id>",
    "uploadedAt": "2026-09-19T..."
  }
}
```

### GET /events/{eventId}/photos

```bash
curl http://localhost:8080/api/events/<event-uuid>/photos \
  -H "Authorization: Bearer <accessToken>"
```

Response — `200 OK`:
```json
{
  "photos": [ { "id": "...", "photoUrl": "...", "caption": "..." } ]
}
```

### See also

- [photos.md](./photos.md) — albums and global photos