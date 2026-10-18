import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { contents, categories } from "@/lib/db/schema";
import { requireAdminSession } from "@/lib/auth/session";
import { requireUserWithPermission } from "@/lib/auth/rbac";
import { createContentSchema } from "@/lib/validations";
import { optimizeFile } from "@/lib/storage/optimizer";
import { uploadToStorage, deleteFromStorage } from "@/lib/storage/s3";
import { recordAuditLog } from "@/lib/audit";
import { eq, ilike, or, and, desc } from "drizzle-orm";

const MAX_UPLOAD_SIZE = (Number(process.env.MAX_UPLOAD_SIZE_MB) || 10) * 1024 * 1024;

export async function GET(request: Request) {
  try {
    await requireAdminSession();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const categoryId = searchParams.get("categoryId")?.trim();
    const status = searchParams.get("status")?.trim(); // 'active' | 'inactive' | undefined

    const db = getDb();

    let query = db
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
      .orderBy(desc(contents.createdAt));

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(contents.title, `%${search}%`),
          ilike(contents.key, `%${search}%`)
        )
      );
    }

    if (categoryId) {
      conditions.push(eq(contents.categoryId, categoryId));
    }

    if (status === "active") {
      conditions.push(eq(contents.isActive, true));
    } else if (status === "inactive") {
      conditions.push(eq(contents.isActive, false));
    }

    const items = conditions.length > 0
      ? await query.where(and(...conditions))
      : await query;

    return NextResponse.json({ contents: items });
  } catch (error: any) {
    if (error.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("List contents error:", error);
    return NextResponse.json({ error: "Failed to fetch contents" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireUserWithPermission("contents:write");
    const formData = await request.formData();

    const title = formData.get("title") as string;
    const key = formData.get("key") as string;
    const categoryId = formData.get("categoryId") as string;
    const description = (formData.get("description") as string) || null;
    const isActive = formData.get("isActive") !== "false";
    const skipOptimization = formData.get("skipOptimization") === "true";
    const convertToWebp = formData.get("convertToWebp") !== "false";
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "A file is required for initial content creation." }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds the limit of ${MAX_UPLOAD_SIZE / (1024 * 1024)} MB.` },
        { status: 400 }
      );
    }

    const parsed = createContentSchema.safeParse({
      title,
      key,
      categoryId,
      description,
      isActive,
      skipOptimization,
      convertToWebp,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const db = getDb();

    // 1. Check content key uniqueness
    const [existing] = await db
      .select()
      .from(contents)
      .where(eq(contents.key, parsed.data.key))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: `Content key "${parsed.data.key}" is already in use. Keys must be globally unique.` },
        { status: 409 }
      );
    }

    // 2. Check category exists
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, parsed.data.categoryId))
      .limit(1);

    if (!category) {
      return NextResponse.json({ error: "Selected category does not exist." }, { status: 404 });
    }

    // 3. Process and optimize the file
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const optimizationResult = await optimizeFile(
      fileBuffer,
      file.name,
      file.type,
      {
        skipOptimization,
        convertToWebp,
      }
    );

    // 4. Upload to Object Storage
    const storageKey = `contents/${parsed.data.key}/${Date.now()}.${optimizationResult.fileExtension}`;

    try {
      await uploadToStorage({
        storageKey,
        buffer: optimizationResult.buffer,
        contentType: optimizationResult.contentType,
      });
    } catch (storageError: any) {
      console.error("Storage upload failure:", storageError);
      return NextResponse.json(
        { error: "Failed to upload file to object storage.", details: storageError.message },
        { status: 502 }
      );
    }

    // 5. Insert content record into database
    let newContent;
    try {
      [newContent] = await db
        .insert(contents)
        .values({
          title: parsed.data.title,
          key: parsed.data.key,
          categoryId: parsed.data.categoryId,
          description: parsed.data.description,
          storageKey,
          contentType: optimizationResult.contentType,
          fileExtension: optimizationResult.fileExtension,
          fileSize: optimizationResult.finalSize,
          originalFileSize: optimizationResult.originalSize,
          checksum: optimizationResult.checksum,
          optimizationStatus: optimizationResult.status,
          isActive: parsed.data.isActive,
          createdBy: admin.userId,
          updatedBy: admin.userId,
        })
        .returning();
    } catch (dbError) {
      // Rollback uploaded object if database insert fails
      await deleteFromStorage(storageKey);
      throw dbError;
    }

    // 6. Record Audit Log
    await recordAuditLog({
      actorId: admin.userId,
      actorEmail: admin.email,
      action: "CONTENT_CREATE",
      entity: "content",
      entityId: newContent.id,
      metadata: {
        key: newContent.key,
        originalSize: optimizationResult.originalSize,
        finalSize: optimizationResult.finalSize,
        spaceSaved: optimizationResult.spaceSaved,
        percentReduction: optimizationResult.percentReduction,
        optimizationStatus: optimizationResult.status,
      },
    });

    return NextResponse.json(
      {
        content: newContent,
        optimization: {
          originalSize: optimizationResult.originalSize,
          finalSize: optimizationResult.finalSize,
          spaceSaved: optimizationResult.spaceSaved,
          percentReduction: optimizationResult.percentReduction,
          status: optimizationResult.status,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Create content error:", error);
    return NextResponse.json({ error: error.message || "Failed to create content" }, { status: 500 });
  }
}
