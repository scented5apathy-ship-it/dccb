# Recipes API ⭐

> **The signature feature of CâyGiaPhảSố.** Recipes are not just cooking instructions — they carry a **genealogy** that records who passed the recipe to whom, generation by generation.

Recipes live inside a family. A recipe has:

- Body: `title`, `description`, `story`, `instructions`, `cuisine_type`, `difficulty`, timings, servings, `image_url`, `is_public`
- Sub-collections: `ingredients[]`, `steps[]` (both ordered)
- **Genealogy edges** (`recipe_origins`): who passed the recipe to whom, with year and generation gap
- Engagement: `reactions`, `comments` (threaded)

The most novel endpoint is `GET /api/recipes/{id}/genealogy-tree`, which returns the **full nested tree** of how a recipe travelled through the family.

---

## Difficulty enum

```text
EASY | MEDIUM | HARD
```

## Reaction types

```text
LIKE | LOVE | YUM | WANT_TO_TRY
```

---

## GET /families/{familyId}/recipes

List recipes for a family with filters and pagination.

### Request

**Headers**: `Authorization: Bearer <accessToken>` (required)

**Path parameters**: `familyId` (UUID, required)

**Query parameters** (all optional):
| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `cuisine` | string | – | `Miền Bắc`, `Miền Trung`, `Miền Nam`, … |
| `difficulty` | string | – | `EASY`, `MEDIUM`, `HARD` |
| `search` | string | – | substring match on `title` / `description` |
| `authorId` | UUID | – | only recipes by this user |
| `page` | int | 0 | zero-based |
| `size` | int | 20 | – |

### Response — `200 OK`

```json
{
  "items": [
    {
      "id": "aaaa2222-0000-0000-0000-000000000001",
      "familyId": "aaaaaaaa-0000-0000-0000-000000000001",
      "authorId": "11111111-1111-1111-1111-111111111111",
      "title": "Bánh chưng làng Đông Ngạc",
      "description": "Bánh chưng truyền thống của dòng họ Nguyễn với công thức 5 đời",
      "story": "Công thức này được cụ Đức sáng tạo năm 1880, truyền qua 5 đời.",
      "cuisineType": "Miền Bắc",
      "difficulty": "HARD",
      "prepTimeMinutes": 240,
      "cookTimeMinutes": 720,
      "servings": 8,
      "instructions": "Ngâm gạo nếp qua đêm. Gói bánh bằng lá dong rửa sạch. Luộc liên tục 12 tiếng với lửa nhỏ.",
      "imageUrl": "https://example.com/banh-chung.jpg",
      "isPublic": true,
      "viewCount": 1520,
      "createdAt": "2024-01-01T00:00:00+07:00",
      "updatedAt": "2026-09-19T03:14:15+07:00",
      "author": {
        "id": "11111111-...",
        "fullName": "Nguyễn Văn An",
        "avatarUrl": "https://i.pravatar.cc/300?u=an"
      },
      "ingredientCount": 8,
      "stepCount": 6,
      "reactionCount": 24,
      "commentCount": 5
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
- `403 Forbidden` — not a member
- `404 Not Found` — family missing

### Example

```bash
# All recipes in Họ Nguyễn
curl "http://localhost:8080/api/families/aaaaaaaa-0000-0000-0000-000000000001/recipes" \
  -H "Authorization: Bearer <accessToken>"

# Filter: easy recipes mentioning "canh"
curl "http://localhost:8080/api/families/aaaaaaaa-0000-0000-0000-000000000001/recipes?difficulty=EASY&search=canh" \
  -H "Authorization: Bearer <accessToken>"
