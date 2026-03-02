import { FastifyInstance } from "fastify";

type VersionOptions = {
  appVersion: string;
};

export const versionRoute = (server: FastifyInstance, options: VersionOptions) => {
  server.get(
    "/version",
    {
      schema: {
        description: "Returns the current version of the API.",
        tags: ["system"],
        summary: "API Version",
        response: {
          200: {
            type: "object",
            properties: {
              version: { type: "string", description: "API version string", example: "1.0.0" }
            }
          }
        }
      }
    },
    async () => ({ version: options.appVersion })
  );
};
