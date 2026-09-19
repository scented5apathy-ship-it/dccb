# API Testing Guide

> A practical methodology for testing the CâyGiaPhảSố REST API — covering manual exploratory testing, Postman collection runs, and automated CI pipelines.

This folder contains:

- [`test-cases.md`](./test-cases.md) — sample test cases for every major endpoint
- [`authentication-tests.md`](./authentication-tests.md) — auth-flow specific tests
- [`crud-tests.md`](./crud-tests.md) — CRUD coverage template
- [`error-cases.md`](./error-cases.md) — error-code matrix
- [`performance-tests.md`](./performance-tests.md) — load testing recipes

---

## Testing methodology

CâyGiaPhảSố uses a layered approach:

| Layer | What you test | Tool |
| --- | --- | --- |
| **Smoke** | Does the API respond at all? Are auth and core CRUD endpoints reachable? | `curl`, Postman |
| **Functional** | Does each endpoint behave correctly under nominal conditions? | Postman, REST Client, Newman |
| **Validation** | Does the endpoint reject bad inputs cleanly? | Postman, REST Client |
| **Error / edge** | Does the endpoint return correct error codes (4xx, 5xx)? | Postman, scripts |
| **Auth / authz** | Are protected resources protected? Can users cross tenants? | Postman + custom scripts |
| **Integration** | Do multi-step flows work end to end (login → create family → create recipe → add origin)? | Postman (Collection Runner) |
| **Performance** | Does it scale? | k6 / Apache Bench / JMeter |

A useful rule of thumb:

> **Cover one happy path + one auth path + one validation path + one error path** for every endpoint you expose publicly.

---

## Types of tests

### 1. Functional

Verify that each endpoint does what it claims. Examples:

- `POST /auth/login` returns 200 + `accessToken` for valid credentials
- `POST /recipes` returns 201 + a `RecipeDto` with all sub-collections persisted
- `GET /recipes/{id}/genealogy-tree` returns a nested tree with the right root member

### 2. Integration

Verify multi-step flows:

- Register → login → create family → create generation → create member → create relationship → fetch tree → render
- Open time capsule that hasn't reached its unlock date → expect 403 → advance clock → re-open → expect 200

### 3. Edge / boundary

- Empty string, null, missing field
- Maximum-length strings (e.g. 255 chars)
- Unicode and emoji
- Past dates (`unlockDate = 1990-01-01`)
- Future dates far in the future
- Idempotency (call the same endpoint twice; verify the second is a no-op or returns the same data)

### 4. Security / authz

- Missing JWT → 401
- Expired JWT → 401
- Valid JWT but caller is not a member of the family → 403
- Caller modifies another user's resource → 403
- SQL injection in `q=...' OR 1=1; --` → server should sanitise (parameterised queries mean this is moot, but worth a smoke test)
- BOLA / BFLA: replace `{familyId}` with another family's id → should be rejected

### 5. Performance

See [`performance-tests.md`](./performance-tests.md).

---

## Tools

| Tool | Best for | Link |
| --- | --- | --- |
| **Postman** | Manual exploration, sharing collection files, low-code test scripts | https://www.postman.com/ |
| **Newman** | CLI runner for Postman collections (CI integration) | https://www.npmjs.com/package/newman |
| **REST Client (VS Code)** | Inline `.http` files, lightweight | https://marketplace.visualstudio.com/items?itemName=humao.rest-client |
| **Bruno / Insomnia** | Open-source alternatives to Postman | https://www.usebruno.com / https://insomnia.rest |
| **curl + jq** | Shell scripts, smoke tests, no GUI required | (built-in) |
| **k6** | Load testing | https://k6.io |
| **Apache Bench** | Quick HTTP throughput | https://httpd.apache.org/docs/2.4/programs/ab.html |
| **JMeter** | Enterprise load testing | https://jmeter.apache.org/ |

---

## Test case template

Use this template for any new test case (matches the format in the rest of this folder):

```markdown
### TC-{ID}: {Title}

**Module**: Auth
**Priority**: P0 (highest) / P1 / P2 / P3 (lowest)
**Type**: Functional / Validation / Error / Security
**Preconditions**:
- Database seeded with `V2__seed_data.sql`
- `accessToken` for `admin@nguyen-family.vn` available

**Steps**:
1. POST /auth/login with valid credentials
2. Capture `accessToken` from response

**Expected**:
- HTTP 200
- Body contains `accessToken` (non-empty), `refreshToken` (UUID), `user.email == "admin@nguyen-family.vn"`
- `tokenType == "Bearer"`, `expiresIn > 0`

**Notes**:
- `accessToken` must be a JWT signed with `JWT_SECRET`
```

---

## How to run automated tests

### Postman Collection Runner (GUI)

1. Open Postman.
2. Right-click **CâyGiaPhảSố API** → **Run collection**.
3. Pick the environment **CâyGiaPhảSố - Dev (localhost)**.
4. Hit **Run**.
5. The results pane shows per-request status, response time, and test pass/fail.

### Newman (CLI)

```bash
# Install
npm install -g newman

# Run
newman run docs/postman/caygiaphaso.postman_collection.json \
  --environment docs/postman/caygiaphaso.postman_environment.json \
  --reporters cli,html \
  --reporter-html-export newman-report.html
```

Open `newman-report.html` for the rendered report.

### CI (GitHub Actions)

```yaml
name: API tests
on: [push, pull_request]
jobs:
  api-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: skillseed
          POSTGRES_USER: skillseed
          POSTGRES_PASSWORD: skillseed_dev_password
        ports: ['5432:5432']
        options: --health-cmd "pg_isready -U skillseed"
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { distribution: temurin, java-version: '17' }
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - name: Start backend
        run: |
          cd backend
          mvn -q spring-boot:run &
          sleep 60  # wait for Spring Boot to start
      - name: Run Newman
        run: |
          npm install -g newman
          newman run docs/postman/caygiaphaso.postman_collection.json \
            --environment docs/postman/caygiaphaso.postman_environment.json \
            --reporters cli,junit \
            --reporter-junit-export newman-report.xml
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: newman-report
          path: newman-report.xml
```

### VS Code REST Client

`.http` files can be checked in alongside the code. Example:

```http
### Login
POST http://localhost:8080/api/auth/login
Content-Type: application/json

{
  "email": "admin@nguyen-family.vn",
  "password": "Password123!"
}

### Get current user
GET http://localhost:8080/api/auth/me
Authorization: Bearer {{accessToken}}
```

VS Code's REST Client extension resolves `{{accessToken}}` from a sibling `rest-client.env.json` (or prompts you to set it).

---

## Defect reporting

When a test fails, capture:

- The endpoint (`METHOD /path`)
- The exact request body
- The response status + body
- The user/role under which the request was made
- The seed data version (`V2__seed_data.sql` doesn't change often, but pin it)
- Steps to reproduce (preferably automated as a Postman test)

---

## See also

- [`test-cases.md`](./test-cases.md) — sample cases per major endpoint
- [`authentication-tests.md`](./authentication-tests.md)
- [`crud-tests.md`](./crud-tests.md)
- [`error-cases.md`](./error-cases.md)
- [`performance-tests.md`](./performance-tests.md)