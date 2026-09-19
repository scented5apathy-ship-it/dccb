# Performance Tests

> Load-testing recipes, expected throughput and response-time targets, and database-query optimisation notes for the CâyGiaPhảSố API.

## Goals

We want CâyGiaPhảSố to remain snappy even as families grow (hundreds of members, hundreds of recipes, decades of stories). This document gives you:

- A baseline **`k6`** script you can run today
- Expected latency / throughput targets per endpoint class
- Notes on the most expensive queries (the family tree, the genealogy tree) and how to keep them fast

---

## Targets

| Endpoint class | p50 | p95 | p99 | Throughput |
| --- | --- | --- | --- | --- |
| `GET /auth/me` | < 20 ms | < 80 ms | < 150 ms | 200 RPS / instance |
| `GET /families` (≤ 5 families/user) | < 30 ms | < 100 ms | < 200 ms | 200 RPS |
| `GET /families/{id}/tree` ⭐ (≤ 50 members) | < 100 ms | < 300 ms | < 500 ms | 50 RPS |
| `GET /families/{id}/tree` (50–500 members) | < 300 ms | < 1 s | < 2 s | 20 RPS |
| `GET /families/{id}/recipes` (paginated) | < 50 ms | < 150 ms | < 300 ms | 200 RPS |
| `GET /recipes/{id}` (full detail) | < 50 ms | < 200 ms | < 400 ms | 100 RPS |
| `GET /recipes/{id}/genealogy-tree` ⭐ | < 80 ms | < 250 ms | < 500 ms | 50 RPS |
| `POST /recipes` (with origins) | < 200 ms | < 600 ms | < 1 s | 20 RPS |
| `POST /recipes/{id}/comments` | < 50 ms | < 200 ms | < 400 ms | 100 RPS |
| `GET /recipes/public` (search) | < 80 ms | < 300 ms | < 600 ms | 50 RPS |
| `GET /notifications` | < 30 ms | < 100 ms | < 200 ms | 200 RPS |
| `POST /auth/login` (with bcrypt) | < 250 ms | < 500 ms | < 800 ms | 30 RPS / instance |

The p95 < 300 ms target on the family-tree endpoint is the **most important** because it's the marquee feature. Everything else can degrade gracefully under load; the tree must always render promptly.

---

## Sample k6 script

Save as `k6-load-test.js`:

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

const loginDuration = new Trend('login_duration');
const treeDuration  = new Trend('tree_duration');
const recipeListDuration = new Trend('recipe_list_duration');

const BASE = __ENV.BASE || 'http://localhost:8080/api';

export const options = {
  stages: [
    { duration: '30s', target: 20 },   // ramp to 20 VUs
    { duration: '1m',  target: 20 },   // hold
    { duration: '30s', target: 50 },   // ramp to 50 VUs
    { duration: '1m',  target: 50 },   // hold
    { duration: '30s', target: 0  },   // ramp down
  ],
  thresholds: {
    'http_req_failed':     ['rate<0.01'],            // < 1% errors
    'http_req_duration':   ['p(95)<500'],            // 95th percentile < 500 ms
    'login_duration':      ['p(95)<800'],            // login is bcrypt-heavy
    'tree_duration':       ['p(95)<500'],            // the family tree
    'recipe_list_duration':['p(95)<300'],
  },
};

// ---- Test data ----
const USERS = [
  { email: 'admin@nguyen-family.vn', password: 'Password123!' },
  { email: 'lan@nguyen-family.vn',   password: 'Password123!' },
  { email: 'minh@nguyen-family.vn',  password: 'Password123!' },
];
const FAMILY_ID = 'aaaaaaaa-0000-0000-0000-000000000001';

let cachedTokens = {};

function login(user) {
  const res = http.post(
    `${BASE}/auth/login`,
    JSON.stringify(user),
    { headers: { 'Content-Type': 'application/json' } }
  );
  loginDuration.add(res.timings.duration);
  check(res, {
    'login 200': (r) => r.status === 200,
    'has accessToken': (r) => !!r.json('accessToken'),
  });
  return res.json('accessToken');
}

export default function () {
  // Pick a user; reuse their token across iterations
  const user = USERS[__VU % USERS.length];
  const cacheKey = user.email;
  let token = cachedTokens[cacheKey];
  if (!token) {
    token = login(user);
    cachedTokens[cacheKey] = token;
  }
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  // 1. /auth/me
  const me = http.get(`${BASE}/auth/me`, authHeader);
  check(me, { 'me 200': (r) => r.status === 200 });

  // 2. Family tree ⭐
  const treeRes = http.get(`${BASE}/families/${FAMILY_ID}/tree`, authHeader);
  treeDuration.add(treeRes.timings.duration);
  check(treeRes, {
    'tree 200':       (r) => r.status === 200,
    'has generations':(r) => Array.isArray(r.json('generations')),
  });

  // 3. Recipe list
  const rl = http.get(`${BASE}/families/${FAMILY_ID}/recipes`, authHeader);
  recipeListDuration.add(rl.timings.duration);
  check(rl, { 'recipe list 200': (r) => r.status === 200 });

  // 4. Public recipes (no auth)
  const pub = http.get(`${BASE}/recipes/public`);
  check(pub, { 'public 200': (r) => r.status === 200 });

  sleep(Math.random() * 2 + 1); // 1-3s think time
}
```

### Running

```bash
# Install k6: https://k6.io/docs/getting-started/installation/

