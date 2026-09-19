# Module 04 — Window Functions

> **Difficulty**: Intermediate · **Time**: 60 min · **Builds on**: Modules 02–03.

## Learning objectives

- Add aggregate-style columns **without losing individual rows** with `OVER()`.
- Reset the window per group using `PARTITION BY`.
- Rank rows with `ROW_NUMBER`, `RANK`, `DENSE_RANK`, and bucketise with `NTILE`.
- Compare adjacent rows using `LAG` / `LEAD`.
- Find first / last values per partition with `FIRST_VALUE` / `LAST_VALUE`.
- Compute running totals and moving averages.

## Concepts

### Why window functions?

Aggregates collapse rows; window functions keep them. The classic pain point:

> "I want every member with their family's average age, but I still need every individual
> row."

```sql
SELECT fm.full_name,
       fm.birth_date,
       AVG(EXTRACT(YEAR FROM fm.birth_date))
         OVER (PARTITION BY fm.family_id) AS family_avg_birth_year
FROM   family_members fm;
```

The syntax is `<aggregate>() OVER (PARTITION BY ... ORDER BY ...)`. The parentheses are
**required** even when empty (`OVER ()` = one global partition).

### `PARTITION BY` vs `GROUP BY`

| `GROUP BY`                       | `PARTITION BY`              |
|----------------------------------|-----------------------------|
| Collapses rows into one per group | Keeps every row             |
| One output row per group         | Same row count as input     |
| Used with aggregates             | Used with aggregates **and** other functions |

### Ranking

```sql
ROW_NUMBER()    -- 1, 2, 3, 4 — strictly unique, breaks ties arbitrarily
RANK()          -- 1, 2, 2, 4 — ties get the same rank, gaps after
DENSE_RANK()    -- 1, 2, 2, 3 — ties share rank, no gaps
NTILE(4)        -- bucketise into 4 groups per partition
```

`ORDER BY` inside `OVER` is what determines the order of the ranking.

### Look before / after: `LAG` / `LEAD`

```sql
LAG(col, n)  OVER (...)  -- the value n rows before in the partition
LEAD(col, n) OVER (...)  -- the value n rows after in the partition
```

The default `n` is 1. Both return `NULL` at the boundary.

### First / last values

```sql
FIRST_VALUE(col) OVER (...)   -- value in the first row of the window
LAST_VALUE(col)  OVER (...)   -- value in the last row of the *current* frame
                              -- (careful — needs a frame clause)
```

### Frame clause

The default frame is `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`. To make
`LAST_VALUE` work as expected, set an explicit frame:

```sql
LAST_VALUE(view_count) OVER (
    PARTITION BY cuisine_type
    ORDER BY view_count
    ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
)
```

### Running totals

```sql
SUM(col) OVER (PARTITION BY ... ORDER BY ... ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)
```

This is the standard recipe for "running totals" and time-series dashboards.

---

## Exercises

### Exercise 1: Rank members by birth date within each family

**Difficulty**: Easy · **Objective**: `PARTITION BY` + `RANK()`.

**Question**: Within each family, rank every member by their `birth_date` ascending
(oldest first). Show the family name, member, birth date, and rank. Filter to the three
core families to keep the output short.

**Schema**: `caygiaphaso.family_members(family_id, full_name, birth_date)`,
`caygiaphaso.families(id, name)`

**Solution**:

```sql
SELECT f.name            AS family,
       fm.full_name      AS member,
       fm.birth_date,
       RANK() OVER (PARTITION BY fm.family_id ORDER BY fm.birth_date) AS birth_rank
FROM   family_members fm
JOIN   families f ON f.id = fm.family_id
WHERE  f.name IN ('Gia tộc họ Nguyễn', 'Gia tộc họ Trần', 'Gia tộc họ Lê')
ORDER BY family, birth_rank;
```

**Explanation**: `PARTITION BY fm.family_id` resets the rank to 1 in every new family.
`ORDER BY fm.birth_date` defines "first". We then sort the result by family and rank.

**Expected output (first 5)**:

