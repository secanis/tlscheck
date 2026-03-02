import { FastifyInstance } from "fastify";

type ConfigRouteOptions = {
  cacheTtlMs: number;
  revocationMode: "ocsp" | "crl" | "off";
};

export const configRoute = (server: FastifyInstance, options: ConfigRouteOptions) => {
  server.get(
    "/api/config",
    {
      schema: {
        description: "Get public configuration settings. Used by the extension to fetch cache TTL and revocation mode.",
        tags: ["config"],
        summary: "Get API Configuration",
        response: {
          200: {
            type: "object",
            description: "Public configuration",
            properties: {
              cacheTtlMs: { type: "integer", description: "Cache TTL in milliseconds (default: 1800000 = 30 minutes)" },
              revocationMode: { type: "string", enum: ["ocsp", "crl", "off"], description: "Revocation check mode" }
            },
            example: {
              cacheTtlMs: 1800000,
              revocationMode: "ocsp"
            }
          }
        }
      }
    },
    async () => {
      return {
        cacheTtlMs: options.cacheTtlMs,
        revocationMode: options.revocationMode
      };
    }
  );
};
