# Project: Static Content Management System

## 1. Project Overview

Build a lightweight, production-minded Static Content Management System (CMS) to manage public static assets through an admin dashboard.

The system must support CRUD operations for categories and content, file uploads, public content URLs that remain stable, and file replacement without changing the public URL.

**Primary objective:** Minimize operational cost and use free-tier services without requiring a credit card for service activation. Verify current provider requirements before implementation. Do not assume any service is credit-card-free without confirmation.

## 2. Required Technology Stack

- **Framework:** Next.js App Router
- **Language:** TypeScript with strict mode
- **Hosting:** Vercel Hobby, subject to its personal/noncommercial usage restrictions
- **Database:** Neon PostgreSQL Free
- **Object Storage:** Neon Object Storage, provided the current account supports it and its usage is within the free quota
- **ORM:** Drizzle ORM
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Validation:** Zod
- **Authentication:** Secure admin authentication compatible with Next.js
- **Package Manager:** pnpm

Before implementation, verify Neon Object Storage availability, its current SDK/API, public access capabilities, overwrite behavior, free-tier quotas, and Vercel deployment compatibility. Do not invent SDK methods or APIs. If Neon Object Storage is not available for the account or does not support the required workflow, document a compatible alternative that satisfies the no-credit-card requirement.

## 3. Core Requirements

### A. Authentication

- Provide a login page for administrators.
- All admin dashboard routes and management APIs must require authentication.
- Public content endpoints must be accessible without login.
- Store secrets exclusively in environment variables.
- Never expose database credentials, storage credentials, or admin secrets to the browser.
- Apply secure cookie settings, CSRF protections where applicable, login rate limiting, and server-side authorization.
- Do not implement a hardcoded production password.

### B. Category Management

Implement full CRUD for categories.

Fields:
- `id`: UUID primary key
- `name`: required category name
- `slug`: unique URL-friendly identifier
- `description`: optional description
- `created_at`
- `updated_at`

Features:
- Search and pagination.
- Create, edit, and delete categories.
- Prevent deletion when a category still contains content unless the user explicitly reassigns or deletes that content.
- Validate category slugs and prevent duplicate values.

### C. Content Management

Implement full CRUD for content records.

Suggested fields:
- `id`: UUID primary key
- `category_id`: foreign key to categories
- `key`: globally unique, immutable content identifier
- `title`: required display name
- `description`: optional description
- `storage_key`: stable object storage key
- `content_type`: MIME type
- `file_extension`: extension
- `file_size`: size in bytes
- `checksum`: file checksum
- `is_active`: boolean
- `created_at`
- `updated_at`
- `created_by`
- `updated_by`

Example content keys:
- `homepage-banner`
- `promo-october`
- `terms-and-conditions`
- `app-config`

Features:
- List, search, filter by category, and paginate content.
- Create new content and upload its initial file.
- Edit metadata without changing the content key.
- Replace the file attached to an existing key.
- Enable and disable public access.
- Preview images and display metadata for other file types.
- Copy the public URL to the clipboard.
- Display file size, MIME type, last modified time, and upload status.
- Show clear validation and upload error messages.

### D. Stable Public URL

Public URLs must not change when a file is replaced.

Use a URL pattern such as:

`https://<APP_DOMAIN>/public/<category-slug>/<content-key>.<extension>`

Alternatively, use an immutable public path based on the content key:

`https://<APP_DOMAIN>/api/content/<content-key>`

Prefer the second approach if file extensions can change or if multiple content types are supported.

Requirements:
- Public URLs must not contain temporary signed tokens.
- Public requests must resolve to the latest active file associated with the content key.
- Replacing a file must not require changing the URL in external applications.
- Inactive or nonexistent content must return the appropriate HTTP status.
- Public endpoints must return the correct `Content-Type`, caching headers, and security headers.
- Support browser-friendly delivery of images, PDFs, and JSON files as appropriate.
- Never expose private storage credentials through public responses.

If a direct public object URL is used, confirm whether the storage provider can preserve the same object key during replacement and whether its public URL remains valid. Otherwise, use a stable Next.js endpoint that resolves the current storage object.

### E. File Upload and Overwrite Behavior

Supported file types should initially include:
- JPEG
- PNG
- WebP
- SVG, only with appropriate security handling
- PDF
- JSON

Requirements:
- Validate file extensions, actual content type, and file size on the server.
- Set configurable upload size limits.
- Generate a stable storage key from the content key, not from the original filename.
- Do not overwrite an existing object before validating the replacement file.
- Replace the stored object only after a successful upload.
- Keep the public URL unchanged.
- Update database metadata only after the storage operation succeeds.
- Handle failed uploads without leaving inconsistent database records.
- Prevent path traversal and unsafe filenames.
- Do not permit arbitrary executable or HTML uploads by default.
- Avoid exposing internal storage keys or credentials unnecessarily.

Use an appropriate replacement strategy. If the storage provider supports object versioning or atomic replacement, use it where practical. Otherwise, implement rollback or recovery behavior for failed replacements.

