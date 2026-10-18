import { SessionPayload, getCurrentUser } from "./session";

export type Role = "superadmin" | "admin" | "editor" | "viewer";

export type Permission =
  | "users:manage"
  | "categories:read"
  | "categories:write"
  | "categories:delete"
  | "contents:read"
  | "contents:write"
  | "contents:delete"
  | "audit_logs:read";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  superadmin: [
    "users:manage",
    "categories:read",
    "categories:write",
    "categories:delete",
    "contents:read",
    "contents:write",
    "contents:delete",
    "audit_logs:read",
  ],
  admin: [
    "categories:read",
    "categories:write",
    "categories:delete",
    "contents:read",
    "contents:write",
    "contents:delete",
    "audit_logs:read",
  ],
  editor: [
    "categories:read",
    "categories:write",
    "contents:read",
    "contents:write",
  ],
  viewer: [
    "categories:read",
    "contents:read",
  ],
};

export function hasPermission(role: string, permission: Permission): boolean {
  const allowed = ROLE_PERMISSIONS[role as Role];
  if (!allowed) return false;
  return allowed.includes(permission);
}

export function isSuperAdmin(role: string): boolean {
  return role === "superadmin";
}

export async function requireUserWithPermission(permission: Permission): Promise<SessionPayload> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized: Authentication required.");
  }

  if (!hasPermission(user.role, permission)) {
    throw new Error(`Forbidden: Insufficient privileges for action '${permission}'. Required role elevation.`);
  }

  return user;
}

export async function requireSuperAdmin(): Promise<SessionPayload> {
  return requireUserWithPermission("users:manage");
}
