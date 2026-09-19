# Setup Guide

> Bring the entire CâyGiaPhảSố stack up locally — database, backend, frontend — in under 15 minutes.

## TL;DR

```bash
# 1. Start Postgres
docker run -d --name skillseed-postgres \
  -e POSTGRES_USER=skillseed \
  -e POSTGRES_PASSWORD=skillseed_dev_password \
  -e POSTGRES_DB=skillseed \
  -p 5432:5432 \
  postgres:16

# 2. Run the backend (auto-applies migrations + seed)
cd backend
mvn spring-boot:run

# 3. Run the frontend (in a separate terminal)
cd frontend
npm install
npm run dev

# Open
# Backend:  http://localhost:8080/api
# Frontend: http://localhost:3000
```

---

## Prerequisites

| Tool | Minimum version | Notes |
| --- | --- | --- |
| Java | 17 (LTS) | Tested with Temurin 17.0.10+. JDK 21 also works. |
| Maven | 3.8+ | Or use the wrapper: `./mvnw spring-boot:run`. |
| Node.js | 18.18+ | Tested with Node 20 LTS. |
| npm | 9+ | Bundled with Node. |
| PostgreSQL | 16 | Either via Docker (recommended) or native install. |
| Docker | 24+ | Optional, but easiest way to run Postgres. |
| Git | 2.30+ | – |
| Postman / Insomnia / Bruno | – | Optional, but the collection helps a lot. |

---

## 1. Database setup

### Option A: Docker (recommended)

```bash
docker run -d --name skillseed-postgres \
  -e POSTGRES_USER=skillseed \
  -e POSTGRES_PASSWORD=skillseed_dev_password \
  -e POSTGRES_DB=skillseed \
  -p 5432:5432 \
  postgres:16
```

Check it's running:

```bash
docker ps | grep postgres
docker logs skillseed-postgres --tail 20
```

### Option B: Native PostgreSQL

If you already have PostgreSQL 16 installed:

```sql
CREATE DATABASE skillseed;
CREATE USER skillseed WITH ENCRYPTED PASSWORD 'skillseed_dev_password';
GRANT ALL PRIVILEGES ON DATABASE skillseed TO skillseed;
```

If your user is different, also grant schema-level privileges (Postgres 15+ requires this):

```sql
GRANT ALL ON SCHEMA public TO skillseed;
```

### Apply migrations manually (optional)

Spring Boot + Flyway will apply migrations automatically on startup, but if you want to do it manually:

```bash
# Apply the three migration files in order
for f in V1 V2 V3; do
  PGPASSWORD=skillseed_dev_password psql -h localhost -U skillseed -d skillseed \
    -v ON_ERROR_STOP=1 -f backend/src/main/resources/db/migration/${f}__*.sql
done
```

> ⚠️ The project uses an isolated `caygiaphaso` schema inside the `skillseed` database. All migrations set `search_path = caygiaphaso, public;` at the top so tables don't pollute `public`.

---

## 2. Backend setup

```bash
cd backend

# (Optional) copy env example
cp .env.example .env

# Run
mvn spring-boot:run
```

The first run will:

1. Download dependencies (~3 minutes)
2. Connect to Postgres at `localhost:5432`
3. Apply `V1__init_schema.sql` (33 tables)
4. Apply `V2__seed_data.sql` (5 users, 3 families, ~45 members, 16 recipes, 9 stories, 5 time capsules, 8 events, …)
5. Apply `V3__create_views.sql` (10 views)
6. Start Tomcat on **http://localhost:8080**

You should see logs ending with:

```
Started Application in 12.345 seconds (process running for 13.012)
Tomcat started on port 8080 (http)
```

### Smoke-test the backend

```bash
# Public endpoint — no auth
curl http://localhost:8080/api/recipes/public

# Login as a seed user
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nguyen-family.vn","password":"Password123!"}'

# Use the access token
TOKEN=<paste-accessToken-here>
curl http://localhost:8080/api/auth/me -H "Authorization: Bearer $TOKEN"
curl http://localhost:8080/api/families -H "Authorization: Bearer $TOKEN"
```

### Backend environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `DB_HOST` | `localhost` | Postgres host |
| `DB_PORT` | `5432` | Postgres port |
| `DB_NAME` | `skillseed` | Database name |
| `DB_USER` | `skillseed` | Database user |
| `DB_PASSWORD` | `skillseed_dev_password` | Database password |
| `JWT_SECRET` | (dev only) | **Required in prod** — 256-bit base64 secret used to sign access tokens |
| `JWT_EXPIRATION` | `604800000` | Access-token lifetime in ms (7 days) |
| `SERVER_PORT` | `8080` | Spring Boot port |

For local dev, defaults work. For any non-local environment, set `JWT_SECRET` to a 256-bit random value.

---

## 3. Frontend setup

```bash
cd frontend
cp .env.example .env.local

npm install      # ~30 seconds
npm run dev
```

The Next.js dev server starts on **http://localhost:3000**.

### Frontend environment variables

`.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api
NEXT_PUBLIC_APP_NAME="CâyGiaPhảSố"
```

`NEXT_PUBLIC_API_BASE_URL` is the base URL the front-end hits. Defaults to `http://localhost:8080/api` if not set.

---

## 4. Default seed accounts

All passwords are `Password123!` (for local dev only):

