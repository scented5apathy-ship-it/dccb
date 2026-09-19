# Module 05 — Recursive CTEs

> **Difficulty**: Advanced · **Time**: 90–120 min · **Builds on**: Modules 02–04.
> This is the heart of the CâyGiaPhảSố codebase. Plan to spend real time here.

## Learning objectives

- Read and write `WITH RECURSIVE` queries using the **base case + recursive case** pattern.
- Walk a tree both directions: **ancestors** and **descendants**.
- Build the **recipe-genealogy chain** — the headline feature of the platform.
- Detect and break **cycles** with `CYCLE` or path-tracking arrays.
- Track **depth** and a **path** through the recursion.
- Understand `UNION` (deduplicates) vs `UNION ALL` (keeps duplicates) in the recursive case.

## Concepts

### Why recursive CTEs?

Some data is naturally recursive — a family tree, a bill of materials, an org chart, a
threaded discussion. SQL is fundamentally set-based; without a recursive CTE you would
need either:

- a fixed number of self-joins (works only when depth is bounded and known),
- an application-side loop pulling one level at a time,
- a recursive CTE (the right answer).

### Anatomy of `WITH RECURSIVE`

```sql
WITH RECURSIVE cte_name (col1, col2, depth, path) AS (
    -- base case: starting rows
    SELECT ..., 0, ARRAY[start_id]
    FROM   ...
    WHERE  ...

    UNION ALL       -- keep duplicates, much faster than UNION

    -- recursive case: build the next level using the CTE itself
    SELECT ..., cte.depth + 1, cte.path || next.id
    FROM   cte_name cte
    JOIN   ...       ON ...
    WHERE  ...
)
SELECT * FROM cte_name;
```

Key rules:

- The base case and the recursive case **must produce the same column shape**.
- The recursive case **must reference** the CTE itself (otherwise Postgres refuses to
  treat it as recursive).
- Without a cycle check, infinite loops are possible — always guard with a depth limit
  *or* a path array.

### Cycle detection: Postgres 14+ `CYCLE` clause

Postgres 14 introduced a built-in syntax:

```sql
WITH RECURSIVE tree (id, parent_id, depth) AS (
   SELECT id, parent_id, 0 FROM nodes WHERE id = 1
   UNION ALL
   SELECT n.id, n.parent_id, t.depth + 1
   FROM   nodes n JOIN tree t ON n.parent_id = t.id
)
CYCLE id SET is_cycle USING path
SELECT * FROM tree;
```

`is_cycle` is `TRUE` for the row that *closes* the loop (so you can filter it out), and
`path` is an array of all the IDs visited so far.

### Tracking depth and path

The two most useful pieces of state you can add:

- `depth` — how many hops from the start. Essential for "show me 3 levels up".
- `path` (`type[]`) — the IDs visited so far. Use it as both a guard
  (`WHERE next.id <> ALL(path)`) and a presentation aid
  (`STRING_AGG(name, ' → ' ORDER BY depth)`).

### `UNION` vs `UNION ALL`

In a recursive CTE, the recursive case typically produces **disjoint** rows (each row is
one step deeper). Prefer `UNION ALL` — it is faster and you rarely want the deduplication
that `UNION` performs.

---

## Exercises

### Exercise 1: Ancestors of a member

**Difficulty**: Medium · **Objective**: Walk **up** the tree using the `relationships`
table.

**Question**: For the member `'a0000013-0000-0000-0000-000000000013'` (Nguyễn Thị Lan,
the food blogger — đời 5), find every ancestor by following `PARENT` edges. Show the
depth and the ancestor's name, ordered by depth ascending.

**Schema**: `caygiaphaso.family_members(id, full_name)`,
`caygiaphaso.relationships(from_member_id, to_member_id, relationship_type)`

**Hint**: The base case is the starting member at depth 0. The recursive step follows
`relationships.from_member_id = cte.id` with `relationship_type = 'PARENT'`.

**Solution**:

```sql
WITH RECURSIVE ancestors AS (
    -- base case: the starting member
    SELECT id, full_name, 0 AS depth
    FROM   family_members
    WHERE  id = 'a0000013-0000-0000-0000-000000000013'

    UNION ALL

    -- recursive case: parent of any ancestor
    SELECT parent.id, parent.full_name, ancestors.depth + 1
    FROM   ancestors
    JOIN   relationships r ON r.to_member_id = ancestors.id
    JOIN   family_members parent ON parent.id = r.from_member_id
    WHERE  r.relationship_type = 'PARENT'
)
SELECT depth, full_name AS ancestor
FROM   ancestors
ORDER BY depth;
```

