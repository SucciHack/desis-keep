# Desis-Keep — Phased Build Plan

---

## Phase 1 — Scaffold + Core Models

### 1.1 Project Setup
- [ ] Run `grit new desis-keep` and select PostgreSQL, Google OAuth, Admin Panel, Docker
- [ ] Run `docker-compose up -d` and confirm all services are healthy (PostgreSQL, Redis, MinIO)
- [ ] Configure `.env` and `frontend/.env.local` with DB, Redis, MinIO, and Google OAuth credentials
- [ ] Verify the default Grit dev server starts (`grit dev`)

### 1.2 Authentication — Replace Credentials with Google OAuth
- [ ] Remove credentials provider from `next-auth` config
- [ ] Install and configure `next-auth` with `GoogleProvider`
- [ ] Create `app/api/auth/[...nextauth]/route.ts`
- [ ] Replace login page with "Sign in with Google" only button
- [ ] Delete existing register page and any credentials-related forms
- [ ] Add `/auth/google/callback` route in Go backend (upsert User on login)
- [ ] Add JWT auth middleware to protect all `/api/*` routes
- [ ] Test full Google OAuth login flow end-to-end

### 1.3 Generate Core Resources
- [ ] `grit generate resource Label --fields "name:string,slug:slug,color:string,user_id:belongs_to:User"`
- [ ] `grit generate resource Note --fields "title:string,body:text,color:string,is_pinned:bool,is_archived:bool,is_trashed:bool,user_id:belongs_to:User,labels:many_to_many:Label"`
- [ ] `grit generate resource Link --fields "url:string,title:string,description:text,thumbnail_url:string,favicon_url:string,is_pinned:bool,is_archived:bool,is_trashed:bool,user_id:belongs_to:User,labels:many_to_many:Label"`
- [ ] `grit generate resource Image --fields "title:string,storage_key:string,url:string,mime_type:string,size_bytes:uint,width:int,height:int,is_pinned:bool,is_archived:bool,is_trashed:bool,user_id:belongs_to:User,labels:many_to_many:Label"`
- [ ] `grit generate resource File --fields "title:string,original_name:string,storage_key:string,url:string,mime_type:string,size_bytes:uint,extension:string,is_pinned:bool,is_archived:bool,is_trashed:bool,user_id:belongs_to:User,labels:many_to_many:Label"`
- [ ] Run `grit migrate` and confirm all tables created in PostgreSQL

### 1.4 Basic CRUD API (Backend)
- [ ] Verify generated CRUD endpoints for Notes work (`GET /api/notes`, `POST`, `PUT`, `DELETE`)
- [ ] Verify CRUD endpoints for Links, Images, Files, Labels
- [ ] Ensure all list endpoints scope results to the authenticated user only
- [ ] Add `?archived=true` and `?trashed=true` query param support to all list endpoints
- [ ] Confirm default list excludes archived and trashed items

### 1.5 Admin Panel — Register Resources
- [ ] Register User in admin with filterable `role` field
- [ ] Register Note, Link, Image, File, Label in admin panel
- [ ] Confirm admin panel is accessible at `/admin` and displays records

---

## Phase 2 — Relationships + Complex Features

### 2.1 Label System
- [ ] Implement label creation, renaming, colour-change, deletion
- [ ] Implement assigning labels to Notes via `many_to_many` (junction table)
- [ ] Implement assigning labels to Links, Images, Files
- [ ] Add `GET /api/notes?label=<slug>` filtering (and same for other resource types)
- [ ] Ensure deleting a label does not delete associated resources

### 2.2 Pin & Archive Logic
- [ ] `PUT /api/notes/:id/pin` — toggle `is_pinned`
- [ ] `PUT /api/notes/:id/archive` — toggle `is_archived`
- [ ] Repeat pin/archive toggle endpoints for Links, Images, Files
- [ ] Pinned items appear in a dedicated "Pinned" section at the top of the board

### 2.3 Trash / Soft Delete
- [ ] `DELETE /api/<resource>/:id` — sets `is_trashed = true` (no hard delete)
- [ ] `PUT /api/<resource>/:id/restore` — sets `is_trashed = false`
- [ ] `DELETE /api/<resource>/:id/permanent` — hard delete (admin or 30-day rule)
- [ ] Background job / cron: hard delete trashed items older than 30 days

