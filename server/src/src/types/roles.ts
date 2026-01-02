export type Role = "admin" | "manager" | "user";

export const ELEVATED_ROLES: Role[] = ["admin", "manager"];

export function isKnownRole(value: unknown): value is Role {
  return value === "admin" || value === "manager" || value === "user";
}

export function isElevatedRole(value: string | null | undefined): boolean {
  if (!value) return false;
  return ELEVATED_ROLES.includes(value as Role);
}