**Explanation**: We follow `to_member_id → from_member_id`. The seed stores the parent
edge as `from_member_id = parent`, `to_member_id = child`, so to climb up we look for
rows where the **child** is the current row (`to_member_id = ancestors.id`) and the
**parent** is the new row (`r.from_member_id`).

**Expected output**:

```
 depth |       ancestor
-------+-----------------------
     0 | Nguyễn Thị Lan (con)
     1 | Nguyễn Văn An
     2 | Nguyễn Văn Cương
     3 | Nguyễn Văn Đức
     4 | Nguyễn Văn Hùng
```

---

### Exercise 2: Descendants of a member

**Difficulty**: Medium · **Objective**: Walk **down** the tree.

**Question**: Find every descendant of member `'a0000001-0000-0000-0000-000000000001'`
(Cụ Hùng, the patriarch). Show depth and descendant name, ordered by depth.

**Hint**: Flip the join direction — find rows where `from_member_id = cte.id`.

**Solution**:

```sql
WITH RECURSIVE descendants AS (
    SELECT id, full_name, 0 AS depth
    FROM   family_members
    WHERE  id = 'a0000001-0000-0000-0000-000000000001'

    UNION ALL

    SELECT child.id, child.full_name, d.depth + 1
    FROM   descendants d
    JOIN   relationships r ON r.from_member_id = d.id
    JOIN   family_members child ON child.id = r.to_member_id
    WHERE  r.relationship_type = 'PARENT'
)
SELECT depth, full_name AS descendant
FROM   descendants
ORDER BY depth, full_name;
```

**Explanation**: This time we look for rows where the *parent* is the current row, and
take the *child* as the next row.

**Expected output (first 10)**:

```
 depth |     descendant
-------+-----------------------
     0 | Nguyễn Văn Hùng
     1 | Nguyễn Văn Đức
     1 | Nguyễn Văn Tài
     2 | Nguyễn Văn Bình
     2 | Nguyễn Văn Cương
     2 | Nguyễn Văn Thắng
     3 | Nguyễn Thị Hạnh
     3 | Nguyễn Văn An
     3 | Nguyễn Văn Hùng (con)
     3 | Nguyễn Thị Yến
```

---

### Exercise 3: Full lineage tree (subtree rooted at a member)

**Difficulty**: Medium-Hard · **Objective**: Combine ancestor depth + descendant
subtree, formatting the path.

**Question**: For `'a0000001-0000-0000-0000-000000000001'` (Cụ Hùng), build a path
string like `Cụ Hùng → Cụ Đức → Ông Cương → Bác An`. Use `' → '` as separator and
order by depth, then by path.

**Hint**: Track a `path_text` column with `concat_path || ' → ' || child_name`.

**Solution**:

```sql
WITH RECURSIVE tree AS (
    SELECT id,
           full_name,
           0                  AS depth,
           full_name::text    AS path
    FROM   family_members
    WHERE  id = 'a0000001-0000-0000-0000-000000000001'

    UNION ALL

    SELECT child.id,
           child.full_name,
           tree.depth + 1,
           tree.path || ' → ' || child.full_name
    FROM   tree
    JOIN   relationships r ON r.from_member_id = tree.id
    JOIN   family_members child ON child.id = r.to_member_id
    WHERE  r.relationship_type = 'PARENT'
)
SELECT depth, path
FROM   tree
ORDER BY depth, path;
```

**Explanation**: We carry a `path` string forward and append to it each step. This makes
the result readable but also fragile — if names contain the separator character it will
look odd. For production, prefer an array path (next exercise).

**Expected output (first 5)**:

```
 depth |                  path
-------+-----------------------------------------
     0 | Nguyễn Văn Hùng
     1 | Nguyễn Văn Hùng → Nguyễn Văn Đức
     1 | Nguyễn Văn Hùng → Nguyễn Văn Tài
     2 | Nguyễn Văn Hùng → Nguyễn Văn Đức → Nguyễn Văn Bình
     2 | Nguyễn Văn Hùng → Nguyễn Văn Đức → Nguyễn Văn Cương
```

---

### Exercise 4: Recipe-genealogy chain (the headline feature)

**Difficulty**: Hard · **Objective**: Apply the same walking pattern to
`recipe_origins` instead of `relationships`.

**Question**: For the recipe **Bánh chưng làng Đông Ngạc**
(`'aaaa2222-0000-0000-0000-000000000001'`), build the chain of who passed the recipe
to whom, in order. Include the `year_transmitted` for each hop.

