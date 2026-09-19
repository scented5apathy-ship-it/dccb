# CâyGiaPhảSố - Project Summary

## Overview

**CâyGiaPhảSố** (AncestryTree) is a complete family-genealogy platform that helps Vietnamese families preserve and share their heritage digitally. The system combines traditional family-tree concepts with three novel social features — recipe genealogy, time capsules to the future, and multi-generational family-tree visualization — backed by a fully normalized PostgreSQL schema with raw-SQL access (no ORM) and a modern Spring Boot + Next.js stack.

## What's Built

### Backend (Spring Boot)
- **187** Java source files
- **20** REST controllers (76 endpoints total)
- **22** services
- **28** repositories (raw JdbcTemplate, no JPA/Hibernate)
- **97** model classes (DTOs, requests, responses, view models)
- Stack: Spring Boot 3.2.5 · Java 17 · Spring Security · JWT · Flyway migrations

### Database (PostgreSQL)
- **33** tables
- **10** views
- **84** indexes
- **41** table-level constraints (FK/CHECK)
- Schema migrations: `V1__init_schema.sql` (28 KB), `V2__seed_data.sql` (83 KB), `V3__create_views.sql` (10 KB)
- Rich seed data:
  - 3 families
  - 21 family members across 5 generations
  - 16 recipes with multi-step genealogy
  - 8 events, 6 achievements, 10 story tags
- Schema: `caygiaphaso` on the `skillseed` database

### Frontend (Next.js)
- **26** pages (App Router, route groups: `(auth)`, `(main)`)
- **51** components (auth, family, recipe, story, time-capsule, event, chat, layout, ui primitives)
- **13** custom hooks (TanStack Query wrappers)
- Stack: Next.js 14 · TypeScript · Tailwind CSS · TanStack Query · Axios · React Hook Form · Zod

### Documentation
- **28** markdown files across `docs/`
- **60** SQL exercises (6 modules × 10 exercises each)
- **12** API reference docs (auth, families, members, recipes, stories, time-capsules, events, chat, photos, notifications, achievements, users)
- **76** Postman requests (collection + environment, JSON-validated)
- **177+** API test cases across 5 test files (auth, CRUD, error, performance, integration)
- **1** setup guide

## 3 Novel Features ⭐

1. **Recipe Genealogy** — Track how family recipes pass through generations with a dedicated `recipe_origins` table, "from member → to member" transmission records, generation-gap metadata, and a `RecipeGenealogy` component visualizing the lineage.
2. **Time Capsules** — Send messages to the future (1/5/10/50 years). Sealed capsules remain locked until `unlock_date`, with optional unlock conditions and a countdown UI component.
3. **Family Tree** — Multi-generational tree visualization powered by `generations` + `relationships` tables and recursive traversal, rendered through the `FamilyTree` React component.

## Quick Start

