# CâyGiaPhảSố (AncestryTree) — Digital Family-Tree Platform

> A digital family-tree platform that goes beyond genealogy. CâyGiaPhảSố records the people, the recipes (and **who passed them to whom**), the stories, the events, and even the **time-locked messages** for future family members.

[Live demo](#) · [API reference](./docs/api/README.md) · [Setup guide](./docs/setup/README.md) · [Postman collection](./docs/postman/README.md)

---

## Three novel features ⭐

| Feature | What it does | Where to see it |
| --- | --- | --- |
| 🍜 **Recipe Genealogy** | Trace who passed a recipe to whom across generations as a visual tree with arrows | `/recipes/{id}` (Recipe tab) |
| ⏳ **Time Capsules** | Sealed messages that unlock on a future date or event — write a letter to your unborn grandchild | `/time-capsules` |
| 🌳 **Family Tree Visualisation** | Multi-generational tree of generations, members, spouses, siblings, and children | `/families/{id}/tree` |

These three are what distinguish CâyGiaPhảSố from every other genealogy app.

---

## What is CâyGiaPhảSố?

**CâyGiaPhảSố** (literally "Digital Family Tree") is a full-stack web app for families to record, share, and pass down their heritage.

Traditional genealogy tools stop at "who married whom". CâyGiaPhảSố adds three novel features that no other family-tree tool offers:

1. **Recipe Genealogy** ⭐ — track who passed a recipe to whom across generations, and visualise the full transmission chain as a nested tree with directional arrows. The detail panel computes the average years per generation of transmission and how many branches the recipe has spread to.

2. **Time Capsules** ⭐ — sealed messages locked until a future date. Write a letter to your unborn grandchild. Record a video for their wedding day. The capsule is rendered as a sealed envelope with an animated wax seal (red = sealed, amber = ready, stone = opened); opening it triggers a "reveal-letter" animation with decorative quote marks.

3. **Family Tree Visualisation** ⭐ — a pre-rendered nested tree of generations, members, spouses, siblings, and children that the front-end renders directly without re-traversal. Each generation row carries its own palette (amber → orange → red → rose → pink → …) so multi-generation trees stay legible.

On top of these, the platform has all the things you'd expect:

- Multi-family support (you can belong to multiple family trees)
- Generations, members, and relationships (parent / spouse / sibling)
- Stories (long-form text with media + tags)
- Events (with RSVP and photo galleries)
- Photo albums (per family, per event, per member)
- Family chat (per-family group chat)
- Achievements (badges for family members)
- Notifications (when time capsules unlock, when someone comments on your recipe, etc.)

---

## Screenshots

> Placeholders — drop in real screenshots once the front-end is stable.

| | |
| --- | --- |
| ![Family tree](docs/assets/family-tree.png) | ![Recipe genealogy](docs/assets/recipe-genealogy.png) |
| _Family tree visualisation ⭐_ | _Recipe genealogy tree ⭐_ |
| ![Time capsule](docs/assets/time-capsule.png) | ![Recipe detail](docs/assets/recipe-detail.png) |
| _Time capsule with countdown ⭐_ | _Recipe detail with comments & reactions_ |

---

## Tech stack

### Backend

| Layer | Choice |
| --- | --- |
| Language | Java 17 |
| Framework | [Spring Boot](https://spring.io/projects/spring-boot) 3.2.5 |
| Build | Maven |
| Web | spring-boot-starter-web (Tomcat) |
| Persistence | spring-boot-starter-jdbc + `JdbcTemplate` (raw SQL — this project is for learning SQL) |
| Database | PostgreSQL 16 |
| Migrations | Flyway (`flyway-core` + `flyway-database-postgresql`) |
| Security | spring-boot-starter-security + JWT (jjwt 0.12.5) |
| Validation | spring-boot-starter-validation (Jakarta Bean Validation) |
| Productivity | Lombok |

### Frontend

| Layer | Choice |
| --- | --- |
| Framework | [Next.js](https://nextjs.org/) 14.2.5 (App Router) |
| Language | TypeScript 5.5 |
| UI | React 18.3 |
| Styling | Tailwind CSS 3.4 |
| Data fetching | TanStack Query 5.51 |
| Forms | react-hook-form 7.52 + Zod 3.23 |
| HTTP client | axios 1.7 |
| State | Zustand 4.5 |
| Dates | date-fns 3.6 |
| Notifications | react-hot-toast 2.4 |

### Database

- **Schema**: `caygiaphaso` (isolated from existing `public` tables)
- **Tables**: 33 base + 10 views
- **Seed**: 5 users, 3 families, ~45 members, 16 recipes (with 11 genealogy edges), 9 stories, 5 time capsules, 8 events, 5 photo albums, etc.

---

## Repository layout

```
test-api-sql/
├── backend/                # Spring Boot 3.2.5
├── frontend/               # Next.js 14
├── database/               # Schema docs (SCHEMA.md) + DB overview README
└── docs/                   # API reference, testing, Postman, setup
    ├── api/                # 12 endpoint reference files (auth, users, families, …)
    ├── api-testing/        # Methodology + 5 test-case files
    ├── postman/            # Importable collection v2.1 + dev environment + README
    └── setup/              # Full-stack setup guide
```

---

## Quick start

> Need full instructions? Read [`docs/setup/README.md`](./docs/setup/README.md).

```bash
# 1. Start Postgres
docker run -d --name skillseed-postgres \
  -e POSTGRES_USER=skillseed -e POSTGRES_PASSWORD=skillseed_dev_password \
  -e POSTGRES_DB=skillseed -p 5432:5432 postgres:16

# 2. Run the backend (auto-migrates + seeds)
cd backend && mvn spring-boot:run

# 3. In another terminal, run the frontend
cd frontend && npm install && npm run dev

# Open http://localhost:3000 and log in as:
#   admin@nguyen-family.vn / Password123!
```

---

## Features

### 🔐 Authentication

- JWT-based: access token (7 days) + opaque refresh token (rotated on each refresh)
- Email + password (bcrypt)
- Bilingual error messages (Vietnamese)
- Rate-limited login / register

See [`docs/api/authentication.md`](./docs/api/authentication.md).

### 👨‍👩‍👧‍👦 Family trees

- Multiple families per user (you can belong to several trees)
- Generations (numbered bands with start / end year)
- Members with biography, gender, dates, occupation, location
- Relationships: parent / spouse / sibling
- Family invitations with role assignment and expiry
- Heritages (cultural artefacts attached to a family)

See [`docs/api/families.md`](./docs/api/families.md) and [`docs/api/members.md`](./docs/api/members.md).

### 🍜 Recipes with genealogy ⭐

- CRUD on recipes with ingredients and ordered steps
- **Recipe origins** — record who passed a recipe to whom, year, generation gap, story
- **Genealogy tree** endpoint that returns the full nested lineage
- Reactions (`LIKE`, `LOVE`, `YUM`, `WANT_TO_TRY`)
- Threaded comments
- Public recipe search (`isPublic = true`)

See [`docs/api/recipes.md`](./docs/api/recipes.md).

### 📖 Stories

- Long-form narrative pieces
- Tags (shared catalog)
- Media attachments (images, video, audio)
- Featured flag for the home carousel

See [`docs/api/stories.md`](./docs/api/stories.md).

### 💌 Time capsules ⭐

- Sealed messages with `unlockDate` and `unlockCondition` (`DATE` / `EVENT` / `MANUAL`)
- Optional recipient member
- `content` is hidden from list responses until the capsule is opened
- Status enum: `LOCKED` / `UNLOCKED` / `OPENED`
- Server-tracked `opened_at` / `opened_by` for audit

See [`docs/api/time-capsules.md`](./docs/api/time-capsules.md).

### 🎉 Events

- CRUD on events (`REUNION`, `WEDDING`, `ANNIVERSARY`, `FUNERAL`, `TET`, `BIRTHDAY`, `OTHER`)
- RSVP (`GOING` / `MAYBE` / `NOT_GOING`)
- Event photos

See [`docs/api/events.md`](./docs/api/events.md).

### 🖼️ Photos & albums

- Per-family albums with cover photo
- Photos tagged with member or event (`photo_tags`)
- Photos attached to events

See [`docs/api/photos.md`](./docs/api/photos.md).

### 💬 Chat

- Per-family group chat
- Threaded messages (replies)
- Cursor pagination

See [`docs/api/chat.md`](./docs/api/chat.md).

### 🔔 Notifications

- Per-user notifications
- Mark one / mark all as read
- Type-specific metadata

See [`docs/api/notifications.md`](./docs/api/notifications.md).

### 🏆 Achievements

- Catalog of badges (`Người kể chuyện gia đình`, `Đầu bếp gia đình`, …)
- Award achievements to family members

See [`docs/api/achievements.md`](./docs/api/achievements.md).

---

## API at a glance

**76 endpoints** documented across [`docs/api/`](./docs/api/README.md):

| Group | Endpoints |
| --- | --- |
| Auth | 5 |
| Users | 3 |
| Families | 12 |
| Family Members | 8 |
| Recipes ⭐ | 15 |
| Stories | 7 |
| Time Capsules ⭐ | 4 |
| Events | 7 |
| Photo Albums | 4 |
| Chat | 4 |
| Notifications | 3 |
| Achievements | 3 |
| **Total** | **76** |

Base URL: `http://localhost:8080/api`

---

## Documentation

| | |
| --- | --- |
| 📘 [API reference](./docs/api/README.md) | Every endpoint, request/response examples |
| 📦 [Postman collection](./docs/postman/README.md) | Importable v2.1 collection + env (76 requests) |
| 🧪 [API testing guide](./docs/api-testing/README.md) | Methodology, test cases, perf tests |
| 🛠 [Setup guide](./docs/setup/README.md) | Bring up the stack |
| 🗄 [Database schema](./database/SCHEMA.md) | Tables, ER diagram, sample queries |
| ⚙️ [Backend README](./backend/README.md) | Spring Boot specifics |
| 🎨 [Frontend README](./frontend/README.md) | Next.js specifics |

---

## Default test accounts

> All passwords are `Password123!` (development only).

| Email | Name | Family |
| --- | --- | --- |
| `admin@nguyen-family.vn` | Nguyễn Văn An | Họ Nguyễn (ADMIN) |
| `lan@nguyen-family.vn` | Nguyễn Thị Lan | Họ Nguyễn |
| `minh@nguyen-family.vn` | Nguyễn Minh | Họ Nguyễn |
| `hoa@tran-family.vn` | Trần Thị Hoa | Họ Trần (ADMIN) |
| `tuan@le-family.vn` | Lê Văn Tuấn | Họ Lê (ADMIN) |

---

## Project status

| Component | Status |
| --- | --- |
| Database schema (V1) | ✅ Complete — 33 tables |
| Seed data (V2) | ✅ Complete — 5 users, 3 families, ~45 members, 16 recipes, 5 time capsules |
| Views (V3) | ✅ Complete — 10 views |
| Backend — Auth + Users | ✅ Complete |
| Backend — Families + Members | ✅ Complete |
| Backend — Recipes + Genealogy ⭐ | ✅ Complete |
| Backend — Stories | ✅ Complete |
| Backend — Time Capsules ⭐ | ✅ Complete |
| Backend — Events + RSVP | ✅ Complete |
| Backend — Photos + Albums | ✅ Complete |
| Backend — Chat | ✅ Complete |
| Backend — Notifications | ✅ Complete |
| Backend — Achievements | ✅ Complete |
| Frontend | ✅ Complete — all pages, 3 novel features polished |
| E2E smoke tests | ✅ Auth, families, recipes, achievements, story tags, genealogy tree, family tree |

---

## What's new in the latest polish

- **Recipe Genealogy tree** now uses directional arrow markers on the SVG paths, a "di sản" ribbon that shows average years per generation, distinct "Cội nguồn" (root) and "Mới nhất" (newest) badges, and a generation-by-generation colour palette.
- **Time Capsules** are now wrapped in a sealed-envelope aesthetic with animated wax seals (a gentle 4-second float + rotation when sealed, a pulsing unlock ring when ready). Opening reveals a "reveal-letter" animation with decorative quote marks and an amber paper background.
- **Family Tree** shows vertical generation connectors, per-generation colour palette, member cards with spouse / children / sibling pills, and a "Crown" indicator on the founding generation.
- **Dashboard** gains a hero welcome card, real public recipe counts, a four-tone stat grid, and a "feature spotlight" ribbon that points to each of the three novel features.
- Tailwind config adds `seal-float`, `reveal-letter`, and `pulse-slow` keyframes.

---

## Roadmap

- [ ] WebSocket / SSE push for chat and notifications
- [ ] Photo upload to S3 (currently URL-only)
- [ ] Internationalisation (currently Vietnamese-only)
- [ ] Mobile app (React Native or PWA)
- [ ] Export family tree to GEDCOM
- [ ] "Recipe search by ingredient" semantic search
- [ ] "Time capsule scheduling" via cron (auto-open on date)

Issues and PRs welcome.

---

## Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/recipe-search`)
3. Write a migration if you change the schema (`V4__...sql`)
4. Write tests (the [Postman collection](./docs/postman/README.md) covers most endpoints)
5. Open a PR — describe the change and link any related issues

Coding conventions:
- Java: 4-space indent, Lombok for boilerplate
- SQL: snake_case columns, `TIMESTAMPTZ` for timestamps, `UUID` primary keys
- TypeScript: 2-space indent, `prettier` defaults, no `any` unless you must

---

## License

This project is for educational purposes. © 2026 CâyGiaPhảSố contributors.

---

## See also

- [Setup guide](./docs/setup/README.md)
- [API reference](./docs/api/README.md)
- [Postman collection](./docs/postman/README.md)
- [API testing guide](./docs/api-testing/README.md)
- [Database schema docs](./database/SCHEMA.md)