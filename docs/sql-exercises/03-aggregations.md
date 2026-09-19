# Module 03 — Aggregations

> **Difficulty**: Intermediate · **Time**: 60 min · **Builds on**: Modules 01–02.

## Learning objectives

- Collapse rows into summaries with `GROUP BY`.
- Filter groups with `HAVING`.
- Use the standard aggregates `COUNT`, `SUM`, `AVG`, `MIN`, `MAX` plus `STRING_AGG`,
  `ARRAY_AGG`, and the Postgres `FILTER` clause.
- Compute multiple groupings in one query with `GROUPING SETS`, `ROLLUP`, and `CUBE`.

## Concepts

### `GROUP BY` and the "single value rule"

Whenever you mix aggregate and non-aggregate columns in `SELECT`, every non-aggregate
column **must** appear in `GROUP BY`:

```sql
SELECT cuisine_type, COUNT(*) AS n
FROM   recipes
GROUP BY cuisine_type;     -- one row per cuisine
```

### `WHERE` vs `HAVING`

- `WHERE` filters **rows** before aggregation.
- `HAVING` filters **groups** after aggregation.

```sql
SELECT cuisine_type, COUNT(*) AS n
FROM   recipes
WHERE  difficulty = 'MEDIUM'      -- first drop the non-MEDIUM rows
GROUP BY cuisine_type
HAVING COUNT(*) >= 2;             -- then drop cuisines with fewer than 2
```

### `FILTER` clause (Postgres only)

Conditional aggregation without a `CASE`:

```sql
SELECT cuisine_type,
       COUNT(*)                                       AS total,
       COUNT(*) FILTER (WHERE difficulty = 'EASY')    AS easy,
       COUNT(*) FILTER (WHERE difficulty = 'MEDIUM')  AS medium,
       COUNT(*) FILTER (WHERE difficulty = 'HARD')    AS hard
FROM   recipes
GROUP BY cuisine_type;
```

### `STRING_AGG`, `ARRAY_AGG`

Concatenate / collect values from many rows into one:

```sql
SELECT r.title,
       STRING_AGG(ri.name, ', ' ORDER BY ri.order_index) AS ingredients
FROM   recipes r
LEFT JOIN recipe_ingredients ri ON ri.recipe_id = r.id
GROUP BY r.id, r.title;
```

### `GROUPING SETS`, `ROLLUP`, `CUBE`

When you want subtotals + grand totals in one shot, these three are gold:

```sql
SELECT cuisine_type, difficulty, COUNT(*)
FROM   recipes
GROUP BY ROLLUP (cuisine_type, difficulty);
-- Adds rows where cuisine_type or (cuisine_type, difficulty) are NULL —
-- the NULL represents "all values" for that dimension.
```

| Form                      | What it produces                                |
|---------------------------|-------------------------------------------------|
| `GROUP BY a, b`           | One row per `(a, b)` pair.                      |
| `GROUP BY GROUPING SETS ((a, b), (a), ())` | a+b subtotals + grand total. |
| `GROUP BY ROLLUP (a, b)`  | Like above, but with the hierarchy baked in.    |
| `GROUP BY CUBE (a, b)`    | All 4 combinations (none, only a, only b, both).|

Use `GROUPING(col)` (returns 1 when the column is rolled up to NULL) to disambiguate.

---

## Exercises

### Exercise 1: Member count per family (descending)

**Difficulty**: Easy · **Objective**: Reinforce `JOIN` + `GROUP BY`.

**Question**: Show every family with at least one member, sorted by member count
descending.

**Schema**: `caygiaphaso.families`, `caygiaphaso.family_members`

**Hint**: Same shape as Module 02 Exercise 3, but order matters here.

**Solution**:

```sql
SELECT f.name,
       COUNT(*) AS member_count
FROM   families f
JOIN   family_members fm ON fm.family_id = f.id
GROUP BY f.id, f.name
ORDER BY member_count DESC;
```

**Expected output** (live dev seed includes an extra "Tester" member in the Nguyễn
family, so 21 instead of 20):

```
       name        | member_count
-------------------+--------------
 Gia tộc họ Nguyễn |           21
 Gia tộc họ Trần   |           15
 Gia tộc họ Lê     |           10
```

---

