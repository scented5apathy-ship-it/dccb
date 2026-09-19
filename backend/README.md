# CâyGiaPhảSố - Backend (Spring Boot)

Backend skeleton for **CâyGiaPhảSố** (AncestryTree) — a digital family-tree platform with heritage features (recipes, stories, time capsules, events).

> Status: **skeleton only** — no controllers/endpoints, no schema yet. Future agents will add tables (Flyway migrations) and REST APIs on top of this foundation.

---

## Tech Stack

| Layer        | Choice                                                    |
| ------------ | --------------------------------------------------------- |
| Language     | Java 17                                                   |
| Framework    | Spring Boot 3.2.5                                         |
| Build        | Maven                                                     |
| Web          | spring-boot-starter-web                                   |
| Persistence  | spring-boot-starter-jdbc + `JdbcTemplate` (raw SQL)       |
| Database     | PostgreSQL 16                                             |
| Migrations   | Flyway (`flyway-core` + `flyway-database-postgresql`)     |
| Security     | spring-boot-starter-security + JWT (jjwt 0.12.5)          |
| Validation   | spring-boot-starter-validation (Jakarta Bean Validation)  |
| Productivity | Lombok                                                    |

> **Note:** We use `JdbcTemplate` with raw SQL on purpose — this project is for learning SQL, not hiding it behind JPA/Hibernate.

---

## Prerequisites

- **JDK 17** (or newer up to 21)
- **Maven 3.8+**
- **PostgreSQL 16** running locally on port `5432`
- An existing database named **`skillseed`** (create it if it does not exist yet)

```sql
CREATE DATABASE skillseed;
CREATE USER skillseed WITH ENCRYPTED PASSWORD 'skillseed_dev_password';
GRANT ALL PRIVILEGES ON DATABASE skillseed TO skillseed;
```

---

## Configuration

Settings live in `src/main/resources/application.yml`. All values can be overridden via environment variables (see `.env.example`):

| Variable        | Default                  | Purpose                              |
| --------------- | ------------------------ | ------------------------------------ |
| `DB_HOST`       | `localhost`              | Postgres host                        |
| `DB_PORT`       | `5432`                   | Postgres port                        |
| `DB_NAME`       | `skillseed`              | Database name                        |
| `DB_USER`       | `skillseed`              | Database user                        |
| `DB_PASSWORD`   | `skillseed_dev_password` | Database password                    |
| `JWT_SECRET`    | (dev placeholder)        | 256-bit base64 secret                |
| `JWT_EXPIRATION`| `604800000`              | JWT lifetime in ms (7 days)          |

Generate a real secret for production:

```bash
openssl rand -base64 32
```

---

## Running

```bash
cd backend
mvn spring-boot:run
```

The server starts on **http://localhost:8080** with context path **`/api`**.

Build a fat jar:

```bash
mvn clean package
java -jar target/caygiaphaso-backend-0.0.1-SNAPSHOT.jar
```

---

## API Base URL

```
http://localhost:8080/api
```

Currently the only reachable endpoints are auth-related (whitelisted in `SecurityConfig`); the rest return `401`/`403` until controllers are added.

---

## Project Structure

```
backend/
├── pom.xml
├── README.md
├── .env.example
├── .gitignore
└── src/
    ├── main/
    │   ├── java/com/giapha/
    │   │   ├── CayGiaphaSoApplication.java     # @SpringBootApplication entrypoint
    │   │   ├── config/
    │   │   │   ├── SecurityConfig.java         # Security filter chain, CORS, BCrypt
    │   │   │   ├── JwtConfig.java              # @ConfigurationProperties("jwt")
    │   │   │   ├── CorsConfig.java             # CORS placeholder hook
    │   │   │   └── DatabaseConfig.java         # JdbcTemplate + TransactionManager
    │   │   ├── controller/                     # (empty — to be filled)
    │   │   ├── service/                        # (empty — to be filled)
    │   │   ├── repository/                     # (empty — to be filled)
    │   │   ├── model/
    │   │   │   ├── entity/                     # (empty — to be filled)
    │   │   │   └── dto/                        # (empty — to be filled)
    │   │   ├── security/
    │   │   │   ├── JwtUtil.java                # sign/parse/validate JWT
    │   │   │   ├── JwtAuthenticationFilter.java # OncePerRequestFilter
    │   │   │   └── UserDetailsServiceImpl.java # stub (replace with JDBC lookup)
    │   │   ├── exception/
    │   │   │   ├── ApiException.java
    │   │   │   ├── ResourceNotFoundException.java   # 404
    │   │   │   ├── BadRequestException.java         # 400
    │   │   │   ├── UnauthorizedException.java       # 401
    │   │   │   └── GlobalExceptionHandler.java      # @RestControllerAdvice
    │   │   └── util/
    │   │       ├── StringUtil.java
    │   │       └── DateUtil.java
    │   └── resources/
    │       ├── application.yml
    │       └── db/migration/                   # Flyway scripts go here (V1__, V2__, …)
    └── test/java/com/giapha/                   # tests go here
```

---

## Conventions

- Java 17, UTF-8 source encoding everywhere
- Constructor injection only — no `@Autowired` on fields
- Lombok on entities/DTOs (`@Data`, `@Builder`, `@NoArgsConstructor`, `@AllArgsConstructor`)
- Package root: `com.giapha.*`
- All API routes are mounted under `/api` (set by `server.servlet.context-path`)
- All errors return the shape `{ timestamp, status, error, message, path }` (see `GlobalExceptionHandler`)

---

## What's NOT here yet (planned for future agents)

1. Flyway migrations for users, family members, relationships, heritage content, etc.
2. Repositories (raw SQL via `JdbcTemplate`) + DTO/entity classes
3. Services + Controllers
4. Auth controller (`POST /api/auth/login`, `POST /api/auth/register`)
5. Tests

Don't add any of these without coordinating — the skeleton is intentionally minimal.
