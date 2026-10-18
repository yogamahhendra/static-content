# Static CMS

<p align="center">
  <img src="public/logo.png" alt="Static CMS Logo" width="120" height="120" />
</p>

<p align="center">
  <strong>High-Performance, Open-Source Static Asset Management System with Immutable Public Endpoints.</strong>
</p>

<p align="center">
  <a href="https://github.com/yogamahhendra"><img src="https://img.shields.io/badge/Developer-yogamahhendra-6366f1?style=flat-square&logo=github" alt="Developer" /></a>
  <img src="https://img.shields.io/badge/Next.js-16.4-black?style=flat-square&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19.3-blue?style=flat-square&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=flat-square&logo=tailwindcss" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Drizzle_ORM-0.45-c6f043?style=flat-square" alt="Drizzle ORM" />
  <img src="https://img.shields.io/badge/Neon-PostgreSQL-00e599?style=flat-square&logo=postgresql" alt="Neon Postgres" />
  <img src="https://img.shields.io/badge/Tests-13%2F13_Passed-success?style=flat-square" alt="Tests" />
  <img src="https://img.shields.io/badge/License-MIT-emerald?style=flat-square" alt="License" />
</p>

---

## 🌟 Overview

**Static CMS** is an open-source, developer-first Content Management System built to centralize, optimize, and serve static digital media (marketing banners, logos, PDF documents, SVG graphics, and JSON configurations).

In modern microservices and multi-client environments, managing media files across cloud buckets often leads to brittle integrations:
- ❌ Hardcoded storage URLs break whenever files are replaced or versioned.
- ❌ Legacy files remain orphaned in cloud storage, inflating hosting bills.
- ❌ Unoptimized media degrades page performance, Core Web Vitals, and mobile bandwidth.
- ❌ Unchecked SVG uploads expose client applications to stored Cross-Site Scripting (XSS).

**Static CMS solves this permanently** by acting as an intelligent intermediary—providing **immutable public URL contracts**, **atomic zero-downtime file replacements with auto-purging**, **automated server-side media optimization via Sharp**, and **enterprise-grade Role-Based Access Control (RBAC)**.

---

## 🚀 Key Features

- **🔗 Immutable Public Endpoints**:
  Assets are accessed through permanent deterministic routes (`/api/content/[key]` and `/api/content/[key]/metadata`). When an asset is replaced or revised, its URL never changes—eliminating the need for downstream code deployments or email template modifications.
- **⚡ Atomic File Replacement & Auto-Purge**:
  Replacing an asset stages the new file in S3 first, verifies database integrity, and immediately deletes the obsolete cloud storage object. No broken intermediate states and no orphaned storage bloat.
