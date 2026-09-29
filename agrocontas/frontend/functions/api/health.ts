import { Env } from "../types/env";
import { jsonSuccess } from "../utils/httpResponse";

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;

  return jsonSuccess({
    status: "ok",
    service: "agrocontas-pages-edge",
    runtime: "cloudflare-pages-worker",
    timestamp: new Date().toISOString(),
    geminiModel: env.GEMINI_MODEL || "gemini-3.6-flash",
    hasApiKey: Boolean(env.GEMINI_API_KEY),
  });
};
