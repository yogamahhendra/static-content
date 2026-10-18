import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  bigint,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// -------------------------------------------------------------
// Users Table (Admin Authentication)
// -------------------------------------------------------------
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    role: varchar("role", { length: 50 }).notNull().default("admin"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("user_email_idx").on(table.email),
  ]
);

// -------------------------------------------------------------
// Categories Table
// -------------------------------------------------------------
export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("category_slug_idx").on(table.slug),
  ]
);

// -------------------------------------------------------------
// Contents Table
// -------------------------------------------------------------
export const contents = pgTable(
  "contents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    key: varchar("key", { length: 255 }).notNull().unique(), // Immutable identifier
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    storageKey: varchar("storage_key", { length: 512 }).notNull(),
    contentType: varchar("content_type", { length: 128 }).notNull(),
    fileExtension: varchar("file_extension", { length: 32 }).notNull(),
    fileSize: bigint("file_size", { mode: "number" }).notNull(),
    originalFileSize: bigint("original_file_size", { mode: "number" }),
    checksum: varchar("checksum", { length: 128 }),
    optimizationStatus: varchar("optimization_status", { length: 50 })
      .notNull()
      .default("unchanged"), // optimized | unchanged | skipped | failed
    isActive: boolean("is_active").notNull().default(true),
    createdBy: uuid("created_by").references(() => users.id),
    updatedBy: uuid("updated_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("content_key_idx").on(table.key),
    index("content_category_idx").on(table.categoryId),
    index("content_active_idx").on(table.isActive),
  ]
);

// -------------------------------------------------------------
// Audit Logs Table
// -------------------------------------------------------------
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: uuid("actor_id").references(() => users.id),
    actorEmail: varchar("actor_email", { length: 255 }),
    action: varchar("action", { length: 100 }).notNull(), // CONTENT_CREATE, CONTENT_REPLACE, etc.
    entity: varchar("entity", { length: 50 }).notNull(), // content, category, auth
    entityId: varchar("entity_id", { length: 255 }),
    metadata: jsonb("metadata"),
    ipAddress: varchar("ip_address", { length: 64 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("audit_log_entity_idx").on(table.entity, table.entityId),
    index("audit_log_created_at_idx").on(table.createdAt),
  ]
);

// -------------------------------------------------------------
// Relations
// -------------------------------------------------------------
export const usersRelations = relations(users, ({ many }) => ({
  createdContents: many(contents, { relationName: "createdContents" }),
  updatedContents: many(contents, { relationName: "updatedContents" }),
  auditLogs: many(auditLogs),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  contents: many(contents),
}));

export const contentsRelations = relations(contents, ({ one }) => ({
  category: one(categories, {
    fields: [contents.categoryId],
    references: [categories.id],
  }),
  author: one(users, {
    fields: [contents.createdBy],
    references: [users.id],
    relationName: "createdContents",
  }),
  editor: one(users, {
    fields: [contents.updatedBy],
    references: [users.id],
    relationName: "updatedContents",
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  actor: one(users, {
    fields: [auditLogs.actorId],
    references: [users.id],
  }),
}));

// Export Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Content = typeof contents.$inferSelect;
export type NewContent = typeof contents.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
