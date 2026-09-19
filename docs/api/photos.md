# Photo Albums & Photos API

> Family photo albums and individual photos. All require JWT.

A **photo album** is a named collection of photos. Albums can be linked to a family, a member, or an event via `photo_tags` (a polymorphic tag table).

A **photo** is an image (or video) attached to one or more albums.

---

## GET /families/{familyId}/albums

List albums for a family.

### Request

**Headers**: `Authorization: Bearer <accessToken>` (required)

**Path parameters**: `familyId` (UUID, required)

### Response — `200 OK`

```json
{
  "albums": [
    {
      "id": "...",
      "familyId": "aaaaaaaa-0000-0000-0000-000000000001",
      "title": "Đám cưới Mai 2026",
      "description": "Ảnh kỷ niệm đám cưới cháu Mai",
      "coverPhotoUrl": "https://example.com/cover.jpg",
      "photoCount": 24,
      "createdBy": "11111111-1111-1111-1111-111111111111",
      "createdAt": "2026-11-15T20:00:00+07:00",
      "updatedAt": "2026-11-16T01:00:00+07:00"
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
curl http://localhost:8080/api/families/aaaaaaaa-0000-0000-0000-000000000001/albums \
  -H "Authorization: Bearer <accessToken>"
```

---

## POST /families/{familyId}/albums

Create a new album.

### Request

**Body**:
```json
{
  "title": "Đám cưới Mai 2026",
  "description": "Ảnh kỷ niệm đám cưới cháu Mai",
  "coverPhotoUrl": "https://example.com/cover.jpg"
}
```

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` | string | yes | – |
| `description` | string | no | – |
| `coverPhotoUrl` | string (URL) | no | – |

### Response — `201 Created`

The created album object (same shape as list items).

### Errors

- `400 Bad Request`
- `401 Unauthorized`
- `403 Forbidden`
- `404 Not Found`

### Example

```bash
curl -X POST http://localhost:8080/api/families/aaaaaaaa-0000-0000-0000-000000000001/albums \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "title":"Đám cưới Mai 2026",
    "description":"Ảnh kỷ niệm đám cưới cháu Mai"
  }'
```

---

## GET /albums/{albumId}/photos

List photos in an album.

### Request

**Headers**: `Authorization: Bearer <accessToken>` (required)

**Path parameters**: `albumId` (UUID, required)

### Response — `200 OK`

```json
{
  "photos": [
    {
      "id": "...",
      "albumId": "...",
      "photoUrl": "https://example.com/album-1.jpg",
      "caption": "Cả nhà chụp ảnh chung",
      "uploadedBy": "11111111-1111-1111-1111-111111111111",
      "uploadedAt": "2026-11-15T20:05:00+07:00",
      "tags": [
        { "tagType": "MEMBER", "tagId": "a0000010-..." },
        { "tagType": "EVENT",  "tagId": "<event-uuid>" }
      ]
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
curl http://localhost:8080/api/albums/<album-uuid>/photos \
  -H "Authorization: Bearer <accessToken>"
```

---

## POST /albums/{albumId}/photos

Add a photo to an album.

### Request

**Body**:
```json
{
  "photoUrl": "https://example.com/album-1.jpg",
  "caption": "Cả nhà chụp ảnh chung",
  "tags": [
    { "tagType": "MEMBER", "tagId": "a0000010-0000-0000-0000-000000000010" }
  ]
}
```

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `photoUrl` | string (URL) | yes | – |
| `caption` | string | no | – |
| `tags` | array | no | each: `{tagType, tagId}` — `tagType` ∈ `MEMBER` / `EVENT` |

### Response — `201 Created`

```json
{
  "photo": {
    "id": "...",
    "albumId": "...",
    "photoUrl": "https://example.com/album-1.jpg",
    "caption": "Cả nhà chụp ảnh chung",
    "uploadedBy": "<user-id>",
    "uploadedAt": "2026-11-15T..."
  }
}
```

### Errors

- `400 Bad Request`
- `401 Unauthorized`
- `403 Forbidden`
- `404 Not Found`

### Example

```bash
curl -X POST http://localhost:8080/api/albums/<album-uuid>/photos \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "photoUrl":"https://example.com/album-1.jpg",
    "caption":"Cả nhà chụp ảnh chung"
  }'
```

### Notes

- This endpoint stores the URL of an already-uploaded photo. CâyGiaPhảSố doesn't host the binary itself — pair it with S3 / Cloudinary / etc. and store the public URL here.
- See [events.md](./events.md#event-photos) for attaching photos directly to events.

---

## See also

- [events.md](./events.md) — event photos
- [stories.md](./stories.md) — `story_media` for embedded images