# Desis-Keep — Project Specification

## Overview

Desis-Keep is a Google Keep-inspired personal resource management application built on the **Grit** meta-framework. Users can capture, organise, and archive five types of resources: links, notes, images, files, and archived items. Authentication is exclusively via **Google OAuth** (no credentials login).

---

## Tech Stack (Grit Defaults)

| Layer | Technology |
|---|---|
| Backend | Go + Gin + GORM |
| Frontend | Next.js (App Router) + TypeScript + React |
| Admin Panel | Grit Admin (Filament-like, resource-based) |
| Validation | Zod (shared frontend/backend types) |
| Auth Provider | Google OAuth only |
| Database | PostgreSQL (Docker) |
| Cache/Sessions | Redis (Docker) |
| Object Storage | MinIO (Docker) — for images & files |

---

## Authentication

- **Provider:** Google OAuth 2.0 only (`next-auth` with Google provider on frontend; Go middleware validates JWT/session on backend)
- Remove all credentials-based login; only "Sign in with Google" button is shown
- On first login, a `User` record is automatically created from the Google profile
- Session stored in Redis

---

## User Roles

| Role | Description |
|---|---|
| `user` | Default role. Can manage their own resources only |
| `admin` | Full access to admin panel; can view/manage all users and resources |

---

## Data Models

### User

| Field | Grit Type | Notes |
|---|---|---|
| `id` | `uint` | Primary key, auto-increment |
| `name` | `string` | From Google profile |
| `email` | `string` | Unique, from Google profile |
| `avatar_url` | `string` | Google profile picture URL |
| `google_id` | `string` | Unique Google sub ID |
| `role` | `string` | `"user"` or `"admin"`, default `"user"` |
| `created_at` | `datetime` | Auto |
| `updated_at` | `datetime` | Auto |

---

### Label

Used to organise resources (equivalent to Google Keep labels).

| Field | Grit Type | Notes |
|---|---|---|
| `id` | `uint` | Primary key |
| `name` | `string` | e.g. "Work", "Personal" |
| `slug` | `slug` | Auto-generated from name |
| `color` | `string` | Hex colour code |
| `user_id` | `belongs_to` | Owner (User) |
| `created_at` | `datetime` | Auto |
| `updated_at` | `datetime` | Auto |

---

### Note

Rich text / plain text notes.

| Field | Grit Type | Notes |
|---|---|---|
| `id` | `uint` | Primary key |
| `title` | `string` | Optional |
| `body` | `text` | Main content (plain or markdown) |
| `color` | `string` | Background colour hex |
| `is_pinned` | `bool` | Pinned to top of board |
| `is_archived` | `bool` | Moved to archive |
| `is_trashed` | `bool` | Soft-deleted |
| `user_id` | `belongs_to` | Owner (User) |
| `labels` | `many_to_many` | Label association |
| `created_at` | `datetime` | Auto |
| `updated_at` | `datetime` | Auto |

---

### Link (Bookmark)

Saved web links with metadata.

| Field | Grit Type | Notes |
|---|---|---|
| `id` | `uint` | Primary key |
| `url` | `string` | Full URL |
| `title` | `string` | Page title (auto-fetched via OG tags) |
| `description` | `text` | OG description |
| `thumbnail_url` | `string` | OG image URL |
| `favicon_url` | `string` | Favicon URL |
| `is_pinned` | `bool` | |
| `is_archived` | `bool` | |
| `is_trashed` | `bool` | |
| `user_id` | `belongs_to` | Owner (User) |
| `labels` | `many_to_many` | Label association |
| `created_at` | `datetime` | |
| `updated_at` | `datetime` | |

---

### Image

Uploaded images stored in MinIO.

| Field | Grit Type | Notes |
|---|---|---|
| `id` | `uint` | Primary key |
| `title` | `string` | Optional caption |
| `storage_key` | `string` | MinIO object key |
| `url` | `string` | Public/pre-signed URL |
| `mime_type` | `string` | e.g. `image/jpeg` |
| `size_bytes` | `uint` | File size |
| `width` | `int` | Pixel width |
| `height` | `int` | Pixel height |
| `is_pinned` | `bool` | |
| `is_archived` | `bool` | |
| `is_trashed` | `bool` | |
| `user_id` | `belongs_to` | Owner (User) |
| `labels` | `many_to_many` | Label association |
| `created_at` | `datetime` | |
| `updated_at` | `datetime` | |

---

### File

Non-image file uploads (PDFs, docs, spreadsheets, etc.) stored in MinIO.

| Field | Grit Type | Notes |
|---|---|---|
| `id` | `uint` | Primary key |
| `title` | `string` | Display name |
| `original_name` | `string` | Original filename |
| `storage_key` | `string` | MinIO object key |
| `url` | `string` | Pre-signed download URL |
| `mime_type` | `string` | e.g. `application/pdf` |
| `size_bytes` | `uint` | File size in bytes |
| `extension` | `string` | e.g. `pdf`, `xlsx` |
| `is_pinned` | `bool` | |
| `is_archived` | `bool` | |
| `is_trashed` | `bool` | |
| `user_id` | `belongs_to` | Owner (User) |
| `labels` | `many_to_many` | Label association |
| `created_at` | `datetime` | |
| `updated_at` | `datetime` | |

---

## Relationships Summary

```
User          has_many  Notes
User          has_many  Links
User          has_many  Images
User          has_many  Files
User          has_many  Labels

Note          belongs_to  User
Note          many_to_many  Labels

Link          belongs_to  User
Link          many_to_many  Labels

Image         belongs_to  User
Image         many_to_many  Labels

File          belongs_to  User
File          many_to_many  Labels

Label         belongs_to  User
Label         many_to_many  Notes, Links, Images, Files
```

---

## Features

### Core Features
- Google OAuth login (only auth method)
- Create / Read / Update / Delete for all 5 resource types
- Pin resources to top of board
- Archive resources (move to Archive view)
- Trash / soft-delete (30-day retention, then hard delete)
- Label management (create, rename, delete, colour-code)
- Assign multiple labels to any resource
- Filter view by label
- Search across all resource types (title, body, URL)

### Link-Specific
- Auto-fetch OG metadata (title, description, thumbnail, favicon) on URL save
- Open link in new tab

### Image-Specific
- Direct image upload to MinIO via pre-signed URLs
- Thumbnail generation on upload
- Lightbox preview

### File-Specific
- Upload arbitrary files to MinIO
- Pre-signed download URLs
- File type icon display

### Archive View
- Dedicated `/archive` page showing all archived resources across types

### Admin Panel
- User management (view, role change, deactivate)
- Resource overview (all notes/links/images/files across all users)
- Stats dashboard (total users, total resources per type)

---

## API Routes (Backend — Go/Gin)

```
POST   /auth/google/callback      — Google OAuth callback
GET    /auth/me                   — Current user

GET    /api/notes                 — List user's notes
POST   /api/notes                 — Create note
PUT    /api/notes/:id             — Update note
DELETE /api/notes/:id             — Trash note

GET    /api/links
POST   /api/links
PUT    /api/links/:id
DELETE /api/links/:id

GET    /api/images
POST   /api/images/upload         — Get pre-signed upload URL
PUT    /api/images/:id
DELETE /api/images/:id

GET    /api/files
POST   /api/files/upload          — Get pre-signed upload URL
PUT    /api/files/:id
DELETE /api/files/:id

GET    /api/labels
POST   /api/labels
PUT    /api/labels/:id
DELETE /api/labels/:id

GET    /api/search?q=             — Cross-resource search
```
