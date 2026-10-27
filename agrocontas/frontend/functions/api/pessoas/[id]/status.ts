import { Env } from "../../../types/env";
import { createD1Db } from "../../../db/d1Adapter";
import { alterarStatusPessoa } from "../../../services/pessoaService";
import { responder } from "../../../utils/responder";

// Exclusão lógica / reativação: corpo { "ativo": false | true }.
export const onRequestPatch: PagesFunction<Env, "id"> = async ({ request, params, env }) =>
  responder(async () => {
    const corpo = (await request.json()) as { ativo?: unknown };
    return alterarStatusPessoa(createD1Db(env.DB), params.id, corpo?.ativo);
  }, "Status atualizado com sucesso.");
