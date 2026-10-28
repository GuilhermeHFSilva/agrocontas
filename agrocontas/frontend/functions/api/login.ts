import { Env } from "../types/env";
import { jsonError, jsonResponse } from "../utils/httpResponse";
import { SESSAO_SEGUNDOS, cookieSessao, criarToken, senhaConfere } from "../utils/sessao";
import { createD1Db } from "../db/d1Adapter";

const DEFAULT_SECRET = "agrocontas-session-secret-fallback-key-32chars";

function comCookie(cookie: string): Response {
  const res = jsonResponse({ success: true });
  res.headers.append("Set-Cookie", cookie);
  return res;
}

interface UsuarioDb {
  id_usuario: number;
  nome: string;
  usuario: string;
  email: string;
  senha: string;
  status: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const secret = env.SESSION_SECRET || DEFAULT_SECRET;

  try {
    const { usuario, senha } = (await request.json()) as { usuario?: unknown; senha?: unknown };
    if (typeof usuario !== "string" || typeof senha !== "string") {
      return jsonError("Requisição inválida. Informe usuário e senha.", 400);
    }

    let autenticado = false;

    if (env.DB) {
      try {
        const db = createD1Db(env.DB);
        const user = await db.first<UsuarioDb>(
          "SELECT id_usuario, nome, usuario, email, senha, status FROM usuario WHERE (usuario = ? OR email = ?) AND status = 'ATIVO'",
          [usuario.trim(), usuario.trim()]
        );

        if (user) {
          if (user.senha === senha) {
            autenticado = true;
          } else {
            const confere = await senhaConfere(senha, user.senha);
            if (confere) autenticado = true;
          }
        }
      } catch (dbErr) {
        console.error("Erro ao consultar tabela usuario:", dbErr);
      }
    }

    if (!autenticado && env.APP_USER && env.APP_PASSWORD) {
      const [okUsuario, okSenha] = await Promise.all([
        senhaConfere(usuario, env.APP_USER),
        senhaConfere(senha, env.APP_PASSWORD),
      ]);
      if (okUsuario && okSenha) autenticado = true;
    }

    if (!autenticado) {
      return jsonError("Usuário ou senha incorretos.", 401);
    }

    return comCookie(cookieSessao(await criarToken(secret), SESSAO_SEGUNDOS));
  } catch {
    return jsonError("Requisição inválida.", 400);
  }
};

export const onRequestDelete: PagesFunction<Env> = async () => comCookie(cookieSessao("", 0));

