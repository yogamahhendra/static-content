import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { contents, categories } from "@/lib/db/schema";
import { requireAdminSession } from "@/lib/auth/session";
import { count, eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    await requireAdminSession();
    const db = getDb();

    // 1. Total categories
    const [totalCategories] = await db.select({ total: count(categories.id) }).from(categories);

    // 2. Total contents
    const [totalContents] = await db.select({ total: count(contents.id) }).from(contents);

    // 3. Active contents
    const [activeContents] = await db
      .select({ total: count(contents.id) })
      .from(contents)
      .where(eq(contents.isActive, true));

    // 4. Inactive contents
    const [inactiveContents] = await db
      .select({ total: count(contents.id) })
      .from(contents)
      .where(eq(contents.isActive, false));

    // 5. Recent updates
    const recentContents = await db
      .select({
        id: contents.id,
        key: contents.key,
        title: contents.title,
        fileExtension: contents.fileExtension,
        contentType: contents.contentType,
        fileSize: contents.fileSize,
        isActive: contents.isActive,
        updatedAt: contents.updatedAt,
        categoryName: categories.name,
      })
      .from(contents)
      .innerJoin(categories, eq(contents.categoryId, categories.id))
      .orderBy(desc(contents.updatedAt))
      .limit(6);

    return NextResponse.json({
      metrics: {
        totalCategories: totalCategories?.total || 0,
        totalContents: totalContents?.total || 0,
        activeContents: activeContents?.total || 0,
        inactiveContents: inactiveContents?.total || 0,
      },
      recentContents,
    });
  } catch (error: any) {
    if (error.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Overview error:", error);
    return NextResponse.json({ error: "Failed to load dashboard overview" }, { status: 500 });
  }
}
