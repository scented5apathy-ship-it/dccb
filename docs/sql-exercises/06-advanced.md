# Module 06 — Advanced

> **Difficulty**: Advanced · **Time**: 90 min · **Builds on**: Modules 01–05.

## Learning objectives

- Use **correlated subqueries** to compare each row against an aggregate of the whole.
- Express existence / non-existence with `EXISTS` / `NOT EXISTS`.
- Combine results with `ANY` / `ALL`.
- Materialise intermediate results with non-recursive CTEs.
- Pivot data with `CASE` / `FILTER`; unpivot with `UNNEST`.
- Use Postgres-native operators on `jsonb` and `UUID[]` columns.
- Run **full-text search** with `to_tsvector` / `to_tsquery`.
- Read `EXPLAIN ANALYZE` and apply targeted indexes.

## Concepts

### Correlated subqueries

A correlated subquery references a column from the outer query — it is re-evaluated
once per row:

```sql
-- Recipes whose view_count is above the *family* average
SELECT r.title,
       r.view_count,
       (SELECT AVG(view_count)
          FROM recipes r2
         WHERE r2.family_id = r.family_id) AS family_avg
FROM   recipes r
WHERE  r.view_count > (SELECT AVG(view_count)
                          FROM recipes r2
                         WHERE r2.family_id = r.family_id);
```

These are equivalent to window functions for many use cases. Choose:

- **Window function** when you need the aggregate *next to* every row.
- **Correlated subquery** when you need to *filter on* the aggregate.

### `EXISTS` and `NOT EXISTS`

`EXISTS` is true when the subquery returns at least one row. It is **short-circuit**:
Postgres stops scanning as soon as it finds one match. Use it for "has any / has none"
checks:

```sql
SELECT f.name
FROM   families f
WHERE  EXISTS (SELECT 1 FROM time_capsules tc WHERE tc.family_id = f.id);
```

`NOT EXISTS` is the idiomatic "anti-join" pattern.

### `ANY` / `ALL`

```sql
-- view_count greater than ANY difficulty-EASY average
... WHERE r.view_count > ANY (
        SELECT AVG(view_count) FROM recipes WHERE difficulty = 'EASY'
      );

-- view_count greater than ALL of those averages
... WHERE r.view_count > ALL (
        SELECT AVG(view_count) FROM recipes WHERE difficulty = 'EASY'
      );
```

### CTEs (non-recursive)

A plain `WITH` clause materialises a subquery once and gives it a name:

```sql
WITH family_recipe_stats AS (
    SELECT family_id,
           COUNT(*)        AS recipe_count,
           AVG(view_count) AS avg_views
    FROM   recipes
    GROUP BY family_id
)
SELECT f.name, s.recipe_count, ROUND(s.avg_views::numeric, 1) AS avg_views
FROM   families f
JOIN   family_recipe_stats s ON s.family_id = f.id;
```

CTEs do not change semantics — they are equivalent to inlining the subquery. They exist
for **readability** and (with the `MATERIALIZED` hint in older versions) sometimes for
performance.

### PIVOT / UNPIVOT

Postgres has no dedicated PIVOT/UNPIVOT keywords, but the pattern is built from
`FILTER` (Module 03) and `UNNEST`:

```sql
-- Pivot recipe counts by (cuisine, difficulty) → columns per difficulty
SELECT cuisine_type,
       COUNT(*) FILTER (WHERE difficulty = 'EASY')   AS easy,
       COUNT(*) FILTER (WHERE difficulty = 'MEDIUM') AS medium,
       COUNT(*) FILTER (WHERE difficulty = 'HARD')   AS hard
FROM   recipes
GROUP BY cuisine_type;
```

To **unpivot**, take columns and turn them into rows using `UNNEST` + `ARRAY`:

```sql
SELECT cuisine_type, 'EASY'   AS difficulty, easy   AS n FROM pivoted
UNION ALL
SELECT cuisine_type, 'MEDIUM' AS difficulty, medium AS n FROM pivoted
UNION ALL
SELECT cuisine_type, 'HARD'   AS difficulty, hard   AS n FROM pivoted;
```

### JSON / JSONB

CâyGiaPhảSố doesn't store JSON columns today, but Postgres's `jsonb` operators are
useful on extension tables. Quick reference:

