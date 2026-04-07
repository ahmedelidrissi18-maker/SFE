import type { UserRole } from "@/types";

export const DEFAULT_LOGIN_REDIRECT = "/dashboard";

export const publicRoutes = ["/", "/login", "/acces-refuse"];
export const authRoutes = ["/login"];

const protectedRouteRules: Array<{ prefix: string; roles: UserRole[] }> = [
  { prefix: "/dashboard", roles: ["ADMIN", "RH", "ENCADRANT", "STAGIAIRE"] },
  { prefix: "/stagiaires", roles: ["ADMIN", "RH"] },
  { prefix: "/stages", roles: ["ADMIN", "RH", "ENCADRANT"] },
];

export function isPublicRoute(pathname: string) {
  return publicRoutes.includes(pathname);
}

export function isAuthRoute(pathname: string) {
  return authRoutes.includes(pathname);
}

export function canAccessPath(pathname: string, role?: UserRole | null) {
  if (!role) {
    return false;
  }

  const matchingRule = protectedRouteRules.find(
    (rule) => pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`),
  );

  if (!matchingRule) {
    return true;
  }

  return matchingRule.roles.includes(role);
}

export function hasRole(role: UserRole | null | undefined, allowedRoles: UserRole[]) {
  return role ? allowedRoles.includes(role) : false;
}