### F. Public Content API

Implement endpoints with clear request validation and error handling.

Suggested routes:

Admin:
- `GET /api/admin/categories`
- `POST /api/admin/categories`
- `GET /api/admin/categories/[id]`
- `PATCH /api/admin/categories/[id]`
- `DELETE /api/admin/categories/[id]`
- `GET /api/admin/contents`
- `POST /api/admin/contents`
- `GET /api/admin/contents/[id]`
- `PATCH /api/admin/contents/[id]`
- `DELETE /api/admin/contents/[id]`
- `POST /api/admin/contents/[id]/replace`
- `POST /api/admin/contents/[id]/toggle-status`

Public:
- `GET /api/content/[key]`
- `GET /api/content/[key]/metadata`

The public content endpoint must return the current active file or stream the content from storage. It must not require admin authentication.

Implement correct HTTP methods and status codes. Avoid leaking stack traces, SQL errors, or internal storage information to clients.

### G. Dashboard UI

Create a clean, minimalist admin dashboard using shadcn/ui and Tailwind CSS.

Pages:
1. Login
2. Dashboard overview
3. Category management
4. Content management
5. Create content
6. Edit content
7. Upload/replace file
8. Content details and public URL
9. Basic audit log

Dashboard overview should display:
- Total categories
- Total content records
- Active content
- Inactive content
- Recent updates

Content listing should include:
- Preview or file-type icon
- Title
- Content key
- Category
- MIME type
- File size
- Status
- Last updated
- Actions

Use responsive layouts, loading states, empty states, confirmation dialogs, and toast notifications. Do not use mock data in production functionality.

### H. Audit Logging

Record significant administrative actions:
- Content created
- Metadata updated
- File replaced
- Content activated or deactivated
- Content deleted
- Category changes
- Login attempts where appropriate

Record actor, action, entity, timestamp, and relevant non-sensitive metadata. Never log passwords, session tokens, or storage credentials.

## 4. Database and Storage Design

Use Drizzle ORM and PostgreSQL migrations.

Define:
- Categories table
- Contents table
- Admin users or a properly integrated authentication schema
- Audit logs table

Add:
- Foreign keys
- Unique constraints
- Indexes for content keys, category IDs, and search/filter fields
- Appropriate delete behavior
- Timestamps and migration files

Keep file bytes in object storage, not PostgreSQL.

The database should contain metadata and the mapping between each stable content key and its current storage object.

Do not store temporary signed URLs as permanent public URLs.

## 5. Environment Variables

Create `.env.example` containing placeholders for all required configuration.

Examples:
- `DATABASE_URL`
- `AUTH_SECRET`
- `APP_BASE_URL`
- Object storage endpoint and credentials, according to the verified provider SDK
- Any required authentication configuration

Never commit `.env` or actual credentials.

Document how to obtain each variable and configure it in Vercel.

## 6. Deployment Requirements

The application must work locally and on Vercel.

Provide:
- Local development instructions
- Neon database setup
- Database migration commands
- Object storage setup
- Environment variable configuration
- Vercel deployment instructions
- Production build verification
- Seed command for an initial admin user, if applicable
- Backup and recovery guidance

Do not rely on local filesystem persistence for uploaded files.

Ensure upload handling is compatible with Vercel request-size limits, execution limits, and the selected storage SDK. Use direct-to-storage uploads when appropriate and supported.

## 7. Testing Requirements

Implement tests for:
- Authentication and authorization
- Category CRUD
- Content CRUD
- Duplicate content keys
- Invalid file types
- File size limits
- File replacement
- Stable URL after replacement
- Inactive content access
- Missing content
- Storage failure and database consistency
- Public API response headers
- Audit log creation

Verify that replacing a file with the same content key preserves the public URL and returns the new file after cache invalidation or expiration.

## 8. Development Workflow

Work in small, verifiable phases.

Phase 1: Verify provider capabilities, free-tier limitations, and no-credit-card requirements.

Phase 2: Define architecture, database schema, API contracts, and file replacement strategy.

Phase 3: Initialize Next.js, Tailwind CSS, shadcn/ui, Drizzle ORM, and Zod.

Phase 4: Implement database schema, migrations, and authentication.

Phase 5: Implement category and content CRUD.

Phase 6: Implement object storage integration and stable public content delivery.

Phase 7: Build the admin dashboard.

Phase 8: Add validation, audit logs, and tests.

Phase 9: Deploy to Vercel and verify production behavior.

After each phase, report completed tasks, changed files, commands executed, test results, and remaining issues.

## 9. Acceptance Criteria

The project is complete only when:

1. An administrator can log in securely.
2. Categories can be created, edited, and deleted according to their constraints.
3. Content can be uploaded and managed through the dashboard.
4. Each content key is unique and immutable after creation.
5. Replacing a file preserves its public URL.
6. A public request returns the latest active file.
7. Database and storage failures are handled safely.
8. Public access does not expose administrative credentials.
9. The application builds and runs on Vercel.
10. Provider requirements and free-tier constraints are documented.
11. The deployment does not depend on persistent local filesystem storage.
12. No production secrets or real credentials are committed to the repository.