```

---

## POST /families/{familyId}/recipes

Create a new recipe with its ingredients, ordered steps, **and initial genealogy origins** in a single atomic call.

### Request

**Headers**:
- `Authorization: Bearer <accessToken>` (required)
- `Content-Type: application/json`

**Body**:
```json
{
  "title": "Bánh chưng làng Đông Ngạc",
  "description": "Bánh chưng truyền thống 5 đời",
  "story": "Cụ Đức sáng tạo năm 1880.",
  "cuisineType": "Miền Bắc",
  "difficulty": "HARD",
  "prepTimeMinutes": 240,
  "cookTimeMinutes": 720,
  "servings": 8,
  "instructions": "Ngâm gạo nếp qua đêm. Gói bánh bằng lá dong rửa sạch. Luộc liên tục 12 tiếng với lửa nhỏ.",
  "imageUrl": "https://example.com/banh-chung.jpg",
  "isPublic": true,
  "ingredients": [
    { "name": "Gạo nếp cái hoa vàng", "quantity": 2, "unit": "kg", "orderIndex": 0 },
    { "name": "Đỗ xanh", "quantity": 0.5, "unit": "kg", "orderIndex": 1 },
    { "name": "Thịt ba chỉ", "quantity": 0.5, "unit": "kg", "orderIndex": 2 },
    { "name": "Lá dong", "quantity": 30, "unit": "lá", "orderIndex": 3 }
  ],
  "steps": [
    { "stepNumber": 1, "instruction": "Ngâm gạo nếp 8 tiếng", "durationMinutes": 480 },
    { "stepNumber": 2, "instruction": "Vo và đãi gạo", "durationMinutes": 30 },
    { "stepNumber": 3, "instruction": "Đồ đỗ xanh và làm nhân", "durationMinutes": 60 },
    { "stepNumber": 4, "instruction": "Gói bánh bằng lá dong", "durationMinutes": 120 },
    { "stepNumber": 5, "instruction": "Luộc 12 tiếng với lửa nhỏ", "durationMinutes": 720 }
  ],
  "origins": [
    {
      "fromMemberId": "a0000001-0000-0000-0000-000000000001",
      "toMemberId": "a0000003-0000-0000-0000-000000000003",
      "yearTransmitted": 1880,
      "generationGap": 1,
      "story": "Cụ Hùng truyền lại cho cụ Đức."
    },
    {
      "fromMemberId": "a0000003-0000-0000-0000-000000000003",
      "toMemberId": "a0000007-0000-0000-0000-000000000007",
      "yearTransmitted": 1910,
      "generationGap": 1,
      "story": "Cụ Đức truyền lại cho bà Hạnh."
    }
  ]
}
```

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` | string | yes | – |
| `description`, `story`, `cuisineType`, `imageUrl` | string | no | – |
| `difficulty` | enum | no | `EASY` / `MEDIUM` / `HARD` |
| `prepTimeMinutes`, `cookTimeMinutes`, `servings` | int | no | – |
| `instructions` | string | yes | – |
| `isPublic` | boolean | no | default `false` |
| `ingredients` | array | no | each: `{name, quantity, unit, orderIndex}` |
| `steps` | array | no | each: `{stepNumber, instruction, durationMinutes?}` |
| `origins` | array | no | each: `{fromMemberId, toMemberId, yearTransmitted?, generationGap?, story?}` |

### Response — `201 Created`

Full `RecipeDetailDto` (same shape as `GET /recipes/{id}` — see below).

### Errors

- `400 Bad Request` — missing `title` / `instructions`, invalid ingredients/steps
- `401 Unauthorized`
- `403 Forbidden` — not a member of the family
- `404 Not Found` — `fromMemberId` / `toMemberId` not in the family

### Example

```bash
curl -X POST http://localhost:8080/api/families/aaaaaaaa-0000-0000-0000-000000000001/recipes \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d @new-recipe.json
```

### Notes

- `authorId` is set to the current user.
- Origins must reference members of the **same family**. Each edge is `(fromMember → toMember)`.
- All sub-collections are persisted atomically — partial failure rolls back.

---

## GET /recipes/{recipeId}

Fetch a single recipe with everything (author, ingredients, steps, origins, reactions, comments).

### Request

**Headers**: `Authorization: Bearer <accessToken>` (required)

**Path parameters**: `recipeId` (UUID, required)

### Response — `200 OK`