```
      family      |      member      | birth_date | birth_rank
------------------+------------------+------------+------------
 Gia tộc họ Lê    | Lê Văn Hòa       | 1940-05-10 |          1
 Gia tộc họ Lê    | Lê Thị Tươi      | 1945-09-18 |          2
 Gia tộc họ Lê    | Lê Văn Tuấn      | 1970-04-22 |          3
 Gia tộc họ Lê    | Lê Thị Hà        | 1972-11-30 |          4
 Gia tộc họ Lê    | Lê Văn Hùng      | 1975-07-08 |          5
```

---

### Exercise 2: Top 3 recipes per cuisine by views

**Difficulty**: Medium · **Objective**: `ROW_NUMBER` + `PARTITION BY` + filter via subquery.

**Question**: For every cuisine, find the top 3 most-viewed recipes. Show cuisine,
title, view count, and rank. Use `ROW_NUMBER` so ties are broken consistently.

**Schema**: `caygiaphaso.recipes(cuisine_type, title, view_count)`

**Hint**: Window first → wrap in a subquery → filter `WHERE rank <= 3`.

**Solution**:

```sql
SELECT cuisine_type, title, view_count, rank_in_cuisine
FROM   (
    SELECT cuisine_type,
           title,
           view_count,
           ROW_NUMBER() OVER (PARTITION BY cuisine_type ORDER BY view_count DESC) AS rank_in_cuisine
    FROM   recipes
) ranked
WHERE  rank_in_cuisine <= 3
ORDER BY cuisine_type, rank_in_cuisine;
```

**Explanation**: We can't write `WHERE ROW_NUMBER() ...` directly because window
functions aren't allowed in `WHERE`. The subquery is a standard workaround.

**Expected output**:

```
 cuisine_type |         title          | view_count | rank_in_cuisine
--------------+-------------------------+------------+-----------------
 Miền Bắc     | Bánh chưng làng Đông…   |       1522 |               1
 Miền Bắc     | Chả lá lốt thơm nức     |       1245 |               2
 Miền Bắc     | Nem rán ngày Tết        |        980 |               3
 Miền Nam     | Cá kho tộ miền Tây      |       1456 |               1
 Miền Nam     | Bánh xèo miền Tây       |       1123 |               2
 Miền Nam     | Canh chua cá lóc        |        890 |               3
 Miền Trung   | Bún bò Huế cung đình    |       2340 |               1
 Miền Trung   | Nem lụi Huế             |        789 |               2
 Miền Trung   | Cơm hến Huế             |        567 |               3
```

---

### Exercise 3: Running count of members added over time

**Difficulty**: Medium · **Objective**: Running totals via `SUM(1) OVER (...)`.

**Question**: For the **Nguyễn** family, list every member ordered by birth date, along
with a running total of how many members exist up to and including that row.

**Schema**: `caygiaphaso.family_members(birth_date)`, `caygiaphaso.families`

**Hint**: `SUM(1) OVER (ORDER BY birth_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)`
adds 1 per row.

**Solution**:

```sql
SELECT fm.full_name,
       fm.birth_date,
       COUNT(*) OVER (
           ORDER BY fm.birth_date
           ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
       ) AS members_so_far
FROM   family_members fm
JOIN   families f ON f.id = fm.family_id
WHERE  f.name = 'Gia tộc họ Nguyễn'
ORDER BY fm.birth_date NULLS LAST;
```

**Explanation**: `NULLS LAST` keeps the row with `NULL` birth date at the bottom (only
the "Tester" row has no date in the seed).

**Expected output (first 5)**:

```
      full_name      | birth_date | members_so_far
---------------------+------------+----------------
 Nguyễn Văn Hùng     | 1820-03-15 |              1
 Nguyễn Văn Đức      | 1850-06-10 |              2
 Nguyễn Thị Mai      | 1855-09-12 |              3
 Nguyễn Văn Tài      | 1858-02-20 |              4
 Nguyễn Văn Cương    | 1885-05-15 |              5
```

---