**Schema**: `caygiaphaso.recipe_origins(recipe_id, from_member_id, to_member_id,
year_transmitted, generation_gap, story)`

**Hint**: A "root" edge is one whose `from_member_id` does not appear as a
`to_member_id` in any other row for the same recipe. Use a `NOT IN` to pick the roots.

**Solution**:

```sql
WITH RECURSIVE chain AS (
    -- base case: edges that start a chain (the "root" transmission)
    SELECT ro.recipe_id,
           ro.from_member_id,
           ro.to_member_id,
           ro.year_transmitted,
           1                                        AS hop,
           ARRAY[ro.from_member_id, ro.to_member_id] AS path
    FROM   recipe_origins ro
    WHERE  ro.recipe_id = 'aaaa2222-0000-0000-0000-000000000001'
      AND  ro.from_member_id NOT IN (
              SELECT to_member_id
              FROM   recipe_origins
              WHERE  recipe_id = ro.recipe_id
          )

    UNION ALL

    -- recursive case: extend the chain by one hop
    SELECT next.recipe_id,
           next.from_member_id,
           next.to_member_id,
           next.year_transmitted,
           chain.hop + 1,
           chain.path || next.to_member_id
    FROM   chain
    JOIN   recipe_origins next
             ON next.recipe_id  = chain.recipe_id
            AND next.from_member_id = chain.to_member_id
            AND NOT (next.to_member_id = ANY(chain.path))   -- cycle guard
)
SELECT hop,
       fm_from.full_name AS from_name,
       fm_to.full_name   AS to_name,
       year_transmitted
FROM   chain
JOIN   family_members fm_from ON fm_from.id = chain.from_member_id
JOIN   family_members fm_to   ON fm_to.id   = chain.to_member_id
ORDER BY hop;
```

**Explanation**: We treat `recipe_origins` as a directed graph: edge `(from → to)` means
"transmitted the recipe from `from` to `to`". Walking forward is identical to walking
down the family tree, but the base case must be carefully chosen:

- **Option A**: every edge (used in Exercise 5 — multi-branch tree) — gives you all
  reachable nodes but with duplicates.
- **Option B** (this exercise): only edges that are *roots*, i.e. whose `from` is no
  one's `to`. This gives you the canonical chains.

The `NOT (to_member_id = ANY(path))` predicate guarantees we never revisit a person,
which would otherwise cause an infinite loop if the seed contained a cycle.

**Expected output**:

```
 hop |   from_name    |      to_name      | year_transmitted
-----+----------------+-------------------+------------------
   1 | Cụ Đức         | Ông Cương        |             1910
   2 | Ông Cương      | Cô Lan           |             1985
   3 | Cô Lan         | Lan (cháu)       |             2015
```

> This is exactly the chain the `v_recipe_genealogy` view is meant to support, walked
> step by step.

---

### Exercise 5: Recipe-genealogy tree (multi-branch)

**Difficulty**: Hard · **Objective**: Cycle-safe recursion with depth limit.

**Question**: Same recipe (Bánh chưng), but show every node in the graph reachable from
the root members, with a depth limit of 5 to prevent runaway recursion.

**Schema**: `caygiaphaso.recipe_origins`, `caygiaphaso.family_members`

**Hint**: Use `depth < 5` in the recursive case as a safety net.

**Solution**:

```sql
WITH RECURSIVE graph AS (
    SELECT ro.recipe_id,
           ro.from_member_id,
           ro.to_member_id,
           1 AS hop,
           ARRAY[ro.from_member_id, ro.to_member_id] AS path
    FROM   recipe_origins ro
    WHERE  ro.recipe_id = 'aaaa2222-0000-0000-0000-000000000001'

    UNION ALL

    SELECT next.recipe_id,
           next.from_member_id,
           next.to_member_id,
           graph.hop + 1,
           graph.path || next.to_member_id
    FROM   graph
    JOIN   recipe_origins next
             ON next.recipe_id = graph.recipe_id
            AND next.from_member_id = graph.to_member_id
            AND NOT (next.to_member_id = ANY(graph.path))
            AND graph.hop < 5
)
SELECT hop, from_m.full_name AS giver, to_m.full_name AS receiver
FROM   graph
JOIN   family_members from_m ON from_m.id = graph.from_member_id
JOIN   family_members to_m   ON to_m.id   = graph.to_member_id
ORDER BY hop, giver;
```