| Operator                | Meaning                                  |
|-------------------------|------------------------------------------|
| `column -> 'key'`       | JSON value as `jsonb`.                   |
| `column ->> 'key'`      | JSON value as `text`.                    |
| `column @> '{"k":"v"}'` | Contains (great for filters).            |
| `column ? 'key'`        | Has key.                                 |
| `jsonb_array_elements(column -> 'arr')` | Unwrap an array.             |

### Array operations

The `related_member_ids` (stories) and `member_ids` (photos) columns are `UUID[]` and
GIN-indexed. Common operators:

```sql
WHERE 'a0000001-0000-0000-0000-000000000001' = ANY(related_member_ids)
WHERE related_member_ids && ARRAY['a0000001-...', 'a0000002-...']   -- overlap
WHERE array_length(related_member_ids, 1) >= 3
```

### Full-text search

`to_tsvector(text)` parses text into a search vector; `to_tsquery('expr')` parses a
query. The `@@` operator matches them:

```sql
SELECT title
FROM   recipes
WHERE  to_tsvector('simple', title || ' ' || description) @@
       to_tsquery('simple', 'bánh & chưng');
```

The `'simple'` config keeps diacritics; `'vietnamese'` does stemming (if installed).
Prefix matching uses `to_tsquery('simple', 'bánh:*')`.

### `EXPLAIN ANALYZE`

```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT ... ;
```

Reading plans:

- Top line is the **overall cost** (planning + execution estimate).
- Each node is one step (`Seq Scan`, `Index Scan`, `Hash Join`, `Nested Loop`, ...).
- `actual time=` shows real wall-clock milliseconds.
- `rows=` is the planner's estimate; mismatches with `actual rows=` hint at stale
  statistics — run `ANALYZE table_name` to refresh.
- `BUFFERS` shows shared/local block reads — high numbers signal a missing index.

---

## Exercises

### Exercise 1: Members whose recipe count > family average

**Difficulty**: Medium · **Objective**: A correlated subquery that filters on an
aggregate.

**Question**: For every user, count how many recipes they have authored. Then list
users whose recipe count is **greater than the average** recipe count per user.

**Schema**: `caygiaphaso.recipes(author_id)`, `caygiaphaso.users(id, full_name)`

**Hint**: Two levels — count per user, then compare against the average of those counts.

**Solution**:

```sql
WITH counts AS (
    SELECT u.id, u.full_name, COUNT(r.id) AS recipe_count
    FROM   users u
    LEFT   JOIN recipes r ON r.author_id = u.id
    GROUP  BY u.id, u.full_name
)
SELECT full_name, recipe_count
FROM   counts
WHERE  recipe_count > (SELECT AVG(recipe_count) FROM counts)
ORDER  BY recipe_count DESC;
```

**Explanation**: We compute per-user counts in a CTE, then compare each row against the
average across all rows in the same CTE. `LEFT JOIN` makes sure users with zero recipes
appear with `0`.

**Expected output** (in the original seed there are 5 users with recipe counts 5, 5, 2, 2,
0):

```
     full_name     | recipe_count
-------------------+--------------
 Lê Văn Tuấn       |            5
 Trần Thị Hoa      |            5
 Nguyễn Thị Lan    |            3
 Nguyễn Văn An     |            3
```

---

### Exercise 2: Latest event per family (correlated subquery)

**Difficulty**: Medium-Hard · **Objective**: Use a correlated subquery to filter on the
maximum per group.

**Question**: For every family, find the most recent event. Show family name, event
title, and event date.

**Schema**: `caygiaphaso.events(family_id, event_date, ...)`, `caygiaphaso.families(id, name)`

**Hint**: For each family row, the correlated subquery checks "no event exists that is
newer". Use `NOT EXISTS` to express that elegantly.

**Solution**:

```sql
SELECT f.name AS family, e.title, e.event_date::date AS event_date
FROM   events e
JOIN   families f ON f.id = e.family_id
WHERE  NOT EXISTS (
    SELECT 1
    FROM   events newer
    WHERE  newer.family_id  = e.family_id
      AND  newer.event_date > e.event_date
)
ORDER BY e.event_date;
```

**Explanation**: This is the classic **anti-join** pattern: the row survives if there is
no newer sibling in the same family. It avoids window functions entirely.

**Expected output**:

