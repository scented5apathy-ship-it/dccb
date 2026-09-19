# CâyGiaPhảSố — Detailed Schema Reference

All tables live in the `caygiaphaso` schema inside the `skillseed` database.
Conventions:
- PK: `UUID DEFAULT gen_random_uuid()` (requires `pgcrypto`)
- Timestamps: `TIMESTAMPTZ DEFAULT NOW()`
- Strings: `TEXT`
- Status / type fields: `TEXT` with `CHECK` constraint (so the value set can be extended without DDL)
- `ON DELETE CASCADE` for owned children, `ON DELETE SET NULL` for optional links, `ON DELETE RESTRICT` for root entities

---

## A. USERS & AUTH

### `users`
| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK | |
| `email` | TEXT | UNIQUE, NOT NULL | |
| `password_hash` | TEXT | NOT NULL | bcrypt |
| `full_name` | TEXT | NOT NULL | |
| `avatar_url` | TEXT | | |
| `phone` | TEXT | | |
| `bio` | TEXT | | |
| `is_active` | BOOLEAN | DEFAULT TRUE | |
| `email_verified` | BOOLEAN | DEFAULT FALSE | |
| `last_login_at` | TIMESTAMPTZ | | |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW(), NOT NULL | |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW(), NOT NULL | trigger |

Indexes: `email`, `is_active`, `created_at`.

### `refresh_tokens`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `user_id` | UUID | FK → `users.id` ON DELETE CASCADE |
| `token` | TEXT | UNIQUE |
| `expires_at` | TIMESTAMPTZ | |
| `revoked_at` | TIMESTAMPTZ | nullable |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() |

---

## B. FAMILY CORE

### `families`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `name` | TEXT | NOT NULL |
| `description` | TEXT | |
| `founded_year` | INTEGER | CHECK 0..3000 |
| `motto` | TEXT | |
| `logo_url` / `cover_image_url` | TEXT | |
| `origin_location` | TEXT | |
| `member_count` | INTEGER | CHECK ≥ 0 (denormalised; updated by triggers or app) |
| `created_by` | UUID | FK → `users.id` ON DELETE RESTRICT |
| `created_at` / `updated_at` | TIMESTAMPTZ | |

### `generations`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `family_id` | UUID | FK → `families.id` ON DELETE CASCADE |
| `generation_number` | INTEGER | CHECK > 0 |
| `name` | TEXT | e.g. "Đời 1 - Cụ tổ" |
| `start_year` / `end_year` | INTEGER | |
| `description` | TEXT | |
| UNIQUE | (`family_id`, `generation_number`) | |

### `family_members`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `family_id` | UUID | FK → `families.id` ON DELETE CASCADE |
| `user_id` | UUID | FK → `users.id` ON DELETE SET NULL (a member may not yet be a system user) |
| `full_name` | TEXT | NOT NULL |
| `nickname` | TEXT | |
| `avatar_url` | TEXT | |
| `gender` | TEXT | CHECK in `MALE`, `FEMALE`, `OTHER` |
| `birth_date` / `death_date` | DATE | CHECK death ≥ birth |
| `birth_place` / `current_location` | TEXT | |
| `occupation` | TEXT | |
| `biography` | TEXT | |
| `generation_id` | UUID | FK → `generations.id` ON DELETE SET NULL |
| `is_alive` | BOOLEAN | DEFAULT TRUE |

Indexes: `family_id`, `user_id`, `generation_id`, `full_name`.

### `relationships`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `family_id` | UUID | FK → `families.id` |
| `from_member_id` | UUID | FK → `family_members.id` |
| `to_member_id` | UUID | FK → `family_members.id` |
| `relationship_type` | TEXT | CHECK in `PARENT`, `CHILD`, `SPOUSE`, `SIBLING`, `ADOPTED`, `GODPARENT` |
| `start_date` / `end_date` | DATE | |
| `notes` | TEXT | |
| CHECK | `from_member_id <> to_member_id` | |

Composite index: `(from_member_id, to_member_id)`.

### `family_invitations`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `family_id` | UUID | FK CASCADE |
| `inviter_id` | UUID | FK CASCADE |
| `invitee_email` | TEXT | |
| `invite_code` | TEXT | UNIQUE |
| `role` | TEXT | CHECK in `ADMIN`, `EDITOR`, `VIEWER` |
| `expires_at` | TIMESTAMPTZ | |
| `accepted_at` | TIMESTAMPTZ | nullable |

---

## C. RECIPES (with genealogy)

### `recipes`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `family_id` | UUID | FK CASCADE |
| `author_id` | UUID | FK → `users.id` RESTRICT |
| `title`, `description`, `story` | TEXT | `story` is the family memory around the dish |
| `cuisine_type` | TEXT | |
| `difficulty` | TEXT | CHECK in `EASY`, `MEDIUM`, `HARD` |
| `prep_time_minutes`, `cook_time_minutes`, `servings` | INTEGER | |
| `instructions` | TEXT | short summary |
| `image_url` | TEXT | |
| `is_public` | BOOLEAN | DEFAULT FALSE |
| `view_count` | INTEGER | CHECK ≥ 0 |

### `recipe_ingredients`
Order-indexed list of ingredients for a recipe. `quantity` is `NUMERIC(10,2)`.

### `recipe_steps`
Step-by-step instructions. UNIQUE on (`recipe_id`, `step_number`).