### Exercise 4: Lag/Lead — ordering siblings by birth date

**Difficulty**: Medium · **Objective**: `LAG`/`LEAD`.

**Question**: For every member of the Nguyễn family, show their `full_name`, their
`birth_date`, and the `birth_date` of the **previous and next** siblings (by birth date)
within the same family.

**Schema**: `caygiaphaso.family_members(birth_date, full_name)`

**Solution**:

```sql
SELECT fm.full_name,
       fm.birth_date,
       LAG(fm.birth_date)  OVER w AS prev_birth_date,
       LEAD(fm.birth_date) OVER w AS next_birth_date
FROM   family_members fm
JOIN   families f ON f.id = fm.family_id
WHERE  f.name = 'Gia tộc họ Nguyễn'
WINDOW w AS (ORDER BY fm.birth_date NULLS LAST)
ORDER BY fm.birth_date NULLS LAST;
```

**Explanation**: The `WINDOW` clause lets us reuse the same `OVER` definition twice. The
first row has `NULL` for `prev_birth_date`; the last row has `NULL` for `next_birth_date`.

**Expected output (first 5)**:

```
      full_name      | birth_date | prev_birth_date | next_birth_date
---------------------+------------+-----------------+-----------------
 Nguyễn Văn Hùng     | 1820-03-15 |                 | 1850-06-10
 Nguyễn Văn Đức      | 1850-06-10 | 1820-03-15      | 1855-09-12
 Nguyễn Thị Mai      | 1855-09-12 | 1850-06-10      | 1858-02-20
 Nguyễn Văn Tài      | 1858-02-20 | 1855-09-12      | 1885-05-15
 Nguyễn Văn Cương    | 1885-05-15 | 1858-02-20      | 1888-04-10
```

---

### Exercise 5: First event per family

**Difficulty**: Medium · **Objective**: `ROW_NUMBER` + filter.

**Question**: For each family, find the **earliest** event by `event_date`. Show family
name, event title, and event date.

**Hint**: `ROW_NUMBER() OVER (PARTITION BY family_id ORDER BY event_date)` then filter.

**Solution**:

```sql
SELECT f.name AS family, e.title, e.event_date::date
FROM   (
    SELECT e.*,
           ROW_NUMBER() OVER (PARTITION BY e.family_id ORDER BY e.event_date) AS rn
    FROM   events e
) e
JOIN families f ON f.id = e.family_id
WHERE  e.rn = 1
ORDER BY e.event_date;
```

**Expected output**:

```
       family        |          title           | event_date
---------------------+--------------------------+------------
 Gia tộc họ Lê       | Khai trương nhà hàng…   | 2010-05-15
 Gia tộc họ Nguyễn   | Giỗ tổ Nguyễn Văn Hùng   | 2024-03-15
 Gia tộc họ Trần     | Giỗ tổ Trần Văn Hào      | 2024-04-10
```

---

### Exercise 6: Percentile rank of recipe popularity

**Difficulty**: Medium · **Objective**: `PERCENT_RANK` and `CUME_DIST`.

**Question**: For each recipe, compute its **percentile rank** and **cumulative
distribution** by `view_count`. Show title, view_count, `percent_rank`, and `cume_dist`.

**Schema**: `caygiaphaso.recipes(title, view_count)`

**Solution**:

```sql
SELECT title,
       view_count,
       ROUND(PERCENT_RANK() OVER (ORDER BY view_count)::numeric, 3) AS pct_rank,
       ROUND(CUME_DIST()    OVER (ORDER BY view_count)::numeric, 3) AS cume_dist
FROM   recipes
ORDER BY view_count DESC;
```

**Explanation**: `PERCENT_RANK` returns `(rank - 1) / (total - 1)`, so the highest value
is 0 and the lowest is 1. `CUME_DIST` returns `count(<= value) / total`, so the highest
value is 1 and the lowest is `1 / total`. Both are useful for popularity dashboards.

**Expected output (first 3 and last 3)**:

