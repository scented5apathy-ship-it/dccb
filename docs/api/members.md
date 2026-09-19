# Family Members & Relationships API

> Endpoints for CRUD on family members, plus the relationship graph that connects them. All require JWT.

A **family member** is a person record in a family tree. It can be:

- **linked to a `users.id`** — the member has registered an account and can sign in
- **unlinked** — the member is a historical ancestor / deceased relative with no account

The **relationships** table stores edges between members (`PARENT`, `SPOUSE`, `SIBLING`, etc.).

---

## GET /families/{familyId}/members

List members of a family, with optional filters.

### Request

**Headers**:
- `Authorization: Bearer <accessToken>` (required)

**Path parameters**:
- `familyId` — UUID, required

**Query parameters** (all optional):
| Name | Type | Description |
| --- | --- | --- |
| `generationId` | UUID | Filter to one generation |
| `search` | string | Substring match on `full_name` / `nickname` |
| `aliveOnly` | boolean | `true` to skip members with a `death_date` |

### Response — `200 OK`

```json
{
  "members": [
    {
      "id": "a0000001-0000-0000-0000-000000000001",
      "familyId": "aaaaaaaa-0000-0000-0000-000000000001",
      "userId": null,
      "fullName": "Nguyễn Văn Hùng",
      "nickname": "Cụ Hùng",
      "gender": "MALE",
      "birthDate": "1820-03-15",
      "deathDate": "1885-08-20",
      "birthPlace": "Thanh Hóa",
      "currentLocation": "Hà Nội",
      "occupation": "Nông dân - Thợ mộc",
      "generationId": "aaaa1111-0000-0000-0000-000000000001",
      "avatarUrl": null,
      "biography": "Cụ tổ khai sáng dòng họ Nguyễn...",
      "isAlive": false,
      "linkedUser": null,
      "relationships": [
        {
          "id": "...",
          "fromMemberId": "a0000001-...",
          "toMemberId": "a0000002-...",
          "type": "SPOUSE"
        }
      ]
    }
  ]
}
```

### Errors

- `401 Unauthorized`
- `403 Forbidden` — not a member
- `404 Not Found` — family missing

### Example

```bash
# All members
curl "http://localhost:8080/api/families/aaaaaaaa-0000-0000-0000-000000000001/members" \
  -H "Authorization: Bearer <accessToken>"

# Filter: living members in generation 5
curl "http://localhost:8080/api/families/aaaaaaaa-0000-0000-0000-000000000001/members?generationId=aaaa1111-0000-0000-0000-000000000005&aliveOnly=true" \
  -H "Authorization: Bearer <accessToken>"
```

### Notes

- `linkedUser` is the `UserDto` of the linked account (or `null`).
- `relationships` carries the edges originating **from** this member (parent/spouse/sibling). The back-end does not deduplicate edges for both endpoints, so a `SPOUSE` edge appears on both spouses.

---

## POST /families/{familyId}/members

Add a new member to a family.

### Request

**Headers**:
- `Authorization: Bearer <accessToken>` (required)
- `Content-Type: application/json`

**Body**:
```json
{
  "fullName": "Nguyễn Văn Mới",
  "nickname": "Mới",
  "gender": "MALE",
  "birthDate": "1990-05-15",
  "deathDate": null,
  "birthPlace": "Hà Nội",
  "currentLocation": "TP. Hồ Chí Minh",
  "occupation": "Kỹ sư",
  "generationId": "aaaa1111-0000-0000-0000-000000000005",
  "biography": "Cháu đời thứ 5 của dòng họ.",
  "userId": null,
  "avatarUrl": null
}
```

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `fullName` | string | yes | 1-255 chars |
| `gender` | enum | yes | `MALE` / `FEMALE` / `OTHER` |
| `generationId` | UUID | yes | must belong to the same family |
| `birthDate` | date | no | – |
| `deathDate` | date | no | – |
| `nickname` | string | no | – |
| `birthPlace` | string | no | – |
| `currentLocation` | string | no | – |
| `occupation` | string | no | – |
| `biography` | string | no | – |
| `avatarUrl` | string | no | – |
| `userId` | UUID | no | link this member to a registered user account |

### Response — `201 Created`

```json
{
  "member": { ...MemberDto... }
}
```

### Errors

- `400 Bad Request` — validation error
- `401 Unauthorized`
- `403 Forbidden` — caller is not a member (or not ADMIN if your role policy is strict)
- `404 Not Found` — family or generationId not found

### Example

```bash
curl -X POST http://localhost:8080/api/families/aaaaaaaa-0000-0000-0000-000000000001/members \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName":"Nguyễn Văn Mới",
    "gender":"MALE",
    "generationId":"aaaa1111-0000-0000-0000-000000000005"
  }'
```

### Notes

- After creating the member, add relationship edges via `POST /relationships` (see below).

---

## GET /members/{memberId}

Fetch a single member with their relationships.

### Request

**Headers**: `Authorization: Bearer <accessToken>` (required)

**Path parameters**: `memberId` (UUID, required)

