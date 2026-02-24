# Claude Code Prompt — Desis-Keep (Grit Framework)

> Paste this entire file into Claude Code to scaffold and build Desis-Keep step by step.

---

## Context

You are building **Desis-Keep**, a Google Keep clone, using the **Grit full-stack meta-framework**.

Stack: Go (Gin + GORM) backend, Next.js App Router frontend, Grit Admin panel, PostgreSQL + Redis + MinIO via Docker.

**Auth:** Replace the existing credentials-based login with **Google OAuth only** using `next-auth` (frontend) and a corresponding Go middleware (backend). No username/password login at all.

---

## Step 1 — Bootstrap the project

```bash
grit new desis-keep
cd desis-keep
```

When prompted, select:
- Database: PostgreSQL
- Auth: Google OAuth
- Admin panel: Yes
- Docker: Yes

---

## Step 2 — Start infrastructure

```bash
docker-compose up -d
```

Confirm PostgreSQL, Redis, and MinIO are running:

```bash
docker-compose ps
```

---

## Step 3 — Configure environment

Edit `.env` (and `.env.local` for Next.js) with:

```env
# Database
DATABASE_URL=postgres://postgres:postgres@localhost:5432/desis_keep

# Redis
REDIS_URL=redis://localhost:6379

# MinIO
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=desis-keep

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

---

## Step 4 — Remove credentials auth, add Google OAuth

### Frontend (`/frontend`)

1. Install next-auth:
```bash
cd frontend
npm install next-auth
```

2. Create `app/api/auth/[...nextauth]/route.ts`:
```typescript
import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.provider === "google") {
        token.googleId = profile?.sub
      }
      return token
    },
    async session({ session, token }) {
      session.user.googleId = token.googleId as string
      return session
    },
  },
})

