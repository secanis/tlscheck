import { FastifyInstance } from "fastify";

export const healthRoute = (server: FastifyInstance) => {
  server.get(
    "/health",
    {
      schema: {
        description: "Health check endpoint. Returns the operational status of the API.",
        tags: ["system"],
        summary: "Health Check",
        response: {
          200: {
            type: "object",
            properties: { status: { type: "string", description: "Operational status", example: "ok" } }
          }
        }
      }
    },
    async () => ({ status: "ok" })
  );
};