### Backend
```bash
cd backend
mvn spring-boot:run
# Listens on http://localhost:8080
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

### Database
PostgreSQL 16 is already running in Docker at `skillseed-postgres:5432`.
The `caygiaphaso` schema is created and migrated automatically by Flyway on first backend boot.

## Where to Learn

### SQL Testing
- `docs/sql-exercises/` — 60 progressive exercises across 6 modules
- Start with `docs/sql-exercises/01-basic-queries.md`
- Progress through joins, aggregations, window functions, recursive CTEs, and advanced topics

### API Testing
- `docs/postman/` — Import `caygiaphaso.postman_collection.json` + `caygiaphaso.postman_environment.json` into Postman
- `docs/api/` — Endpoint reference (12 modules)
- `docs/api-testing/` — 177+ test cases covering auth, CRUD, errors, and performance

## Tech Stack
- **Backend**: Spring Boot 3.2.5, Java 17, JdbcTemplate (raw SQL), Spring Security, JWT auth
- **Frontend**: Next.js 14, TypeScript, Tailwind, TanStack Query, Axios, React Hook Form, Zod
- **Database**: PostgreSQL 16, Flyway migrations
- **Auth**: JWT (HS384) with refresh tokens
- **Build**: Maven (backend), npm (frontend)

## File Structure
```
test-api-sql/
├── README.md                            Project overview & quickstart
├── PROJECT_SUMMARY.md                   This file
├── .gitignore
├── backend/                             Spring Boot backend
│   ├── pom.xml                          Maven build (Spring Boot 3.2.5)
│   ├── README.md                        Backend-specific docs
│   └── src/main/
│       ├── java/com/giapha/
│       │   ├── CayGiaphaSoApplication.java
│       │   ├── config/                  Security, CORS, JWT config
│       │   ├── controller/              20 REST controllers
│       │   ├── exception/               Global exception handlers
│       │   ├── model/                   97 DTO / request / response models
│       │   ├── repository/              28 JdbcTemplate-based DAOs
│       │   ├── security/                JWT utilities, filters
│       │   ├── service/                 22 business-logic services
│       │   └── util/                    Helpers
│       └── resources/
│           ├── application.yml          DB + Flyway + JWT config
│           └── db/migration/            Flyway SQL migrations
│               ├── V1__init_schema.sql  33 tables + indexes + constraints
│               ├── V2__seed_data.sql    Seed families, members, recipes, …
│               └── V3__create_views.sql 10 reporting views
├── frontend/                            Next.js 14 app
│   ├── package.json
│   ├── README.md
│   └── src/
│       ├── app/                         26 pages (App Router)
│       │   ├── (auth)/                  login, register
│       │   └── (main)/                  dashboard, families, members,
│       │                                recipes, stories, time-capsules,
│       │                                events, chat, notifications, profile
│       ├── components/                  51 React components
│       ├── hooks/                       13 TanStack Query hooks
│       ├── lib/                         api-client, api, auth, utils
│       ├── styles/                      Global styles
│       └── types/                       TypeScript type definitions
├── database/                          DB docs (no SQL dumps; migrations in backend)
│   ├── README.md                        DB overview
│   └── SCHEMA.md                        Full schema reference
└── docs/                                Documentation
    ├── README.md
    ├── api/                             12 endpoint reference files
    │   ├── README.md
    │   ├── authentication.md
    │   ├── families.md
    │   ├── members.md
    │   ├── recipes.md
    │   ├── stories.md
    │   ├── time-capsules.md
    │   ├── events.md
    │   ├── chat.md
    │   ├── photos.md
    │   ├── notifications.md
    │   ├── achievements.md
    │   └── users.md
    ├── api-testing/                     5 test files (177+ cases)
    │   ├── README.md
    │   ├── authentication-tests.md      (33 cases)
    │   ├── crud-tests.md                (39 cases)
    │   ├── error-cases.md               (32 cases)
    │   ├── performance-tests.md         (5 cases)
    │   └── test-cases.md                (68 cases)
    ├── postman/                         Importable Postman assets
    │   ├── README.md
    │   ├── caygiaphaso.postman_collection.json   76 requests
    │   └── caygiaphaso.postman_environment.json
    ├── sql-exercises/                   60 exercises across 6 modules
    │   ├── README.md
    │   ├── 01-basic-queries.md
    │   ├── 02-joins.md
    │   ├── 03-aggregations.md
    │   ├── 04-window-functions.md
    │   ├── 05-recursive-cte.md
    │   └── 06-advanced.md
    └── setup/                           Setup guide
        └── README.md
```

## Smoke-Test Verification (this session)

- **GET /api/auth/me** (no token) → `401 Unauthorized` ✓
- **POST /api/auth/login** with bad payload → `400 Bad Request` with validation errors ✓
- **POST /api/auth/register** → `201 Created` + JWT tokens ✓
- **POST /api/auth/login** → `200 OK` + access token ✓
- **GET /api/auth/me** with token → `200 OK` with user payload ✓
- **GET /api/families** with token → `200 OK` ✓

## Final Status

**READY TO USE** — All components in place, backend boots cleanly, authentication
and authorization work end-to-end, seed data is loaded, and documentation is
comprehensive and importable.