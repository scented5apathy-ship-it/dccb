# Stories API

> Family stories — narrative pieces tied to members, generations, and tags. All endpoints require JWT.

A **story** is a long-form piece of family history: "How my grandparents met", "The day the village flooded", "Letters from the front". Stories support:

- Free text body
- Optional `story_date` and `story_location`
- One or more `related_member_ids`
- An optional `related_generation_id`
- Multiple media items (images, videos, audio) via `story_media`
- Tagging via `story_tags` and `story_tag_map`
- A `featured` flag for the homepage carousel

---

## GET /families/{familyId}/stories

List stories for a family.

### Request

**Headers**: `Authorization: Bearer <accessToken>` (required)

**Path parameters**: `familyId` (UUID, required)

**Query parameters** (all optional):
| Name | Type | Description |
| --- | --- | --- |
| `search` | string | Substring match on `title` / `content` |
| `tag` | UUID | Filter by story-tag id |
| `featured` | boolean | `true` for featured stories only |
| `memberId` | UUID | Filter to stories related to this member |
| `page` | int | Default 0 |
| `size` | int | Default 20 |

### Response — `200 OK`

```json
{
  "stories": [
    {
      "id": "...",
      "familyId": "aaaaaaaa-0000-0000-0000-000000000001",
      "authorId": "22222222-2222-2222-2222-222222222222",
      "title": "Bà nội kể chuyện ngày Tết thời bao cấp",
      "content": "Mùa xuân năm 1979...",
      "storyDate": "1979-02-08",
      "storyLocation": "Làng Đông Ngạc, Hà Nội",
      "relatedMemberIds": ["a0000007-...", "a0000008-..."],
      "relatedGenerationId": "aaaa1111-0000-0000-0000-000000000003",
      "isFeatured": true,
      "viewCount": 245,
      "createdAt": "2024-02-10T00:00:00+07:00",
      "updatedAt": "2026-09-19T03:14:15+07:00",
      "tags": [
        { "id": "...", "name": "Tết" }
      ],
      "media": [
        {
          "id": "...",
          "mediaType": "IMAGE",
          "mediaUrl": "https://example.com/story-1.jpg",
          "caption": "Gia đình năm 1979",
          "orderIndex": 0
        }
      ],
      "author": { "id": "22222222-...", "fullName": "Nguyễn Thị Lan", "avatarUrl": "https://i.pravatar.cc/300?u=lan" }
    }
  ],
  "page": 0,
  "size": 20,
  "totalItems": 9,
  "totalPages": 1
}
```

### Errors

- `401 Unauthorized`
- `403 Forbidden`
- `404 Not Found`

### Example

```bash
# Featured stories in Họ Nguyễn
curl "http://localhost:8080/api/families/aaaaaaaa-0000-0000-0000-000000000001/stories?featured=true" \
  -H "Authorization: Bearer <accessToken>"

# Stories tagged with "Tết"
curl "http://localhost:8080/api/families/aaaaaaaa-0000-0000-0000-000000000001/stories?tag=<tag-uuid>" \
  -H "Authorization: Bearer <accessToken>"
```

---

## POST /families/{familyId}/stories

Create a new story.

### Request

**Body**:
```json
{
  "title": "Bà nội kể chuyện ngày Tết thời bao cấp",
  "content": "Mùa xuân năm 1979, khi đất nước vừa thống nhất...",
  "storyDate": "1979-02-08",
  "storyLocation": "Làng Đông Ngạc, Hà Nội",
  "relatedMemberIds": ["a0000007-0000-0000-0000-000000000007"],
  "relatedGenerationId": "aaaa1111-0000-0000-0000-000000000003",
  "isFeatured": true,
  "tagIds": ["<tag-uuid>"],
  "media": [
    {
      "mediaType": "IMAGE",
      "mediaUrl": "https://example.com/story-1.jpg",
      "caption": "Gia đình năm 1979",
      "orderIndex": 0
    }
  ]
}
```

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` | string | yes | – |
| `content` | string | yes | – |
| `storyDate` | date | no | – |
| `storyLocation` | string | no | – |
| `relatedMemberIds` | UUID[] | no | – |
| `relatedGenerationId` | UUID | no | – |
| `isFeatured` | boolean | no | default `false` |
| `tagIds` | UUID[] | no | – |
| `media` | array | no | each: `{mediaType, mediaUrl, caption?, orderIndex}` |

### Response — `201 Created`

Full story object (same shape as list items).

### Errors

- `400 Bad Request`
- `401 Unauthorized`
- `403 Forbidden`
- `404 Not Found`

### Example

```bash
curl -X POST http://localhost:8080/api/families/aaaaaaaa-0000-0000-0000-000000000001/stories \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d @new-story.json
```

---

## GET /stories/{storyId}

Fetch one story with everything: author, tags, media, related members.

### Request

**Path parameters**: `storyId` (UUID, required)

### Response — `200 OK`

Same shape as the items in `GET /families/{familyId}/stories`.

### Errors

- `401 Unauthorized`
- `403 Forbidden`
- `404 Not Found`

### Example

```bash
curl http://localhost:8080/api/stories/<story-uuid> \
  -H "Authorization: Bearer <accessToken>"
```

### Notes

- `view_count` is incremented server-side on each successful response.

---

## PUT /stories/{storyId}

Update an existing story.

### Request

**Body** (any subset of `CreateStoryRequest`):
```json
{
  "title": "Bà nội kể chuyện ngày Tết (đã sửa)",
  "isFeatured": true
}
```

### Response — `200 OK`

Updated story.

### Errors

- `400 Bad Request`
- `401 Unauthorized`
- `403 Forbidden` — not author / ADMIN
- `404 Not Found`

### Example

```bash
curl -X PUT http://localhost:8080/api/stories/<story-uuid> \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"isFeatured":true}'
```

---

## DELETE /stories/{storyId}

Delete a story (cascades to `story_media`, `story_tag_map`).

### Request

**Path parameters**: `storyId` (UUID, required)

### Response — `200 OK`

```json
{ "message": "Đã xoá câu chuyện" }
```

### Errors

- `401 Unauthorized`
- `403 Forbidden` — not author / ADMIN
- `404 Not Found`

### Example

```bash
curl -X DELETE http://localhost:8080/api/stories/<story-uuid> \
  -H "Authorization: Bearer <accessToken>"
```

---

## Story Tags

Story tags are a shared catalog (per family, but exposed globally for convenience).

### GET /story-tags

List all tags in the system (across families).

```bash
curl http://localhost:8080/api/story-tags \
  -H "Authorization: Bearer <accessToken>"
```

Response — `200 OK`:
```json
{
  "tags": [
    { "id": "...", "name": "Tết", "storyCount": 4 },
    { "id": "...", "name": "Kháng chiến", "storyCount": 2 }
  ]
}
```

### POST /story-tags

Create a new tag.

```bash
curl -X POST http://localhost:8080/api/story-tags \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Tết","color":"#ff5252"}'
```

Response — `201 Created`: the created tag.

### Notes

- Tags are global (no `family_id`). Stories reference tags by id in `story_tag_map`.
- Tag names are unique (case-insensitive).

---

## See also

- [members.md](./members.md) — `related_member_ids`
- [families.md](./families.md) — `family_id`