```json
{
  "recipe": { ...RecipeDto... },
  "author": {
    "id": "11111111-...",
    "fullName": "Nguyễn Văn An",
    "avatarUrl": "https://i.pravatar.cc/300?u=an"
  },
  "ingredients": [
    { "id": "...", "name": "Gạo nếp cái hoa vàng", "quantity": 2, "unit": "kg", "orderIndex": 0 }
  ],
  "steps": [
    { "id": "...", "stepNumber": 1, "instruction": "Ngâm gạo nếp 8 tiếng", "durationMinutes": 480 }
  ],
  "origins": [
    {
      "id": "...",
      "recipeId": "aaaa2222-...",
      "fromMemberId": "a0000001-...",
      "toMemberId": "a0000003-...",
      "yearTransmitted": 1880,
      "generationGap": 1,
      "story": "Cụ Hùng truyền lại cho cụ Đức.",
      "createdAt": "2024-01-01T00:00:00+07:00",
      "fromMember": { "id": "a0000001-...", "fullName": "Nguyễn Văn Hùng", "generationNumber": 1, "generationName": "Đời 1 - Cụ tổ" },
      "toMember":   { "id": "a0000003-...", "fullName": "Nguyễn Văn Đức", "generationNumber": 2, "generationName": "Đời 2 - Cụ nội" }
    }
  ],
  "comments": [
    {
      "id": "...",
      "content": "Công thức này ngon lắm!",
      "createdAt": "2024-06-12T...",
      "author": { "id": "...", "fullName": "..." },
      "replies": [ ...nested CommentDto... ]
    }
  ],
  "reactions": {
    "like": 12,
    "love": 8,
    "yum": 4,
    "wantToTry": 0
  },
  "userReaction": "LOVE"
}
```

`userReaction` is the current user's reaction, or `null` if none.

### Errors

- `401 Unauthorized`
- `403 Forbidden` — recipe belongs to a family the caller cannot see
- `404 Not Found`

### Example

```bash
curl http://localhost:8080/api/recipes/aaaa2222-0000-0000-0000-000000000001 \
  -H "Authorization: Bearer <accessToken>"
```

### Notes

- `view_count` is incremented server-side on each successful response.

---

## PUT /recipes/{recipeId}

Update a recipe.

### Request

**Body** (any subset of `CreateRecipeRequest`; existing ingredients/steps/origins are **not** auto-replaced — pass the new list explicitly if you want to overwrite):

```json
{
  "title": "Bánh chưng làng Đông Ngạc (cập nhật)",
  "difficulty": "MEDIUM",
  "isPublic": true
}
```

### Response — `200 OK`

Updated `RecipeDetailDto`.

### Errors

- `400 Bad Request`
- `401 Unauthorized`
- `403 Forbidden` — not the author or ADMIN
- `404 Not Found`

### Example

```bash
curl -X PUT http://localhost:8080/api/recipes/aaaa2222-0000-0000-0000-000000000001 \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"difficulty":"MEDIUM"}'
```

---

## DELETE /recipes/{recipeId}

Delete a recipe and all its sub-collections (ingredients, steps, origins, reactions, comments) by cascade.

### Request

**Headers**: `Authorization: Bearer <accessToken>` (required)

### Response — `200 OK`

```json
{ "message": "Recipe deleted" }
```

### Errors

- `401 Unauthorized`
- `403 Forbidden`
- `404 Not Found`

### Example

```bash
curl -X DELETE http://localhost:8080/api/recipes/aaaa2222-0000-0000-0000-000000000001 \
  -H "Authorization: Bearer <accessToken>"
```

---

## GET /recipes/public

Public recipe search across **all** families (no auth required).

### Request

**Query parameters**: same as `/families/{familyId}/recipes` except `authorId`. Plus:
| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `sort` | string | `recent` | `recent` (created_at DESC) or `popular` (view_count DESC) |

### Response — `200 OK`

Same paginated shape as `GET /families/{familyId}/recipes` — but only recipes where `is_public = true`.

### Example

```bash
# No auth required
curl "http://localhost:8080/api/recipes/public?cuisine=Mi%E1%BB%81n%20B%E1%BA%AFc&sort=popular"
```

---

## Recipe genealogy ⭐ NOVEL FEATURE

### POST /recipes/{recipeId}/origins

Add a single genealogy edge (who received the recipe from whom).

```bash
curl -X POST http://localhost:8080/api/recipes/aaaa2222-0000-0000-0000-000000000001/origins \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "fromMemberId": "a0000007-0000-0000-0000-000000000007",
    "toMemberId": "a0000010-0000-0000-0000-000000000010",
    "yearTransmitted": 1960,
    "generationGap": 1,
    "story": "Bà Hạnh truyền lại cho con dâu."
  }'
```

### GET /recipes/{recipeId}/origins

List all edges for a recipe (flat list, chronological if `yearTransmitted` is set).

```bash
curl http://localhost:8080/api/recipes/aaaa2222-0000-0000-0000-000000000001/origins \
  -H "Authorization: Bearer <accessToken>"
```

