import { z } from "zod";

const envSchema = z.object({
  APP_VERSION: z.string().optional().default("dev"),
  PORT: z.coerce.number().int().positive().optional().default(3000),
  HOST: z.string().optional().default("::"),
  LOG_LEVEL: z.string().optional().default("info"),
  REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().optional().default(8000),
  RATE_LIMIT_WINDOW_MS: z
    .coerce
    .number()
    .int()
    .positive()
    .optional()
    .default(60000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().optional().default(30),
  MAX_BODY_BYTES: z.coerce.number().int().positive().optional().default(4096),
  REVOCATION_MODE: z.enum(["ocsp", "crl", "off"]).optional().default("ocsp"),
  CACHE_TTL_MS: z.coerce.number().int().positive().optional().default(1800000),
  METRICS_ENABLED: z.coerce.boolean().optional().default(false),
});

export type AppConfig = {
  appVersion: string;
  port: number;
  host: string;
  logLevel: string;
  requestTimeoutMs: number;
  rateLimitWindowMs: number;
  rateLimitMax: number;
  bodyLimitBytes: number;
  revocationMode: "ocsp" | "crl" | "off";
  cacheTtlMs: number;
  metricsEnabled: boolean;
};

export const getConfig = (): AppConfig => {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues || [];
    const payload = JSON.stringify({ level: "warn", msg: "Invalid environment configuration", issues });
    console.warn(payload);
    throw new Error("Invalid environment configuration");
  }

  return {
    appVersion: parsed.data.APP_VERSION,
    port: parsed.data.PORT,
    host: parsed.data.HOST,
    logLevel: parsed.data.LOG_LEVEL,
    requestTimeoutMs: parsed.data.REQUEST_TIMEOUT_MS,
    rateLimitWindowMs: parsed.data.RATE_LIMIT_WINDOW_MS,
    rateLimitMax: parsed.data.RATE_LIMIT_MAX,
    bodyLimitBytes: parsed.data.MAX_BODY_BYTES,
    revocationMode: parsed.data.REVOCATION_MODE,
    cacheTtlMs: parsed.data.CACHE_TTL_MS,
    metricsEnabled: parsed.data.METRICS_ENABLED,
  };
};