```
            title            | view_count | pct_rank | cume_dist
-----------------------------+------------+----------+-----------
 Bún bò Huế cung đình        |       2340 |    0.000 |     0.059
 Bánh chưng làng Đông Ngạc   |       1522 |    0.063 |     0.118
 Cá kho tộ miền Tây          |       1456 |    0.125 |     0.176
 ...
 Chuối nếp nướng             |        789 |    0.688 |     0.824
 Chè bắp nóng                |        234 |    0.938 |     0.941
 Phở bò Tester v2            |          0 |    1.000 |     1.000
```

---

### Exercise 7: Average recipe view count vs the previous recipe

**Difficulty**: Medium · **Objective**: `LAG` + arithmetic.

**Question**: List every recipe ordered by `view_count` descending, showing title,
view_count, the **previous** view_count, and the **difference**. This lets you see how
much more popular each recipe is than the one below it.

**Schema**: `caygiaphaso.recipes(title, view_count)`

**Solution**:

```sql
SELECT title,
       view_count,
       LAG(view_count) OVER (ORDER BY view_count DESC) AS prev_view_count,
       view_count - LAG(view_count) OVER (ORDER BY view_count DESC) AS diff_from_prev
FROM   recipes
ORDER BY view_count DESC;
```

**Expected output (first 5)**:

```
            title             | view_count | prev_view_count | diff_from_prev
------------------------------+------------+-----------------+----------------
 Bún bò Huế cung đình         |       2340 |                 |
 Bánh chưng làng Đông Ngạc    |       1522 |           2340 |           -818
 Cá kho tộ miền Tây           |       1456 |           1522 |            -66
 Chả lá lốt thơm nức          |       1245 |           1456 |           -211
 Bánh xèo miền Tây            |       1123 |           1245 |           -122
```

---

### Exercise 8: Members partitioned by generation, ranked by age

**Difficulty**: Medium · **Objective**: `PARTITION BY` on a join key.

**Question**: For every generation in the **Nguyễn** family, rank its members by birth
date. Show generation number, member, birth date, and rank.

**Schema**: `caygiaphaso.family_members(generation_id, birth_date)`,
`caygiaphaso.generations(family_id, generation_number, name)`

**Hint**: `PARTITION BY generation_id`. Members without a generation form their own
"NULL" partition.

**Solution**:

```sql
SELECT g.generation_number,
       g.name  AS generation,
       fm.full_name,
       fm.birth_date,
       RANK() OVER (PARTITION BY fm.generation_id ORDER BY fm.birth_date) AS rank_in_gen
FROM   family_members fm
JOIN   generations   g ON g.id = fm.generation_id
WHERE  g.family_id = 'aaaaaaaa-0000-0000-0000-000000000001'
ORDER BY g.generation_number, rank_in_gen;
```

**Expected output (first 8)**:

```
 generation_number |   generation   |     full_name      | birth_date | rank_in_gen
-------------------+----------------+--------------------+------------+-------------
                 1 | Đời 1 - Cụ tổ  | Nguyễn Văn Hùng   | 1820-03-15 |           1
                 2 | Đời 2 - Cụ nội | Nguyễn Văn Đức    | 1850-06-10 |           1
                 2 | Đời 2 - Cụ nội | Nguyễn Thị Mai    | 1855-09-12 |           2
                 2 | Đời 2 - Cụ nội | Nguyễn Văn Tài    | 1858-02-20 |           3
                 3 | Đời 3 - Ông bà | Nguyễn Văn Bình   | 1888-04-10 |           1
                 3 | Đời 3 - Ông bà | Nguyễn Thị Hạnh   | 1890-08-22 |           2
                 3 | Đời 3 - Ông bà | Nguyễn Văn Cương  | 1885-05-15 |           3
                 3 | Đời 3 - Ông bà | Nguyễn Văn Thắng  | 1892-07-08 |           4
```

> Note that rank 3 in generation 3 is earlier than rank 1+2 because ranks are computed
> independently per partition; the numbers don't need to be globally consistent.

---

### Exercise 9: Cumulative reactions per recipe

