# Postman Collection & Environment

> An importable Postman v2.1 collection with **76 requests** covering every endpoint in the CâyGiaPhảSố API, plus a dev environment with 16 pre-wired variables.

---

## Files

| File | Format | What it is |
| --- | --- | --- |
| `caygiaphaso.postman_collection.json` | Postman v2.1.0 | The collection (76 requests, 12 folders) |
| `caygiaphaso.postman_environment.json` | Postman v2.1.0 | Dev environment (16 variables) |

Both files are valid JSON — you can import them directly into Postman v9+ (and most HTTP testing tools that understand v2.1, including Bruno, Insomnia, and VS Code REST Client with conversion).

---

## Importing into Postman

### 1. Import the collection

1. Open Postman.
2. Click **File → Import**.
3. Drag `caygiaphaso.postman_collection.json` into the dialog **or** click **Upload files** and pick it.
4. Confirm — you should see a new **"CâyGiaPhảSố API"** collection in the sidebar.

### 2. Import the environment

1. **File → Import** again.
2. Pick `caygiaphaso.postman_environment.json`.
3. The **"CâyGiaPhảSố - Dev (localhost)"** environment now appears in the environment dropdown at the top right of Postman.
4. Select it (do this once and Postman will remember).

### 3. Make sure the backend is running

```bash
cd backend
mvn spring-boot:run
```

By default the API lives at `http://localhost:8080/api`. The `baseUrl` variable in the environment is set to this URL; change it if your backend runs elsewhere.

### 4. Login first

The collection is wired so that the **Login** request test-script writes the `accessToken` into the environment variable. Every other request auto-attaches `Authorization: Bearer {{accessToken}}` via the collection-level pre-request script.

```
1. Auth → Login   (double-click and hit Send)
2. 1. Auth → Get Current User (me)   (verify the token works)
3. Anything else
```

---

## Environment variables

| Variable | Purpose | Auto-set by |
| --- | --- | --- |
| `baseUrl` | API root URL | initial value (you can change) |
| `accessToken` | JWT for Authorization header | Login / Refresh Token test scripts |
| `refreshToken` | Opaque refresh token | Login / Refresh Token test scripts |
| `userId` | Current user UUID | Login test script |
| `familyId` | First family in user's list | List My Families test script |
| `memberId` | First member in family | List Members test script |
| `recipeId` | First recipe in family | List Recipes test script |
| `timeCapsuleId` | First time capsule | List Time Capsules test script |
| `eventId` | First event | List Events test script |
| `storyId` | First story | List Stories test script |
| `albumId` | First album | List Albums test script |
| `chatId` | First chat | List Chats test script |
| `commentId` | Created comment id | Add Comment test script |
| `relationshipId` | Created relationship id | Create Relationship test script |
| `generationId` | Sample generation id | initial value |
| `notificationId` | First notification id | List Notifications test script |

> Initial values for `userId`, `familyId`, `memberId`, `recipeId`, and `generationId` are seeded with sample UUIDs from the `V2__seed_data.sql` so you can test individual endpoints without running the "List" calls first. Other variables (`timeCapsuleId`, `eventId`, etc.) start empty and are populated by their respective list endpoints.

---

## Collection features

### Pre-request script (collection-level)

Every request runs the following snippet before sending, automatically attaching the bearer token:

```js
if (pm.variables.has('accessToken') && pm.variables.get('accessToken') !== '') {
  pm.request.headers.upsert({
    key: 'Authorization',
    value: 'Bearer ' + pm.variables.get('accessToken')
  });
}
```

So once you've logged in, you don't need to copy tokens around.

### Test scripts (collection-level + per-request)

**Collection-level** — every response is checked:

```js
pm.test('Status code is 2xx', function () {
  pm.expect(pm.response.code).to.be.oneOf([200, 201, 204]);
});
pm.test('Response time < 1500ms', function () {
  pm.expect(pm.response.responseTime).to.be.below(1500);
});
```

**Per-request** — most list/create requests have additional tests that:

- Verify the JSON shape (e.g. `pm.expect(body.families).to.be.an('array')`)
- Capture key ids into environment variables for chained workflows

