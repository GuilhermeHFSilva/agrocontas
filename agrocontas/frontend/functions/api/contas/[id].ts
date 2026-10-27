import { Env } from "../../types/env";
import { createD1Db } from "../../db/d1Adapter";
import { obterConta, atualizarConta } from "../../services/movimentoService";
import { responder } from "../../utils/responder";
import { ContaInput } from "../../../src/types/cadastros";

export const onRequestGet: PagesFunction<Env, "id"> = async ({ params, env }) =>
  responder(async () => obterConta(createD1Db(env.DB), params.id));

export const onRequestPut: PagesFunction<Env, "id"> = async ({ request, params, env }) =>
  responder(
    async () => atualizarConta(createD1Db(env.DB), params.id, (await request.json()) as ContaInput),
    "Conta atualizada com sucesso."
  );