### Exercise 2: Average cook time per cuisine

**Difficulty**: Easy · **Objective**: `AVG` and a `NULL` filter.

**Question**: For each cuisine, compute the **average cook time** and the number of
recipes. Round to one decimal. Sort by average cook time descending.

**Schema**: `caygiaphaso.recipes(cuisine_type, cook_time_minutes, ...)`

**Hint**: `AVG(cook_time_minutes)` ignores rows with `NULL` cook time. Use
`ROUND(AVG(...)::numeric, 1)` for a clean display.

**Solution**:

```sql
SELECT cuisine_type,
       COUNT(*)                                    AS recipe_count,
       ROUND(AVG(cook_time_minutes)::numeric, 1)   AS avg_cook_time
FROM   recipes
GROUP BY cuisine_type
ORDER BY avg_cook_time DESC;
```

**Expected output**:

```
 cuisine_type | recipe_count | avg_cook_time
--------------+--------------+---------------
 Miền Bắc     |            7 |        163.6
 Miền Trung   |            5 |         73.0
 Miền Nam     |            5 |         60.0
```

---

### Exercise 3: Reactions per recipe type

**Difficulty**: Easy · **Objective**: `COUNT` + `GROUP BY` over a join.

**Question**: Show every recipe with its title and how many **reactions** it has
(across all reaction types). Show only recipes that actually have at least one reaction.
Sort by reaction count descending.

**Schema**: `caygiaphaso.recipes(id, title)`,
`caygiaphaso.recipe_reactions(recipe_id)`

**Hint**: Use `LEFT JOIN` with `IS NOT NULL` filter, or `INNER JOIN` (cleaner).

**Solution**:

```sql
SELECT r.title,
       COUNT(rr.user_id) AS reaction_count
FROM   recipes r
JOIN   recipe_reactions rr ON rr.recipe_id = r.id
GROUP BY r.id, r.title
ORDER BY reaction_count DESC, r.title;
```

**Expected output**:

```
        title         | reaction_count
----------------------+----------------
 Bánh chưng làng Đông Ngạc | 3
 Cá kho tộ miền Tây   |              2
 Bún bò Huế cung đình |              2
```

---

### Exercise 4: Events per type per family

**Difficulty**: Medium · **Objective**: Multi-column `GROUP BY`.

**Question**: Pivot events into a table with one row per family and one column per event
type. Use `FILTER` to count each type separately.

**Schema**: `caygiaphaso.events(family_id, event_type, ...)`,
`caygiaphaso.families(id, name)`

**Solution**:

```sql
SELECT f.name AS family,
       COUNT(*) FILTER (WHERE e.event_type = 'WEDDING')   AS wedding,
       COUNT(*) FILTER (WHERE e.event_type = 'FUNERAL')   AS funeral,
       COUNT(*) FILTER (WHERE e.event_type = 'BIRTHDAY')  AS birthday,
       COUNT(*) FILTER (WHERE e.event_type = 'REUNION')   AS reunion,
       COUNT(*) FILTER (WHERE e.event_type = 'RELIGIOUS') AS religious,
       COUNT(*) FILTER (WHERE e.event_type = 'OTHER')     AS other,
       COUNT(*)                                          AS total
FROM   events e
JOIN   families f ON f.id = e.family_id
GROUP BY f.id, f.name
ORDER BY total DESC;
```

**Explanation**: `FILTER (WHERE ...)` is more readable than `SUM(CASE WHEN ... THEN 1 END)`
and avoids a `CASE` per column. Each `COUNT(*)` only counts rows where the predicate is
true.

**Expected output**:

```
       family        | wedding | funeral | birthday | reunion | religious | other | total
---------------------+---------+---------+----------+---------+-----------+-------+------
 Gia tộc họ Nguyễn   |       1 |       1 |        0 |       1 |         0 |     0 |    3
 Gia tộc họ Trần     |       0 |       1 |        1 |       0 |         1 |     0 |    3
 Gia tộc họ Lê       |       0 |       0 |        0 |       1 |         0 |     1 |    2
```

---

### Exercise 5: Families with more than 10 members

**Difficulty**: Easy · **Objective**: Introduce `HAVING`.

**Question**: Show every family whose member count is **strictly greater than 10**.
Include the family name and the count.

