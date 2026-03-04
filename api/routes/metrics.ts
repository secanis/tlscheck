import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { getConfig } from "../config";
import { getMetrics } from "../services/metrics";

export const metricsRoute = (server: FastifyInstance) => {
  const config = getConfig();

  server.get(
    "/metrics",
    {
      schema: {
        description: "API metrics endpoint",
        tags: ["system"],
        summary: "Metrics",
        response: {
          200: {
            type: "object",
            properties: {
              totalRequests: { type: "number" },
              successfulRequests: { type: "number" },
              failedRequests: { type: "number" },
              cacheHits: { type: "number" },
              cacheMisses: { type: "number" },
              cacheHitRate: { type: "number" },
              revocationChecks: { type: "number" },
              revocationGood: { type: "number" },
              revocationRevoked: { type: "number" },
              revocationErrors: { type: "number" },
              revocationUnsupported: { type: "number" },
              revocationGoodRate: { type: "number" },
              revocationRevokedRate: { type: "number" },
              averageResponseTimeMs: { type: "number" },
              uptimeSeconds: { type: "number" },
              startedAt: { type: "string" }
            }
          },
          401: {
            type: "object",
            properties: { error: { type: "string" } }
          },
          404: {
            type: "object",
            properties: { error: { type: "string" } }
          }
        }
      }
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!config.metricsEnabled) {
        return reply.code(404).send({ error: "Metrics endpoint is not enabled" });
      }

      const apiKey = request.headers["x-api-key"] as string | undefined;

      if (!apiKey || apiKey !== config.metricsApiKey) {
        return reply.code(401).send({ error: "Unauthorized - invalid or missing API key" });
      }

      const metrics = getMetrics();
      const cacheTotal = metrics.cacheHits + metrics.cacheMisses;
      const revocationTotal = metrics.revocationChecks;

      return {
        totalRequests: metrics.totalRequests,
        successfulRequests: metrics.successfulRequests,
        failedRequests: metrics.failedRequests,
        cacheHits: metrics.cacheHits,
        cacheMisses: metrics.cacheMisses,
        cacheHitRate: cacheTotal > 0 ? parseFloat(((metrics.cacheHits / cacheTotal) * 100).toFixed(2)) : 0,
        revocationChecks: metrics.revocationChecks,
        revocationGood: metrics.revocationGood,
        revocationRevoked: metrics.revocationRevoked,
        revocationErrors: metrics.revocationErrors,
        revocationUnsupported: metrics.revocationUnsupported,
        revocationGoodRate: revocationTotal > 0 ? parseFloat(((metrics.revocationGood / revocationTotal) * 100).toFixed(2)) : 0,
        revocationRevokedRate: revocationTotal > 0 ? parseFloat(((metrics.revocationRevoked / revocationTotal) * 100).toFixed(2)) : 0,
        averageResponseTimeMs: Math.round(metrics.averageResponseTimeMs),
        uptimeSeconds: metrics.uptimeSeconds,
        startedAt: metrics.startedAt,
        requestsByStatus: metrics.requestsByStatus,
        requestsByError: metrics.requestsByError
      };
    }
  );
};
