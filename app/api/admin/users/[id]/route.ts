import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireSuperAdmin } from "@/lib/auth/rbac";
import { updateUserSchema } from "@/lib/validations";
import { hashPassword } from "@/lib/auth/password";
import { recordAuditLog } from "@/lib/audit";
import { eq } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    await requireSuperAdmin();
    const { id } = await params;
    const db = getDb();

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    if (error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Get user error:", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const admin = await requireSuperAdmin();
    const { id } = await params;
    const body = await request.json();
    const parsed = updateUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const db = getDb();

    const [targetUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Safeguard: Do not allow a superadmin to demote their own account
    if (admin.userId === id && parsed.data.role && parsed.data.role !== "superadmin") {
      return NextResponse.json(
        { error: "Cannot demote your own superadmin account." },
        { status: 400 }
      );
    }

    let passwordHash: string | undefined;
    if (parsed.data.password) {
      passwordHash = await hashPassword(parsed.data.password);
    }

    const [updated] = await db
      .update(users)
      .set({
        ...(parsed.data.role && { role: parsed.data.role }),
        ...(passwordHash && { passwordHash }),
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        email: users.email,
        role: users.role,
        updatedAt: users.updatedAt,
      });

    await recordAuditLog({
      actorId: admin.userId,
      actorEmail: admin.email,
      action: "USER_UPDATE",
      entity: "user",
      entityId: updated.id,
      metadata: {
        email: updated.email,
        roleChanged: parsed.data.role ? { from: targetUser.role, to: updated.role } : null,
        passwordReset: !!passwordHash,
      },
    });

    return NextResponse.json({ user: updated });
  } catch (error: any) {
    if (error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Update user error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const admin = await requireSuperAdmin();
    const { id } = await params;

    // Safeguard: Cannot delete self
    if (admin.userId === id) {
      return NextResponse.json(
        { error: "You cannot delete your own account." },
        { status: 400 }
      );
    }

    const db = getDb();

    const [targetUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await db.delete(users).where(eq(users.id, id));

    await recordAuditLog({
      actorId: admin.userId,
      actorEmail: admin.email,
      action: "USER_DELETE",
      entity: "user",
      entityId: id,
      metadata: { email: targetUser.email, role: targetUser.role },
    });

    return NextResponse.json({ success: true, message: `User "${targetUser.email}" deleted successfully` });
  } catch (error: any) {
    if (error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Delete user error:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