**Difficulty**: Medium · **Objective**: Running total via `SUM OVER`.

**Question**: Show every reaction in chronological order with a running total of
reactions per recipe.

**Schema**: `caygiaphaso.recipe_reactions(recipe_id, user_id, reaction_type, created_at)`

**Solution**:

```sql
SELECT rr.recipe_id,
       r.title,
       rr.created_at::date AS reaction_date,
       COUNT(*) OVER (
           PARTITION BY rr.recipe_id
           ORDER BY rr.created_at
           ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
       ) AS cumulative_reactions
FROM   recipe_reactions rr
JOIN   recipes r ON r.id = rr.recipe_id
ORDER BY rr.recipe_id, rr.created_at;
```

**Expected output**:

```
 recipe_id |         title          | reaction_date | cumulative_reactions
-----------+-------------------------+---------------+----------------------
 aaaa22... | Bánh chưng làng Đông… | 2024-01-15    |                    1
 aaaa22... | Bánh chưng làng Đông… | 2024-01-16    |                    2
 aaaa22... | Bánh chưng làng Đông… | 2024-01-17    |                    3
 bbbb22... | Bún bò Huế cung đình   | 2024-02-01    |                    1
 bbbb22... | Bún bò Huế cung đình   | 2024-02-02    |                    2
 cccc22... | Cá kho tộ miền Tây     | 2024-03-10    |                    1
 cccc22... | Cá kho tộ miền Tây     | 2024-03-11    |                    2
```

> Dates are illustrative; the actual values depend on when the seed was loaded.

---

### Exercise 10: First and last value per family using `FIRST_VALUE`

**Difficulty**: Medium-Hard · **Objective**: Frame clauses that include `UNBOUNDED
FOLLOWING`.

**Question**: For every member of the **Nguyễn** family, show the **birth date of the
oldest and youngest** member of that family (alongside the current row). Use
`FIRST_VALUE` and `LAST_VALUE` with an explicit frame.

**Schema**: `caygiaphaso.family_members(family_id, birth_date, full_name)`

**Solution**:

```sql
SELECT fm.full_name,
       fm.birth_date,
       FIRST_VALUE(fm.birth_date) OVER w AS oldest_in_family,
       LAST_VALUE(fm.birth_date)  OVER w AS youngest_in_family
FROM   family_members fm
JOIN   families f ON f.id = fm.family_id
WHERE  f.name = 'Gia tộc họ Nguyễn'
WINDOW w AS (
    ORDER BY fm.birth_date NULLS LAST
    ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
)
ORDER BY fm.birth_date NULLS LAST;
```

**Explanation**: Without the explicit frame, `LAST_VALUE` would only see up to the
current row. `UNBOUNDED FOLLOWING` extends the window all the way to the end of the
partition.

**Expected output (first 3)**:

```
      full_name      | birth_date | oldest_in_family | youngest_in_family
---------------------+------------+------------------+--------------------
 Nguyễn Văn Hùng     | 1820-03-15 | 1820-03-15       | 2018-09-10
 Nguyễn Văn Đức      | 1850-06-10 | 1820-03-15       | 2018-09-10
 Nguyễn Thị Mai      | 1855-09-12 | 1820-03-15       | 2018-09-10
```

---

## Stretch / Try it yourself

1. **`NTILE(4)` over recipes** — quartile the recipes by view count.
2. **Moving average of recipe view count** with `AVG(view_count) OVER (ORDER BY view_count ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)`.
3. **Spouse age gap**: window-function over the `relationships` table joining twice on
   `family_members` to compute the age difference between partners.
4. **Most recent recipe per cuisine** using `ROW_NUMBER()` ordered by `created_at DESC`.
5. **RANK vs DENSE_RANK** — produce both side by side and note the difference on the
   recipe list.

---

## What's next

Module 05 is the heart of this codebase: **recursive CTEs**. You will use them to walk
family trees up (ancestors) and down (descendants), and to express the recipe-genealogy
chain that lets a viewer follow *how a dish travelled from cụ tổ to today's chef*.