# Local
k6 run k6-load-test.js

# Against staging
k6 run -e BASE=https://staging.example.com/api k6-load-test.js

# Generate a JSON report for CI
k6 run --out json=results.json k6-load-test.js
```

In CI you can fail the build when any threshold is breached:

```bash
k6 run --summary-export=summary.json k6-load-test.js
test $(jq '.metrics.http_req_duration.values.p(95)' summary.json) -lt 500 && exit 0 || exit 1
```

---

## Alternative tools

### Apache Bench (quick sanity)

```bash
# Login endpoint (POST)
ab -n 1000 -c 50 -p login.json -T application/json http://localhost:8080/api/auth/login

# Public endpoint (GET)
ab -n 10000 -c 100 http://localhost:8080/api/recipes/public
```

Apache Bench is one-shot and lacks the k6 scripting power, but it's pre-installed on most Linux distros and great for a 30-second sanity check.

### JMeter

If you need a GUI to design complex scenarios (e.g. one user logs in once, then 100 threads hammer the tree endpoint), JMeter is the industry standard. The test plan can be saved as XML and checked into git.

```bash
jmeter -n -t caygiaphaso.jmx -l results.jtl -e -o report/
```

---

## Database-query optimisation

Most performance problems will trace back to SQL. The expensive queries in CâyGiaPhảSố are:

### 1. Family tree (`GET /families/{id}/tree`)

This single endpoint issues:

1. 1 query for the family metadata
2. 1 query for all generations
3. 1 query for all members
4. 1 query for all relationships
5. Several queries for the photo / stats summary

**Optimisations**:

- Index `family_members(family_id)`, `relationships(family_id)`, `generations(family_id)`.
- Materialise the tree in memory once per family (cache for 5 minutes).
- For families with > 500 members, paginate by generation and lazy-load generations.

The view `v_family_summary` already exists in `V3__create_views.sql` — use it for the top counters.

### 2. Recipe genealogy tree (`GET /recipes/{id}/genealogy-tree`)

Recursive traversal of `recipe_origins` per recipe. Recursive CTE:

```sql
WITH RECURSIVE recipe_lineage AS (
  SELECT id, from_member_id, to_member_id, 0 AS depth
  FROM recipe_origins
  WHERE recipe_id = :recipeId AND from_member_id = (
    SELECT MIN(from_member_id) FROM recipe_origins WHERE recipe_id = :recipeId
  )

  UNION ALL

  SELECT ro.id, ro.from_member_id, ro.to_member_id, rl.depth + 1
  FROM recipe_origins ro
  JOIN recipe_lineage rl ON ro.from_member_id = rl.to_member_id
  WHERE ro.recipe_id = :recipeId
)
SELECT * FROM recipe_lineage;
```

**Optimisations**:

- Index `recipe_origins(recipe_id, from_member_id)` and `(recipe_id, to_member_id)`.
- For recipes with > 50 edges, pre-compute the tree in `recipe_genealogy_cache` table and invalidate on write.

### 3. Recipe detail (`GET /recipes/{id}`)

Issues 5+ queries (recipe + author + ingredients + steps + origins + reactions + comments).

**Optimisations**:

- Use `JOIN FETCH` (or its `JdbcTemplate` equivalent: a single `LEFT JOIN` query that returns all rows).
- Cache the recipe body for 30 seconds; comments/reactions can be stale by a few seconds.

### 4. Member search (`GET /users/search?q=...`)

```sql
SELECT id, email, full_name, avatar_url, is_active
FROM caygiaphaso.users
WHERE is_active = true
  AND (full_name ILIKE '%' || :q || '%' OR email ILIKE '%' || :q || '%')
LIMIT 50;
```

**Optimisations**:

- Add a GIN trigram index (`pg_trgm`) on `full_name` and `email`:
  ```sql
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
  CREATE INDEX users_full_name_trgm ON caygiaphaso.users USING GIN (full_name gin_trgm_ops);
  ```
- Cap results at 50 rows.

---

## Connection pool tuning

Default Spring Boot HikariCP settings:

```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 10
      minimum-idle: 2
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
```

For a load test that pushes > 100 RPS, increase `maximum-pool-size` to `cpu_cores * 4` (e.g. 4 cores → 16). Monitor `hikaricp.connections.active` in Micrometer.

---

## Profiling

For a deep dive:

```bash
# Enable SQL logging
SPRING_JPA_SHOW_SQL=true # (won't apply; this project uses JdbcTemplate)
LOGGING_LEVEL_COM_GIAPHA=DEBUG

# Capture slow queries with `pg_stat_statements`
docker exec -it skillseed-postgres psql -U skillseed -d skillseed \
  -c "SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 20;"
```

Or in Java, attach a JDK Flight Recorder (`-XX:StartFlightRecording=duration=60s,filename=rec.jfr`) and open the recording in JDK Mission Control.

---

## See also

- [`test-cases.md`](./test-cases.md) — TC-PERF-001 baseline
- [`../setup/README.md`](../setup/README.md) — bring up the stack
- [Postgres `pg_trgm`](https://www.postgresql.org/docs/current/pgtrgm.html) — trigram indexing