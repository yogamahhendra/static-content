import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { contents, categories, users } from "@/lib/db/schema";
import { requireAdminSession } from "@/lib/auth/session";
import { requireUserWithPermission } from "@/lib/auth/rbac";
import { updateContentMetadataSchema } from "@/lib/validations";
import { deleteFromStorage } from "@/lib/storage/s3";
import { recordAuditLog } from "@/lib/audit";
import { eq } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    await requireAdminSession();
    const { id } = await params;
    const db = getDb();

    const [content] = await db
      .select({
        id: contents.id,
        key: contents.key,
        title: contents.title,
        description: contents.description,
        storageKey: contents.storageKey,
        contentType: contents.contentType,
        fileExtension: contents.fileExtension,
        fileSize: contents.fileSize,
        originalFileSize: contents.originalFileSize,
        checksum: contents.checksum,
        optimizationStatus: contents.optimizationStatus,
        isActive: contents.isActive,
        createdAt: contents.createdAt,
        updatedAt: contents.updatedAt,
        category: {
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
        },
      })
      .from(contents)
      .innerJoin(categories, eq(contents.categoryId, categories.id))
      .where(eq(contents.id, id))
      .limit(1);

    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    return NextResponse.json({ content });
  } catch (error: any) {
    if (error.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Get content error:", error);
    return NextResponse.json({ error: "Failed to fetch content" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const admin = await requireUserWithPermission("contents:write");
    const { id } = await params;
    const body = await request.json();
    const parsed = updateContentMetadataSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const db = getDb();

    const [existing] = await db
      .select()
      .from(contents)
      .where(eq(contents.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    // Verify category if categoryId is being changed
    if (parsed.data.categoryId && parsed.data.categoryId !== existing.categoryId) {
      const [category] = await db
        .select()
        .from(categories)
        .where(eq(categories.id, parsed.data.categoryId))
        .limit(1);

      if (!category) {
        return NextResponse.json({ error: "Specified category does not exist." }, { status: 404 });
      }
    }

    const [updated] = await db
      .update(contents)
      .set({
        ...(parsed.data.title && { title: parsed.data.title }),
        ...(parsed.data.description !== undefined && { description: parsed.data.description }),
        ...(parsed.data.categoryId && { categoryId: parsed.data.categoryId }),
        ...(parsed.data.isActive !== undefined && { isActive: parsed.data.isActive }),
        updatedBy: admin.userId,
        updatedAt: new Date(),
      })
      .where(eq(contents.id, id))
      .returning();

    await recordAuditLog({
      actorId: admin.userId,
      actorEmail: admin.email,
      action: "CONTENT_UPDATE_METADATA",
      entity: "content",
      entityId: updated.id,
      metadata: { previous: existing, updated },
    });

    return NextResponse.json({ content: updated });
  } catch (error: any) {
    if (error.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Update content error:", error);
    return NextResponse.json({ error: "Failed to update content" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const admin = await requireUserWithPermission("contents:delete");
    const { id } = await params;
    const db = getDb();

    const [existing] = await db
      .select()
      .from(contents)
      .where(eq(contents.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    // Delete record from database
    await db.delete(contents).where(eq(contents.id, id));

    // Remove file from object storage
    await deleteFromStorage(existing.storageKey);

    await recordAuditLog({
      actorId: admin.userId,
      actorEmail: admin.email,
      action: "CONTENT_DELETE",
      entity: "content",
      entityId: id,
      metadata: { key: existing.key, title: existing.title, storageKey: existing.storageKey },
    });

    return NextResponse.json({ success: true, message: "Content and storage object deleted successfully" });
  } catch (error: any) {
    if (error.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Delete content error:", error);
    return NextResponse.json({ error: "Failed to delete content" }, { status: 500 });
  }
}
