# SQL Exercises Guide — CâyGiaPhảSố (AncestryTree)

> A progressive, hands-on learning path for SQL through the lens of a real Vietnamese
> digital family-tree platform.

Welcome! This guide teaches SQL by querying the actual `caygiaphaso` schema that powers
**CâyGiaPhảSố** — a platform that helps families preserve recipes, stories, events, and
genealogy across generations. Every exercise uses real seed data drawn from three fictional
families: họ Nguyễn (5 generations, Hà Nội), họ Trần (4 generations, Huế), and họ Lê
(3 generations, TP. Hồ Chí Minh).

By the end of this guide you will be able to:

- Read and reason about a 33-table PostgreSQL schema.
- Translate family-genealogy questions (who is whose ancestor?) into SQL.
- Build **recursive CTEs** that walk both family trees **and** the recipe-transmission graph.
- Use window functions, aggregation, JSONB operators, and full-text search.
- Optimise queries with indexes and `EXPLAIN ANALYZE`.

---

## Prerequisites

| Tool               | Why                                                          |
|--------------------|--------------------------------------------------------------|
| Docker             | We run PostgreSQL 16 in a container named `skillseed-postgres`. |
| `psql` or pgAdmin  | Any PostgreSQL client — the guide uses standard SQL.         |
| Basic SQL literacy | Knowing `SELECT`, `WHERE`, `ORDER BY` will get you through Module 1. |

Confirm the database is up:

```bash
docker ps | grep skillseed-postgres
```

If the container is missing, start the project's full stack (see `backend/README.md`) or
just the database service from `docker-compose.yml`.

---

## Connecting

The schema lives in the `skillseed` database inside the `caygiaphaso` namespace.

### Option 1 — psql in Docker (recommended)

```bash
docker exec -it skillseed-postgres psql -U skillseed -d skillseed
```

Inside psql, always set the search path so unqualified table names resolve to `caygiaphaso`:

```sql
SET search_path = caygiaphaso, public;
```

You can verify the schema with:

```sql
\dt caygiaphaso.*
```

### Option 2 — One-shot queries

```bash
docker exec skillseed-postgres psql -U skillseed -d skillseed \
  -c "SET search_path = caygiaphaso; SELECT count(*) FROM family_members;"
```

### Option 3 — pgAdmin / DBeaver / TablePlus

Connect to `localhost:5432` with user `skillseed`, password `skillseed`, database `skillseed`.
Then either run `SET search_path = caygiaphaso;` per session, or qualify every table with
the `caygiaphaso.` prefix.

---

## Module overview

The guide is organised into six progressive modules. Each module opens with the **what**
and **why**, then walks you through 8–10 exercises that build on what you just learned.

| #  | Module                                       | Difficulty     | What you will master                                  |
|----|----------------------------------------------|----------------|--------------------------------------------------------|
| 01 | [Basic Queries](./01-basic-queries.md)       | Beginner       | `SELECT`, `WHERE`, `ORDER BY`, `NULL` handling, basic functions. |
| 02 | [JOINs](./02-joins.md)                       | Beginner→Inter | `INNER`/`LEFT`/`FULL` joins, self-joins, `USING` vs `ON`. |
| 03 | [Aggregations](./03-aggregations.md)         | Intermediate   | `GROUP BY`, `HAVING`, `STRING_AGG`, `FILTER`, `ROLLUP`. |
| 04 | [Window Functions](./04-window-functions.md) | Intermediate   | `OVER`, `PARTITION BY`, ranking, running totals.       |
| 05 | [Recursive CTE](./05-recursive-cte.md)       | **Advanced**   | `WITH RECURSIVE`, ancestor/descendant walks, recipe genealogy chains. |
| 06 | [Advanced](./06-advanced.md)                 | Advanced       | Correlated subqueries, `EXISTS`, `JSONB`, full-text search, `EXPLAIN ANALYZE`. |

> **Heads up:** Module 05 is the heart of this codebase. Family trees *and* the
> "recipe-genealogy" feature are both expressed as recursive CTEs. Plan to spend extra
> time there.

---

## How to use this guide

1. **Skim the objectives** at the top of each module so you know what to focus on.
2. **Read the concept section** before touching the exercises — it explains the *why*.
3. **Try each exercise yourself first.** Resist the urge to peek at the solution.
4. **Use the hint** (italicised beneath the question) only when stuck for more than five
   minutes.
5. **Read the explanation** after solving — even if your query returns the right rows, the
   explanation usually shows a cleaner or more idiomatic form.
6. **Run the queries for real.** Nothing beats seeing rows come back. Aim to actually
   execute at least one query per exercise; do *all* of them in Module 05.

> Each module ends with a **Stretch / Try it yourself** section that pushes beyond the
> prescribed exercises. Those are great warm-ups before moving to the next module.

---

## Database cheat-sheet

