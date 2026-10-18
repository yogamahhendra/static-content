import { NextResponse } from "next/server";
import { getCurrentUser, clearSessionCookie } from "@/lib/auth/session";
import { recordAuditLog } from "@/lib/audit";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (user) {
      await recordAuditLog({
        actorId: user.userId,
        actorEmail: user.email,
        action: "ADMIN_LOGOUT",
        entity: "auth",
        entityId: user.userId,
      });
    }

    await clearSessionCookie();
    return NextResponse.json({ success: true, message: "Logged out successfully" });
  } catch (error: any) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Failed to log out" }, { status: 500 });
  }
}
