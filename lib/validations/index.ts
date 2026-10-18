import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["superadmin", "admin", "editor", "viewer"]).default("admin"),
});

export const updateUserSchema = z.object({
  role: z.enum(["superadmin", "admin", "editor", "viewer"]).optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
});

export const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(255)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase alphanumeric with hyphens only (e.g. promo-banners)"
    ),
  description: z.string().max(1000).optional().nullable(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens only")
    .optional(),
  description: z.string().max(1000).optional().nullable(),
});

export const createContentSchema = z.object({
  categoryId: z.string().uuid("Invalid category ID"),
  key: z
    .string()
    .min(1, "Content key is required")
    .max(255)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Key must be lowercase alphanumeric with hyphens only (e.g. homepage-hero)"
    ),
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().max(1000).optional().nullable(),
  isActive: z.boolean().default(true),
  skipOptimization: z.boolean().optional().default(false),
  convertToWebp: z.boolean().optional().default(true),
});

export const updateContentMetadataSchema = z.object({
  categoryId: z.string().uuid("Invalid category ID").optional(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional().nullable(),
  isActive: z.boolean().optional(),
});
