import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { categories, contents } from "@/lib/db/schema";
import { requireAdminSession } from "@/lib/auth/session";
import { requireUserWithPermission } from "@/lib/auth/rbac";
import { createCategorySchema } from "@/lib/validations";
import { recordAuditLog } from "@/lib/audit";
import { eq, ilike, or, sql, count } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    await requireAdminSession();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";

    const db = getDb();

    let query = db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        createdAt: categories.createdAt,
        updatedAt: categories.updatedAt,
        contentsCount: count(contents.id),
      })
      .from(categories)
      .leftJoin(contents, eq(categories.id, contents.categoryId))
      .groupBy(categories.id);

    let whereClause = undefined;
    if (search) {
      whereClause = or(
        ilike(categories.name, `%${search}%`),
        ilike(categories.slug, `%${search}%`)
      );
    }

    const items = whereClause ? await query.where(whereClause) : await query;

    return NextResponse.json({ categories: items });
  } catch (error: any) {
    if (error.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("List categories error:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireUserWithPermission("categories:write");
    const body = await request.json();
    const parsed = createCategorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, slug, description } = parsed.data;
    const db = getDb();

    // Check slug uniqueness
    const [existing] = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: `Category slug "${slug}" already exists. Slugs must be globally unique.` },
        { status: 409 }
      );
    }

    const [newCat] = await db
      .insert(categories)
      .values({
        name,
        slug,
        description: description || null,
      })
      .returning();

    await recordAuditLog({
      actorId: admin.userId,
      actorEmail: admin.email,
      action: "CATEGORY_CREATE",
      entity: "category",
      entityId: newCat.id,
      metadata: { name: newCat.name, slug: newCat.slug },
    });

    return NextResponse.json({ category: newCat }, { status: 201 });
  } catch (error: any) {
    if (error.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Create category error:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
