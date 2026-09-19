# CâyGiaPhảSố — REST API Reference

> **CâyGiaPhảSố** (AncestryTree) is a digital family-tree platform that combines classic genealogy with heritage features like family recipes, time-locked stories, time capsules, events, and family chat.

This section is the canonical reference for every HTTP endpoint exposed by the Spring Boot backend.

- **Base URL**: `http://localhost:8080/api`
- **Auth**: JWT Bearer tokens (access + refresh)
- **Format**: JSON (`application/json`)
- **API style**: REST, JWT-secured, snake_case/camelCase in payloads as emitted by the DTOs
- **Spring context-path**: `/api` (so every controller path is prefixed with `/api`)

---

## Table of contents

| Resource | Doc | Highlights |
| --- | --- | --- |
| Authentication & users | [authentication.md](./authentication.md), [users.md](./users.md) | JWT register / login / refresh / logout / me, profile update, user search |
| Families & members | [families.md](./families.md), [members.md](./members.md) | Create / join / update family, generations, members, relationships, invitations, family tree ⭐ |
| Recipes & genealogy | [recipes.md](./recipes.md) | CRUD, public search, **recipe origins (genealogy)** ⭐, **genealogy tree** ⭐, reactions, comments |
| Stories | [stories.md](./stories.md) | CRUD, story tags, media |
| Time capsules | [time-capsules.md](./time-capsules.md) | **Date-locked messages** ⭐ — list / create / open / delete |
| Events & RSVP | [events.md](./events.md) | CRUD, RSVP, event photos |
| Photos & albums | [photos.md](./photos.md) | Albums, photos |
| Family chat | [chat.md](./chat.md) | Per-family group chat, messages |
| Notifications | [notifications.md](./notifications.md) | List / mark read / mark all read |
| Achievements | [achievements.md](./achievements.md) | Catalog and per-member awards |

> ⭐ marks the **novel** features of CâyGiaPhảSố — these are the differentiating endpoints that don't exist in classic genealogy tools.

---

## Conventions used in this reference

### HTTP status codes

| Code | Meaning |
| --- | --- |
| `200 OK` | Successful read / update |
| `201 Created` | Resource created |
| `204 No Content` | Empty success (not currently used) |
| `400 Bad Request` | Validation error — body is present but invalid |
| `401 Unauthorized` | Missing or invalid JWT |
| `403 Forbidden` | Authenticated but not allowed (e.g. opening a locked time capsule) |
| `404 Not Found` | Resource missing or not visible to current user |
| `409 Conflict` | Uniqueness violation (e.g. duplicate email) |
| `429 Too Many Requests` | Rate-limited (login / register) |
| `500 Internal Server Error` | Unhandled exception (always includes a Vietnamese message) |

### Error envelope

Spring Boot returns `application/problem+json` for errors thrown by the global exception handler. The shape is:

```json
{
  "timestamp": "2026-09-19T03:14:15.123Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Email không hợp lệ",
  "path": "/api/auth/register"
}
```

Validation errors return field-level details:

```json
{
  "timestamp": "2026-09-19T03:14:15.123Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "fieldErrors": {
    "email": "Email không hợp lệ",
    "password": "Mật khẩu phải có ít nhất 8 ký tự"
  },
  "path": "/api/auth/register"
}
```

### Timestamps & ids

- All ids are **UUID v4** strings.
- Timestamps are **ISO-8601 with offset** (e.g. `2026-09-19T10:30:00+07:00`).
- Dates without a time use **`yyyy-MM-dd`** (e.g. `2026-09-19`).

### Authentication header

Every authenticated endpoint expects:

```
Authorization: Bearer <accessToken>
```

The access token is obtained from `POST /api/auth/login` or `POST /api/auth/register` and is valid for 7 days (`JWT_EXPIRATION=604800000` ms by default). Refresh with `POST /api/auth/refresh`.

### Pagination

Some list endpoints accept `page` (zero-based) and `size` (default `20`). Paginated responses include:

```json
{
  "items": [ ... ],
  "page": 0,
  "size": 20,
  "totalItems": 152,
  "totalPages": 8
}
```

---

## Quickstart (30 seconds)

```bash
# 1. Login with a seed account
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nguyen-family.vn","password":"Password123!"}'

# 2. Use the returned accessToken in subsequent calls
curl http://localhost:8080/api/auth/me \
  -H "Authorization: Bearer <accessToken>"

# 3. List families the user belongs to
curl http://localhost:8080/api/families \
  -H "Authorization: Bearer <accessToken>"
```

> Seed accounts (all use password `Password123!`):
> - `admin@nguyen-family.vn` — Nguyễn Văn An (owner of Họ Nguyễn)
> - `lan@nguyen-family.vn` — Nguyễn Thị Lan (member of Họ Nguyễn)
> - `minh@nguyen-family.vn` — Nguyễn Minh
> - `hoa@tran-family.vn` — Trần Thị Hoa (owner of Họ Trần)
> - `tuan@le-family.vn` — Lê Văn Tuấn (owner of Họ Lê)

See [setup/README.md](../setup/README.md) for full installation instructions.

---

