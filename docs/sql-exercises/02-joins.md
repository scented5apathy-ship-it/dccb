# Module 02 — JOINs

> **Difficulty**: Beginner → Intermediate · **Time**: 60–90 min · **Builds on**: Module 01.

## Learning objectives

By the end of this module you will be able to:

- Combine two or more tables with `INNER`, `LEFT`, `RIGHT`, and `FULL OUTER` joins.
- Pick the right **join cardinality**: one-to-many, many-to-one, self-join.
- Disambiguate overlapping column names with table aliases.
- Use `USING` when both tables share a column name; use `ON` when the join condition is
  more complex.
- Predict whether `NULL` values appear, disappear, or get multiplied by your join.

## Concepts

### Inner join (the default)

```sql
SELECT *
FROM   families f
JOIN   family_members fm ON fm.family_id = f.id;
```

Only rows that satisfy the join condition are kept. If a member has no `family_id`
(impossible here due to `NOT NULL`) or the family is missing, the row drops out.

### Outer joins

```
                  matching     A only     B only
INNER JOIN         kept         dropped    dropped
LEFT  JOIN         kept         kept       dropped
RIGHT JOIN         kept         dropped    kept
FULL  JOIN         kept         kept       kept
```

`LEFT JOIN` is by far the most common: "give me everything in A, and the matching data in
B if any".

```sql
-- time_capsules with their recipient (NULL if none)
SELECT t.title,
       recipient.full_name AS recipient_name
FROM   time_capsules t
LEFT JOIN family_members recipient ON recipient.id = t.recipient_member_id;
```

### `USING` vs `ON`

When the join columns have the **same name** in both tables, you can shorten the syntax:

```sql
SELECT * FROM recipe_reactions JOIN recipe_comments USING (recipe_id);
```

`ON` is required when the column names differ or you need extra predicates:

```sql
SELECT * FROM relationships r
JOIN family_members parent ON parent.id = r.from_member_id
WHERE r.relationship_type = 'PARENT';
```

### Self-joins

A table joining itself. Always use **different aliases** to disambiguate.

```sql
-- "who is the spouse of X?" — pairs of members are stored as two rows.
SELECT a.full_name AS member, b.full_name AS spouse
FROM   relationships r
JOIN   family_members a ON a.id = r.from_member_id
JOIN   family_members b ON b.id = r.to_member_id
WHERE  r.relationship_type = 'SPOUSE'
LIMIT  5;
```

### CROSS JOIN — every combination

`CROSS JOIN` returns the cartesian product. Rare in business queries, common in:

- building all date/number pairs for a report,
- feature engineering in ML pipelines,
- the `v_user_activity` view style subqueries.

```sql
SELECT g.generation_number, d.difficulty
FROM generations g
CROSS JOIN (VALUES ('EASY'), ('MEDIUM'), ('HARD')) AS d(difficulty);
```

### NATURAL JOIN — never use in production

`NATURAL JOIN` automatically joins on every column with the same name. It sounds
convenient but is fragile: adding a new column with a coincidental name silently changes
the join semantics. Always prefer explicit `ON` or `USING`.

---

## Exercises

### Exercise 1: Members with their family name

**Difficulty**: Trivial · **Objective**: Practice a basic `INNER JOIN` and aliases.

**Question**: For each member show `member_name`, `nickname`, and the `family_name` they
belong to. Sort by `family_name`, then `member_name`. Limit to 10 rows.

**Schema**:
- `caygiaphaso.family_members(id, family_id, full_name, nickname)`
- `caygiaphaso.families(id, name)`

**Hint**: Pick short aliases (`f`, `fm`) and join on `fm.family_id = f.id`.

**Solution**:

```sql
SELECT fm.full_name  AS member_name,
       fm.nickname,
       f.name        AS family_name
FROM   family_members fm
JOIN   families f ON f.id = fm.family_id
ORDER BY f.name, fm.full_name
LIMIT  10;
```

**Explanation**: Every member *must* belong to a family (`NOT NULL` FK), so an inner join
is equivalent to a left join here. We alias both tables to keep the query readable.

**Expected output (first 5)**:

```
      member_name      | nickname |    family_name
-----------------------+----------+------------------
 Lê Thị Hà             | Hà       | Gia tộc họ Lê
 Lê Thị Ngọc           | Ngọc     | Gia tộc họ Lê
 Lê Thị Tươi           | Bà Tươi  | Gia tộc họ Lê
 Lê Văn Bảo            | Bảo      | Gia tộc họ Lê
 Lê Văn Hoà            | Ông Hòa  | Gia tộc họ Lê
```

---

### Exercise 2: Recipes with their authors

**Difficulty**: Easy · **Objective**: Two-table inner join, aliasing for clarity.

**Question**: Show every recipe with the author's full name and email. Sort by recipe
title.

**Schema**: `caygiaphaso.recipes(id, title, author_id)`, `caygiaphaso.users(id, full_name, email)`

**Hint**: The author of a recipe is always a user — `author_id NOT NULL`.

**Solution**:

```sql
SELECT r.title           AS recipe,
       u.full_name       AS author,
       u.email
FROM   recipes r
JOIN   users u ON u.id = r.author_id
ORDER BY r.title;
```

**Expected output (first 5)**:

```
        recipe        |     author      |        email
----------------------+-----------------+---------------------
 Bánh chưng làng Đông Ngạc | Nguyễn Văn An  | admin@nguyen-family.vn
 Bánh nậm Huế         | Trần Thị Hoa   | hoa@tran-family.vn
 Bánh xèo miền Tây    | Lê Văn Tuấn    | tuan@le-family.vn
 Bún bò Huế cung đình | Trần Thị Hoa   | hoa@tran-family.vn
 Cá kho tộ miền Tây   | Lê Văn Tuấn    | tuan@le-family.vn
```

---

### Exercise 3: Events with attendee count

**Difficulty**: Easy · **Objective**: One-to-many join + `COUNT` + `GROUP BY` (basic
preview of Module 03).

**Question**: For each event, show its title, `event_type`, location, and how many
attendees responded (any RSVP status). Sort by attendee count descending.

**Schema**: `caygiaphaso.events(id, title, event_type, location)`,
`caygiaphaso.event_attendees(event_id, member_id)`

**Hint**: Join, then `GROUP BY e.id`. `COUNT(*)` counts all RSVP rows.

**Solution**:

```sql
SELECT e.title,
       e.event_type,
       e.location,
       COUNT(*) AS attendee_count
FROM   events e
JOIN   event_attendees ea ON ea.event_id = e.id
GROUP BY e.id, e.title, e.event_type, e.location
ORDER BY attendee_count DESC, e.title;
```

**Explanation**: We group by every selected column of `events`. Including `e.id` is
enough; the other columns must also be in `GROUP BY` because Postgres groups *by exact
column list*.

**Expected output**:

```
             title             | event_type |          location           | attendee_count
-------------------------------+------------+-----------------------------+----------------
 Đám cưới Lan và Minh          | WEDDING    | Nhà hàng Hoa Sứ, Hà Nội     |              5
 Giỗ tổ Nguyễn Văn Hùng        | FUNERAL    | Đền làng Đông Ngạc, Hà Nội   |              3
 Họp mặt gia đình cuối năm     | REUNION    | Nhà hàng Miền Tây, TP.HCM   |              4
 Họp mặt họ Nguyễn 2024        | REUNION    | Trung tâm Hội nghị…         |              3
 Khai trương nhà hàng Miền Tây | OTHER      | Quận Bình Thạnh, TP.HCM     |              3
 Giỗ tổ Trần Văn Hào           | FUNERAL    | Nhà thờ họ Trần, Huế        |              3
 Sinh nhật ông Sơn 80 tuổi     | BIRTHDAY   | Nhà hàng Hoàng Cung, Huế    |              2
 Lễ tưởng niệm liệt sĩ         | RELIGIOUS  | Nghĩa trang TP Huế          |              0  ← (none if no attendees)
```

> The last row only appears if there are events with zero attendees. In the seed every
> event has at least one RSVP, so you'll see eight rows.

---

### Exercise 4: Stories with their tags

**Difficulty**: Easy · **Objective**: Many-to-many via a junction table.

**Question**: For each story, list the title and the **names of all its tags** in a single
comma-separated string, sorted alphabetically. Order stories by title.