### GET /recipes/{recipeId}/genealogy-tree ⭐

Return the **full nested tree** of how a recipe has travelled through the family.

```bash
curl http://localhost:8080/api/recipes/aaaa2222-0000-0000-0000-000000000001/genealogy-tree \
  -H "Authorization: Bearer <accessToken>" | jq .
```

**Response shape**:
```json
{
  "recipe": {
    "id": "aaaa2222-...",
    "title": "Bánh chưng làng Đông Ngạc"
  },
  "tree": {
    "member": {
      "id": "a0000001-...",
      "fullName": "Nguyễn Văn Hùng",
      "generationNumber": 1,
      "generationName": "Đời 1 - Cụ tổ"
    },
    "year": 1860,
    "story": "Cụ Hùng sáng tạo công thức đầu tiên.",
    "children": [
      {
        "member": { "id": "a0000003-...", "fullName": "Nguyễn Văn Đức", "generationNumber": 2, "generationName": "Đời 2 - Cụ nội" },
        "year": 1880,
        "story": "Cụ Đức sáng tạo năm 1880.",
        "children": [
          {
            "member": { "id": "a0000007-...", "fullName": "Nguyễn Thị Hạnh", "generationNumber": 3, "generationName": "Đời 3 - Ông bà nội" },
            "year": 1910,
            "story": "...",
            "children": [ ...recursive... ]
          }
        ]
      }
    ]
  },
  "totalGenerations": 5,
  "oldestYear": 1860,
  "newestYear": 2020
}
```

> The tree is built by joining `recipe_origins` to itself: each `toMember` becomes the `fromMember` of the next level. Members with multiple incoming edges appear multiple times; the visualisation can de-duplicate by member id if needed.

---

## Reactions

### POST /recipes/{recipeId}/reactions

Toggle (set or update) the current user's reaction.

```bash
curl -X POST http://localhost:8080/api/recipes/aaaa2222-0000-0000-0000-000000000001/reactions \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"reactionType":"LOVE"}'
```

Response — `200 OK`:
```json
{
  "like": 12, "love": 9, "yum": 4, "wantToTry": 0,
  "users": [
    { "userId": "...", "reactionType": "LOVE" }
  ],
  "total": 25
}
```

### DELETE /recipes/{recipeId}/reactions

Remove the current user's reaction (if any).

```bash
curl -X DELETE http://localhost:8080/api/recipes/aaaa2222-0000-0000-0000-000000000001/reactions \
  -H "Authorization: Bearer <accessToken>"
```

Response — `200 OK`:
```json
{ "message": "Reaction removed" }
```

### GET /recipes/{recipeId}/reactions

List current counts and the list of users who reacted.

```bash
curl http://localhost:8080/api/recipes/aaaa2222-0000-0000-0000-000000000001/reactions \
  -H "Authorization: Bearer <accessToken>"
```

---

## Comments

### POST /recipes/{recipeId}/comments

Add a top-level comment or a reply (set `parentCommentId`).

```bash
# Top-level
curl -X POST http://localhost:8080/api/recipes/aaaa2222-0000-0000-0000-000000000001/comments \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"content":"Công thức này ngon lắm!"}'

# Reply
curl -X POST http://localhost:8080/api/recipes/aaaa2222-0000-0000-0000-000000000001/comments \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"content":"Đồng ý!","parentCommentId":"comment-uuid"}'
```

Response — `200 OK`: the created `CommentDto` with id, content, author, createdAt.

### GET /recipes/{recipeId}/comments

List threaded comments (top-level + nested replies).

```bash
curl http://localhost:8080/api/recipes/aaaa2222-0000-0000-0000-000000000001/comments \
  -H "Authorization: Bearer <accessToken>"
```

### PUT /comments/{commentId}

Update a comment (author only).

```bash
curl -X PUT http://localhost:8080/api/comments/comment-uuid \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"content":"Cập nhật nội dung"}'
```

### DELETE /comments/{commentId}

Delete a comment (author or ADMIN).

```bash
curl -X DELETE http://localhost:8080/api/comments/comment-uuid \
  -H "Authorization: Bearer <accessToken>"
```

---

## See also

- [members.md](./members.md) — member ids used in origin edges
- [families.md](./families.md) — family-scoped endpoints
- [Postman collection](../postman/caygiaphaso.postman_collection.json) — all these endpoints are pre-wired with seed data