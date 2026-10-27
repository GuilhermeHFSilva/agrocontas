import { Env } from "../../types/env";
import { createD1Db } from "../../db/d1Adapter";
import { ContaError, verificarNfe } from "../../services/contaService";
import { jsonError, jsonSuccess } from "../../utils/httpResponse";
import { NfeExtracao } from "../../../src/types/nfe";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const nfe = (await request.json()) as NfeExtracao;
    const verificacao = await verificarNfe(createD1Db(env.DB), nfe);
    return jsonSuccess(verificacao, "Consulta ao banco de dados concluída.");
  } catch (error: unknown) {
    if (error instanceof ContaError) return jsonError(error.message, error.statusCode);
    if (error instanceof SyntaxError) return jsonError("Corpo da requisição inválido (JSON esperado).", 400);
    return jsonError("Erro ao consultar o banco de dados.", 500);
  }
};