**Expected output** (6 rows — every edge in the graph reached from any starting point):

```
 hop |       giver       |       receiver
-----+-------------------+-----------------------
   1 | Nguyễn Văn Đức    | Nguyễn Văn Cương
   1 | Nguyễn Văn Cương  | Nguyễn Thị Lan
   1 | Nguyễn Thị Lan    | Nguyễn Thị Lan (con)
   2 | Nguyễn Văn Cương  | Nguyễn Thị Lan
   2 | Nguyễn Thị Lan    | Nguyễn Thị Lan (con)
   3 | Nguyễn Thị Lan    | Nguyễn Thị Lan (con)
```

The depth limit (`graph.hop < 5`) becomes important for more complex graphs where a
chef could have learned from two teachers — without it, a cycle would cause infinite
recursion.

---

### Exercise 6: Common ancestors of two members

**Difficulty**: Hard · **Objective**: Combine two recursive walks and intersect them.

**Question**: Find every member who is an ancestor of **both** Lan (cháu)
(`'a0000013-0000-0000-0000-000000000013'`) **and** Minh
(`'a0000014-0000-0000-0000-000000000014'`). Show the ancestor's name and the depth in
each lineage.

**Hint**: Compute two ancestor sets, then `INTERSECT` or use `INNER JOIN` on the `id`.

**Solution**:

```sql
WITH RECURSIVE

-- ancestors of Lan
ancestors_lan AS (
    SELECT id, full_name, 0 AS depth_lan
    FROM   family_members
    WHERE  id = 'a0000013-0000-0000-0000-000000000013'
    UNION ALL
    SELECT p.id, p.full_name, al.depth_lan + 1
    FROM   ancestors_lan al
    JOIN   relationships r ON r.to_member_id = al.id
    JOIN   family_members p ON p.id = r.from_member_id
    WHERE  r.relationship_type = 'PARENT'
),

-- ancestors of Minh (same shape; thanks to symmetry in the seed, results overlap)
ancestors_minh AS (
    SELECT id, full_name, 0 AS depth_minh
    FROM   family_members
    WHERE  id = 'a0000014-0000-0000-0000-000000000014'
    UNION ALL
    SELECT p.id, p.full_name, am.depth_minh + 1
    FROM   ancestors_minh am
    JOIN   relationships r ON r.to_member_id = am.id
    JOIN   family_members p ON p.id = r.from_member_id
    WHERE  r.relationship_type = 'PARENT'
)

SELECT al.id,
       al.full_name                              AS ancestor,
       al.depth_lan                              AS lan_depth,
       am.depth_minh                             AS minh_depth
FROM   ancestors_lan al
JOIN   ancestors_minh am USING (id)
ORDER BY al.full_name;
```

**Explanation**: We compute both ancestor sets in parallel CTEs and join on the `id`.
Depths on each side can differ — siblings share an ancestor at the same depth, but
cousins of different ages might share an ancestor at slightly different depths.

**Expected output**:

```
                  ancestor                  | lan_depth | minh_depth
-------------------------------------------+-----------+-----------
 Nguyễn Văn An                             |         1 |         1
 Nguyễn Văn Cương                          |         2 |         2
 Nguyễn Văn Đức                            |         3 |         3
 Nguyễn Văn Hùng                            |         4 |         4
```

---

### Exercise 7: Generation depth from the family root

**Difficulty**: Medium · **Objective**: Compute depth for every member in a family.

**Question**: For the Nguyễn family, compute the depth of every member from the earliest
ancestor (the one with the smallest birth date in the family). Show `full_name`,
`birth_date`, and `depth`. Sort by depth then name.

**Hint**: Use a subquery to find the earliest-born member's `id`, then start the
recursion from there. Use `WHERE id = (subquery)` instead of `ORDER BY ... LIMIT 1`
inside the CTE (Postgres disallows the latter in the base case of a recursive CTE).

**Solution**:

```sql
WITH RECURSIVE ng AS (
    -- pick the earliest-born member as the root
    SELECT id, full_name, birth_date, 0 AS depth, ARRAY[id] AS path
    FROM   family_members
    WHERE  id = (
              SELECT id FROM family_members
              WHERE  family_id = 'aaaaaaaa-0000-0000-0000-000000000001'
              ORDER BY birth_date NULLS LAST
              LIMIT  1
           )

    UNION ALL

    SELECT child.id, child.full_name, child.birth_date,
           ng.depth + 1, ng.path || child.id
    FROM   ng
    JOIN   relationships r ON r.from_member_id = ng.id
    JOIN   family_members child ON child.id = r.to_member_id
    WHERE  r.relationship_type = 'PARENT'
          AND NOT (child.id = ANY(ng.path))
)
SELECT depth, full_name, birth_date
FROM   ng
ORDER BY depth, birth_date;
```

