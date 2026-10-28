import { Env } from "../../../types/env";
import { createD1Db } from "../../../db/d1Adapter";
import { alterarStatusCategoria } from "../../../services/classificacaoService";
import { responder } from "../../../utils/responder";

export const onRequestPatch: PagesFunction<Env, "id"> = async ({ request, params, env }) =>
  responder(async () => {
    const corpo = (await request.json()) as { ativo?: unknown };
    return alterarStatusCategoria(createD1Db(env.DB), params.id, corpo?.ativo);
  }, "Status atualizado com sucesso.");