### 2.4 MinIO Integration
- [ ] Create MinIO bucket on app startup if it does not exist
- [ ] `POST /api/images/upload` — return pre-signed PUT URL + storage key
- [ ] `POST /api/files/upload` — return pre-signed PUT URL + storage key
- [ ] After frontend uploads to MinIO, frontend calls `POST /api/images` or `POST /api/files` with `storage_key`
- [ ] Pre-signed GET URLs generated on read (for secure/private access)

### 2.5 OG Metadata Auto-Fetch for Links
- [ ] On `POST /api/links`, if `title` is empty, fetch URL and parse OG meta tags
- [ ] Populate `title`, `description`, `thumbnail_url`, `favicon_url` automatically
- [ ] Handle fetch errors gracefully (save link even if OG fetch fails)

### 2.6 Cross-Resource Search
- [ ] `GET /api/search?q=<query>` — search Notes (title, body), Links (title, url, description), Images (title), Files (title, original_name)
- [ ] Return unified result list with a `type` field (`note`, `link`, `image`, `file`)
- [ ] Results scoped to the authenticated user only

### 2.7 User Upsert & Profile Sync
- [ ] On every Google OAuth login, update `name` and `avatar_url` if changed
- [ ] `GET /auth/me` — return current user profile
- [ ] Display user avatar in the frontend navigation

---

## Phase 3 — Frontend Customisation + Polish

### 3.1 Dashboard Board UI
- [ ] Implement masonry grid layout for resource cards (use `react-masonry-css` or CSS columns)
- [ ] `NoteCard` component — colour background, title, body preview, label chips
- [ ] `LinkCard` component — thumbnail, favicon, title, domain name, external link icon
- [ ] `ImageCard` component — full image thumbnail, title, label chips
- [ ] `FileCard` component — file type icon, filename, size, download button
- [ ] Pinned section rendered above the main grid
- [ ] Empty state illustration when no resources exist

### 3.2 Filtering & Navigation
- [ ] Resource type filter tabs: All | Notes | Links | Images | Files
- [ ] Label sidebar (collapsible on mobile)
- [ ] Click a label in the sidebar to filter the board
- [ ] Search bar in the header that calls `GET /api/search`
- [ ] Search results shown in a unified results page

### 3.3 Archive & Trash Pages
- [ ] `/archive` page — all archived resources across types, with "Unarchive" action on each card
- [ ] `/trash` page — all trashed resources, with "Restore" and "Delete Forever" actions
- [ ] Trash page shows how many days until permanent deletion

### 3.4 Resource Create/Edit Modals
- [ ] Click anywhere on the board opens a "Create" input (Google Keep style)
- [ ] Expand into full modal for Notes (rich text or markdown editor)
- [ ] Link creation modal with URL field + auto-fetch preview
- [ ] Image upload modal with drag-and-drop
- [ ] File upload modal with drag-and-drop
- [ ] Edit modal for all resource types (pre-populated)

### 3.5 Label Management UI
- [ ] Label management page (`/labels`) — create, rename, delete, set colour
- [ ] Colour picker for label colour
- [ ] Label chips displayed on cards

### 3.6 Responsive Design & Polish
- [ ] Fully responsive layout (mobile, tablet, desktop)
- [ ] Dark mode support
- [ ] Smooth card hover animations
- [ ] Loading skeletons for cards while fetching
- [ ] Toast notifications for create / update / delete / error
- [ ] Lightbox for image preview (full-screen)
- [ ] Keyboard shortcut: `N` to create a new note

### 3.7 Admin Panel Polish
- [ ] Stats dashboard: total users, total resources per type, storage used (MinIO)
- [ ] User role management in admin (promote to admin, demote to user)
- [ ] Bulk delete trashed items from admin

### 3.8 Final QA & Deployment Prep
- [ ] Run `go test ./...` — all backend tests pass
- [ ] Run `npx tsc --noEmit` — no TypeScript errors
- [ ] Run `npm run build` — frontend builds without errors
- [ ] Review all API routes for auth scoping (no user can access another user's data)
- [ ] Add rate limiting to `/auth/google/callback` and `/api/links` (OG fetch)
- [ ] Write `README.md` with setup instructions and environment variable docs
- [ ] Docker Compose production config (with proper secrets management)
