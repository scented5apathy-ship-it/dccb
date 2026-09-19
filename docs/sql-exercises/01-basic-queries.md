# Module 01 — Basic Queries

> **Difficulty**: Beginner · **Time**: 45–60 min · **Builds on**: nothing.

## Learning objectives

By the end of this module you should be able to:

- Project columns with `SELECT` and filter rows with `WHERE`.
- Sort results with `ORDER BY`, limit them with `LIMIT`/`OFFSET`, and deduplicate with `DISTINCT`.
- Use the comparison operators `=`, `<>`, `<`, `>`, `BETWEEN`, `IN`, `LIKE`, `ILIKE`.
- Combine predicates with `AND`, `OR`, `NOT`.
- Handle `NULL` correctly with `IS NULL`, `IS NOT NULL`, and `COALESCE`.
- Call common scalar functions: `COUNT`, `SUM`, `AVG`, `MIN`, `MAX`, plus string/date helpers.

## Concepts

### `SELECT`, `FROM`, `WHERE`

The most basic SQL query has three parts:

```sql
SELECT column1, column2, ...   -- what to return
FROM   table_name              -- where the data lives
WHERE  condition;               -- which rows to keep
```

`SELECT *` is fine for exploration but should be avoided in production code — always name
the columns you need.

### Ordering and pagination

```sql
ORDER BY column [ASC | DESC]      -- default is ASC
LIMIT  n                          -- keep only the first n rows
OFFSET m                          -- skip the first m rows
```

`OFFSET` is handy but **scales poorly** on large tables — for true cursor-style pagination
use `WHERE id > last_seen_id ORDER BY id LIMIT n`.

### `DISTINCT`

Removes duplicate rows from the result. It is computed after `WHERE` but before `ORDER BY`.

```sql
SELECT DISTINCT cuisine_type FROM recipes;
```

### Comparison operators

| Operator      | Meaning                                     |
|---------------|---------------------------------------------|
| `=`           | Equal                                       |
| `<>` / `!=`   | Not equal                                   |
| `<`, `>`, `<=`, `>=` | Ordering comparisons                 |
| `BETWEEN a AND b` | Inclusive range (both endpoints)        |
| `IN (a, b, c)`   | Membership in a literal list             |
| `LIKE`           | SQL pattern: `%` any chars, `_` one char |
| `ILIKE`          | Case-insensitive `LIKE` (Postgres only)  |

```sql
WHERE title LIKE 'Bánh%'         -- starts with "Bánh"
WHERE nickname ILIKE '%lan%'     -- contains "lan" / "Lan" / "LAN"
WHERE cuisine_type IN ('Miền Bắc', 'Miền Trung')
WHERE EXTRACT(YEAR FROM birth_date) BETWEEN 1900 AND 1950
```

### Logical operators

`AND` has higher precedence than `OR`; use parentheses when mixing them:

```sql
WHERE (gender = 'FEMALE' OR nickname LIKE 'Bà%')
  AND  birth_date < '1950-01-01';
```

### `NULL`

`NULL` means *unknown*, not zero and not empty string. Standard comparisons like `= NULL`
return `NULL` (which is treated as **false** by `WHERE`), so always use:

```sql
WHERE death_date IS NULL
WHERE death_date IS NOT NULL
```

To replace `NULL` with a real value use `COALESCE(a, b, c)` — it returns the first
non-`NULL` argument.

### Aggregate functions

`COUNT`, `SUM`, `AVG`, `MIN`, `MAX` are aggregates: they collapse many rows into one.

- `COUNT(*)` counts rows including `NULL`s.
- `COUNT(column)` ignores `NULL`s in that column.
- `AVG`/`SUM` ignore `NULL`s.

```sql
SELECT COUNT(*) AS total_members,
       AVG(EXTRACT(YEAR FROM AGE(birth_date)))::int AS avg_birth_year
FROM   family_members;
```

### Useful scalar functions

| Function                        | What it does                              |
|---------------------------------|-------------------------------------------|
| `UPPER(s)` / `LOWER(s)`         | Change case.                              |
| `LENGTH(s)`                     | Character count (use `CHAR_LENGTH` to be explicit). |
| `SUBSTRING(s FROM n FOR k)`     | Slice a string.                           |
| `CONCAT(a, b, ...)` / `a \|\| b` | Concatenate.                              |
| `NOW()` / `CURRENT_DATE`        | Current timestamp / date.                 |
| `EXTRACT(YEAR FROM d)`          | Pull a field out of a date/time.          |
| `AGE(d)`                        | Interval between `d` and today.           |

---

## Exercises

### Exercise 1: List every family

