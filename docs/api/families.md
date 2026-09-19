# Families API

> Endpoints for managing family groups, their generations, and the **family tree ⭐** visualisation. All endpoints under `/api/families/...` require JWT.

A **family** (`gia tộc`) is the top-level grouping in CâyGiaPhảSố. Every family has a name, a description, a motto, a founding year, and one creator (admin). Members, recipes, stories, events, time capsules, etc. all hang off a family.

A **generation** (`đời`) is a numbered band of years inside a family (e.g. "Đời 1 — Cụ tổ", "Đời 5 — Con cháu"). Members are assigned to exactly one generation.

The **family tree** endpoint composes generations + members + relationships into a nested structure the front-end can walk directly.

---

## POST /families

Create a new family. The creator becomes the family's ADMIN.

### Request

**Headers**:
- `Authorization: Bearer <accessToken>` (required)
- `Content-Type: application/json`

**Body**:
```json
{
  "name": "Gia tộc họ Nguyễn",
  "description": "Dòng họ Nguyễn có truyền thống hơn 200 năm tại làng Đông Ngạc, Hà Nội.",
  "foundedYear": 1820,
  "motto": "Hiếu đễ trước, nghĩa khí sau",
  "originLocation": "Làng Đông Ngạc, Từ Liêm, Hà Nội"
}
```

| Field | Type | Required | Validation |
| --- | --- | --- | --- |
| `name` | string | yes | 1-255 chars |
| `description` | string | no | – |
| `foundedYear` | int | no | – |
| `motto` | string | no | max 255 chars |
| `originLocation` | string | no | max 255 chars |

### Response — `201 Created`

```json
{
  "family": {
    "id": "aaaaaaaa-0000-0000-0000-000000000001",
    "name": "Gia tộc họ Nguyễn",
    "description": "Dòng họ Nguyễn có truyền thống hơn 200 năm tại làng Đông Ngạc, Hà Nội.",
    "foundedYear": 1820,
    "motto": "Hiếu đễ trước, nghĩa khí sau",
    "originLocation": "Làng Đông Ngạc, Từ Liêm, Hà Nội",
    "createdBy": "11111111-1111-1111-1111-111111111111",
    "memberCount": 1,
    "createdAt": "2026-09-19T03:14:15+07:00",
    "updatedAt": "2026-09-19T03:14:15+07:00"
  }
}
```

### Errors

- `400 Bad Request` — missing/invalid name
- `401 Unauthorized` — missing token

### Example

```bash
curl -X POST http://localhost:8080/api/families \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Gia tộc họ Phạm",
    "foundedYear": 1950,
    "motto": "Ăn quả nhớ kẻ trồng cây"
  }'
```

### Notes

- The new family starts with **member_count = 1** (the creator).
- The creator is **automatically added as a `family_member` row** linked to their `users.id`. They can later edit their member entry to add biographical details.

---

## GET /families

List families the current user belongs to.

### Request

**Headers**:
- `Authorization: Bearer <accessToken>` (required)

### Response — `200 OK`

```json
{
  "families": [
    {
      "family": {
        "id": "aaaaaaaa-0000-0000-0000-000000000001",
        "name": "Gia tộc họ Nguyễn",
        "foundedYear": 1820,
        "motto": "Hiếu đễ trước, nghĩa khí sau",
        "memberCount": 20
      },
      "role": "ADMIN",
      "memberCount": 20
    },
    {
      "family": {
        "id": "bbbbbbbb-0000-0000-0000-000000000002",
        "name": "Gia tộc họ Trần",
        "foundedYear": 1855,
        "motto": "Trung hiếu vẹn toàn",
        "memberCount": 15
      },
      "role": "MEMBER",
      "memberCount": 15
    }
  ]
}
```

`role` is one of `ADMIN` (creator) or `MEMBER` (joined via invite).

### Errors

- `401 Unauthorized` — missing token

### Example

```bash
curl http://localhost:8080/api/families \
  -H "Authorization: Bearer <accessToken>"
```

### Notes

