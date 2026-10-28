import { Env } from "../types/env";
import { handleCorsPreflight, jsonError } from "../utils/httpResponse";
import { lerCookieSessao, tokenValido } from "../utils/sessao";

const DEFAULT_SECRET = "agrocontas-session-secret-fallback-key-32chars";
const ROTAS_PUBLICAS = ["/api/health", "/api/login"];

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, next } = context;
  if (request.method === "OPTIONS") return handleCorsPreflight();
  if (ROTAS_PUBLICAS.includes(new URL(request.url).pathname)) return next();

  const secret = env.SESSION_SECRET || DEFAULT_SECRET;
  if (!(await tokenValido(lerCookieSessao(request), secret))) {
    return jsonError("Não autenticado.", 401);
  }
  return next();
};