## Endpoint summary

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| **Auth** | | | |
| POST | `/auth/register` | – | Register a new user |
| POST | `/auth/login` | – | Login and receive JWT tokens |
| POST | `/auth/refresh` | – | Exchange refresh token for new access token |
| POST | `/auth/logout` | JWT | Invalidate the refresh token |
| GET | `/auth/me` | JWT | Get current authenticated user |
| **Users** | | | |
| GET | `/users/{id}` | JWT | Get user by id |
| PUT | `/users/me` | JWT | Update own profile |
| GET | `/users/search?q=...` | JWT | Search users |
| **Families** | | | |
| POST | `/families` | JWT | Create a new family |
| GET | `/families` | JWT | List families I belong to |
| POST | `/families/join` | JWT | Join via invite code |
| GET | `/families/{familyId}` | JWT | Family detail (generations, heritages, stats) |
| PUT | `/families/{familyId}` | JWT (ADMIN) | Update family metadata |
| GET | `/families/{familyId}/generations` | JWT | List generations |
| POST | `/families/{familyId}/generations` | JWT | Create a generation |
| DELETE | `/generations/{id}` | JWT | Delete a generation |
| GET | `/families/{familyId}/members` | JWT | List members (filterable) |
| POST | `/families/{familyId}/members` | JWT | Add a member |
| GET | `/members/{id}` | JWT | Member detail |
| PUT | `/members/{id}` | JWT | Update member |
| DELETE | `/members/{id}` | JWT | Delete member |
| GET | `/families/{familyId}/tree` | JWT | **Family tree ⭐** (nested generations) |
| POST | `/relationships` | JWT | Create relationship edge |
| PUT | `/relationships/{id}` | JWT | Update relationship edge |
| DELETE | `/relationships/{id}` | JWT | Delete relationship edge |
| POST | `/families/{familyId}/invitations` | JWT (ADMIN) | Create an invite |
| GET | `/families/{familyId}/heritages` | JWT | List heritages |
| POST | `/families/{familyId}/heritages` | JWT | Create heritage |
| **Recipes ⭐** | | | |
| GET | `/families/{familyId}/recipes` | JWT | List family recipes (filterable) |
| POST | `/families/{familyId}/recipes` | JWT | Create recipe (incl. ingredients/steps/origins) |
| GET | `/recipes/{id}` | JWT | Recipe detail with everything |
| PUT | `/recipes/{id}` | JWT | Update recipe |
| DELETE | `/recipes/{id}` | JWT | Delete recipe |
| GET | `/recipes/public` | – | Public recipe search |
| POST | `/recipes/{id}/origins` | JWT | **Add genealogy edge** ⭐ |
| GET | `/recipes/{id}/origins` | JWT | List genealogy edges |
| GET | `/recipes/{id}/genealogy-tree` | JWT | **Full genealogy tree** ⭐ |
| POST | `/recipes/{id}/reactions` | JWT | Toggle reaction |
| DELETE | `/recipes/{id}/reactions` | JWT | Remove reaction |
| GET | `/recipes/{id}/reactions` | JWT | Counts + users |
| POST | `/recipes/{id}/comments` | JWT | Add comment (top-level or reply) |
| GET | `/recipes/{id}/comments` | JWT | Threaded comments |
| PUT | `/comments/{commentId}` | JWT | Update comment |
| DELETE | `/comments/{commentId}` | JWT | Delete comment |
| **Stories** | | | |
| GET | `/families/{familyId}/stories` | JWT | List stories |
| POST | `/families/{familyId}/stories` | JWT | Create story |
| GET | `/stories/{id}` | JWT | Story detail |
| PUT | `/stories/{id}` | JWT | Update story |
| DELETE | `/stories/{id}` | JWT | Delete story |
| GET | `/story-tags` | JWT | List story tags |
| POST | `/story-tags` | JWT | Create tag |
| **Time Capsules ⭐** | | | |
| GET | `/families/{familyId}/time-capsules` | JWT | List capsules |
| POST | `/families/{familyId}/time-capsules` | JWT | Create capsule |
| POST | `/time-capsules/{id}/open` | JWT | **Open (gated by unlock_date / condition)** ⭐ |
| DELETE | `/time-capsules/{id}` | JWT | Delete capsule |
| **Events** | | | |
| GET | `/families/{familyId}/events` | JWT | List events |
| POST | `/families/{familyId}/events` | JWT | Create event |
| PUT | `/events/{id}` | JWT | Update event |
| DELETE | `/events/{id}` | JWT | Delete event |
| POST | `/events/{id}/rsvp` | JWT | RSVP to event |
| POST | `/events/{id}/photos` | JWT | Attach event photo |
| GET | `/events/{id}/photos` | JWT | List event photos |
| **Photo Albums** | | | |
| GET | `/families/{familyId}/albums` | JWT | List albums |
| POST | `/families/{familyId}/albums` | JWT | Create album |
| GET | `/albums/{albumId}/photos` | JWT | List photos in album |
| POST | `/albums/{albumId}/photos` | JWT | Add photo to album |
| **Chat** | | | |
| GET | `/families/{familyId}/chats` | JWT | List family chats |
| POST | `/families/{familyId}/chats` | JWT | Create chat |
| GET | `/chats/{chatId}/messages` | JWT | List messages |
| POST | `/chats/{chatId}/messages` | JWT | Send message |
| **Notifications** | | | |
| GET | `/notifications` | JWT | List notifications |
| POST | `/notifications/{id}/read` | JWT | Mark one as read |
| POST | `/notifications/read-all` | JWT | Mark all as read |
| **Achievements** | | | |
| GET | `/achievements` | JWT | Catalog |
| GET | `/members/{memberId}/achievements` | JWT | Awards for member |
| POST | `/members/{memberId}/achievements` | JWT | Award achievement |

**Total: 76 endpoints** documented across this folder.

---

## See also

- [Postman collection](../postman/README.md) — importable v2.1 collection with environment
- [Testing guides](../api-testing/README.md) — how to exercise each endpoint
- [Setup guide](../setup/README.md) — bring the stack up locally