**Expected output (first 5)**:

```
 depth |      full_name      | birth_date
-------+---------------------+------------
     0 | Nguyễn Văn Hùng     | 1820-03-15
     1 | Nguyễn Văn Đức      | 1850-06-10
     1 | Nguyễn Văn Tài      | 1858-02-20
     2 | Nguyễn Văn Cương    | 1885-05-15
     2 | Nguyễn Văn Bình     | 1888-04-10
```

---

### Exercise 8: All paths from oldest to newest variant of a recipe

**Difficulty**: Hard · **Objective**: Cycle-safe enumeration with `string_agg` on the path.

**Question**: For the Bánh chưng recipe, find every path from a root giver to a leaf
receiver (i.e. no one received the recipe *from* them). Display the path as a
human-readable arrow string.

**Hint**: A "leaf" receiver is a `to_member_id` with no outgoing `recipe_origins` edge.
Identify leaves in a subquery, then run the recursive walk.

**Solution**:

```sql
WITH RECURSIVE paths AS (
    SELECT ro.recipe_id,
           ro.from_member_id,
           ro.to_member_id,
           1 AS hop,
           ARRAY[ro.from_member_id, ro.to_member_id] AS path,
           ARRAY[ro.from_member_id]::text[]          AS name_path
    FROM   recipe_origins ro
    WHERE  ro.recipe_id = 'aaaa2222-0000-0000-0000-000000000001'

    UNION ALL

    SELECT next.recipe_id,
           next.from_member_id,
           next.to_member_id,
           p.hop + 1,
           p.path || next.to_member_id,
           p.name_path || (SELECT full_name FROM family_members WHERE id = next.to_member_id)
    FROM   paths p
    JOIN   recipe_origins next
             ON next.recipe_id = p.recipe_id
            AND next.from_member_id = p.to_member_id
            AND NOT (next.to_member_id = ANY(p.path))
            AND p.hop < 10
)
SELECT STRING_AGG(np, ' → ' ORDER BY ord) AS chain
FROM   (
    SELECT name_path AS np,
           ROW_NUMBER() OVER ()           AS ord
    FROM   paths
) x;
```

> In practice this query is easier to read split into a final `SELECT` that pivots the
> array into a string; here we keep it inline.

**Expected output**:

```
                                       chain
---------------------------------------------------------------------------------
 Cụ Đức → Ông Cương → Cô Lan → Lan (cháu)
```

> With only one transmission chain in the seed, the result is a single row. Try the
> same query on a recipe with multiple branches (if your seed adds any) to see multiple
> paths.

---

### Exercise 9: Event timeline with parent events

**Difficulty**: Medium-Hard · **Objective**: Adapt the recursion to a different edge
type.

**Question**: Some events reference earlier events through their `description` text
(e.g. "the wedding that started the dynasty"). Build a timeline ordering every event by
`event_date`, then walk forward through events that follow one another within 30 days
of each other — treating each as a "child" of the previous.

**Schema**: `caygiaphaso.events(id, title, event_date)`

**Hint**: Use `LAG(event_date) OVER (ORDER BY event_date)` to detect adjacency, then
build a recursive chain. This is a good place to reach for `LAG` from Module 04.

**Solution (combined)**:

```sql
WITH RECURSIVE timeline AS (
    -- pick the earliest event in each family as a seed
    SELECT e.id, e.title, e.event_date, 1 AS sequence
    FROM   events e
    WHERE  e.event_date = (SELECT MIN(event_date) FROM events WHERE family_id = e.family_id)

    UNION ALL

    SELECT next_e.id, next_e.title, next_e.event_date, t.sequence + 1
    FROM   timeline t
    JOIN   LATERAL (
        SELECT id, title, event_date
        FROM   events
        WHERE  family_id = (SELECT family_id FROM events WHERE id = t.id)
          AND  event_date > t.event_date
          AND  event_date <= t.event_date + INTERVAL '30 days'
        ORDER BY event_date
        LIMIT  1
    ) next_e ON TRUE
)
SELECT sequence, title, event_date::date
FROM   timeline
ORDER BY sequence;
```

**Expected output (approximate)**:

