import { getConfig } from "./config";
import { buildServer } from "./server";

const start = async () => {
  const config = getConfig();
  const server = await buildServer({ config });

  const shutdown = async (signal: string) => {
    server.log.info({ signal }, "Shutting down...");
    await server.close();
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  try {
    await server.listen({ port: config.port, host: config.host });
    server.log.info({ port: config.port, host: config.host }, "TLSCheck API listening");
  } catch (error) {
    server.log.error({ err: error }, "Failed to start server");
    process.exit(1);
  }
};

start();