The `caygiaphaso` schema has 33 tables and 10 views. Below is a quick map; for full column
details see `database/SCHEMA.md`.

```
users ───────────────┐
                     ├── families ─── generations ─── family_members
                     │                       │              │
                     │                       │              ├── relationships (self)
                     │                       │              ├── member_achievements ── achievements
                     │                       │              └── (linked via user_id)
                     │                       │
                     │                       └──── events ──── event_attendees
                     │                                     └──── event_photos
                     │
                     ├── recipes ── recipe_ingredients
                     │          ├── recipe_steps
                     │          ├── recipe_origins   ← genealogy edges
                     │          ├── recipe_reactions
                     │          └── recipe_comments  (self-threaded)
                     │
                     ├── stories ── story_media
                     │         ├── story_tag_map ── story_tags
                     │         └── related_member_ids UUID[] (GIN-indexed)
                     │
                     ├── time_capsules ── (recipient_member_id → family_members)
                     │
                     ├── photo_albums ── photos (member_ids UUID[])
                     │             └── photo_tags
                     │
                     ├── family_chats ── chat_members
                     │             └── chat_messages (threaded)
                     │
                     ├── family_heritages, notifications, comments, reactions
```

### The 10 views you can lean on

| View                              | What it gives you                                                     |
|-----------------------------------|-----------------------------------------------------------------------|
| `v_family_summary`                | Family + creator + counts (members, recipes, stories, events).        |
| `v_member_with_user`              | `family_members` joined with `families`, `generations`, `users`.       |
| `v_relationships_full`            | Both endpoints of a relationship (from → to) with names.              |
| `v_recipe_genealogy`              | Recipe + giver + receiver + their generations + transmission story.   |
| `v_recipe_with_stats`             | Recipe + author + reaction/comment/origin counts.                      |
| `v_event_summary`                 | Event + creator + RSVP counts + photo count.                          |
| `v_story_with_media`              | Story + author + media count + tag array.                             |
| `v_time_capsule_status`           | Time capsule + computed `current_status` and `days_until_unlock`.     |
| `v_user_activity`                 | Per-user counts of authored recipes, stories, events, messages, etc.  |
| `v_active_notifications`          | Unread notifications with user name.                                  |

Whenever an exercise can be expressed with a view it will say so — but you'll usually write
the query yourself first, then compare with the view's definition in `V3__create_views.sql`.

### The seed data at a glance

- **5 users** with hashed passwords (dev-only, all are `Password123!`).
- **3 (originally 4) families** — họ Nguyễn (20 members, 5 generations), họ Trần (15 members, 4 generations), họ Lê (10 members, 3 generations).
- **16 recipes** with multi-generation transmission chains:
  - Bánh chưng: cụ Đức → ông Cương → cô Lan → Lan cháu.
  - Bún bò Huế: cụ Ngọc → bà Lệ → cô Hồng → Trần Văn Minh.
  - Cá kho tộ: bà Tươi → Tuấn & Hùng.
- **9 stories**, **8 events**, **5 time capsules**, **12 photos**, **6 achievements**.
- Use the **stable UUIDs** in the seed (e.g. `'aaaaaaaa-0000-0000-0000-000000000001'`) when
  you need to refer to a specific family or member.

---

## Tips for SQL testing in this codebase

1. **Always `SET search_path = caygiaphaso;`** at the start of a session.
2. **Wrap exploratory work in transactions** so a typo doesn't pollute your environment:
   ```sql
   BEGIN;
     -- your queries
   ROLLBACK;
   ```
3. **Use `\x`** in psql for expanded display — handy when rows have many columns.
4. **Use `EXPLAIN ANALYZE`** to understand query cost (covered in Module 06).
5. **Watch out for the seed `password_hash`** — it is a static dev-only bcrypt hash. Don't
   try to derive passwords from it; check the comments in `V2__seed_data.sql`.
6. **Comments in the seed** are in Vietnamese. They tell the human story behind each row —
   useful for picking realistic test cases.

---

## Suggested learning path

| If you are …                              | Spend the most time in …                                   |
|-------------------------------------------|-------------------------------------------------------------|
| New to SQL                                | Modules 01–02, doing every exercise.                        |
| Comfortable with joins                     | Modules 03–04, focus on the *partition by* problems.        |
| Preparing for backend interviews           | Module 05 — recursive CTEs are asked often.                 |
| Tuning real workloads                      | Module 06 (subqueries, JSONB, EXPLAIN).                     |
| Building a feature here                    | Module 05 + the relevant view in `V3__create_views.sql`.    |

---

## Conventions used in this guide

- SQL keywords are **UPPERCASE**, identifiers are `lowercase_snake_case` — matches the
  codebase.
- Inline comments in solutions use `--` and explain *why*, not *what*.
- Sample expected output is shown in psql's default formatting.
- All queries have been **run against the live seed data** — row counts and IDs you see
  are real.

Happy querying — and may your ancestors always be properly indexed.