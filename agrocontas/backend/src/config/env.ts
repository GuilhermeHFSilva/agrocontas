import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export const env = {
  // RENDER é definida automaticamente pelo Render, que exige escutar em 0.0.0.0
  HOST: process.env.HOST || (process.env.RENDER ? "0.0.0.0" : "127.0.0.1"),
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  CORS_ORIGIN: process.env.CORS_ORIGIN || "*",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
  DATABASE_PATH: process.env.DATABASE_PATH || path.resolve(__dirname, "../../../database/agrocontas.db"),
  CF_ACCOUNT_ID: process.env.CF_ACCOUNT_ID || "",
  CF_DATABASE_ID: process.env.CF_DATABASE_ID || "",
  CF_API_TOKEN: process.env.CF_API_TOKEN || "",
};
