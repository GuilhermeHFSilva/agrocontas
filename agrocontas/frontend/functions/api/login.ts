import { Env } from "../types/env";
import { jsonError, jsonResponse } from "../utils/httpResponse";
import { SESSAO_SEGUNDOS, cookieSessao, criarToken, senhaConfere } from "../utils/sessao";

function comCookie(cookie: string): Response {
  const res = jsonResponse({ success: true });
  res.headers.append("Set-Cookie", cookie);
  return res;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.APP_USER || !env.APP_PASSWORD || !env.SESSION_SECRET) {
    return jsonError("APP_USER/APP_PASSWORD/SESSION_SECRET não configurados no servidor.", 500);
  }
  try {
    const { usuario, senha } = (await request.json()) as { usuario?: unknown; senha?: unknown };
    if (typeof usuario !== "string" || typeof senha !== "string") return jsonError("Requisição inválida.", 400);
    // Avalia os dois sempre, para não revelar qual campo errou.
    const [okUsuario, okSenha] = await Promise.all([
      senhaConfere(usuario, env.APP_USER),
      senhaConfere(senha, env.APP_PASSWORD),
    ]);
    if (!okUsuario || !okSenha) return jsonError("Usuário ou senha incorretos.", 401);
    return comCookie(cookieSessao(await criarToken(env.SESSION_SECRET), SESSAO_SEGUNDOS));
  } catch {
    return jsonError("Requisição inválida.", 400);
  }
};

export const onRequestDelete: PagesFunction<Env> = async () => comCookie(cookieSessao("", 0));
