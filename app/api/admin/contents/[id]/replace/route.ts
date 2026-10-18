import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { contents } from "@/lib/db/schema";
import { requireUserWithPermission } from "@/lib/auth/rbac";
import { optimizeFile } from "@/lib/storage/optimizer";
import { uploadToStorage, deleteFromStorage } from "@/lib/storage/s3";
import { recordAuditLog } from "@/lib/audit";
import { eq } from "drizzle-orm";

const MAX_UPLOAD_SIZE = (Number(process.env.MAX_UPLOAD_SIZE_MB) || 10) * 1024 * 1024;

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const admin = await requireUserWithPermission("contents:write");
    const { id } = await params;
    const formData = await request.formData();

    const file = formData.get("file") as File | null;
    const skipOptimization = formData.get("skipOptimization") === "true";
    const convertToWebp = formData.get("convertToWebp") !== "false";

    if (!file) {
      return NextResponse.json({ error: "Replacement file is required." }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds the limit of ${MAX_UPLOAD_SIZE / (1024 * 1024)} MB.` },
        { status: 400 }
      );
    }

    const db = getDb();

    // 1. Retrieve existing content record
    const [existing] = await db
      .select()
      .from(contents)
      .where(eq(contents.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Content not found." }, { status: 404 });
    }

    // 2. Process and optimize replacement file
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

    // 3. Upload new object to storage with a new version key
    const newStorageKey = `contents/${existing.key}/${Date.now()}.${optimizationResult.fileExtension}`;

    try {
      await uploadToStorage({
        storageKey: newStorageKey,
        buffer: optimizationResult.buffer,
        contentType: optimizationResult.contentType,
      });
    } catch (storageError: any) {
      console.error("Replacement upload failed:", storageError);
      return NextResponse.json(
        { error: "Failed to upload replacement file to object storage.", details: storageError.message },
        { status: 502 }
      );
    }

    // 4. Update database metadata atomically
    let updated;
    try {
      [updated] = await db
        .update(contents)
        .set({
          storageKey: newStorageKey,
          contentType: optimizationResult.contentType,
          fileExtension: optimizationResult.fileExtension,
          fileSize: optimizationResult.finalSize,
          originalFileSize: optimizationResult.originalSize,
          checksum: optimizationResult.checksum,
          optimizationStatus: optimizationResult.status,
          updatedBy: admin.userId,
          updatedAt: new Date(),
        })
        .where(eq(contents.id, id))
        .returning();
    } catch (dbError) {
      // If DB update fails, clean up the newly uploaded object to prevent dangling files
      await deleteFromStorage(newStorageKey);
      throw dbError;
    }

    // 5. Clean up the old storage object immediately after database update succeeds
    let oldFileDeleted = false;
    if (existing.storageKey && existing.storageKey !== newStorageKey) {
      oldFileDeleted = await deleteFromStorage(existing.storageKey);
      if (oldFileDeleted) {
        console.log(`[S3 Storage] ✅ Old file purged from storage: ${existing.storageKey}`);
      } else {
        console.warn(`[S3 Storage] ⚠️ Could not remove old file: ${existing.storageKey}`);
      }
    }

    // 6. Record Audit Log
    await recordAuditLog({
      actorId: admin.userId,
      actorEmail: admin.email,
      action: "CONTENT_REPLACE_FILE",
      entity: "content",
      entityId: updated.id,
      metadata: {
        key: updated.key,
        previousStorageKey: existing.storageKey,
        newStorageKey,
        oldFilePurged: oldFileDeleted,
        previousSize: existing.fileSize,
        originalSize: optimizationResult.originalSize,
        finalSize: optimizationResult.finalSize,
        spaceSaved: optimizationResult.spaceSaved,
        percentReduction: optimizationResult.percentReduction,
        optimizationStatus: optimizationResult.status,
      },
    });

    return NextResponse.json({
      success: true,
      content: updated,
      oldFileDeleted,
      optimization: {
        originalSize: optimizationResult.originalSize,
        finalSize: optimizationResult.finalSize,
        spaceSaved: optimizationResult.spaceSaved,
        percentReduction: optimizationResult.percentReduction,
        status: optimizationResult.status,
      },
    });
  } catch (error: any) {
    if (error.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Replace file error:", error);
    return NextResponse.json({ error: error.message || "Failed to replace file" }, { status: 500 });
  }
}
