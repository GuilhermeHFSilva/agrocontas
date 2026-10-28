import { Env } from "../../types/env";
import { createD1Db } from "../../db/d1Adapter";
import { obterPessoa, atualizarPessoa } from "../../services/pessoaService";
import { responder } from "../../utils/responder";
import { PessoaInput } from "../../../src/types/cadastros";

export const onRequestGet: PagesFunction<Env, "id"> = async ({ params, env }) =>
  responder(async () => obterPessoa(createD1Db(env.DB), params.id));

export const onRequestPut: PagesFunction<Env, "id"> = async ({ request, params, env }) =>
  responder(
    async () => atualizarPessoa(createD1Db(env.DB), params.id, (await request.json()) as PessoaInput),
    "Pessoa atualizada com sucesso."
  );