### `recipe_origins`  *(genealogy edge)*
| Column | Type | Notes |
|---|---|---|
| `recipe_id` | UUID | FK CASCADE |
| `from_member_id` | UUID | FK → `family_members.id` (giver) |
| `to_member_id` | UUID | FK → `family_members.id` (receiver) |
| `year_transmitted` | INTEGER | |
| `generation_gap` | INTEGER | CHECK ≥ 0 |
| `story` | TEXT | narrative about the transmission |

CHECK: `from_member_id <> to_member_id`. This is the heart of the "recipe genealogy" feature.

### `recipe_reactions`
`reaction_type` ∈ `LIKE`, `LOVE`, `YUM`, `WANT_TO_TRY`. UNIQUE(`recipe_id`, `user_id`, `reaction_type`).

### `recipe_comments`
Self-referential for threaded replies (`parent_comment_id` → `recipe_comments.id`).

---

## D. STORIES

### `stories`
| Column | Type | Notes |
|---|---|---|
| `related_member_ids` | `UUID[]` | GIN-indexed array of member IDs |
| `related_generation_id` | UUID | FK SET NULL |
| `is_featured` | BOOLEAN | DEFAULT FALSE |

### `story_media`, `story_tags`, `story_tag_map`
Media: `media_type` ∈ `IMAGE`, `VIDEO`, `AUDIO`, `DOCUMENT`. Tags: simple unique name. Map: many-to-many.

---

## E. TIME CAPSULES

### `time_capsules`
| Column | Type | Notes |
|---|---|---|
| `unlock_condition` | TEXT | CHECK in `DATE`, `EVENT`, `MANUAL` |
| `unlock_date` | DATE | required when `unlock_condition = 'DATE'` (CHECK) |
| `recipient_member_id` | UUID | optional FK |
| `is_opened`, `opened_at`, `opened_by` | | |

View `v_time_capsule_status` computes a `current_status` of `OPENED` / `AVAILABLE` / `LOCKED`.

---

## F. EVENTS

### `events`
- `event_type` ∈ `WEDDING`, `FUNERAL`, `BIRTHDAY`, `REUNION`, `ANNIVERSARY`, `RELIGIOUS`, `OTHER`
- `latitude` / `longitude` validated via CHECK bounds
- `end_date >= event_date`

### `event_attendees`
- `rsvp_status` ∈ `GOING`, `MAYBE`, `NOT_GOING`, `PENDING`
- UNIQUE(`event_id`, `member_id`)

### `event_photos`
Free-form photo gallery per event.

---

## G. PHOTOS

### `photo_albums`
A logical container of photos within a family.

### `photos`
- `member_ids` `UUID[]` (GIN index) — quick lookup "photos containing member X"

### `photo_tags`
Polymorphic-ish tag table:
- `tag_type ∈ MEMBER, LOCATION, EVENT`
- CHECK ensures only the relevant FK is set:
  - `MEMBER` → `tagged_member_id` set, `tagged_event_id` NULL
  - `EVENT` → `tagged_event_id` set, `tagged_member_id` NULL
  - `LOCATION` → both NULL (just a free text label elsewhere)

---

## H. CHAT

### `family_chats`
One default chat per family, plus optional topic chats.

### `chat_members`
UNIQUE(`chat_id`, `user_id`). `role` ∈ `MEMBER`, `ADMIN`.

### `chat_messages`
- `message_type` ∈ `TEXT`, `IMAGE`, `FILE`, `SYSTEM`
- `reply_to_message_id` → self-reference for threading
- `sender_id` SET NULL on user delete (preserve the message thread)

---

## I. ENGAGEMENT

### `achievements`
Static catalogue (`code` UNIQUE) of achievements and their point values.

### `member_achievements`
Earned-by relation. UNIQUE(`member_id`, `achievement_id`).

### `family_heritages`
Holds the symbolic / traditional artefacts of a family: `heritage_type` ∈ `MOTTO`, `SYMBOL`, `TRADITION`, `SONG`, `STORY`, `RECIPE`.

### `notifications`
- `notification_type` is free-form (e.g. `RECIPE`, `COMMENT`, `EVENT`, `CHAT`, `ACHIEVEMENT`, `TIME_CAPSULE`)
- `related_entity_type` + `related_entity_id` for polymorphic links (no FK by design)
- Index `(user_id, is_read)` for unread badge queries

### `comments` (generic polymorphic)
- `entity_type ∈ STORY, PHOTO, EVENT`
- `entity_id` is a UUID with no FK (by design — polymorphic)

### `reactions` (generic polymorphic)
- `reaction_type ∈ LIKE, LOVE, YUM, WANT_TO_TRY`
- UNIQUE(`entity_type`, `entity_id`, `user_id`, `reaction_type`)

---

## Index strategy
- Every FK column has a dedicated b-tree index.
- Composite indexes for hot paths:
  - `relationships(from_member_id, to_member_id)`
  - `recipes(family_id, author_id)`
  - `notifications(user_id, is_read)`
- GIN indexes for array columns:
  - `stories.related_member_ids`
  - `photos.member_ids`
- Partial-style behaviour via CHECK for tag-table exclusivity.

## Triggers
A single `set_updated_at()` function is attached to tables with an `updated_at` column:
`users`, `families`, `family_members`, `recipes`, `stories`, `events`, `recipe_comments`.

## Re-running migrations
The migration files are idempotent at the **DDL** level (each file uses `CREATE TABLE` / `CREATE OR REPLACE VIEW`). Re-running the entire sequence drops & recreates the `caygiaphaso` schema first (see README).