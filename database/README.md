# CâyGiaPhảSố — Database Overview

Digital family-tree platform. PostgreSQL 16 with Flyway migrations.

## Quick facts
- **DB engine:** PostgreSQL 16
- **Schema name:** `caygiaphaso` (isolated from existing `public` tables)
- **Migrations:** `backend/src/main/resources/db/migration/V1__init_schema.sql`, `V2__seed_data.sql`, `V3__create_views.sql`
- **Tables:** 33 base tables + 10 views
- **Seed:** 5 users, 3 families, 45 members, 16 recipes, 11 recipe origins, 9 stories, 5 time capsules, 8 events, 5 photo albums, etc.

## Entity groups
| Group | Tables |
|---|---|
| Users & Auth | `users`, `refresh_tokens` |
| Family core | `families`, `generations`, `family_members`, `relationships`, `family_invitations` |
| Recipes (with genealogy) | `recipes`, `recipe_ingredients`, `recipe_steps`, `recipe_origins`, `recipe_reactions`, `recipe_comments` |
| Stories | `stories`, `story_media`, `story_tags`, `story_tag_map` |
| Time capsules | `time_capsules` |
| Events | `events`, `event_attendees`, `event_photos` |
| Photos | `photo_albums`, `photos`, `photo_tags` |
| Chat | `family_chats`, `chat_members`, `chat_messages` |
| Engagement | `achievements`, `member_achievements`, `family_heritages`, `notifications`, `comments`, `reactions` |

## ER overview (text)

```
users ──┬── refresh_tokens
        └── families ──┬── generations
                        ├── family_members ──── users (optional)
                        │     └── relationships (self)
                        ├── family_invitations
                        ├── recipes ──┬── recipe_ingredients
                        │             ├── recipe_steps
                        │             ├── recipe_origins (genealogy)
                        │             ├── recipe_reactions
                        │             └── recipe_comments (self)
                        ├── stories ──┬── story_media
                        │             ├── story_tag_map ─── story_tags
                        │             └── comments (polymorphic)
                        ├── time_capsules ── family_members
                        ├── events ──┬── event_attendees ── family_members
                        │            └── event_photos
                        ├── photo_albums ── photos ──┬── photo_tags (MEMBER|EVENT)
                        │                           └── photo_tags (MEMBER|EVENT)
                        ├── family_chats ──┬── chat_members ── users
                        │                  └── chat_messages (self-reply)
                        ├── family_heritages
                        ├── notifications
                        ├── reactions (polymorphic)
                        ├── achievements ─── member_achievements
                        └── comments / reactions (polymorphic, generic)
```

## Sample queries

### Family summary (view)
```sql
SET search_path = caygiaphaso, public;
SELECT name, motto, member_count, recipe_count, event_count
FROM v_family_summary ORDER BY name;
```

### Recipe genealogy (how a recipe passes through generations)
```sql
SELECT recipe_title, from_member_name, from_generation_name,
       to_member_name, to_generation_name, year_transmitted
FROM v_recipe_genealogy
WHERE recipe_title LIKE '%Bánh chưng%'
ORDER BY year_transmitted;
```

### Recursive ancestor tree
```sql
WITH RECURSIVE ancestors AS (
  SELECT id, full_name, 0 AS depth
  FROM family_members WHERE full_name = 'Nguyễn Thị Lan (con)'
  UNION ALL
  SELECT fm.id, fm.full_name, a.depth + 1
  FROM ancestors a
  JOIN relationships r ON r.to_member_id = a.id AND r.relationship_type = 'PARENT'
  JOIN family_members fm ON fm.id = r.from_member_id
)
SELECT depth, full_name FROM ancestors ORDER BY depth DESC;
```

### Time capsule status
```sql
SELECT title, current_status, days_until_unlock, recipient_name
FROM v_time_capsule_status ORDER BY unlock_date;
```

### Top engaged users
```sql
SELECT full_name, recipes_authored, stories_authored, messages_sent
FROM v_user_activity
ORDER BY recipes_authored + stories_authored DESC LIMIT 5;
```

## Reset / clean

Drop & recreate the schema (all data is lost, including the project's tables):
```bash
docker exec skillseed-postgres psql -U skillseed -d skillseed \
  -c "DROP SCHEMA IF EXISTS caygiaphaso CASCADE; CREATE SCHEMA caygiaphaso;"
```

Then re-apply migrations:
```bash
for f in V1 V2 V3; do
  docker exec -i skillseed-postgres psql -U skillseed -d skillseed \
    -v ON_ERROR_STOP=1 -f /dev/stdin < \
    backend/src/main/resources/db/migration/${f}__*.sql
done
```

## Run with Spring Boot Flyway

The migrations directory `backend/src/main/resources/db/migration/` is the standard Flyway location configured in `application.yml`. The Spring Boot app will pick them up automatically on startup.

> Note: the existing `pom.xml` references `org.flywaydb:flyway-database-postgresql` without a `<version>`. Spring Boot 3.2.5's BOM doesn't manage that artifact (it's a Flyway 10.x split), so a `mvn flyway:migrate` from CLI will fail until either the dep is removed or pinned to a specific version. The Spring Boot app itself uses Flyway 9.22.3 which does NOT need the extra artifact.

## Reference
- Detailed schemas: [`SCHEMA.md`](./SCHEMA.md)