**Schema**: `caygiaphaso.families`, `caygiaphaso.family_members`

**Hint**: `HAVING` filters *after* aggregation, so this is where `COUNT(*) > 10` belongs.

**Solution**:

```sql
SELECT f.name,
       COUNT(*) AS member_count
FROM   families f
JOIN   family_members fm ON fm.family_id = f.id
GROUP BY f.id, f.name
HAVING COUNT(*) > 10
ORDER BY member_count DESC;
```

**Expected output**:

```
       name        | member_count
-------------------+--------------
 Gia tộc họ Nguyễn |           20
 Gia tộc họ Trần   |           15
```

---

### Exercise 6: Average ingredients per recipe by difficulty

**Difficulty**: Easy–Medium · **Objective**: `AVG` over a count of children.

**Question**: For each difficulty level, show the average number of ingredients per
recipe and how many recipes there are. Sort by difficulty alphabetically.

**Schema**: `caygiaphaso.recipes(difficulty)`,
`caygiaphaso.recipe_ingredients(recipe_id)`

**Hint**: Compute `COUNT(ri.id)` per recipe first, then average over recipes. The
trick is a subquery or `LEFT JOIN` + `AVG`.

**Solution**:

```sql
SELECT r.difficulty,
       COUNT(DISTINCT r.id) AS recipe_count,
       ROUND(AVG(ingredient_counts.n)::numeric, 2) AS avg_ingredients
FROM   recipes r
LEFT JOIN (
    SELECT recipe_id, COUNT(*) AS n
    FROM   recipe_ingredients
    GROUP BY recipe_id
) ingredient_counts ON ingredient_counts.recipe_id = r.id
GROUP BY r.difficulty
ORDER BY r.difficulty;
```

**Explanation**: We need "average per-recipe ingredient count" — that's a two-level
aggregate. The subquery first counts ingredients per recipe; the outer query averages
those counts. `COUNT(DISTINCT r.id)` makes sure each recipe contributes once.

**Expected output**:

```
 difficulty | recipe_count | avg_ingredients
------------+--------------+-----------------
 EASY       |            5 |            0.60
 HARD       |            3 |            1.00
 MEDIUM     |            9 |            1.00
```

---

### Exercise 7: Top 5 most active recipe authors

**Difficulty**: Medium · **Objective**: Rank by aggregated author activity.

**Question**: List the 5 users who have authored the most recipes, with the recipe count.

**Schema**: `caygiaphaso.recipes(author_id)`, `caygiaphaso.users(id, full_name)`

**Hint**: `GROUP BY author_id`, `ORDER BY count DESC`, `LIMIT 5`.

**Solution**:

```sql
SELECT u.full_name,
       COUNT(r.id) AS recipe_count
FROM   users u
JOIN   recipes r ON r.author_id = u.id
GROUP BY u.id, u.full_name
ORDER BY recipe_count DESC
LIMIT  5;
```

**Expected output**:

```
    full_name     | recipe_count
------------------+--------------
 Lê Văn Tuấn      |            5
 Trần Thị Hoa     |            5
 Nguyễn Thị Lan (con) |        2
 Nguyễn Văn An    |            2
```

---

### Exercise 8: Unique media items per story

**Difficulty**: Medium · **Objective**: `COUNT(DISTINCT ...)` to avoid double-counting.

**Question**: For every story, show its title and the number of distinct media items.
Include stories with zero media. Sort by media count descending.

**Schema**: `caygiaphaso.stories(id, title)`,
`caygiaphaso.story_media(story_id, id)`

**Solution**:

```sql
SELECT s.title,
       COUNT(DISTINCT sm.id) AS media_count
FROM   stories s
LEFT JOIN story_media sm ON sm.story_id = s.id
GROUP BY s.id, s.title
ORDER BY media_count DESC, s.title;
```

**Explanation**: `COUNT(DISTINCT sm.id)` is the safe choice even when there's only one
join to `story_media`. If you ever add a second join that could fan out the same media
row, this protects you from double-counting.

**Expected output**:

```
                  title                  | media_count
-----------------------------------------+------------
 Hồi tưởng về cụ tổ Nguyễn Văn Hùng     |          2
 Ông nội và phong trào Duy Tân          |          2
 Bí quyết bánh chưng 5 đời              |          2
 Mâm cỗ Tết của bà Lệ                   |          1
 Mùa hè của bà Hạnh                     |          1
 Xây dựng CâyGiaPhảSố - hành tr…         |          1
 Ông Hòa - người thầy thuốc của làng    |          1
 Bà Tươi và gánh bánh xèo               |          1
 Minh mở nhà hàng tại Sydney            |          1
```

---

### Exercise 9: Total prep + cook time by cuisine

**Difficulty**: Easy · **Objective**: Sum multiple columns per group.

**Question**: For each cuisine, return the **total minutes** of prep and cook time across
all recipes. Sort by total minutes descending.

**Schema**: `caygiaphaso.recipes(cuisine_type, prep_time_minutes, cook_time_minutes)`

**Solution**:

```sql
SELECT cuisine_type,
       SUM(prep_time_minutes) AS total_prep,
       SUM(cook_time_minutes) AS total_cook,
       SUM(prep_time_minutes) + SUM(cook_time_minutes) AS total_minutes
FROM   recipes
GROUP BY cuisine_type
ORDER BY total_minutes DESC;
```

**Explanation**: `SUM` ignores `NULL`s, so recipes without a recorded prep or cook time
contribute `0`. If you instead wanted to *exclude* such recipes from the count, wrap the
sum in `COALESCE(SUM(...), 0)` or add `WHERE prep_time_minutes IS NOT NULL`.

**Expected output**:

```
 cuisine_type | total_prep | total_cook | total_minutes
--------------+------------+------------+--------------
 Miền Bắc     |        525 |       1145 |         1670
 Miền Trung   |        305 |        365 |          670
 Miền Nam     |        170 |        300 |          470
```

---

### Exercise 10: Cuisines with total cook time > 100 minutes

**Difficulty**: Medium · **Objective**: `HAVING` on a derived aggregate.

**Question**: Show every cuisine whose **total cook time** (across all recipes) is
greater than 100 minutes. Show cuisine, total cook time, and number of recipes.

**Schema**: `caygiaphaso.recipes(cuisine_type, cook_time_minutes)`

**Hint**: Aggregate first, filter with `HAVING SUM(cook_time_minutes) > 100`.

**Solution**:

```sql
SELECT cuisine_type,
       COUNT(*)                       AS recipe_count,
       SUM(cook_time_minutes)         AS total_cook
FROM   recipes
GROUP BY cuisine_type
HAVING SUM(cook_time_minutes) > 100
ORDER BY total_cook DESC;
```

**Explanation**: `HAVING` is the only place you can filter on the result of an
aggregate; `WHERE` would not see `SUM(...)`.

**Expected output**:

```
 cuisine_type | recipe_count | total_cook
--------------+--------------+------------
 Miền Bắc     |            7 |        965
 Miền Trung   |            5 |        365
 Miền Nam     |            5 |        300
```

> All three cuisines qualify; this is mostly an exercise in the syntax.

---

## Bonus: `ROLLUP` exercise

Use `ROLLUP` to get the same cuisine totals plus a grand total:

```sql
SELECT cuisine_type,
       COUNT(*)                       AS recipe_count,
       SUM(cook_time_minutes)         AS total_cook
FROM   recipes
GROUP BY ROLLUP (cuisine_type)
ORDER BY cuisine_type NULLS LAST;
```

The `NULL` row at the bottom is the **grand total** — `ROLLUP` adds it automatically.
Wrap cuisine in `COALESCE(cuisine_type, 'ALL')` if you prefer a friendlier label.

---

## Stretch / Try it yourself

1. **`HAVING` with multiple aggregates**: find cuisines where average cook time > 60
   *and* recipe count > 3.
2. **`ARRAY_AGG`**: list every story's media URLs in a single array column.
3. **`CUBE`**: produce a 2D summary with subtotals on `(cuisine_type, difficulty)`.
4. Use `FILTER` to count **only `LOVE`** reactions on each recipe.
5. **Achievement points per family** — join `member_achievements → family_members →
   families` and sum `points` per family.

---

## What's next

Module 04 introduces **window functions** — they let you keep individual rows visible
*and* aggregate them at the same time. You'll use them to rank recipes, compute running
totals, and find the first event per family without losing the underlying row data.