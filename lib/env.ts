import path from "node:path";
import { z } from "zod";
import { assertPasswordStrength } from "@/lib/security/password-policy";

const booleanFlagSchema = z
  .enum(["true", "false"])
  .default("true")
  .transform((value) => value === "true");

const optionalStringSchema = z.string().trim().optional().default("");

const serverEnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z
      .string()
      .trim()
      .min(1)
      .default("postgresql://postgres:postgres@localhost:5432/gestion_stagiaires?schema=public"),
    NEXTAUTH_SECRET: optionalStringSchema,
    AUTH_SECRET: optionalStringSchema,
    NEXTAUTH_URL: z.string().trim().url().default("http://localhost:3000"),
    DEFAULT_USER_PASSWORD: z.string().trim().default("Password123!"),
    TWO_FACTOR_ISSUER: z.string().trim().default("Gestion des Stagiaires"),
    TWO_FACTOR_ENCRYPTION_SECRET: optionalStringSchema,
    REDIS_ENABLED: booleanFlagSchema,
    REDIS_URL: z.string().trim().url().default("redis://localhost:6379"),
    REDIS_CHANNEL_PREFIX: z.string().trim().min(1).default("gestion-stagiaires"),
    REDIS_CONNECT_TIMEOUT_MS: z.coerce.number().int().positive().default(2_000),
    DOCUMENT_STORAGE_DRIVER: z.enum(["local"]).default("local"),
    DOCUMENT_STORAGE_LOCAL_ROOT: z
      .string()
      .trim()
      .default(path.join(process.cwd(), "storage", "documents")),
    HEALTHCHECK_QUEUE_WARNING_THRESHOLD: z.coerce.number().int().min(0).default(20),
    HEALTHCHECK_QUEUE_CRITICAL_THRESHOLD: z.coerce.number().int().min(0).default(100),
    GITHUB_TOKEN: optionalStringSchema,
    GITHUB_API_BASE_URL: z.string().trim().url().default("https://api.github.com"),
    GITHUB_CLIENT_ID: optionalStringSchema,
    GITHUB_CLIENT_SECRET: optionalStringSchema,
    AUTH_GOOGLE_CLIENT_ID: optionalStringSchema,
    AUTH_GOOGLE_CLIENT_SECRET: optionalStringSchema,
    AUTH_GITHUB_CLIENT_ID: optionalStringSchema,
    AUTH_GITHUB_CLIENT_SECRET: optionalStringSchema,
    NOTIFICATIONS_PROCESSOR_SECRET: optionalStringSchema,
  })
  .superRefine((env, context) => {
    const resolvedAuthSecret = env.NEXTAUTH_SECRET || env.AUTH_SECRET;

    if (env.NODE_ENV === "production" && !resolvedAuthSecret) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["NEXTAUTH_SECRET"],
        message: "NEXTAUTH_SECRET ou AUTH_SECRET est requis en production.",
      });
    }

    for (const [idKey, secretKey, label] of [
      ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET", "GitHub OAuth"],
      ["AUTH_GOOGLE_CLIENT_ID", "AUTH_GOOGLE_CLIENT_SECRET", "Google OAuth"],
      ["AUTH_GITHUB_CLIENT_ID", "AUTH_GITHUB_CLIENT_SECRET", "Connexion GitHub OAuth"],
    ] as const) {
      const hasId = Boolean(env[idKey]);
      const hasSecret = Boolean(env[secretKey]);

      if (hasId !== hasSecret) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [idKey],
          message: `${label} doit definir ${idKey} et ${secretKey} ensemble.`,
        });
      }
    }
  });

export type AppEnv = z.infer<typeof serverEnvSchema>;

declare global {
  var __sfeAppEnv__: AppEnv | undefined;
}

function parseAppEnv() {
  const rawEnv = {
    ...process.env,
    REDIS_ENABLED:
      process.env.REDIS_ENABLED ??
      (process.env.NODE_ENV === "production" ? "true" : "false"),
  };
  const parsedEnv = serverEnvSchema.parse(rawEnv);

  assertPasswordStrength(parsedEnv.DEFAULT_USER_PASSWORD, "DEFAULT_USER_PASSWORD");

  return parsedEnv;
}

export function getAppEnv() {
  if (process.env.NODE_ENV === "test") {
    return parseAppEnv();
  }

  if (!globalThis.__sfeAppEnv__) {
    globalThis.__sfeAppEnv__ = parseAppEnv();
  }

  return globalThis.__sfeAppEnv__;
}

export function assertAppEnv() {
  return getAppEnv();
}

export function getResolvedAuthSecret() {
  const env = getAppEnv();
  return env.NEXTAUTH_SECRET || env.AUTH_SECRET || "";
}