**Difficulty**: Trivial · **Objective**: Practice `SELECT`/`FROM` and basic ordering.

**Question**: Return every family, sorted by `founded_year` ascending.

**Schema**: `caygiaphaso.families(id, name, founded_year, motto, origin_location, ...)`

**Hint**: Just `SELECT` from `families` and tack on `ORDER BY`.

**Solution**:

```sql
SELECT name, founded_year, motto, origin_location
FROM   families
ORDER BY founded_year ASC;
```

**Explanation**: The default sort direction is `ASC`, so the keyword is optional. We name
the columns instead of using `SELECT *` so the result is stable even if the table schema
later gains new columns.

**Expected output (3 rows from the seed)**:

```
       name        | founded_year |          motto           |      origin_location
-------------------+--------------+--------------------------+------------------------------
 Gia tộc họ Nguyễn |         1820 | Hiếu đễ trước, nghĩa khí sau | Làng Đông Ngạc, Từ Liêm, Hà Nội
 Gia tộc họ Trần   |         1855 | Trung hiếu vẹn toàn      | Phường Phú Hậu, thành phố Huế
 Gia tộc họ Lê     |         1965 | Thuận vợ thuận chồng…    | Quận Bình Thạnh, TP. Hồ Chí Minh
```

---

### Exercise 2: Find users with a `@gmail.com` email

**Difficulty**: Easy · **Objective**: Use `LIKE` for suffix matching.

**Question**: List the `full_name` and `email` of every user whose email ends in
`@gmail.com`.

**Schema**: `caygiaphaso.users(id, email, full_name, ...)`

**Hint**: `LIKE '%@gmail.com'` matches any string that ends with the suffix. Use `ILIKE`
if you want case-insensitive matching.

**Solution**:

```sql
SELECT full_name, email
FROM   users
WHERE  email LIKE '%@gmail.com';
```

**Explanation**: `%` is the SQL wildcard for "any number of any characters". We use `LIKE`
(not `ILIKE`) because the seed uses lowercase domains, but either works in this case.

> **Reality check**: The current seed uses `@nguyen-family.vn`, `@tran-family.vn` and
> `@le-family.vn`. The query returns zero rows today; it is here as a *template* you can
> use against real production data. Try changing the suffix to `%@nguyen-family.vn` to see
> it work.

**Expected output (with the real seed)**: zero rows. If you adapt the suffix:

```
   full_name    |         email
----------------+------------------------
 Nguyễn Văn An  | admin@nguyen-family.vn
 Nguyễn Thị Lan | lan@nguyen-family.vn
 Nguyễn Minh    | minh@nguyen-family.vn
```

---

### Exercise 3: Count members per family

**Difficulty**: Easy · **Objective**: First introduction to `COUNT` + `GROUP BY`.

**Question**: For each family, show its name and the number of members.

**Schema**: `caygiaphaso.families(id, name)`, `caygiaphaso.family_members(family_id, ...)`

**Hint**: `COUNT(*)` counts all rows; `GROUP BY family_id` collapses them into one row per
family.

**Solution**:

```sql
SELECT f.name,
       COUNT(*) AS member_count
FROM   families f
JOIN   family_members fm ON fm.family_id = f.id
GROUP BY f.id, f.name
ORDER BY member_count DESC;
```

**Explanation**: We `JOIN` the two tables so we can show the family *name* alongside the
count. `GROUP BY f.id, f.name` is required because `f.name` is selected but not aggregated;
including `f.id` is harmless and helps when two families share a name.

**Expected output** (the live dev seed has 21 Nguyễn members after additional test rows were
added; the original V2 seed has 20):

```
       name        | member_count
-------------------+--------------
 Gia tộc họ Nguyễn |           21
 Gia tộc họ Trần   |           15
 Gia tộc họ Lê     |           10
```

> Cross-check: the `families.member_count` column is denormalised, so it should match.

---

### Exercise 4: Members born before 1950

**Difficulty**: Easy · **Objective**: Use a date comparison.

**Question**: List `full_name`, `nickname`, and `birth_date` of every family member born
**before 1950-01-01**, sorted by `birth_date`.

**Schema**: `caygiaphaso.family_members(birth_date, full_name, nickname, ...)`

**Hint**: Date literals use single quotes and the ISO format `YYYY-MM-DD`.

**Solution**:

```sql
SELECT full_name, nickname, birth_date
FROM   family_members
WHERE  birth_date < '1950-01-01'
ORDER BY birth_date;
```

**Explanation**: PostgreSQL compares dates against date literals directly. We get the
oldest ancestors first.

**Expected output (first 5 rows)**:

