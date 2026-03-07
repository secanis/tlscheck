import { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { normalizeTarget } from "../services/normalize-target";
import { fetchCertificate } from "../services/fetch-certificate";
import { mapCertificate } from "../services/map-certificate";
import { rateLimiter } from "../services/rate-limiter";
import { checkRevocation } from "../services/revocation";
import { ApiCache } from "../services/cache";
import { tlsCheckTotal, tlsCheckDurationSeconds, revocationCheckTotal, httpResponseStatusTotal } from "../services/metrics";


type CertificateResult = ReturnType<typeof mapCertificate>;

const bodySchema = z
  .object({
    domain: z.string().optional(),
    host: z.string().optional(),
    revocationCheck: z.boolean().optional()
  })
  .refine((value) => Boolean(value.domain || value.host), {
    message: "domain or host is required"
  });

type CheckRouteOptions = {
  rateLimitWindowMs: number;
  rateLimitMax: number;
  requestTimeoutMs: number;
  revocationMode: "ocsp" | "crl" | "off";
  cacheTtlMs: number;
};

const certificateCache = new ApiCache<CertificateResult>();

export const checkRoute = (server: FastifyInstance, options: CheckRouteOptions) => {
  certificateCache.setTtl(options.cacheTtlMs);

  const limiter = rateLimiter({
    windowMs: options.rateLimitWindowMs,
    max: options.rateLimitMax
  });

  server.post(
    "/api/check",
    {
      schema: {
        description: "Check TLS certificate for a domain. Results are cached for 30 minutes by default.",
        tags: ["ssl"],
        summary: "Check TLS Certificate",
        body: {
          type: "object",
          properties: {
            domain: { type: "string", examples: ["example.com"], description: "Domain to check (e.g., example.com)" },
            host: { type: "string", examples: ["example.com"], description: "Alternative to domain" },
            revocationCheck: { type: "boolean", description: "Enable revocation check (OCSP/CRL). Default: false" }
          },
          additionalProperties: false,
          required: ["domain"]
        },
        querystring: {
          type: "object",
          properties: {
            revocationCheck: { type: "string", enum: ["true", "false"], description: "Query param alternative to body" }
          }
        },
        response: {
          200: {
            type: "object",
            description: "Certificate details",
            properties: {
              host: { type: "string", description: "Checked hostname" },
              port: { type: "number", description: "Connection port (443)" },
              valid: { type: "boolean", description: "Whether certificate is valid" },
              authorizationError: { type: "string", description: "Error message if invalid" },
              protocol: { type: "string", description: "TLS protocol version (e.g., TLSv1.3)" },
              cipher: { type: "object", description: "Cipher suite details" },
              cipherName: { type: "string", description: "Cipher name" },
              cipherVersion: { type: "string", description: "Cipher version" },
              cipherStandardName: { type: "string", description: "Standard cipher name" },
              subject: { type: "object", description: "Certificate subject details" },
              issuer: { type: "object", description: "Certificate issuer details" },
              subjectName: { type: "string", description: "Certificate subject CN" },
              issuerName: { type: "string", description: "Certificate issuer CN" },
              revocation: {
                type: ["object", "null"],
                description: "Revocation status (only when revocationCheck is enabled)",
                properties: {
                  status: { type: "string", description: "good, revoked, unknown, or error" },
                  source: { type: "string", description: "ocsp or crl" },
                  reason: { type: "string", description: "Revocation reason if revoked" },
                  checkedAt: { type: "string", description: "ISO timestamp when revocation was checked" }
                }
              },
              subjectaltname: { type: "string", description: "Subject Alternative Names" },
              valid_from: { type: "string", description: "Certificate valid from date" },
              valid_to: { type: "string", description: "Certificate valid until date" },
              fingerprint256: { type: "string", description: "SHA-256 fingerprint" },
              serialNumber: { type: "string", description: "Certificate serial number" },
              raw: { type: "string", description: "PEM-encoded certificate" }
            }
          },
          400: {
            type: "object",
            description: "Bad Request - Invalid domain or payload",
            properties: { error: { type: "string" } }
          },
          429: {
            type: "object",
            description: "Rate Limit Exceeded",
            headers: {
              "Retry-After": { type: "integer", description: "Seconds to wait before retrying" },
              "X-RateLimit-Limit": { type: "integer", description: "Maximum requests per window" },
              "X-RateLimit-Remaining": { type: "integer", description: "Remaining requests in window" },
              "X-RateLimit-Reset": { type: "integer", description: "Unix timestamp when the rate limit resets" }
            },
            properties: { error: { type: "string", example: "Rate limit exceeded" } }
          },
          502: {
            type: "object",
            description: "Bad Gateway - Failed to connect to target host",
            properties: { error: { type: "string" } }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Querystring?: { revocationCheck?: string } }>, reply) => {
      const ip = request.ip || request.socket.remoteAddress || "unknown";
      const requestStartTime = Date.now();
      
      request.log.info({ ip, method: request.method, url: request.url }, "Incoming request");

      if (!limiter.allow(ip)) {
        request.log.warn({ ip }, "Rate limit exceeded");
        reply.code(429);
        httpResponseStatusTotal.inc({ status_code: '429', route: '/api/check' });
        return { error: "Rate limit exceeded" };
      }

      const parsed = bodySchema.safeParse(request.body || {});
      if (!parsed.success) {
        request.log.warn(
          { issues: parsed.error.issues, body: request.body },
          "Invalid /api/check payload"
        );
        reply.code(400);
        httpResponseStatusTotal.inc({ status_code: '400', route: '/api/check' });
        return { error: "Invalid payload" };
      }

      const { domain, host, revocationCheck } = parsed.data;
      const input = domain || host || "";

      request.log.info({ domain: input, revocationCheck }, "Checking certificate");

      const target = normalizeTarget(input);

      if (!target) {
        request.log.warn({ domain: input }, "Invalid domain");
        reply.code(400);
        httpResponseStatusTotal.inc({ status_code: '400', route: '/api/check' });
        return { error: "Invalid domain" };
      }

      const revocationEnabled =
        request.query?.revocationCheck === "true" || revocationCheck === true;
      const cacheKey = `${target.host}:${revocationEnabled}`;

      const cached = certificateCache.get(cacheKey);
      if (cached) {
        request.log.debug({ cacheKey, host: target.host }, "Returning cached certificate");
        request.log.info({ 
          host: target.host, 
          cached: true, 
          durationMs: Date.now() - requestStartTime 
        }, "Certificate check complete");
        return cached;
      }

      try {
        request.log.debug({ host: target.host }, "Fetching certificate from target");
        const result = await fetchCertificate(target, {
          timeoutMs: options.requestTimeoutMs
        });
        
        let revocation = undefined;
        if (options.revocationMode !== "off" && revocationEnabled) {
          request.log.debug({ host: target.host }, "Checking revocation status");
          revocation = await checkRevocation(
            result.cert,
            options.revocationMode === "ocsp" ? result.issuer : undefined
          );
          revocationCheckTotal.inc({ status: revocation.status, source: revocation.source });
          request.log.info({ 
            host: target.host, 
            revocationStatus: revocation.status, 
            revocationSource: revocation.source 
          }, "Revocation check result");
        }

        const response = mapCertificate({ ...result, revocation }, target);
        certificateCache.set(cacheKey, response);
        
        const durationMs = Date.now() - requestStartTime;
        tlsCheckTotal.inc({ status: 'success', valid: response.valid ? 'true' : 'false' });
        tlsCheckDurationSeconds.inc(durationMs / 1000);
        httpResponseStatusTotal.inc({ status_code: '200', route: '/api/check' });
        
        request.log.info({ 
          host: target.host, 
          valid: response.valid, 
          revocationStatus: response.revocation?.status,
          durationMs 
        }, "Certificate check complete");

        return response;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        const durationMs = Date.now() - requestStartTime;
        tlsCheckTotal.inc({ status: 'error', valid: 'false' });
        tlsCheckDurationSeconds.inc(durationMs / 1000);
        
        request.log.error({ 
          host: target?.host, 
          error: message, 
          durationMs: Date.now() - requestStartTime 
        }, "Certificate check failed");
        reply.code(502);
        httpResponseStatusTotal.inc({ status_code: '502', route: '/api/check' });
        return { error: message };
      }
    }
  );
};
