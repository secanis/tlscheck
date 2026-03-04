import { FastifyInstance } from "fastify";
import { healthRoute } from "./health";
import { versionRoute } from "./version";
import { checkRoute } from "./check";
import { configRoute } from "./config";
import { metricsRoute } from "./metrics";

type RouteOptions = {
  appVersion: string;
  rateLimitWindowMs: number;
  rateLimitMax: number;
  requestTimeoutMs: number;
  revocationMode: "ocsp" | "crl" | "off";
  cacheTtlMs: number;
};

export const registerRoutes = (server: FastifyInstance, options: RouteOptions) => {
  healthRoute(server);
  versionRoute(server, options);
  configRoute(server, {
    cacheTtlMs: options.cacheTtlMs,
    revocationMode: options.revocationMode
  });
  checkRoute(server, {
    rateLimitWindowMs: options.rateLimitWindowMs,
    rateLimitMax: options.rateLimitMax,
    requestTimeoutMs: options.requestTimeoutMs,
    revocationMode: options.revocationMode,
    cacheTtlMs: options.cacheTtlMs
  });
  metricsRoute(server);
};