```
 sequence |              title               | event_date
----------+----------------------------------+------------
        1 | Giỗ tổ Nguyễn Văn Hùng          | 2024-03-15
        1 | Giỗ tổ Trần Văn Hào             | 2024-04-10
        1 | Khai trương nhà hàng Miền Tây   | 2010-05-15
```

> The 30-day window means the chain usually stops after one step because the seed's
> events are spaced months apart. This is an exercise in pattern matching, not an
> exact production query — try extending the window to `INTERVAL '6 months'` to see a
> longer chain.

---

### Exercise 10: Story cascade via tags

**Difficulty**: Hard · **Objective**: Recurse through a *many-to-many* relation.

**Question**: Find every story that can be reached from the story `Bí quyết bánh chưng
5 đời` (`'aaaa3333-0000-0000-0000-000000000002'`) by following **shared tags** —
i.e. a story references another if they have any tag in common. Show depth, story
title, and the list of tags that connect to the next story.

**Schema**: `caygiaphaso.stories(id, title)`, `caygiaphaso.story_tags`,
`caygiaphaso.story_tag_map`

**Solution**:

```sql
WITH RECURSIVE cascade AS (
    -- starting story
    SELECT s.id, s.title, 0 AS depth, ARRAY[s.id] AS path
    FROM   stories s
    WHERE  s.id = 'aaaa3333-0000-0000-0000-000000000002'

    UNION ALL

    -- stories sharing at least one tag with a story already in the cascade
    SELECT next_s.id, next_s.title, c.depth + 1, c.path || next_s.id
    FROM   cascade c
    JOIN   story_tag_map m1 ON m1.story_id = c.id
    JOIN   story_tag_map m2 ON m2.tag_id   = m1.tag_id
    JOIN   stories next_s    ON next_s.id   = m2.story_id
    WHERE  NOT (next_s.id = ANY(c.path))     -- cycle guard
)
SELECT DISTINCT depth, title
FROM   cascade
ORDER BY depth, title;
```

**Explanation**: We join twice through `story_tag_map` — once for the current story's
tags, once for any other story sharing those tags. The `DISTINCT` deduplicates the rows
that the join inevitably fans out.

**Expected output**:

```
 depth |                title
-------+---------------------------------------
     0 | Bí quyết bánh chưng 5 đời
     1 | Hồi tưởng về cụ tổ Nguyễn Văn Hùng
     1 | Mâm cỗ Tết của bà Lệ
     1 | Ông Hòa - người thầy thuốc của làng
     1 | Ông nội và phong trào Duy Tân
     2 | Ông nội và phong trào Duy Tân   -- shared "truyền thống" tag
```

---

## Bonus: built-in `CYCLE` (Postgres 14+)

If your server is 14 or newer, the same recipe-genealogy chain becomes:

```sql
WITH RECURSIVE chain AS (
    SELECT ro.from_member_id, ro.to_member_id, 1 AS hop
    FROM   recipe_origins ro
    WHERE  ro.recipe_id = 'aaaa2222-0000-0000-0000-000000000001'

    UNION ALL

    SELECT next.from_member_id, next.to_member_id, chain.hop + 1
    FROM   chain
    JOIN   recipe_origins next
             ON next.recipe_id  = 'aaaa2222-0000-0000-0000-000000000001'
            AND next.from_member_id = chain.to_member_id
)
CYCLE to_member_id SET is_cycle USING path
SELECT hop,
       (SELECT full_name FROM family_members WHERE id = chain.from_member_id) AS giver,
       (SELECT full_name FROM family_members WHERE id = chain.to_member_id)   AS receiver,
       is_cycle
FROM   chain
WHERE  NOT is_cycle;
```

The `CYCLE` clause does the bookkeeping for you: it tracks every `to_member_id` seen and
flips `is_cycle` to `TRUE` the second time around.

---

## Stretch / Try it yourself

1. **Tree visualisation** — write a query that returns the depth + an indent string of
   `repeat('  ', depth)` for the Nguyễn tree starting from Cụ Hùng.
2. **Find common descendants** of two spouses.
3. **Find a "youngest common ancestor** between two cousins.
4. **Reverse the recipe chain** — given the most recent recipient, list everyone who
   taught them (one level up the chain).
5. **Use `CYCLE`** with Postgres 14+ to detect and skip the cycles automatically.

---

## What's next

Module 06 finishes the tour with **advanced** techniques: correlated subqueries, JSON
operators, full-text search, and reading `EXPLAIN ANALYZE` output. These are the tools
you'll reach for when performance matters or the schema runs out of relational columns.