```
    full_name    | nickname | birth_date
-----------------+----------+------------
 Nguyễn Văn Hùng | Cụ Hùng  | 1820-03-15
 Nguyễn Văn Đức  | Cụ Đức   | 1850-06-10
 Trần Văn Hào    | Cụ Hào   | 1855-04-10
 Nguyễn Thị Mai  | Cụ Mai   | 1855-09-12
 Nguyễn Văn Tài  | Cụ Tài   | 1858-02-20
```

---

### Exercise 5: Easy-difficulty recipes

**Difficulty**: Easy · **Objective**: Combine equality, `ORDER BY`, `LIMIT`.

**Question**: Return the title and `cook_time_minutes` of every recipe with
`difficulty = 'EASY'`, sorted from shortest cook time to longest, limited to the first 5.

**Schema**: `caygiaphaso.recipes(title, difficulty, cook_time_minutes, ...)`

**Hint**: `WHERE difficulty = 'EASY'` then `ORDER BY cook_time_minutes`, then `LIMIT 5`.

**Solution**:

```sql
SELECT title, cook_time_minutes
FROM   recipes
WHERE  difficulty = 'EASY'
ORDER BY cook_time_minutes ASC
LIMIT  5;
```

**Explanation**: `LIMIT` goes after `ORDER BY` so we get the truly shortest-cook-time
recipes, not an arbitrary slice.

**Expected output**:

```
        title         | cook_time_minutes
----------------------+-------------------
 Chả lá lốt thơm nức  |                20
 Chè bắp nóng         |                30
 Canh chua cá lóc     |                30
 Chuối nếp nướng      |                30
 Xôi gấc đỏ may mắn   |                45
```

---

### Exercise 6: Families founded after 1900

**Difficulty**: Easy · **Objective**: Use `>` with a numeric column.

**Question**: List the names of families founded after the year 1900, together with their
founding year.

**Schema**: `caygiaphaso.families(name, founded_year, ...)`

**Solution**:

```sql
SELECT name, founded_year
FROM   families
WHERE  founded_year > 1900
ORDER BY founded_year;
```

**Expected output**:

```
       name        | founded_year
-------------------+--------------
 Gia tộc họ Lê     |         1965
```

> Only one family qualifies — the seed has another family "Gia tộc Test" with
> `founded_year = 1900`, which the strict `>` excludes.

---

### Exercise 7: Members still alive

**Difficulty**: Easy · **Objective**: Handle `NULL` correctly.

**Question**: List `full_name`, `nickname`, `current_location`, and `occupation` for every
member whose `death_date IS NULL`. Order by `birth_date` (oldest first).

**Schema**: `caygiaphaso.family_members(death_date, is_alive, ...)`

**Hint**: Two columns encode "still alive": `death_date IS NULL` and `is_alive = TRUE`. We
will use the date check because it is the *source of truth*.

**Solution**:

```sql
SELECT full_name, nickname, current_location, occupation
FROM   family_members
WHERE  death_date IS NULL
ORDER BY birth_date;
```

**Explanation**: A common bug is `WHERE death_date = NULL` — that always evaluates to
`NULL`, which acts as false, so every row is filtered out. Use `IS NULL`.

**Expected output (first 5)**:

```
    full_name      | nickname  | current_location  |   occupation
-------------------+-----------+-------------------+-----------------
 Trần Văn Sơn      | Ông Sơn   | Huế              | Kỹ sư
 Trần Thị Hoa      | Bà Hoa    | Huế              | Giáo viên về hưu
 Trần Văn Hải      | Ông Hải   | Đà Nẵng          | Bác sĩ
 Trần Thị Hồng     | Cô Hồng   | Huế              | Đầu bếp nhà hàng
 Nguyễn Văn An     | Bác An    | Hà Nội           | Kỹ sư xây dựng
```

---

### Exercise 8: Recipes with 30–60 minute prep time

**Difficulty**: Easy · **Objective**: Use `BETWEEN`.

**Question**: Show the `title`, `prep_time_minutes`, and `cook_time_minutes` of every
recipe whose `prep_time_minutes` is between 30 and 60 inclusive. Sort by prep time
descending.

**Schema**: `caygiaphaso.recipes(prep_time_minutes, cook_time_minutes, title)`

**Hint**: `BETWEEN 30 AND 60` is inclusive on both ends.

**Solution**:

```sql
SELECT title, prep_time_minutes, cook_time_minutes
FROM   recipes
WHERE  prep_time_minutes BETWEEN 30 AND 60
ORDER BY prep_time_minutes DESC;
```

**Explanation**: `BETWEEN a AND b` is shorthand for `>= a AND <= b`. Avoid it when one of
the endpoints should be exclusive — it is too easy to misread.

