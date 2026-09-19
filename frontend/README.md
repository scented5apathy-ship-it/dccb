# Cây Gia Phả Số — Frontend

Frontend skeleton for **Cây Gia Phả Số** (AncestryTree), a digital family-tree
platform with Vietnamese heritage features: families, recipes, stories, time
capsules, and events.

> ⚠️ This repository is a **skeleton**. Most pages and API calls are stubs and
> will be filled in by future agents. See *Status* below.

## Tech Stack

- **Next.js 14** (App Router, RSC by default)
- **TypeScript** (strict)
- **Tailwind CSS** (custom warm-amber theme)
- **TanStack Query 5** for data fetching
- **Axios** HTTP client with interceptors
- **Zustand** for the client auth store
- **react-hook-form + zod** for forms and validation
- **react-hot-toast** for notifications
- **lucide-react** for icons
- **date-fns** (with Vietnamese locale) for dates

## Prerequisites

- Node.js **18.17+** (Node 20 LTS recommended)
- npm 9+ / pnpm / yarn
- The backend running at `http://localhost:8080/api` (configurable)

## Setup

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev          # start dev server at http://localhost:3000
```

Other scripts:

| Command            | What it does                       |
|--------------------|------------------------------------|
| `npm run dev`      | Start the dev server               |
| `npm run build`    | Production build                   |
| `npm run start`    | Start the built app                |
| `npm run lint`     | Run ESLint                         |
| `npm run type-check` | Run `tsc --noEmit`              |

## Project Structure

```
frontend/
├── public/                    # static assets
└── src/
    ├── app/                   # Next.js App Router
    │   ├── (auth)/            # login & register
    │   ├── (main)/            # authenticated app
    │   ├── api/               # (placeholder) Next API routes
    │   ├── layout.tsx         # root layout + metadata
    │   ├── providers.tsx      # QueryClient + Toast providers
    │   └── globals.css        # Tailwind entrypoint
    ├── components/
    │   ├── ui/                # Button, Input, Card, Modal, ...
    │   ├── layout/            # Sidebar, TopBar, MobileMenu
    │   ├── auth/              # LoginForm, RegisterForm, ProtectedRoute
    │   ├── family/            # FamilyCard, FamilyTree, ...
    │   ├── recipe/            # RecipeCard, RecipeGenealogy, RecipeForm
    │   ├── story/             # StoryCard, StoryTimeline
    │   ├── time-capsule/      # TimeCapsuleCard, Countdown
    │   └── shared/            # EmptyState, ErrorBoundary, LoadingState, ...
    ├── lib/
    │   ├── api.ts             # axios instance + interceptors
    │   ├── api-client.ts      # typed API stubs (to be filled)
    │   ├── auth.ts            # token/user storage helpers
    │   └── utils.ts           # cn(), formatDate(), ...
    ├── hooks/                 # TanStack Query hooks + zustand auth
    ├── types/                 # shared TypeScript types
    └── styles/globals.css     # placeholder
```

## Connecting to the Backend

The base URL is read from `NEXT_PUBLIC_API_URL` (default
`http://localhost:8080/api`). The Axios client in `src/lib/api.ts` automatically
attaches the JWT token from `localStorage` and redirects to `/login` on a `401`
response.

`src/lib/api-client.ts` contains typed method stubs that currently reject with
`"not implemented yet"` — every page that calls these will fail until a future
agent fills them in.

## Conventions

- **Components** are TypeScript with explicit prop types.
- **Styling** is Tailwind utility classes only — no CSS modules.
- **Icons** come from `lucide-react`.
- **Server components** by default; mark with `'use client'` only when you need
  state, hooks, or browser APIs.
- **Routing**: anything under `(main)` is wrapped by `ProtectedRoute`, which
  redirects unauthenticated users to `/login?redirect=<path>`.
- **Dates**: format helpers in `src/lib/utils.ts` already use the Vietnamese
  locale (`vi`).
- **Aliases**: `@/...` → `./src/...` (see `tsconfig.json`).

## Status / What Still Needs to Be Built

- ✅ Project skeleton, configs, and TypeScript types
- ✅ UI primitives, layout, and form skeletons
- ✅ Auth store + protected route guard
- ✅ TanStack Query hooks (returning stubs for now)
- ⏳ **Real API implementations** in `src/lib/api-client.ts`
- ⏳ Detailed page contents (forms, lists, detail views, etc.)
- ⏳ Family-tree visualization (`FamilyTree.tsx`)
- ⏳ File uploads (avatars, story media, time-capsule media)
- ⏳ Next.js API routes in `src/app/api/` for any proxying
- ⏳ Tests (unit + integration)

## Suggestions for Future Agents

1. **Start with `api-client.ts`** — most other code depends on its real
   response shapes.
2. Use **zod schemas** alongside the request types to keep forms and client
   validation in sync.
3. For the family-tree visualization, consider `d3-hierarchy` + an SVG renderer
   (the placeholder component already exists at
   `src/components/family/FamilyTree.tsx`).
4. When adding new mutation hooks, follow the pattern in `useFamily.ts`
   (`useQueryClient.invalidateQueries` on success).
5. All Vietnamese copy lives in components — keep wording short and friendly.

## License

Internal project — © 2026 Cây Gia Phả Số.