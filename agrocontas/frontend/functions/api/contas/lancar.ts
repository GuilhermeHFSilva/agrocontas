import { Env } from "../../types/env";
import { createD1Db } from "../../db/d1Adapter";
import { ContaError, lancarNfe } from "../../services/contaService";
import { jsonError, jsonSuccess } from "../../utils/httpResponse";
import { NfeExtracao } from "../../../src/types/nfe";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const nfe = (await request.json()) as NfeExtracao;
    const lancamento = await lancarNfe(createD1Db(env.DB), nfe);
    return jsonSuccess(lancamento, "Registro lançado com sucesso.", 201);
  } catch (error: unknown) {
    if (error instanceof ContaError) return jsonError(error.message, error.statusCode);
    if (error instanceof SyntaxError) return jsonError("Corpo da requisição inválido (JSON esperado).", 400);
    return jsonError("Erro ao lançar o registro no banco de dados.", 500);
  }
};
