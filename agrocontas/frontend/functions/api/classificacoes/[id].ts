import { Env } from "../../types/env";
import { createD1Db } from "../../db/d1Adapter";
import { obterCategoria, atualizarCategoria } from "../../services/classificacaoService";
import { responder } from "../../utils/responder";
import { CategoriaInput } from "../../../src/types/cadastros";

export const onRequestGet: PagesFunction<Env, "id"> = async ({ params, env }) =>
  responder(async () => obterCategoria(createD1Db(env.DB), params.id));

export const onRequestPut: PagesFunction<Env, "id"> = async ({ request, params, env }) =>
  responder(
    async () => atualizarCategoria(createD1Db(env.DB), params.id, (await request.json()) as CategoriaInput),
    "Classificação atualizada com sucesso."
  );