Start with Phase 1. Verify the actual storage provider APIs and limitations before writing storage integration code. Do not silently substitute an incompatible service or claim that the system is zero-cost without documenting the applicable quotas and terms.

## 10. File Compression and Optimization

Implement automatic file compression and optimization during upload. Compression must happen before the final file is saved to object storage.

### A. Image Optimization

Support:
- JPEG / JPG
- PNG
- WebP
- SVG with security validation

Use `sharp` for server-side raster image processing where compatible with the deployment runtime.

Requirements:
1. Automatically optimize images during upload.
2. Allow conversion of JPEG and PNG to WebP.
3. Preserve the original format by default when conversion would break compatibility or transparency requirements.
4. Preserve transparency for PNG and WebP images when required.
5. Do not upscale images.
6. Make maximum width, maximum height, output format, and quality configurable.
7. Use a sensible default WebP quality, such as 80.
8. Resize only when the image exceeds configured dimensions.
9. Strip unnecessary EXIF metadata by default, including GPS metadata.
10. Validate image dimensions and reject invalid or excessively large images.
11. Prevent decompression bombs and excessive memory consumption.
12. Reject unsupported, corrupted, or malicious files.
13. Display original size, optimized size, and compression percentage in the upload result.
14. Provide an option to disable optimization for files that must remain unchanged.

Suggested defaults:
- Maximum width: 1920 px
- Maximum height: 1920 px
- WebP quality: 80
- Resize only when the original exceeds the maximum dimensions.
- Never upscale.

Make these settings configurable through server-side configuration rather than hardcoding them throughout the codebase.

### B. PDF Optimization

PDF files must not be processed as images.

- Preserve the original PDF by default.
- If PDF optimization is supported, use a verified PDF optimization tool compatible with the deployment environment.
- Do not require a paid external compression API.
- Do not claim a PDF was compressed if its size did not decrease.
- Preserve readability, page dimensions, and document integrity.
- Allow the administrator to retain the original file when optimization is not appropriate.

### C. JSON Optimization

For JSON files:
- Parse and validate JSON before saving.
- Minify valid JSON by removing unnecessary whitespace.
- Preserve the JSON data structure and values.
- Do not minify JSON if the administrator explicitly requests formatting preservation.
- Report the original and final file sizes.

### D. SVG Security

- Validate SVG content before accepting it.
- Reject scripts, event-handler attributes, unsafe external references, and other dangerous active content.
- Do not treat SVG as a trusted image merely because its extension is `.svg`.
- Preserve SVG only when it passes validation.
- Consider rasterizing SVG to WebP as an optional, explicit operation rather than silently changing the default format.

### E. Upload Processing Workflow

Implement the following workflow:

1. Authenticate the administrator.
2. Validate the uploaded file's actual content type, extension, and size.
3. Apply the appropriate optimization strategy based on file type.
4. Compare the original and optimized outputs.
5. Use the optimized file only when it is valid and offers a benefit, unless a configured conversion is explicitly requested.
6. Calculate the final file size and checksum.
7. Upload the processed file to object storage.
8. Update database metadata only after storage succeeds.
9. Preserve the existing public content key and URL when replacing a file.
10. Invalidate or update the relevant cache after successful replacement.
11. Record the original size, final size, output format, and processing result in the audit log.
12. Clean up temporary files and buffers safely.

Never overwrite the existing production file before processing and validation succeed. Failed uploads must not leave the content pointing to a missing or incomplete object.

### F. Upload UI

Before upload, show:
- Original filename
- Original file size
- Detected file type
- Expected optimization settings

After upload, show:
- Original file size
- Final stored file size
- Space saved in bytes
- Percentage reduction
- Original and output formats
- Optimization status: Optimized, Unchanged, Skipped, or Failed

Example:

Original: 2.40 MB  
Optimized: =KB  
Saved: 1.98 MB (82.5%)  
Format: JPEG → WebP

The values above are illustrative only. Display actual measurements from the processed file.

### G. Technical and Deployment Constraints

- Ensure the chosen image-processing library is compatible with the Vercel deployment runtime and its resource limits.
- Set configurable limits for upload size, pixel count, processing duration, and memory usage.
- Avoid buffering unbounded uploads in memory.
- Use temporary storage only when supported by the runtime, and never rely on temporary files persisting between requests.
- For files exceeding safe synchronous processing limits, reject them with a clear message or use a separately configured asynchronous processing workflow.
- Do not introduce paid compression services.
- Add tests for file integrity, compression results, transparent images, invalid files, oversized images, JSON validity, and stable public URLs after replacement.

Update the database schema and admin dashboard as necessary to record original size, optimized size, output MIME type, checksum, and optimization status.

Implement and test this feature without changing the existing stable URL contract.