import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { users, contents } from "@/lib/db/schema";
import { requireSuperAdmin } from "@/lib/auth/rbac";
import { createUserSchema } from "@/lib/validations";
import { hashPassword } from "@/lib/auth/password";
import { recordAuditLog } from "@/lib/audit";
import { eq, ilike, or, count, desc } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    await requireSuperAdmin();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const role = searchParams.get("role")?.trim() || "";

    const db = getDb();

    let query = db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        contentsCreated: count(contents.id),
      })
      .from(users)
      .leftJoin(contents, eq(users.id, contents.createdBy))
      .groupBy(users.id)
      .orderBy(desc(users.createdAt));

    const conditions = [];

    if (search) {
      conditions.push(ilike(users.email, `%${search}%`));
    }

    if (role) {
      conditions.push(eq(users.role, role));
    }

    const items = conditions.length > 0
      ? await query.where(or(...conditions))
      : await query;

    return NextResponse.json({ users: items });
  } catch (error: any) {
    if (error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("List users error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireSuperAdmin();
    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password, role } = parsed.data;
    const db = getDb();

    // Check email uniqueness
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: `User with email "${email}" already exists.` },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const [newUser] = await db
      .insert(users)
      .values({
        email: email.toLowerCase().trim(),
        passwordHash,
        role,
      })
      .returning({
        id: users.id,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      });

    await recordAuditLog({
      actorId: admin.userId,
      actorEmail: admin.email,
      action: "USER_CREATE",
      entity: "user",
      entityId: newUser.id,
      metadata: { email: newUser.email, role: newUser.role },
    });

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error: any) {
    if (error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Create user error:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