**Schema**: `caygiaphaso.stories(id, title)`, `caygiaphaso.story_tags(id, name)`,
`caygiaphaso.story_tag_map(story_id, tag_id)`

**Hint**: `STRING_AGG(name, ', ' ORDER BY name)` does the concatenation in one line.

**Solution**:

```sql
SELECT s.title,
       STRING_AGG(st.name, ', ' ORDER BY st.name) AS tags
FROM   stories s
LEFT JOIN story_tag_map m  ON m.story_id = s.id
LEFT JOIN story_tags    st ON st.id = m.tag_id
GROUP BY s.id, s.title
ORDER BY s.title;
```

**Explanation**: We use `LEFT JOIN` so stories without any tags still appear (with a
`NULL` tag column that `STRING_AGG` skips). `STRING_AGG` is a Postgres aggregate function
introduced in version 9.0 — it is the idiomatic way to "join rows into one column".

**Expected output**:

```
             title              |           tags
--------------------------------+-------------------------
 Bài ca làng Đông Ngạc          | (none)
 Bí quyết bánh chưng 5 đời      | ẩm thực, tết, truyền thống
 Hồi tưởng về cụ tổ Nguyễn Văn Hùng | gia đình, truyền thống
 Mâm cỗ Tết của bà Lệ           | ẩm thực, tết, truyền thống
 Mùa hè của bà Hạnh             | (none)
 Ông Hòa - người thầy thuốc…    | truyền thống, y khoa
 Ông nội và phong trào Duy Tân  | kháng chiến, truyền thống
 Xây dựng CâyGiaPhảSố…          | (none)
```

---

### Exercise 5: Families with member counts

**Difficulty**: Easy · **Objective**: Use the `v_family_summary` view (or roll your own
join).

**Question**: Show the family name, the creator's name, and the member count. Sort by
member count descending.

**Schema**: `caygiaphaso.families`, `caygiaphaso.users`, `caygiaphaso.family_members`

**Hint**: This is exactly what `v_family_summary` returns. We will write it manually
first, then verify the view gives the same answer.

**Solution (manual)**:

```sql
SELECT f.name           AS family,
       u.full_name      AS creator,
       COUNT(fm.id)     AS member_count
FROM   families f
JOIN   users u              ON u.id  = f.created_by
LEFT   JOIN family_members fm ON fm.family_id = f.id
GROUP BY f.id, f.name, u.full_name
ORDER BY member_count DESC;
```

**Solution (with view)**:

```sql
SELECT name AS family, creator_name AS creator, member_count
FROM   v_family_summary
ORDER BY member_count DESC;
```

**Explanation**: A `LEFT JOIN` to `family_members` keeps families with zero members (if
any exist); an inner join would drop them. We aggregate `COUNT(fm.id)` to count how many
joined rows we found.

**Expected output** (the original seed has three families; a 4th "Gia tộc Test" was added
during development, so depending on which seed you ran you may see 3 or 4 rows):

```
       family        |    creator    | member_count
---------------------+---------------+--------------
 Gia tộc họ Nguyễn   | Nguyễn Văn An |           20
 Gia tộc họ Trần     | Trần Thị Hoa  |           15
 Gia tộc họ Lê       | Lê Văn Tuấn   |           10
 Gia tộc Test        | Nguyễn Văn An |            5
```

---

### Exercise 6: Recipes with ingredient counts

**Difficulty**: Easy · **Objective**: One-to-many + `COUNT` + `LEFT JOIN` to show
recipes with no ingredients.

**Question**: List every recipe with its title and the number of ingredients. Include
recipes with zero ingredients in the result (use a `LEFT JOIN`). Sort by ingredient
count descending.

**Schema**: `caygiaphaso.recipes(id, title)`, `caygiaphaso.recipe_ingredients(recipe_id, name)`

**Solution**:

```sql
SELECT r.title,
       COUNT(ri.id) AS ingredient_count
FROM   recipes r
LEFT JOIN recipe_ingredients ri ON ri.recipe_id = r.id
GROUP BY r.id, r.title
ORDER BY ingredient_count DESC, r.title;
```

**Explanation**: `COUNT(ri.id)` ignores `NULL`s, so recipes without any ingredients show
`0` instead of `1`.

