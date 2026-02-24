# Desis-Keep

A Google Keep-inspired personal resource management application for capturing, organizing, and archiving your digital content.

## What is Desis-Keep?

Desis-Keep is a full-stack application that helps you manage and organize various types of digital resources in one place. Think of it as your personal knowledge base where you can save notes, bookmarks, images, files, and blog posts with powerful organization features like labels, pinning, archiving, and search.

## Key Features

### Resource Management
Manage five types of resources with a unified interface:

- **Notes** - Rich text notes with color coding and markdown support
- **Links** - Save bookmarks with automatic metadata fetching (title, description, thumbnail, favicon)
- **Images** - Upload and organize images with thumbnail generation and lightbox preview
- **Files** - Store documents, PDFs, spreadsheets, and other files with pre-signed download URLs
- **Blogs** - Create and publish blog posts with rich content

### Organization Tools

- **Labels** - Create custom labels with color coding to categorize resources
- **Pin Resources** - Keep important items at the top of your board
- **Archive** - Move completed or inactive resources to a dedicated archive view
- **Trash** - Soft-delete items with 30-day retention before permanent deletion
- **Search** - Full-text search across all resource types (titles, content, URLs)
- **Filters** - Filter views by pinned, archived, or trashed status

### Authentication

- **Google OAuth** - Secure authentication using your Google account (no password management)
- **Role-Based Access** - User and admin roles for access control

### Admin Panel

A powerful admin interface for managing the application:

- **User Management** - View users, change roles, manage accounts
- **Resource Overview** - Browse all resources across all users
- **Dashboard** - View statistics and metrics (total users, resources per type)
- **System Tools** - Cron jobs, file management, job queue monitoring, email logs, security settings

## Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **TailwindCSS** - Utility-first styling
- **React Query** - Data fetching and caching
- **React Hook Form** - Form management with Zod validation
- **Tiptap** - Rich text editor for notes and blogs
- **Lucide Icons** - Beautiful icon library

### Backend
- **Go** - High-performance backend language
- **Gin** - Fast HTTP web framework
- **GORM** - ORM for database operations
- **PostgreSQL** - Primary database
- **Redis** - Caching and session storage
- **MinIO** - S3-compatible object storage for files and images

### Infrastructure
- **Docker** - Containerized deployment
- **Turborepo** - Monorepo build system
- **pnpm** - Fast, disk-efficient package manager

## Project Structure

```
desis-keep/
├── apps/
│   ├── admin/          # Admin panel (Next.js)
│   ├── api/            # Backend API (Go)
│   └── web/            # Public website (Next.js)
├── packages/
│   └── shared/         # Shared types, schemas, and constants
└── docker-compose.yml  # Docker services configuration
```

## Getting Started

### Prerequisites

- Node.js 20+
- Go 1.24+
- Docker and Docker Compose
- pnpm 10+

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd desis-keep
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start Docker services (PostgreSQL, Redis, MinIO):
```bash
pnpm docker:up
```

5. Run database migrations:
```bash
cd apps/api
go run cmd/migrate/main.go
```

6. Start development servers:
```bash
# All services
pnpm dev

# Or individually
pnpm dev:api    # API server (port 8080)
pnpm dev:admin  # Admin panel (port 3001)
pnpm dev:web    # Public website (port 3000)
```

### Access the Application

- **Public Website**: http://localhost:3000
- **Admin Panel**: http://localhost:3001
- **API**: http://localhost:8080
- **MinIO Console**: http://localhost:9001

## API Endpoints

### Authentication
- `POST /auth/google/callback` - Google OAuth callback
- `GET /auth/me` - Get current user

### Resources
- `GET /api/notes` - List notes
- `POST /api/notes` - Create note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note

Similar endpoints exist for `/api/links`, `/api/images`, `/api/files`, and `/api/blogs`

### Labels
- `GET /api/labels` - List labels
- `POST /api/labels` - Create label
- `PUT /api/labels/:id` - Update label
- `DELETE /api/labels/:id` - Delete label

### Search
- `GET /api/search?q=query` - Cross-resource search

### Upload
- `POST /api/upload/presigned` - Get pre-signed upload URL
- `POST /api/upload/complete` - Complete upload and create resource

## Features in Detail

### Link Metadata Fetching
When you save a URL, Desis-Keep automatically fetches:
- Page title
- Description (from Open Graph tags)
- Thumbnail image
- Favicon

### Image Processing
Uploaded images are:
- Stored in MinIO object storage
- Automatically resized for thumbnails
- Served with optimized URLs
- Viewable in a lightbox gallery

### File Management
- Support for any file type (PDFs, documents, spreadsheets, etc.)
- Pre-signed URLs for secure downloads
- File type detection and icon display
- Size tracking and display

### Label System
- Create unlimited custom labels
- Assign colors to labels for visual organization
- Apply multiple labels to any resource
- Filter resources by label

## Development

### Build for Production
```bash
pnpm build
```

### Run Tests
```bash
pnpm test
```

### Lint Code
```bash
pnpm lint
```

### Type Check
```bash
pnpm type-check
```

## Docker Deployment

Build and run with Docker Compose:

```bash
docker compose -f docker-compose.prod.yml up -d
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[Your License Here]

## Support

For issues and questions, please open an issue on GitHub.