You can run the whole collection with **Collection Runner** (right-click collection → **Run**) and see all tests pass/fail in one go.

### Bearer token auth

The collection has `auth: { type: bearer, bearer: [{ key: 'token', value: '{{accessToken}}' }] }` at the top level. Postman sends `Authorization: Bearer {{accessToken}}` on every request automatically. Endpoints that don't need auth (`POST /auth/login`, `POST /auth/register`, `POST /auth/refresh`, `GET /recipes/public`) still work fine — the server ignores the header.

### Folders

12 top-level folders mirror the API documentation:

| # | Folder | Endpoints |
| --- | --- | --- |
| 1 | Auth | 5 |
| 2 | Users | 3 |
| 3 | Families | 12 |
| 4 | Family Members | 8 |
| 5 | Recipes ⭐ | 15 |
| 6 | Stories | 7 |
| 7 | Time Capsules ⭐ | 4 |
| 8 | Events | 7 |
| 9 | Photo Albums | 4 |
| 10 | Chat | 4 |
| 11 | Notifications | 3 |
| 12 | Achievements | 3 |
|   | **Total** | **76** |

---

## Suggested workflows

### Workflow 1 — explore the genealogy feature

```
1. Auth → Login (admin@nguyen-family.vn / Password123!)
2. 3. Families → List My Families   → captures familyId
3. 5. Recipes → List Recipes         → captures recipeId
4. 5. Recipes → Get Genealogy Tree   → see the nested tree
5. 5. Recipes → Add Origin           → add another edge
6. 5. Recipes → Get Recipe Details   → see origins, comments, reactions
```

### Workflow 2 — open a time capsule

```
1. Auth → Login (minh@nguyen-family.vn / Password123!  — Minh already opened the first capsule)
2. 7. Time Capsules → List Time Capsules → captures timeCapsuleId (an OPENED one)
3. 7. Time Capsules → Open Time Capsule  → returns content
4. 7. Time Capsules → List Time Capsules
5. 7. Time Capsules → Open Time Capsule  → for a LOCKED capsule returns 403
```

### Workflow 3 — create and decorate a recipe

```
1. Auth → Login
2. 3. Families → List My Families   → captures familyId
3. 5. Recipes → Create Recipe (with genealogy) → POST with ingredients, steps, origins
4. 5. Recipes → Add Reaction        → POST LOVE
5. 5. Recipes → Add Comment         → POST top-level comment
```

### Workflow 4 — automate with the Collection Runner

1. Right-click the collection → **Run collection**.
2. Postman will execute every request in order.
3. The first run will fail any request that depends on `Login` having run first. Fix the order by dragging requests into sequence, or open the **Run** dialog and tick **Run iterations in order**.
4. Watch the green/red test results scroll by. Failed tests usually indicate either a missing seed (re-run `V2__seed_data.sql`) or that `accessToken` expired (re-run **Login**).

---

## Troubleshooting

| Problem | Fix |
| --- | --- |
| All requests return `401 Unauthorized` | Run **Login** first. The collection only sets `accessToken` after a successful login. |
| `404` on a seeded id | The seed data wasn't applied — re-run the migrations: `mvn spring-boot:run` auto-runs them, or run `psql -f backend/src/main/resources/db/migration/V2__seed_data.sql` manually. |
| `403 Forbidden` on Update/Delete operations | You're trying to update someone else's record. Login as the seed user that owns it. |
| `{{baseUrl}}` is empty in URLs | The environment isn't selected. Pick **CâyGiaPhảSố - Dev (localhost)** in the dropdown. |
| Importing fails with "schema not supported" | Upgrade Postman to v9 or newer. |
| Vietnamese characters render as `?` | Make sure your terminal / Postman is using UTF-8. |

---

## See also

- [../api/README.md](../api/README.md) — full API reference
- [../api/recipes.md](../api/recipes.md) — recipe genealogy ⭐
- [../api/time-capsules.md](../api/time-capsules.md) — time capsules ⭐
- [../api-testing/README.md](../api-testing/README.md) — how to write automated tests
- [../setup/README.md](../setup/README.md) — bring the stack up