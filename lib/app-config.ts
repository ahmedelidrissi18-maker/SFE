import { assertPasswordStrength } from "@/lib/security/password-policy";

const resolvedDefaultUserPassword = process.env.DEFAULT_USER_PASSWORD?.trim() || "Password123!";

assertPasswordStrength(resolvedDefaultUserPassword, "DEFAULT_USER_PASSWORD");

export const DEFAULT_USER_PASSWORD = resolvedDefaultUserPassword;