**Expected output**:

```
       title        | prep_time_minutes | cook_time_minutes
--------------------+-------------------+-------------------
 Giò lụa gia truyền |                60 |                90
 Cơm hến Huế        |                60 |                30
 Nem rán ngày Tết   |                60 |                30
 Nem lụi Huế        |                45 |                20
 Canh măng mực…     |                45 |                60
 Chuối nếp nướng    |                30 |                30
 Bánh xèo miền Tây  |                30 |                30
 Cá kho tộ…         |                30 |                90
 Xôi gấc đỏ…       |                30 |                45
 Chả lá lốt…       |                30 |                20
```

---

### Exercise 9: Members whose nickname starts with `Cụ` or `Bà`

**Difficulty**: Easy–Medium · **Objective**: Combine `OR` and `LIKE`.

**Question**: Find every member whose nickname begins with `Cụ` or `Bà`, sorted by
`birth_date`.

**Schema**: `caygiaphaso.family_members(nickname, birth_date, full_name)`

**Hint**: `WHERE nickname LIKE 'Cụ%' OR nickname LIKE 'Bà%'`. Mind the parentheses if you
add more conditions.

**Solution**:

```sql
SELECT full_name, nickname, birth_date
FROM   family_members
WHERE  nickname LIKE 'Cụ%' OR nickname LIKE 'Bà%'
ORDER BY birth_date;
```

**Explanation**: `%` matches zero or more characters, so `'Cụ%'` matches both `Cụ Hùng`
and `Cụ Tổ`. If you wanted case-insensitive matching use `ILIKE`.

**Expected output (first 5)**:

```
    full_name    | nickname | birth_date
-----------------+----------+------------
 Nguyễn Văn Hùng | Cụ Hùng  | 1820-03-15
 Nguyễn Văn Đức  | Cụ Đức   | 1850-06-10
 Trần Văn Hào    | Cụ Hào   | 1855-04-10
 Nguyễn Thị Mai  | Cụ Mai   | 1855-09-12
 Nguyễn Văn Tài  | Cụ Tài   | 1858-02-20
```

---

### Exercise 10: Count achievements per type (no — per member)

**Difficulty**: Easy · **Objective**: Multiple `GROUP BY` columns and counting distinct
achievements.

**Question**: For each member who has at least one achievement, show how many they have
and the total point value of those achievements. Sort by total points descending.

**Schema**: `caygiaphaso.member_achievements(member_id, achievement_id)`,
`caygiaphaso.achievements(id, points)`

**Hint**: Join `member_achievements` with `achievements` so you can sum `points`. Use
`fm.full_name` from `family_members` to make the result readable.

**Solution**:

```sql
SELECT fm.full_name,
       COUNT(ma.achievement_id) AS achievement_count,
       SUM(a.points)             AS total_points
FROM   member_achievements ma
JOIN   achievements  a ON a.id = ma.achievement_id
JOIN   family_members fm ON fm.id = ma.member_id
GROUP BY fm.id, fm.full_name
ORDER BY total_points DESC;
```

**Explanation**: `COUNT(achievement_id)` ignores `NULL`s, but here the column is `NOT NULL`,
so it counts the same rows as `COUNT(*)`. `SUM(a.points)` adds the point value of every
achievement the member holds.

**Expected output**:

```
      full_name       | achievement_count | total_points
----------------------+-------------------+--------------
 Nguyễn Thị Lan (con) |                 4 |            95
 Nguyễn Thị Lan       |                 2 |            80
 Nguyễn Minh          |                 2 |            45
 Lê Văn Tuấn         |                 1 |            20
 Trần Thị Hoa (con)   |                 1 |            15
```

---

## Stretch / Try it yourself

1. Find every recipe whose **title** contains the word `bánh` (`ILIKE '%bánh%'`), regardless
   of case. How many are there?
2. List all events whose `event_date` falls in 2024 and `event_type` is `WEDDING`,
   `REUNION`, or `FUNERAL`. Use `IN (...)`.
3. Compute the **age** of every living member with `EXTRACT(YEAR FROM AGE(birth_date))`.
   Who is the youngest?
4. Show every distinct cuisine across all recipes using `SELECT DISTINCT cuisine_type`.
   How many cuisines does the seed contain?
5. Use `COALESCE` to display members as `nickname — full_name` when nickname exists, or
   just `full_name` when it doesn't.

---

## What's next

In Module 02 you will combine these tables with `JOIN`s to surface the *relationships*
between members, recipes, events, and stories — the data structures that actually make
CâyGiaPhảSố come alive.