import fastify, { FastifyInstance } from "fastify";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import cors from "@fastify/cors";
import { registerRoutes } from "./routes/index";
import { AppConfig } from "./config";
import metricsPlugin from 'fastify-metrics'

type ServerOptions = {
  config: AppConfig;
};

export const buildServer = async ({ config }: ServerOptions): Promise<FastifyInstance> => {
  const server = fastify({
    logger: {
      level: config.logLevel
    },
    bodyLimit: config.bodyLimitBytes
  });

  await server.register(cors, {
    origin: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["content-type"],
    maxAge: 600
  });

  await server.register(swagger, {
    openapi: {
      info: {
        title: "TLSCheck API",
        version: config.appVersion,
        description: `Fetch TLS certificate details for a host.

## Rate Limiting
- Default: 30 requests per 60 seconds per IP address
- Returns 429 status when exceeded
- Headers: \`Retry-After\`, \`X-RateLimit-Limit\`, \`X-RateLimit-Remaining\`, \`X-RateLimit-Reset\`

## Caching
- Results are cached in-memory for 30 minutes (configurable via \`CACHE_TTL_MS\`)
- Cache key includes revocation check flag

## CORS
- Enabled for all origins with GET, POST, OPTIONS methods

## Revocation Checks
- Can be enabled per-request via \`revocationCheck: true\`
- Checks OCSP first, falls back to CRL if needed
- Configurable via \`REVOCATION_MODE\` (ocsp, crl, or off)`
      }
    }
  });

  registerRoutes(server, {
    appVersion: config.appVersion,
    rateLimitMax: config.rateLimitMax,
    rateLimitWindowMs: config.rateLimitWindowMs,
    requestTimeoutMs: config.requestTimeoutMs,
    revocationMode: config.revocationMode,
    cacheTtlMs: config.cacheTtlMs
  });

  await server.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list"
    },
    transformSpecification: (swaggerObject) => swaggerObject,
    transformSpecificationClone: true
  });

  if (config.metricsEnabled) {
    await server.register(metricsPlugin, {
      endpoint: "/metrics",
      defaultMetrics: { enabled: true },
      routeMetrics: {
        enabled: true
      }
    });
  }

  return server;
};