export { handler as GET, handler as POST }
```

3. Replace the existing login page (`app/login/page.tsx`) with a single "Sign in with Google" button:
```typescript
"use client"
import { signIn } from "next-auth/react"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <button
        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
        className="flex items-center gap-2 rounded-lg border px-6 py-3 text-sm font-medium shadow hover:bg-gray-50"
      >
        <img src="/google-icon.svg" className="h-5 w-5" />
        Sign in with Google
      </button>
    </div>
  )
}
```

4. Delete any credentials provider config and the existing register/login forms.

### Backend (`/backend`)

1. Add a `/auth/google/callback` route in `routes/auth.go` that:
   - Receives the Google ID token from the frontend session
   - Verifies it using Google's tokeninfo endpoint
   - Creates or updates the `User` record (upsert on `google_id`)
   - Returns a signed JWT for the Go API session

2. Protect all `/api/*` routes with a `AuthMiddleware` that validates the JWT.

---

## Step 5 — Generate the Label resource

```bash
grit generate resource Label --fields "name:string,slug:slug,color:string,user_id:belongs_to:User"
```

---

## Step 6 — Generate the Note resource

```bash
grit generate resource Note --fields "title:string,body:text,color:string,is_pinned:bool,is_archived:bool,is_trashed:bool,user_id:belongs_to:User,labels:many_to_many:Label"
```

---

## Step 7 — Generate the Link resource

```bash
grit generate resource Link --fields "url:string,title:string,description:text,thumbnail_url:string,favicon_url:string,is_pinned:bool,is_archived:bool,is_trashed:bool,user_id:belongs_to:User,labels:many_to_many:Label"
```

---

## Step 8 — Generate the Image resource

```bash
grit generate resource Image --fields "title:string,storage_key:string,url:string,mime_type:string,size_bytes:uint,width:int,height:int,is_pinned:bool,is_archived:bool,is_trashed:bool,user_id:belongs_to:User,labels:many_to_many:Label"
```

---

## Step 9 — Generate the File resource

```bash
grit generate resource File --fields "title:string,original_name:string,storage_key:string,url:string,mime_type:string,size_bytes:uint,extension:string,is_pinned:bool,is_archived:bool,is_trashed:bool,user_id:belongs_to:User,labels:many_to_many:Label"
```

---

## Step 10 — Run migrations

```bash
grit migrate
```

---

## Step 11 — Add OG metadata auto-fetch for Links

In the Go backend, add a service `services/og_fetcher.go` that:
1. On `POST /api/links`, reads the `url` field
2. Fetches the URL and parses `<meta property="og:*">` tags
3. Populates `title`, `description`, `thumbnail_url`, `favicon_url` automatically if not supplied by the user

---

## Step 12 — Add MinIO upload flow

1. In `services/storage.go`, create a MinIO client using the env vars.
2. Add a `POST /api/images/upload` handler that:
   - Generates a pre-signed PUT URL for MinIO
   - Returns `{ upload_url, storage_key }` to the frontend
3. Add a `POST /api/files/upload` handler with the same pattern.
4. After the frontend uploads directly to MinIO, it calls the normal `POST /api/images` or `POST /api/files` with the `storage_key` to save the record.

---

## Step 13 — Add soft-delete (Trash) and Archive logic

For every resource (Note, Link, Image, File):
- `DELETE /api/<resource>/:id` → sets `is_trashed = true`, does NOT hard delete
- `PUT /api/<resource>/:id/archive` → toggles `is_archived`
- `PUT /api/<resource>/:id/restore` → sets `is_trashed = false`
- `DELETE /api/<resource>/:id/permanent` → hard deletes (admin only or after 30 days)

Add a background job (Go goroutine or cron) that hard-deletes trashed items older than 30 days.

---

## Step 14 — Add cross-resource search

Add `GET /api/search?q=<query>` that queries Notes (title, body), Links (title, url, description), Images (title), Files (title, original_name) using SQL `ILIKE '%query%'` and returns unified results with a `type` field.

---

## Step 15 — Register resources in Admin Panel

In the Grit admin config file, register:

```go
admin.RegisterResource(&models.User{}, admin.ResourceConfig{
    Fields: []string{"id", "name", "email", "role", "created_at"},
    Filterable: []string{"role"},
})
admin.RegisterResource(&models.Note{}, admin.ResourceConfig{
    Fields: []string{"id", "title", "user_id", "is_archived", "is_trashed", "created_at"},
})
admin.RegisterResource(&models.Link{}, admin.ResourceConfig{
    Fields: []string{"id", "url", "title", "user_id", "created_at"},
})
admin.RegisterResource(&models.Image{}, admin.ResourceConfig{
    Fields: []string{"id", "title", "mime_type", "size_bytes", "user_id", "created_at"},
})
admin.RegisterResource(&models.File{}, admin.ResourceConfig{
    Fields: []string{"id", "title", "extension", "size_bytes", "user_id", "created_at"},
})
admin.RegisterResource(&models.Label{}, admin.ResourceConfig{
    Fields: []string{"id", "name", "color", "user_id"},
})
```

---

## Step 16 — Build the frontend board UI

In `frontend/app/dashboard/page.tsx`, implement:

1. A masonry grid layout (use `react-masonry-css` or CSS columns) showing all resource cards
2. Filter tabs: All | Notes | Links | Images | Files
3. Label sidebar for filtering
4. Pinned section at the top
5. Each card type has its own component:
   - `NoteCard` — shows title + body preview + colour background
   - `LinkCard` — shows thumbnail + favicon + title + domain
   - `ImageCard` — shows full image thumbnail
   - `FileCard` — shows file type icon + name + size

---

## Step 17 — Build Archive and Trash pages

- `frontend/app/archive/page.tsx` — shows all resources where `is_archived = true`
- `frontend/app/trash/page.tsx` — shows all resources where `is_trashed = true`, with Restore and Permanently Delete actions

---

## Step 18 — Final checks

```bash
# Run backend tests
cd backend && go test ./...

# Run frontend type checks
cd frontend && npx tsc --noEmit

# Build frontend
cd frontend && npm run build
```

---

## Notes for Claude Code

- Always scope API queries to the **authenticated user** — never return another user's resources
- The `User` record should be **upserted** on Google login (create if not exists, update avatar/name if changed)
- All resource list endpoints should support `?archived=true` and `?trashed=true` query params
- Default list endpoint excludes archived and trashed items
- MinIO bucket should be created on app startup if it does not exist