```
       family        |          title           | event_date
---------------------+--------------------------+------------
 Gia tộc họ Lê       | Họp mặt gia đình cuối năm | 2024-12-30
 Gia tộc họ Nguyễn   | Họp mặt họ Nguyễn 2024    | 2024-12-31
 Gia tộc họ Trần     | Sinh nhật ông Sơn 80 tuổi | 2025-05-30
```

---

### Exercise 3: Pivot cuisine counts into columns

**Difficulty**: Medium · **Objective**: Manual PIVOT.

**Question**: Build a table with one row per cuisine, and one column per `difficulty`.
Values are the number of recipes at that intersection.

**Schema**: `caygiaphaso.recipes(cuisine_type, difficulty)`

**Solution**:

```sql
SELECT cuisine_type,
       COUNT(*) FILTER (WHERE difficulty = 'EASY')   AS easy,
       COUNT(*) FILTER (WHERE difficulty = 'MEDIUM') AS medium,
       COUNT(*) FILTER (WHERE difficulty = 'HARD')   AS hard,
       COUNT(*)                                     AS total
FROM   recipes
GROUP BY cuisine_type
ORDER BY cuisine_type;
```

**Expected output**:

```
 cuisine_type | easy | medium | hard | total
--------------+------+--------+------+--------
 Miền Bắc     |    2 |      4 |    1 |      7
 Miền Nam     |    2 |      2 |    1 |      5
 Miền Trung   |    1 |      3 |    1 |      5
```

---

### Exercise 4: Full-text search over recipes

**Difficulty**: Medium · **Objective**: `to_tsvector` + `to_tsquery`.

**Question**: Find every recipe whose concatenated title + description + instructions
matches the query `'bánh'`. Use the `'simple'` config so we keep diacritics.

**Schema**: `caygiaphaso.recipes(title, description, instructions)`

**Hint**: Build a `tsvector` from `title || ' ' || description || ' ' || instructions`
and compare to `to_tsquery('simple', 'bánh')`.

**Solution**:

```sql
SELECT title,
       ts_rank(to_tsvector('simple',
                           title || ' ' || COALESCE(description,'') || ' ' ||
                           COALESCE(instructions,'')),
               to_tsquery('simple','bánh')) AS rank
FROM   recipes
WHERE  to_tsvector('simple',
                   title || ' ' || COALESCE(description,'') || ' ' ||
                   COALESCE(instructions,''))
       @@ to_tsquery('simple','bánh')
ORDER BY rank DESC;
```

**Explanation**: We build the same `tsvector` twice — once in `WHERE`, once in
`ts_rank`. In production, materialise it into a generated column with a GIN index:

```sql
ALTER TABLE recipes
    ADD COLUMN search_doc tsvector
    GENERATED ALWAYS AS (
        to_tsvector('simple', title || ' ' || COALESCE(description,'') || ' ' || instructions)
    ) STORED;
CREATE INDEX idx_recipes_search ON recipes USING GIN (search_doc);
```

Then queries become:

```sql
SELECT title FROM recipes WHERE search_doc @@ to_tsquery('simple','bánh');
```

**Expected output**:

```
            title            | rank
-----------------------------+------
 Bánh chưng làng Đông Ngạc   | 0.06
 Bánh nậm Huế                | 0.06
 Bánh xèo miền Tây           | 0.06
 Nem rán ngày Tết             | 0.05
```

---

### Exercise 5: Photos tagged with a specific member

**Difficulty**: Medium · **Objective**: Use the `UUID[]` array operators.

**Question**: Find every photo that tags a member with id `'a0000009-0000-0000-0000-000000000009'`
(Bác An). Show photo URL, caption, and uploader name.

**Schema**: `caygiaphaso.photos(member_ids UUID[])`, `caygiaphaso.users(id, full_name)`

**Hint**: `'a0000009-...' = ANY(member_ids)` checks membership. The GIN index on
`member_ids` makes this fast.

**Solution**:

```sql
SELECT p.photo_url,
       p.caption,
       u.full_name AS uploader
FROM   photos p
JOIN   users u ON u.id = p.uploader_id
WHERE  'a0000009-0000-0000-0000-000000000009' = ANY(p.member_ids)
ORDER BY p.created_at DESC;
```

**Expected output**:

