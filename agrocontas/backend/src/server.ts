import { app } from "./app";
import { env } from "./config/env";

const server = app.listen(env.PORT, () => {
  console.log(`Servidor rodando em: http://localhost:${env.PORT}`);
  console.log(`Healthcheck: http://localhost:${env.PORT}/api/health`);
  console.log(`Extração de NFe: POST http://localhost:${env.PORT}/api/nfe/extract`);
  console.log(`Modelo Gemini: ${env.GEMINI_MODEL}`);
});

process.on("SIGTERM", () => {
  server.close(() => {
    process.exit(0);
  });
});
