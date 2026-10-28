import { Env } from "../types/env";
import { handleCorsPreflight, jsonError } from "../utils/httpResponse";
import { lerCookieSessao, tokenValido } from "../utils/sessao";

const ROTAS_PUBLICAS = ["/api/health", "/api/login"];

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, next } = context;
  if (request.method === "OPTIONS") return handleCorsPreflight();
  if (ROTAS_PUBLICAS.includes(new URL(request.url).pathname)) return next();

  if (!env.SESSION_SECRET) return jsonError("SESSION_SECRET não configurado no servidor.", 500);
  if (!(await tokenValido(lerCookieSessao(request), env.SESSION_SECRET))) {
    return jsonError("Não autenticado.", 401);
  }
  return next();
};

