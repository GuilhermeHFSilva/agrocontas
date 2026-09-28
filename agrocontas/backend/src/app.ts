import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import multer from "multer";
import { env } from "./config/env";
import { nfeRoutes } from "./routes/nfeRoutes";

const app = express();

app.use(
  cors({
    origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-gemini-api-key", "x-gemini-model"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    service: "agrocontas-backend",
    timestamp: new Date().toISOString(),
    geminiModel: env.GEMINI_MODEL,
    hasApiKey: Boolean(env.GEMINI_API_KEY),
  });
});

app.use("/api/nfe", nfeRoutes);

app.use(
  (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        res.status(400).json({
          success: false,
          error: "O arquivo PDF excede o tamanho máximo permitido de 15MB.",
        });
        return;
      }
      res.status(400).json({
        success: false,
        error: `Erro no upload do arquivo: ${err.message}`,
      });
      return;
    }

    if (err.message.includes("Apenas arquivos PDF são permitidos")) {
      res.status(400).json({
        success: false,
        error: err.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: "Ocorreu um erro interno no servidor.",
    });
  }
);

export { app };