```
              photo_url              |    caption    | uploader
--------------------------------------+---------------+----------
 https://example.com/photo-wedding-2.jpg | Bố mẹ chú rể | Nguyễn Thị Lan (con)
 https://example.com/photo-tet-1.jpg    | Cả gia đình… | Nguyễn Văn An
```

---

### Exercise 6: Stories that reference a member

**Difficulty**: Medium · **Objective**: Another `UUID[]` example with a different operator.

**Question**: Find every story that references *any* member of the Nguyễn đời 1
(generation_number = 1). Use `&&` (array overlap) and a subquery that builds the array.

**Schema**: `caygiaphaso.stories(related_member_ids)`,
`caygiaphaso.generations`, `caygiaphaso.family_members`

**Solution**:

```sql
SELECT s.title,
       s.story_date,
       COUNT(*) OVER () AS matching_stories
FROM   stories s
WHERE  s.related_member_ids &&
       (SELECT array_agg(fm.id)
          FROM family_members fm
          JOIN generations  g ON g.id = fm.generation_id
         WHERE g.family_id = 'aaaaaaaa-0000-0000-0000-000000000001'
           AND g.generation_number = 1);
```

**Explanation**: `&&` is "array overlap" — true if the two arrays share at least one
element. The subquery builds the array of Nguyễn đời 1 member IDs at runtime.

**Expected output**:

```
             title              | story_date
--------------------------------+------------
 Hồi tưởng về cụ tổ Nguyễn…    | 1870-05-10
 Bí quyết bánh chưng 5 đời     | 1880-12-30
```

---

### Exercise 7: Families with an unopened time capsule (`EXISTS`)

**Difficulty**: Medium · **Objective**: Express "has at least one" with `EXISTS`.

**Question**: List every family that has at least one **time capsule** that is
**not yet opened** (`is_opened = FALSE`).

**Schema**: `caygiaphaso.families`, `caygiaphaso.time_capsules(family_id, is_opened)`

**Hint**: `EXISTS (subquery)` is true when the subquery returns at least one row.

**Solution**:

```sql
SELECT f.id, f.name
FROM   families f
WHERE  EXISTS (
    SELECT 1
    FROM   time_capsules tc
    WHERE  tc.family_id = f.id
      AND  tc.is_opened  = FALSE
)
ORDER BY f.name;
```

**Expected output**:

```
                  id                  |     name
--------------------------------------+----------------
 aaaaaaaa-0000-0000-0000-000000000001 | Gia tộc họ Nguyễn
 bbbbbbbb-0000-0000-0000-000000000002 | Gia tộc họ Trần
 cccccccc-0000-0000-0000-000000000003 | Gia tộc họ Lê
```

> Every family qualifies in the seed; use `NOT EXISTS` to find families with **no**
> capsules (an empty result set is the expected answer).

---

### Exercise 8: Use `EXPLAIN ANALYZE` to find a missing index

**Difficulty**: Medium-Hard · **Objective**: Read a query plan.

**Question**: The seed does not have an index on `family_members.full_name`, so a name
lookup currently does a sequential scan. Run `EXPLAIN ANALYZE` on the lookup, then
create the index and run again to compare.

**Schema**: `caygiaphaso.family_members(full_name, ...)`

**Hint 1**: The query is `SELECT * FROM family_members WHERE full_name = 'Nguyễn Văn An';`

**Hint 2**: Postgres does already have an index — `idx_family_members_full_name`. Look
at the plan; with only 50 rows the planner may still pick a seq scan because it
estimates the index lookup as more expensive.

**Step 1 — read the plan**:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM family_members WHERE full_name = 'Nguyễn Văn An';
```

**Plan (before any forced index)**:

```
 Seq Scan on family_members  (cost=0.00..2.64 rows=1 width=259)
                              (actual time=0.015..0.023 rows=1 loops=1)
   Filter: (full_name = 'Nguyễn Văn An'::text)
   Rows Removed by Filter: 50
 Planning Time: 0.827 ms
 Execution Time: 0.081 ms
```

**Step 2 — disable seq scan for this experiment**:

```sql
SET enable_seqscan = OFF;
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM family_members WHERE full_name = 'Nguyễn Văn An';
RESET enable_seqscan;
```

**Plan (with seq scan off)**:

```
 Index Scan using idx_family_members_full_name on family_members
       (cost=0.27..8.29 rows=1 width=259) (actual time=0.025..0.027 rows=1 loops=1)
   Index Cond: (full_name = 'Nguyễn Văn An'::text)
   Buffers: shared hit=2
 Execution Time: 0.040 ms
