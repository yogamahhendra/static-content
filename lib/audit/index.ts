import { getDb } from "@/lib/db";
import { auditLogs, type NewAuditLog } from "@/lib/db/schema";

export type AuditAction =
  | "ADMIN_LOGIN"
  | "ADMIN_LOGOUT"
  | "USER_CREATE"
  | "USER_UPDATE"
  | "USER_DELETE"
  | "CATEGORY_CREATE"
  | "CATEGORY_UPDATE"
  | "CATEGORY_DELETE"
  | "CONTENT_CREATE"
  | "CONTENT_UPDATE_METADATA"
  | "CONTENT_REPLACE_FILE"
  | "CONTENT_TOGGLE_STATUS"
  | "CONTENT_DELETE";

export interface LogAuditParams {
  actorId?: string | null;
  actorEmail?: string | null;
  action: AuditAction;
  entity: "category" | "content" | "auth" | "user" | "system";
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
}

export async function recordAuditLog(params: LogAuditParams): Promise<void> {
  // Check if audit logging is disabled via environment variable
  if (process.env.ENABLE_AUDIT_LOGS === "false") {
    return;
  }

  try {
    const db = getDb();
    const newEntry: NewAuditLog = {
      actorId: params.actorId || null,
      actorEmail: params.actorEmail || null,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId || null,
      metadata: params.metadata || null,
      ipAddress: params.ipAddress || null,
    };

    await db.insert(auditLogs).values(newEntry);
  } catch (error) {
    // Audit logging should not crash the primary operational request
    console.error("⚠️ Failed to write audit log:", error);
  }
}
