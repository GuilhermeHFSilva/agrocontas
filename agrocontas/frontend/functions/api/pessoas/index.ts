import { Env } from "../../types/env";
import { createD1Db } from "../../db/d1Adapter";
import { listarPessoas, criarPessoa } from "../../services/pessoaService";
import { responder } from "../../utils/responder";
import { PessoaFiltros, PessoaInput } from "../../../src/types/cadastros";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) =>
  responder(async () => {
    const params = new URL(request.url).searchParams;
    const filtros: PessoaFiltros = {
      q: params.get("q") ?? undefined,
      classificacao: (params.get("classificacao") ?? "") as PessoaFiltros["classificacao"],
      status: (params.get("status") ?? "ATIVO") as PessoaFiltros["status"],
    };
    return listarPessoas(createD1Db(env.DB), filtros);
  });

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) =>
  responder(
    async () => criarPessoa(createD1Db(env.DB), (await request.json()) as PessoaInput),
    "Pessoa cadastrada com sucesso.",
    201
  );