**Expected output (first 5)**:

```
        title         | ingredient_count
----------------------+------------------
 Bánh chưng làng…     |                5
 Bún bò Huế cung đình |                4
 Cá kho tộ miền Tây   |                4
 Giò lụa gia truyền   |                4
 Chả lá lốt thơm nức  |                3
```

---

### Exercise 7: Members who are also system users

**Difficulty**: Easy–Medium · **Objective**: Two joins — table → users via `user_id`.

**Question**: List every family member who has an account on the platform. Show
`full_name` (member), `email` (user), and the family name. Sort by family then member.

**Schema**: `caygiaphaso.family_members(id, full_name, family_id, user_id)`,
`caygiaphaso.users(id, email)`, `caygiaphaso.families(id, name)`

**Hint**: Use `INNER JOIN users` because we only want members **with** an account.

**Solution**:

```sql
SELECT f.name   AS family,
       fm.full_name AS member,
       u.email  AS user_email
FROM   family_members fm
JOIN   users u    ON u.id = fm.user_id
JOIN   families f ON f.id = fm.family_id
ORDER BY f.name, fm.full_name;
```

**Expected output**:

```
     family     |     member      |       email
----------------+-----------------+--------------------
 Gia tộc họ Lê  | Lê Văn Tuấn     | tuan@le-family.vn
 Gia tộc họ Nguyễn | Nguyễn Minh  | minh@nguyen-family.vn
 Gia tộc họ Nguyễn | Nguyễn Thị Lan (con) | lan@nguyen-family.vn
 Gia tộc họ Trần | Trần Thị Hoa (con)  | hoa@tran-family.vn
```

---

### Exercise 8: Events with creator and location

**Difficulty**: Easy · **Objective**: Two-table join + casting `TIMESTAMPTZ` to `DATE` for
clean display.

**Question**: For every event, show its `title`, the `creator_name`, `location`,
`event_type`, and the calendar `event_date` (no time). Sort by `event_date`.

**Schema**: `caygiaphaso.events(id, title, event_date, event_type, location, creator_id)`,
`caygiaphaso.users(id, full_name)`

**Hint**: `event_date::date` casts a `TIMESTAMPTZ` to a `DATE`.

**Solution**:

```sql
SELECT e.title,
       u.full_name       AS creator,
       e.location,
       e.event_type,
       e.event_date::date AS event_date
FROM   events e
JOIN   users u ON u.id = e.creator_id
ORDER BY e.event_date;
```

**Expected output**:

```
            title            |   creator   |      location      | event_type | event_date
-----------------------------+-------------+--------------------+------------+------------
 Khai trương nhà hàng Miền…  | Lê Văn Tuấn | Quận Bình Thạnh…   | OTHER      | 2010-05-15
 Giỗ tổ Nguyễn Văn Hùng      | Nguyễn Văn An | Đền làng Đông Ngạc | FUNERAL  | 2024-03-15
 Giỗ tổ Trần Văn Hào         | Trần Thị Hoa | Nhà thờ họ Trần   | FUNERAL    | 2024-04-10
 Đám cưới Lan và Minh        | Nguyễn Văn An | Nhà hàng Hoa Sứ   | WEDDING    | 2024-06-15
 Lễ tưởng niệm liệt sĩ       | Trần Thị Hoa | Nghĩa trang TP Huế | RELIGIOUS  | 2024-07-27
 Họp mặt gia đình cuối năm   | Lê Văn Tuấn | Nhà hàng Miền Tây  | REUNION    | 2024-12-30
 Họp mặt họ Nguyễn 2024      | Nguyễn Văn An | TT Hội nghị Quốc gia | REUNION  | 2024-12-31
 Sinh nhật ông Sơn 80 tuổi   | Trần Thị Hoa | Nhà hàng Hoàng Cung | BIRTHDAY  | 2025-05-30
```

---

### Exercise 9: Time capsules with recipient

**Difficulty**: Easy–Medium · **Objective**: Use `LEFT JOIN` for an optional FK.

**Question**: Show every time capsule with its creator, recipient (if any), `unlock_date`,
and current `is_opened` status. Order by `unlock_date`.