| Email | Full name | Family | Role |
| --- | --- | --- | --- |
| `admin@nguyen-family.vn` | Nguyễn Văn An | Họ Nguyễn (1820) | ADMIN |
| `lan@nguyen-family.vn` | Nguyễn Thị Lan | Họ Nguyễn | MEMBER |
| `minh@nguyen-family.vn` | Nguyễn Minh | Họ Nguyễn | MEMBER |
| `hoa@tran-family.vn` | Trần Thị Hoa | Họ Trần (1855) | ADMIN |
| `tuan@le-family.vn` | Lê Văn Tuấn | Họ Lê (1965) | ADMIN |

A handful of magic sample UUIDs from `V2__seed_data.sql`:

- **Họ Nguyễn family id**: `aaaaaaaa-0000-0000-0000-000000000001`
- **Họ Nguyễn user (admin)**: `11111111-1111-1111-1111-111111111111`
- **Bánh chưng recipe**: `aaaa2222-0000-0000-0000-000000000001`
- **Cụ Hùng member**: `a0000001-0000-0000-0000-000000000001`

The Postman collection pre-populates these in the environment.

---

## 5. Reset / clean

### Wipe database and re-apply migrations

```bash
docker exec skillseed-postgres psql -U skillseed -d skillseed \
  -c "DROP SCHEMA IF EXISTS caygiaphaso CASCADE;"

# Restart the backend — Flyway will re-create the schema and re-seed.
cd backend
mvn spring-boot:run
```

### Wipe Docker Postgres entirely

```bash
docker stop skillseed-postgres
docker rm skillseed-postgres
# Re-create from scratch (Step 1 above)
```

### Reset the frontend cache

```bash
cd frontend
rm -rf .next node_modules
npm install
npm run dev
```

---

## 6. Troubleshooting

### Backend won't start: `FATAL: database "skillseed" does not exist`

You skipped Step 1. Either run the Docker command or create the database manually.

### Backend won't start: `FATAL: password authentication failed for user "skillseed"`

Either Postgres is running with a different password, or the user doesn't exist. Verify:

```bash
PGPASSWORD=skillseed_dev_password psql -h localhost -U skillseed -d skillseed -c 'SELECT 1;'
```

### Backend won't start: `relation "caygiaphaso.users" does not exist`

The schema wasn't created. Either Flyway failed silently (check the logs) or you ran the migrations out of order. Reset and retry:

```bash
docker exec skillseed-postgres psql -U skillseed -d skillseed \
  -c "DROP SCHEMA IF EXISTS caygiaphaso CASCADE;"
mvn spring-boot:run   # Flyway will re-apply
```

### Frontend shows `Network Error`

The backend isn't reachable. Verify `http://localhost:8080/api/recipes/public` returns 200 in a browser. Also check `NEXT_PUBLIC_API_BASE_URL` in `frontend/.env.local`.

### Frontend can't sign in

Check the browser's **Network** tab — the login POST should hit `/api/auth/login`. If you see a CORS error, the backend's `SecurityConfig` may not include your origin. (For dev, all origins are allowed.)

### `Port 8080 already in use`

```bash
# macOS / Linux
lsof -i :8080
kill -9 <pid>

# Windows
netstat -ano | findstr :8080
taskkill /F /PID <pid>
```

Or run on a different port:

```bash
SERVER_PORT=8081 mvn spring-boot:run
# and update NEXT_PUBLIC_API_BASE_URL accordingly
```

### `Port 3000 already in use` (Next.js)

Next.js will auto-pick 3001, 3002, … Look at the dev-server log.

### `JWT_SECRET is required` in production

In dev, a fallback secret is used. **Always set `JWT_SECRET` to a 256-bit base64 value in any deployed environment:**

```bash
openssl rand -base64 32
# -> copy the output into JWT_SECRET
```

### Flyway migration mismatch

If you change a migration file after it has been applied, Flyway refuses to start:

```
Migration version 2 mismatch
```

The fix is to either revert your migration changes or use `flyway.repair`:

```bash
mvn flyway:repair -Dflyway.url=jdbc:postgresql://localhost:5432/skillseed \
                  -Dflyway.user=skillseed \
                  -Dflyway.password=skillseed_dev_password
```

For dev only. Never repair in production.

---

## 7. Project layout

```
test-api-sql/
├── backend/                # Spring Boot 3.2.5 (Java 17)
│   ├── src/main/java/com/giapha/
│   │   ├── controller/     # 20 REST controllers
│   │   ├── service/        # business logic (raw SQL via JdbcTemplate)
│   │   ├── repository/     # SQL queries
│   │   ├── model/dto/      # request/response DTOs
│   │   ├── security/       # JWT, Spring Security, CurrentUser
│   │   ├── exception/      # global exception handler
│   │   └── config/         # SecurityConfig, application config
│   └── src/main/resources/
│       ├── application.yml # Spring Boot config (context-path=/api, port=8080)
│       └── db/migration/   # Flyway migrations (V1, V2, V3)
├── database/               # Schema docs and queries
├── frontend/               # Next.js 14 (App Router)
│   └── src/
│       ├── app/            # pages and layouts
│       ├── components/     # React components
│       ├── hooks/          # React Query hooks
│       ├── lib/            # API client, utils
│       └── types/          # TypeScript types
└── docs/                   # ← You are here
    ├── api/                # REST API reference (12 files)
    ├── api-testing/        # test cases & methodology (6 files)
    ├── postman/            # importable collection + env
    └── setup/              # this file
```

---

## See also

- [../api/README.md](../api/README.md) — REST API reference
- [../postman/README.md](../postman/README.md) — Postman collection
- [../api-testing/README.md](../api-testing/README.md) — how to test
- [`../../backend/README.md`](../../backend/README.md) — backend-specific notes
- [`../../database/README.md`](../../database/README.md) — database schema docs