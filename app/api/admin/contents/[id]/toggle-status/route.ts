import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { contents } from "@/lib/db/schema";
import { requireUserWithPermission } from "@/lib/auth/rbac";
import { recordAuditLog } from "@/lib/audit";
import { eq } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const admin = await requireUserWithPermission("contents:write");
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

    const newStatus = !existing.isActive;

    const [updated] = await db
      .update(contents)
      .set({
        isActive: newStatus,
        updatedBy: admin.userId,
        updatedAt: new Date(),
      })
      .where(eq(contents.id, id))
      .returning();

    await recordAuditLog({
      actorId: admin.userId,
      actorEmail: admin.email,
      action: "CONTENT_TOGGLE_STATUS",
      entity: "content",
      entityId: updated.id,
      metadata: { key: updated.key, previousStatus: existing.isActive, newStatus },
    });

    return NextResponse.json({
      success: true,
      content: updated,
      message: `Content "${updated.title}" is now ${newStatus ? "active" : "inactive"}`,
    });
  } catch (error: any) {
    if (error.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Toggle status error:", error);
    return NextResponse.json({ error: "Failed to toggle content status" }, { status: 500 });
  }
}