- **🖼️ Automated Server-Side Optimization**:
  - Automatically transcodes raster images (JPEG, PNG, TIFF) to next-generation **WebP** via [Sharp](https://sharp.pixelplumbing.com/).
  - Strips privacy-compromising EXIF metadata.
  - Sanitizes SVG files against executable JavaScript and dangerous event handlers (`onload`, `onerror`, `<script>`).
  - Minifies JSON configuration schemas.
- **🛡️ Full Role-Based Access Control (RBAC)**:
  Fine-grained administrative permission tiers:
  - `superadmin`: Full system control, user management, role assignments, category and content CRUD.
  - `admin`: Category and content management, file replacements, status toggling.
  - `editor`: Create and modify content assets and categories.
  - `viewer`: Read-only access to console metrics and asset libraries.
- **📜 Comprehensive Audit Logging**:
  Captures an immutable chronological trail of administrative mutations (actor, action, entity, target ID, metadata, and timestamps). Can be toggled on/off via the `ENABLE_AUDIT_LOGS` environment variable.
- **💎 Glassmorphic Dark-Mode UI**:
  Engineered with Tailwind CSS v4, Lucide icons, responsive drawer navigation, real-time clipboard copying, search filters, and modal-driven workflows.
- **💳 Zero-Credit-Card Free-Tier Ready**:
  Fully compatible with free tiers of **Neon Serverless PostgreSQL** (1 GB), **Neon Object Storage** or any S3-compatible provider (5 GB), and **Vercel Hobby** serverless hosting.

---

## 🛠️ Technology Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Framework** | [Next.js 16 (App Router)](https://nextjs.org/) | React 19, Turbopack, Partial Prerendering |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Modern CSS tokens, dark mode palette, glassmorphism |
| **Database** | [Neon PostgreSQL](https://neon.tech/) | Serverless driver (`@neondatabase/serverless`) |
| **ORM** | [Drizzle ORM](https://orm.drizzle.team/) | Type-safe schema definition and Drizzle Kit migrations |
| **Storage Engine** | [AWS SDK S3 Client](https://aws.amazon.com/sdk-for-javascript/) | Compatible with Neon S3, Cloudflare R2, MinIO, AWS S3 |
| **Image Pipeline** | [Sharp](https://sharp.pixelplumbing.com/) | Server-side high-speed WebP compression & image transforms |
| **Authentication** | [Jose](https://github.com/panva/jose) & [Bcryptjs](https://github.com/dcodeIO/bcrypt.js) | Cryptographic HttpOnly JWT session tokens & password hashing |
| **Validation** | [Zod](https://zod.dev/) | Strict input validation schemas for all API payloads |

---

## 📋 RBAC Permission Matrix

| Capability | Superadmin | Admin | Editor | Viewer |
| :--- | :---: | :---: | :---: | :---: |
| View Overview & Content Library | ✅ | ✅ | ✅ | ✅ |
| Copy Public Endpoint URLs | ✅ | ✅ | ✅ | ✅ |
| Upload & Create New Content Assets | ✅ | ✅ | ✅ | ❌ |
| Replace File & Auto-Purge Old S3 Object | ✅ | ✅ | ✅ | ❌ |
| Edit Content Metadata & Categories | ✅ | ✅ | ✅ | ❌ |
| Toggle Content Active/Inactive Status | ✅ | ✅ | ❌ | ❌ |
| Delete Content Assets & Categories | ✅ | ✅ | ❌ | ❌ |
| View System Audit Logs | ✅ | ✅ | ❌ | ❌ |
| Create, Edit, & Delete Users / Assign Roles | ✅ | ❌ | ❌ | ❌ |

---

## 🏁 Getting Started

### Prerequisites

- **Node.js**: `v20.x` or higher
- **Package Manager**: [pnpm](https://pnpm.io/) (`corepack enable pnpm` or `npm install -g pnpm`)
- **PostgreSQL Database**: Free tier instance from [Neon](https://neon.tech)
- **Object Storage**: S3-compatible bucket credentials (e.g., Neon Object Storage, Cloudflare R2, or AWS S3)

### 1. Clone the Repository

```bash
git clone https://github.com/yogamahhendra/static-content.git
cd static-content
pnpm install
```

### 2. Configure Environment Variables

Copy `.env.example` to create your local `.env`:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```ini
# Application URL
APP_BASE_URL=http://localhost:3000

# Neon Serverless PostgreSQL
DATABASE_URL="postgresql://user:password@ep-sample-pooler.aws.neon.tech/neondb?sslmode=require"

# JWT Secret (generate with: openssl rand -base64 32)
AUTH_SECRET="your_secure_random_string_at_least_32_chars"

# Initial Superadmin Credentials (used by pnpm db:seed)
ADMIN_INITIAL_EMAIL="admin@example.com"
ADMIN_INITIAL_PASSWORD="ChangeMeStrongPassword123!"

# Audit Logging (true | false)
ENABLE_AUDIT_LOGS=true

# S3 / Neon Object Storage Configuration
AWS_ENDPOINT_URL_S3="https://your-branch-id.storage.neon.tech"
AWS_REGION="ap-southeast-1"
AWS_ACCESS_KEY_ID="your_access_key"
AWS_SECRET_ACCESS_KEY="your_secret_key"
S3_BUCKET_NAME="static-content"
```

### 3. Initialize Database & Seed Superadmin

Push the schema to your Neon database and seed the default superadmin user & initial categories:

```bash
# Push Drizzle schema migrations to database
pnpm db:push

# Seed superadmin account and default asset categories
pnpm db:seed
```

### 4. Run Development Server

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the landing page, or navigate to [http://localhost:3000/login](http://localhost:3000/login) to sign in to the Admin Console using your seeded administrator credentials.

---

## 📡 API Reference

### Public Delivery Endpoints

#### 1. Stream File Content
```http
GET /api/content/:key
```
Streams the raw asset directly from storage with optimal `Cache-Control: public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800` headers.

#### 2. Get Asset Metadata
```http
GET /api/content/:key/metadata
```
Returns a JSON summary of the asset (key, title, content type, file size, checksum, category, and update timestamp).

---

### Admin Endpoints (Authenticated)

| Method | Endpoint | Description | Role Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate admin and receive HttpOnly cookie | Public |
| `POST` | `/api/auth/logout` | Revoke session and clear session cookie | Authenticated |
| `GET` | `/api/auth/me` | Fetch currently authenticated user profile & role | Authenticated |
| `GET` | `/api/admin/overview` | Dashboard analytics (counts, active assets, recents) | Viewer+ |
| `GET` | `/api/admin/contents` | Paginated asset listing with search & category filters | Viewer+ |
| `POST` | `/api/admin/contents` | Upload asset (validates, optimizes WebP, uploads S3) | Editor+ |
| `PUT` | `/api/admin/contents/:id` | Update asset metadata (title, description, category) | Editor+ |
| `POST` | `/api/admin/contents/:id/replace` | Replace file atomically and purge old S3 object | Editor+ |
| `PATCH` | `/api/admin/contents/:id/toggle-status` | Toggle asset between Active and Inactive | Admin+ |
| `DELETE` | `/api/admin/contents/:id` | Delete asset record and associated S3 storage object | Admin+ |
| `GET` | `/api/admin/categories` | List all categories with asset count | Viewer+ |
| `POST` | `/api/admin/categories` | Create new asset category | Editor+ |
| `PUT` | `/api/admin/categories/:id` | Update category title and slug | Editor+ |
| `DELETE` | `/api/admin/categories/:id` | Delete category (protected against active assets) | Admin+ |
| `GET` | `/api/admin/users` | List all administrator accounts and roles | Superadmin |
| `POST` | `/api/admin/users` | Create new user account with designated role | Superadmin |
| `PUT` | `/api/admin/users/:id` | Update user email, role, or reset password | Superadmin |
| `DELETE` | `/api/admin/users/:id` | Remove user account (prevents self-deletion) | Superadmin |
| `GET` | `/api/admin/audit-logs` | Fetch chronological audit log records | Admin+ |

---

## 🧪 Testing & Validation

The codebase includes an automated test suite verifying password cryptography, JWT session parsing, RBAC validation matrix, Zod validation schemas, WebP optimization, SVG script sanitization, and atomic storage replacement invariants.

```bash
# Run unit and integration tests
pnpm test

# Run Next.js production build verification
pnpm build
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to check the [issues page](https://github.com/yogamahhendra/static-content/issues) if you want to contribute.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 👤 Author

Developed by **yogamahhendra**
- GitHub: [@yogamahhendra](https://github.com/yogamahhendra)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