```

**Explanation**: The planner was right — with only 50 rows, the index lookup is
*actually* slower than the sequential scan because of the extra buffer hit. As the table
grows past a few thousand rows the planner will switch to the index automatically.

**Take-aways**:

- `EXPLAIN ANALYZE` is *evidence*, not a guess.
- Don't over-index — write-heavy tables pay a price on every INSERT.
- For very small tables, seq scans are usually fine.

---

### Exercise 9: Compare two query plans with `EXPLAIN`

**Difficulty**: Medium-Hard · **Objective**: Diagnose a regression.

**Question**: Compare the cost of finding a member by id using `WHERE id = '...'` versus
joining to a related table on the same column.

**Plan A — direct lookup**:

```sql
EXPLAIN ANALYZE
SELECT * FROM family_members WHERE id = 'a0000009-0000-0000-0000-000000000009';
```

**Plan B — joined lookup**:

```sql
EXPLAIN ANALYZE
SELECT fm.*
FROM   family_members fm
JOIN   relationships r ON r.from_member_id = fm.id
WHERE  fm.id = 'a0000009-0000-0000-0000-000000000009'
LIMIT  1;
```

**Explanation**: Plan A is a single `Index Scan` using the PK index, cost ≈ 8. Plan B
adds a `Nested Loop` join — cost grows with the number of relationships. Even with
`LIMIT 1`, the join cost dominates for popular members. **Always prefer the simpler
query unless you actually need the join.**

---

### Exercise 10: Most popular ingredient across all recipes

**Difficulty**: Hard · **Objective**: Window-function ranking on a grouped set.

**Question**: For every ingredient, count how many recipes use it. Show the top 5 along
with how many recipes it appears in.

**Schema**: `caygiaphaso.recipe_ingredients(name, recipe_id)`

**Hint**: `GROUP BY name`, `ORDER BY count DESC`.

**Solution**:

```sql
SELECT name,
       COUNT(DISTINCT recipe_id) AS recipe_count,
       RANK() OVER (ORDER BY COUNT(DISTINCT recipe_id) DESC) AS popularity_rank
FROM   recipe_ingredients
GROUP BY name
ORDER BY recipe_count DESC, name
LIMIT  5;
```

**Explanation**: `COUNT(DISTINCT recipe_id)` is defensive — even if the same recipe
listed the same ingredient twice, it would count once.

**Expected output**:

```
  name  | recipe_count | popularity_rank
--------+--------------+-----------------
 (only a handful of ingredients exist in the seed; this exercise focuses on the pattern)
```

> The seed only has ingredients for the first recipe in each family. Adapt the limit or
> remove it to see the full list. A more realistic seed would have a long ingredient
> table — the SQL pattern remains identical.

---

## Stretch / Try it yourself

1. **Anti-join**: families with **no** time capsules at all.
2. **JSON extraction**: add a temporary `jsonb` column to one table and query it with
   `->`, `->>`, and `@>`.
3. **Materialised view**: create a view `mv_family_stats` that aggregates member count,
   recipe count, event count, and story count per family.
4. **Window + correlated subquery**: combine `RANK()` over a per-family partition with a
   `WHERE` clause that filters by an aggregate of the whole set.
5. **Partial index**: `CREATE INDEX ... WHERE is_opened = FALSE` on time_capsules, then
   `EXPLAIN ANALYZE` a query that filters on that column.

---

## Where to go from here

You have now seen the entire SQL surface that CâyGiaPhảSố actually uses:

| Topic                                | Module |
|--------------------------------------|--------|
| Basic SELECT/WHERE                   | 01     |
| JOINs                                | 02     |
| GROUP BY / HAVING                    | 03     |
| Window functions                     | 04     |
| Recursive CTEs (genealogy!)          | 05     |
| Subqueries, JSONB, FTS, EXPLAIN      | 06     |

For deeper dives:

- `database/SCHEMA.md` — every column, every index, every constraint.
- `backend/src/main/resources/db/migration/V3__create_views.sql` — the views that
  capture common queries, many of which use the same techniques above.
- Postgres docs at https://www.postgresql.org/docs/16/ — particularly the chapters on
  *Window Functions*, *Recursive Queries*, and *Performance Tips*.

Happy querying.