### Response — `200 OK`

```json
{
  "id": "a0000003-0000-0000-0000-000000000003",
  "familyId": "aaaaaaaa-0000-0000-0000-000000000001",
  "userId": null,
  "fullName": "Nguyễn Văn Đức",
  "gender": "MALE",
  "birthDate": "1860-04-12",
  "deathDate": "1930-11-02",
  "occupation": "Nghệ nhân làm bánh",
  "biography": "...",
  "generationId": "aaaa1111-0000-0000-0000-000000000002",
  "relationships": [
    {
      "id": "r-001",
      "fromMemberId": "a0000003-...",
      "toMemberId": "a0000005-...",
      "type": "SPOUSE",
      "startDate": "1885-02-10"
    }
  ]
}
```

### Errors

- `401 Unauthorized`
- `403 Forbidden` — caller is not a member of the same family
- `404 Not Found`

### Example

```bash
curl http://localhost:8080/api/members/a0000003-0000-0000-0000-000000000003 \
  -H "Authorization: Bearer <accessToken>"
```

---

## PUT /members/{memberId}

Update a member.

### Request

**Body** (any subset of `CreateMemberRequest` fields, plus `isAlive`):
```json
{
  "occupation": "Nghệ nhân làm bánh (đã sửa)",
  "biography": "Đoạn văn cập nhật...",
  "deathDate": "1930-11-02",
  "isAlive": false
}
```

### Response — `200 OK`

```json
{
  "member": { ...updated MemberDto... }
}
```

### Errors

- `400 Bad Request`
- `401 Unauthorized`
- `403 Forbidden` — not ADMIN (or the linked user themselves for limited fields)
- `404 Not Found`

### Example

```bash
curl -X PUT http://localhost:8080/api/members/a0000003-0000-0000-0000-000000000003 \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"occupation":"Nghệ nhân làm bánh"}'
```

---

## DELETE /members/{memberId}

Delete a member.

### Request

**Path parameters**: `memberId` (UUID, required)

### Response — `200 OK`

```json
{ "message": "Đã xoá thành viên" }
```

### Errors

- `401 Unauthorized`
- `403 Forbidden` — not ADMIN
- `404 Not Found`

### Example

```bash
curl -X DELETE http://localhost:8080/api/members/a0000003-0000-0000-0000-000000000003 \
  -H "Authorization: Bearer <accessToken>"
```

### Notes

- The relationship edges where this member participates are deleted by cascade (FK constraint).

---

## Relationships

Relationship edges connect two members. The `type` is one of:

| Type | Meaning |
| --- | --- |
| `PARENT` | fromMember is parent of toMember |
| `CHILD` | inverse of PARENT (semantic only; the back-end typically stores PARENT edges) |
| `SPOUSE` | married / partner |
| `SIBLING` | share at least one parent |

### POST /relationships

```bash
curl -X POST http://localhost:8080/api/relationships \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "familyId": "aaaaaaaa-0000-0000-0000-000000000001",
    "fromMemberId": "a0000001-0000-0000-0000-000000000001",
    "toMemberId": "a0000003-0000-0000-0000-000000000003",
    "relationshipType": "PARENT",
    "startDate": "1860-04-12",
    "notes": "Cụ Hùng là cha của cụ Đức."
  }'
```

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `familyId` | UUID | yes | both members must belong to this family |
| `fromMemberId` | UUID | yes | – |
| `toMemberId` | UUID | yes | must be different |
| `relationshipType` | enum | yes | `PARENT`, `SPOUSE`, `SIBLING`, `CHILD` |
| `startDate` | date | no | – |
| `notes` | string | no | – |

Response — `201 Created`:
```json
{
  "relationship": {
    "id": "r-uuid",
    "familyId": "aaaaaaaa-0000-0000-0000-000000000001",
    "fromMemberId": "...",
    "toMemberId": "...",
    "relationshipType": "PARENT",
    "startDate": "1860-04-12",
    "notes": "..."
  }
}
```

Errors: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

### PUT /relationships/{relationshipId}

Update an existing edge (e.g. add `notes`, change `startDate`):

```bash
curl -X PUT http://localhost:8080/api/relationships/r-uuid \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"notes":"Cập nhật chú thích"}'
```

Response — `200 OK` with the updated relationship.

### DELETE /relationships/{relationshipId}

```bash
curl -X DELETE http://localhost:8080/api/relationships/r-uuid \
  -H "Authorization: Bearer <accessToken>"
```

Response — `200 OK` with `{ "message": "Đã xoá quan hệ" }`.

---

## Family Member Achievements

Members can be awarded achievements (badges) — see [achievements.md](./achievements.md).

```bash
# Awards for a member
curl http://localhost:8080/api/members/a0000003-0000-0000-0000-000000000003/achievements \
  -H "Authorization: Bearer <accessToken>"
```

---

## See also

- [families.md](./families.md) — family metadata, generations, family tree
- [recipes.md](./recipes.md) — recipe genealogy uses member ids as endpoints
- [achievements.md](./achievements.md) — per-member awards