import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { categories, contents } from "@/lib/db/schema";
import { requireAdminSession } from "@/lib/auth/session";
import { requireUserWithPermission } from "@/lib/auth/rbac";
import { updateCategorySchema } from "@/lib/validations";
import { recordAuditLog } from "@/lib/audit";
import { eq, and, ne, count } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    await requireAdminSession();
    const { id } = await params;
    const db = getDb();

    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const [contentCount] = await db
      .select({ total: count(contents.id) })
      .from(contents)
      .where(eq(contents.categoryId, id));

    return NextResponse.json({
      category: {
        ...category,
        contentsCount: contentCount?.total || 0,
      },
    });
  } catch (error: any) {
    if (error.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Get category error:", error);
    return NextResponse.json({ error: "Failed to fetch category" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const admin = await requireUserWithPermission("categories:write");
    const { id } = await params;
    const body = await request.json();
    const parsed = updateCategorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const db = getDb();

    const [existing] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // If slug is being updated, verify it doesn't conflict with another category
    if (parsed.data.slug && parsed.data.slug !== existing.slug) {
      const [slugConflict] = await db
        .select()
        .from(categories)
        .where(and(eq(categories.slug, parsed.data.slug), ne(categories.id, id)))
        .limit(1);

      if (slugConflict) {
        return NextResponse.json(
          { error: `Slug "${parsed.data.slug}" is already taken by another category.` },
          { status: 409 }
        );
      }
    }

    const [updated] = await db
      .update(categories)
      .set({
        ...(parsed.data.name && { name: parsed.data.name }),
        ...(parsed.data.slug && { slug: parsed.data.slug }),
        ...(parsed.data.description !== undefined && { description: parsed.data.description }),
        updatedAt: new Date(),
      })
      .where(eq(categories.id, id))
      .returning();

    await recordAuditLog({
      actorId: admin.userId,
      actorEmail: admin.email,
      action: "CATEGORY_UPDATE",
      entity: "category",
      entityId: updated.id,
      metadata: { previous: existing, updated },
    });

    return NextResponse.json({ category: updated });
  } catch (error: any) {
    if (error.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Update category error:", error);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const admin = await requireUserWithPermission("categories:delete");
    const { id } = await params;
    const db = getDb();

    const [existing] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Check if category still contains contents
    const [contentCount] = await db
      .select({ total: count(contents.id) })
      .from(contents)
      .where(eq(contents.categoryId, id));

    if (contentCount && contentCount.total > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete category "${existing.name}". It contains ${contentCount.total} content item(s). Reassign or delete those contents first.`,
        },
        { status: 400 }
      );
    }

    await db.delete(categories).where(eq(categories.id, id));

    await recordAuditLog({
      actorId: admin.userId,
      actorEmail: admin.email,
      action: "CATEGORY_DELETE",
      entity: "category",
      entityId: id,
      metadata: { name: existing.name, slug: existing.slug },
    });

    return NextResponse.json({ success: true, message: "Category deleted successfully" });
  } catch (error: any) {
    if (error.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Delete category error:", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
