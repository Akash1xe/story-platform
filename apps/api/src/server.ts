import "dotenv/config";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/database.js";

const server = app.listen(env.PORT, () => {
  console.info(`Story Platform API listening on http://localhost:${env.PORT}`);
});

const shutdown = (signal: string) => {
  console.info(`${signal} received. Shutting down API...`);

  server.close(async (error) => {
    if (error) {
      console.error("Error while closing the HTTP server:", error);
      process.exitCode = 1;
    }

    await prisma.$disconnect();
  });
};

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
