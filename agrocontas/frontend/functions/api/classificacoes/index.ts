import { Env } from "../../types/env";
import { createD1Db } from "../../db/d1Adapter";
import { listarCategorias, criarCategoria } from "../../services/classificacaoService";
import { responder } from "../../utils/responder";
import { CategoriaFiltros, CategoriaInput } from "../../../src/types/cadastros";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) =>
  responder(async () => {
    const params = new URL(request.url).searchParams;
    const filtros: CategoriaFiltros = {
      q: params.get("q") ?? undefined,
      tipo: (params.get("tipo") ?? "") as CategoriaFiltros["tipo"],
      status: (params.get("status") ?? "ATIVO") as CategoriaFiltros["status"],
    };
    return listarCategorias(createD1Db(env.DB), filtros);
  });

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) =>
  responder(
    async () => criarCategoria(createD1Db(env.DB), (await request.json()) as CategoriaInput),
    "Classificação cadastrada com sucesso.",
    201
  );
