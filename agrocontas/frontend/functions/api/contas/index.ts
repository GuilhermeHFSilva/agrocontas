import { Env } from "../../types/env";
import { createD1Db } from "../../db/d1Adapter";
import { listarContas, criarConta } from "../../services/movimentoService";
import { responder } from "../../utils/responder";
import { ContaFiltros, ContaInput } from "../../../src/types/cadastros";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) =>
  responder(async () => {
    const params = new URL(request.url).searchParams;
    const filtros: ContaFiltros = {
      q: params.get("q") ?? undefined,
      tipoOperacao: (params.get("tipoOperacao") ?? "") as ContaFiltros["tipoOperacao"],
      status: (params.get("status") ?? "ATIVAS") as ContaFiltros["status"],
      vencimentoDe: params.get("vencimentoDe") ?? undefined,
      vencimentoAte: params.get("vencimentoAte") ?? undefined,
    };
    return listarContas(createD1Db(env.DB), filtros);
  });

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) =>
  responder(
    async () => criarConta(createD1Db(env.DB), (await request.json()) as ContaInput),
    "Conta cadastrada com sucesso.",
    201
  );
