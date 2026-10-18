# Static Content Management System - System Architecture & Specifications

Dokumen ini mendokumentasikan keputusan arsitektur sistem, skema database, spesifikasi API, dan strategi integrasi storage untuk Static Content Management System (CMS).

---

## 1. Provider Verification & Quota Summary (Phase 1)

### A. Neon Serverless PostgreSQL
- **Free Tier:** 1 GB storage per project, 100 Compute Unit (CU) hours per bulan.
- **Credit Card:** **Tidak diperlukan (Zero Credit Card Required)**.
- **Koneksi:** Menggunakan `@neondatabase/serverless` dengan protokol HTTP query pooler (sangat cepat dan ramah serverless Vercel) serta standard pooler connection string untuk `drizzle-kit` migrations.

### B. Neon Object Storage (S3-Compatible)
- **Free Tier:** 5 GB storage per project, 5 GB transfer network egress per bulan.
- **Credit Card:** **Tidak diperlukan (Termasuk dalam paket Neon Free)**.
- **Protokol:** 100% S3 Wire Protocol compatible. Menggunakan library resmi `@aws-sdk/client-s3`.
- **Fallback Compatibility:** Karena menggunakan standard S3 Client, variabel lingkungan dapat diarahkan ke Supabase Storage S3 (1 GB free), Cloudflare R2 (10 GB free), ataupun MinIO lokal tanpa mengubah satu baris kode pun.

### C. Vercel Hosting (Hobby Plan)
- **Free Tier:** Personal/non-commercial, 100 GB bandwith, serverless function payload limit 4.5 MB.
- **Credit Card:** **Tidak diperlukan**.

---

## 2. Database Schema Design (Phase 2 & Phase 4)

Menggunakan **Drizzle ORM** dengan PostgreSQL dialect.

### A. Tabel `users`
Tabel administrator sistem.
```typescript
{
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 50 }).notNull().default("admin"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}
```

### B. Tabel `categories`
Kategori pengelompokan konten statis.
```typescript
{
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(), // URL-friendly identifier
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}
```
*Index:* `slug_idx` pada kolom `slug`.
*Relasi:* Dilindungi dengan referensi ketat; kategori tidak boleh dihapus jika masih ada konten yang merujuk padanya (`onDelete: "restrict"`).

### C. Tabel `contents`
Metadata aset konten statis dan pemetaan ke object storage.
```typescript
{
  id: uuid("id").primaryKey().defaultRandom(),
  categoryId: uuid("category_id").notNull().references(() => categories.id, { onDelete: "restrict" }),
  key: varchar("key", { length: 255 }).notNull().unique(), // Immutable identifier (cth: homepage-hero)
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  storageKey: varchar("storage_key", { length: 512 }).notNull(),
  contentType: varchar("content_type", { length: 128 }).notNull(),
  fileExtension: varchar("file_extension", { length: 32 }).notNull(),
  fileSize: bigint("file_size", { mode: "number" }).notNull(),
  originalFileSize: bigint("original_file_size", { mode: "number" }),
  checksum: varchar("checksum", { length: 128 }),
  optimizationStatus: varchar("optimization_status", { length: 50 }).notNull().default("unchanged"), // optimized | unchanged | skipped | failed
  isActive: boolean("is_active").notNull().default(true),
  createdBy: uuid("created_by").references(() => users.id),
  updatedBy: uuid("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}
```
*Index:* `content_key_idx` (`key`), `content_category_idx` (`category_id`), `content_active_idx` (`is_active`).

### D. Tabel `audit_logs`
Pencatatan rekam jejak aksi administratif non-sensitif.
```typescript
{
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: uuid("actor_id").references(() => users.id),
  actorEmail: varchar("actor_email", { length: 255 }),
  action: varchar("action", { length: 100 }).notNull(), // CONTENT_CREATE, CONTENT_REPLACE, dsb.
  entity: varchar("entity", { length: 50 }).notNull(), // content, category, auth
  entityId: varchar("entity_id", { length: 255 }),
  metadata: jsonb("metadata"),
  ipAddress: varchar("ip_address", { length: 64 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}
```

---

## 3. Storage Key & File Replacement Workflow

### A. Format Storage Key
Storage key menggunakan pola terisolasi:
`contents/${content_id}/${timestamp}-${content_key}.${extension}`

### B. Alur Penggantian Berkas (Replace File Workflow)
1. **Validasi Awal:** Server memvalidasi tipe MIME asli, ekstensi berkas, dan batas ukuran file yang diunggah.
2. **Optimasi:** Berkas diproses melalui pipeline optimasi (Sharp untuk gambar raster, minifikasi untuk JSON, sanitasi tag script untuk SVG).
3. **Simpan ke Storage:** Berkas baru diunggah ke Object Storage pada `storage_key` baru yang unik.
4. **Pembaruan Database:** Kolom `storage_key`, `file_size`, `original_file_size`, `content_type`, `checksum`, `optimization_status`, dan `updated_at` diperbarui di database.
5. **Pembersihan Berkas Lama:** Hanya setelah database berhasil diperbarui, berkas lama di object storage dihapus (safe non-blocking cleanup). Jika database gagal, file baru di-rollback tanpa merusak berkas produksi yang sedang aktif.
6. **URL Publik Tetap Stabil:** URL publik adalah `/api/content/[key]`. Konsumen eksternal tidak perlu mengubah URL sama sekali saat berkas diperbarui.
7. **Cache Revalidation:** Mengirim header `Cache-Control: public, max-age=60, s-maxage=300, stale-while-revalidate=86400` dan `ETag` berbasis checksum.

---

## 4. API Endpoints Contract

### A. Public Endpoints (Tanpa Autentikasi)
- `GET /api/content/[key]`:
  - Mengambil data berkas aktif terbaru dan melakukan streaming dengan header `Content-Type` yang sesuai.
  - Return `404` jika konten tidak ditemukan atau `is_active: false`.
- `GET /api/content/[key]/metadata`:
  - Mengembalikan JSON metadata publik (title, key, content_type, file_size, updated_at).

### B. Admin Endpoints (Memerlukan Session Cookie Admin)
- **Auth:**
  - `POST /api/auth/login` (email, password)
  - `POST /api/auth/logout`
  - `GET /api/auth/me`
- **Categories:**
  - `GET /api/admin/categories` (search, pagination)
  - `POST /api/admin/categories` (name, slug, description)
  - `GET /api/admin/categories/[id]`
  - `PATCH /api/admin/categories/[id]`
  - `DELETE /api/admin/categories/[id]` (validasi isi konten)
- **Contents:**
  - `GET /api/admin/contents` (filter category, search, pagination)
  - `POST /api/admin/contents` (multipart/form-data: title, key, category_id, file, optimize_options)
  - `GET /api/admin/contents/[id]`
  - `PATCH /api/admin/contents/[id]` (metadata update: title, description, category_id)
  - `POST /api/admin/contents/[id]/replace` (multipart/form-data: replacement file)
  - `POST /api/admin/contents/[id]/toggle-status` (is_active toggle)
  - `DELETE /api/admin/contents/[id]` (hapus metadata & object di storage)
- **Dashboard & Audit:**
  - `GET /api/admin/overview` (stats ringkasan)
  - `GET /api/admin/audit-logs` (daftar log audit)