- Useful for the family-switcher in the top nav. Empty array is a valid response (the user has just registered and hasn't joined a family yet).

---

## GET /families/{familyId}

Fetch detailed metadata for a family: profile + generations + heritages + counters.

### Request

**Headers**:
- `Authorization: Bearer <accessToken>` (required)

**Path parameters**:
| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `familyId` | UUID | yes | The family id |

### Response — `200 OK`

```json
{
  "family": { ...same as POST... },
  "generations": [
    {
      "id": "aaaa1111-0000-0000-0000-000000000001",
      "generationNumber": 1,
      "name": "Đời 1 - Cụ tổ",
      "startYear": 1820,
      "endYear": 1885,
      "description": "..."
    }
  ],
  "heritages": [ ...HeritageDto... ],
  "stats": {
    "memberCount": 20,
    "recipeCount": 8,
    "storyCount": 4,
    "eventCount": 3,
    "timeCapsuleCount": 3
  },
  "myRole": "ADMIN"
}
```

### Errors

- `401 Unauthorized` — missing token
- `403 Forbidden` — current user is not a member
- `404 Not Found` — family does not exist

### Example

```bash
curl http://localhost:8080/api/families/aaaaaaaa-0000-0000-0000-000000000001 \
  -H "Authorization: Bearer <accessToken>"
```

---

## PUT /families/{familyId}

Update family metadata. **Only the ADMIN** can update.

### Request

**Headers**:
- `Authorization: Bearer <accessToken>` (required)
- `Content-Type: application/json`

**Body** (any subset; the same fields as `POST /families`):
```json
{
  "name": "Gia tộc họ Nguyễn (cập nhật)",
  "motto": "Hiếu - Nghĩa - Trung - Tín"
}
```

### Response — `200 OK`

```json
{
  "family": { ...updated FamilyDto... }
}
```

### Errors

- `400 Bad Request` — validation error
- `401 Unauthorized` — missing token
- `403 Forbidden` — caller is not ADMIN
- `404 Not Found` — family missing

### Example

```bash
curl -X PUT http://localhost:8080/api/families/aaaaaaaa-0000-0000-0000-000000000001 \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"motto":"Hiếu - Nghĩa - Trung - Tín"}'
```

---

## POST /families/join

Join an existing family using an invite code issued by its ADMIN.

### Request

**Headers**:
- `Authorization: Bearer <accessToken>` (required)
- `Content-Type: application/json`

**Body**:
```json
{
  "inviteCode": "NGUYEN-2026-A1B2C3"
}
```

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `inviteCode` | string | yes | Code returned by `POST /families/{familyId}/invitations` |

### Response — `200 OK`

```json
{
  "family": { ...FamilyDto... },
  "role": "MEMBER",
  "memberCount": 21
}
```

### Errors

- `400 Bad Request` — missing inviteCode
- `401 Unauthorized` — missing token
- `404 Not Found` — invite not found / expired / revoked
- `409 Conflict` — user already a member

### Example

```bash
curl -X POST http://localhost:8080/api/families/join \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"inviteCode":"NGUYEN-2026-A1B2C3"}'
```

### Notes

- `GET /families/join` returns `405 Method Not Allowed` (POST-only).
- Invites have an expiry (`expires_at`); an expired invite yields `404`.

---

## GET /families/{familyId}/generations

List the generations of a family in chronological order.

### Request

**Headers**:
- `Authorization: Bearer <accessToken>` (required)

**Path parameters**: `familyId` (UUID, required)

### Response — `200 OK`

```json
{
  "generations": [
    {
      "id": "aaaa1111-0000-0000-0000-000000000001",
      "familyId": "aaaaaaaa-0000-0000-0000-000000000001",
      "generationNumber": 1,
      "name": "Đời 1 - Cụ tổ",
      "startYear": 1820,
      "endYear": 1885,
      "description": "Cụ tổ khai sáng dòng họ, từ Thanh Hóa lên Hà Nội lập nghiệp.",
      "memberCount": 2
    }
  ]
}
```

### Errors

- `401 Unauthorized`
- `403 Forbidden` — not a member
- `404 Not Found`

### Example

```bash
curl http://localhost:8080/api/families/aaaaaaaa-0000-0000-0000-000000000001/generations \
  -H "Authorization: Bearer <accessToken>"
```

---

## POST /families/{familyId}/generations

Create a new generation. **ADMIN only.**

### Request

**Body**:
```json
{
  "generationNumber": 6,
  "name": "Đời 6 - Cháu chắt",
  "startYear": 2010,
  "endYear": null,
  "description": "Thế hệ sinh sau năm 2010."
}
```

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `generationNumber` | int | yes | unique per family, must be > 0 |
| `name` | string | yes | 1-255 chars |
| `startYear` | int | yes | – |
| `endYear` | int | no | null = ongoing |
| `description` | string | no | – |

### Response — `201 Created`

```json
{
  "generation": { ...GenerationDto... }
}
```

### Errors

- `400 Bad Request` — validation / duplicate generation number
- `401 Unauthorized`
- `403 Forbidden` — not ADMIN
- `404 Not Found` — family missing

### Example

```bash
curl -X POST http://localhost:8080/api/families/aaaaaaaa-0000-0000-0000-000000000001/generations \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"generationNumber":6,"name":"Đời 6","startYear":2010}'
```

---

## DELETE /generations/{generationId}

Delete a generation. Members assigned to it must be reassigned first (or will be deleted by cascade).

### Request

**Path parameters**: `generationId` (UUID, required)

### Response — `200 OK`

```json
{ "message": "Đã xoá đời thành công" }
```

### Errors

- `401 Unauthorized`
- `403 Forbidden` — not ADMIN
- `404 Not Found` — generation missing

### Example

```bash
curl -X DELETE http://localhost:8080/api/generations/aaaa1111-0000-0000-0000-000000000001 \
  -H "Authorization: Bearer <accessToken>"
```

### Notes

- The route is `/api/generations/{id}` (not `/families/{id}/generations/{id}`) per the spec.

---

## GET /families/{familyId}/tree ⭐ NOVEL FEATURE

Return the full hierarchical family tree — generations → members → spouses → siblings → children. The front-end consumes this directly to render the tree visualisation without re-traversal.

### Request

**Headers**:
- `Authorization: Bearer <accessToken>` (required)

**Path parameters**: `familyId` (UUID, required)

### Response — `200 OK`

```json
{
  "familyId": "aaaaaaaa-0000-0000-0000-000000000001",
  "familyName": "Gia tộc họ Nguyễn",
  "totalMembers": 20,
  "totalGenerations": 5,
  "generations": [
    {
      "id": "aaaa1111-0000-0000-0000-000000000001",
      "generationNumber": 1,
      "name": "Đời 1 - Cụ tổ",
      "startYear": 1820,
      "endYear": 1885,
      "members": [
        {
          "id": "a0000001-0000-0000-0000-000000000001",
          "fullName": "Nguyễn Văn Hùng",
          "nickname": "Cụ Hùng",
          "gender": "MALE",
          "avatarUrl": null,
          "birthDate": "1820-03-15",
          "deathDate": "1885-08-20",
          "isAlive": false,
          "occupation": "Nông dân - Thợ mộc",
          "generationId": "aaaa1111-0000-0000-0000-000000000001",
          "spouses": [
            {
              "id": "a0000002-0000-0000-0000-000000000002",
              "fullName": "Nguyễn Thị Hoa",
              "gender": "FEMALE",
              "birthDate": "1825-05-10",
              "isAlive": false,
              "children": [],
              "spouses": [],
              "siblings": []
            }
          ],
          "siblings": [],
          "children": [
            {
              "id": "a0000003-0000-0000-0000-000000000003",
              "fullName": "Nguyễn Văn Đức",
              "gender": "MALE",
              "generationId": "aaaa1111-0000-0000-0000-000000000002",
              "children": [ ...recursive... ],
              "spouses": [ ... ],
              "siblings": [ ... ]
            }
          ]
        }
      ]
    }
  ]
}
```

### Errors

- `401 Unauthorized`
- `403 Forbidden` — not a member
- `404 Not Found`

### Example

```bash
curl http://localhost:8080/api/families/aaaaaaaa-0000-0000-0000-000000000001/tree \
  -H "Authorization: Bearer <accessToken>" | jq . > family-tree.json
```

### Notes

- This is the canonical payload for the tree visualisation component on the front-end.
- `children` is recursive; `spouses` and `siblings` are not.
- See [FamilyTreeResponse.java](../../backend/src/main/java/com/giapha/model/dto/tree/FamilyTreeResponse.java) for the full DTO.

---

## POST /families/{familyId}/invitations

Create a new invite code (ADMIN only).

### Request

**Body**:
```json
{
  "recipientEmail": "new.member@example.com",
  "role": "MEMBER",
  "expiresInDays": 7,
  "maxUses": 1
}
```

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `recipientEmail` | string | no | if set, only this email may redeem |
| `role` | string | no | `ADMIN` or `MEMBER` (default `MEMBER`) |
| `expiresInDays` | int | no | default 7 |
| `maxUses` | int | no | default 1 |

### Response — `201 Created`

```json
{
  "invitation": {
    "code": "NGUYEN-2026-A1B2C3",
    "familyId": "aaaaaaaa-0000-0000-0000-000000000001",
    "expiresAt": "2026-09-26T03:14:15+07:00",
    "maxUses": 1,
    "uses": 0
  }
}
```

### Example

```bash
curl -X POST http://localhost:8080/api/families/aaaaaaaa-0000-0000-0000-000000000001/invitations \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"recipientEmail":"new.member@example.com","expiresInDays":7}'
```

---

## Heritages (read & create)

Heritages are cultural / physical artefacts attached to a family (e.g. "Bộ sưu tập ảnh cũ", "Bình gốm thời Nguyễn").

### GET /families/{familyId}/heritages

```bash
curl http://localhost:8080/api/families/aaaaaaaa-0000-0000-0000-000000000001/heritages \
  -H "Authorization: Bearer <accessToken>"
```

### POST /families/{familyId}/heritages

```bash
curl -X POST http://localhost:8080/api/families/aaaaaaaa-0000-0000-0000-000000000001/heritages \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Bộ ảnh đám cưới 1955",
    "description": "Album ảnh đám cưới ông bà nội",
    "type": "PHOTO_ALBUM",
    "imageUrl": "https://example.com/album-1955.jpg"
  }'
```