**Schema**: `caygiaphaso.time_capsules(id, title, creator_id, recipient_member_id, unlock_date, is_opened)`,
`caygiaphaso.users`, `caygiaphaso.family_members`

**Hint**: The recipient FK is *nullable*, so use a `LEFT JOIN`.

**Solution**:

```sql
SELECT t.title,
       creator.full_name  AS creator,
       recipient.full_name AS recipient,
       t.unlock_date,
       t.is_opened
FROM   time_capsules t
JOIN   users creator         ON creator.id  = t.creator_id
LEFT JOIN family_members recipient ON recipient.id = t.recipient_member_id
ORDER BY t.unlock_date;
```

**Explanation**: `LEFT JOIN` ensures capsules without a recipient still appear (with
`NULL` in the recipient column). Use this pattern any time you want "all of A, plus
matching data from B".

**Expected output**:

```
            title             |    creator    |      recipient      | unlock_date | is_opened
------------------------------+---------------+---------------------+-------------+-----------
 Lá thư gửi tương lai…        | Nguyễn Văn An |                     | 2025-09-19  | t
 Di sản nghề y cho con cháu    | Lê Văn Tuấn   | Lê Văn Khoa         | 2026-06-12  | f
 Thư cho Linh và Bảo           | Trần Thị Hoa  | Trần Thị Linh       | 2028-08-15  | f
 Công thức bí mật cho Mai      | Nguyễn Thị Lan (con) | Nguyễn Thị Mai (cháu) | 2033-06-20 | f
 Kỷ vật cho Minh Anh           | Nguyễn Văn An | Nguyễn Minh Anh     | 2036-09-10  | f
```

> The first row has a `NULL` recipient — that's the `LEFT JOIN` doing its job.

---

### Exercise 10: Find parents via the relationships table

**Difficulty**: Medium · **Objective**: Self-join on the `relationships` table.

**Question**: For every `PARENT` relationship, list the parent's full name, the child's
full name, and the family name. Sort by parent name.

**Schema**: `caygiaphaso.relationships(from_member_id, to_member_id, relationship_type, family_id)`,
`caygiaphaso.family_members(id, full_name)`,
`caygiaphaso.families(id, name)`

**Hint**: `from_member_id` is the parent, `to_member_id` is the child. Self-join twice.

**Solution**:

```sql
SELECT parent.full_name  AS parent,
       child.full_name   AS child,
       f.name            AS family
FROM   relationships r
JOIN   family_members parent ON parent.id = r.from_member_id
JOIN   family_members child  ON child.id  = r.to_member_id
JOIN   families f            ON f.id      = r.family_id
WHERE  r.relationship_type = 'PARENT'
ORDER BY parent.full_name, child.full_name;
```

**Explanation**: This is a classic *self-join*: we join `family_members` twice, once with
the alias `parent` and once with `child`. The relationships table is the bridge that
connects the two role instances.

**Expected output (first 5)**:

```
       parent        |        child        |     family
---------------------+---------------------+------------------
 Bác An              | Lan                 | Gia tộc họ Nguyễn
 Bác An              | Minh                | Gia tộc họ Nguyễn
 Cô Hương            | Nam                 | Gia tộc họ Nguyễn
 Cụ Đức             | Ông Bình            | Gia tộc họ Nguyễn
 Cụ Đức             | Ông Cương           | Gia tộc họ Nguyễn
```

---

## Stretch / Try it yourself

1. **Sibling pairs**: list all sibling relationships. The relationships table stores both
   directions — deduplicate with `WHERE from_member_id < to_member_id`.
2. **Spouses with marriage date**: show spouse pairs and their `start_date` (you may need
   `DISTINCT ON` since each pair is stored twice).
3. **Recipes without any steps**: `LEFT JOIN recipe_steps` and `WHERE step.id IS NULL`.
4. **Find events created by members of the same family** (using `events.creator_id →
   users.id` and `users` joined with `family_members`). Hint: a `creator_id` is a *user*,
   not a member, so the link is `users → family_members.user_id`.
5. **CROSS JOIN** every recipe title with every cuisine_type — useful for a "what if we
   added this combo?" brainstorm view.

---

## What's next

Module 03 zooms in on `GROUP BY`, `HAVING`, and the richer aggregation functions — the
foundation for the dashboard-style summaries the application actually uses.