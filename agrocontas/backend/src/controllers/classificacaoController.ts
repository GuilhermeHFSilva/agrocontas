import { Request, Response } from "express";
import { getDb } from "../db/connection";
import {
  alterarStatusCategoria,
  atualizarCategoria,
  criarCategoria,
  listarCategorias,
  obterCategoria,
} from "../services/classificacaoService";
import { CategoriaFiltros, CategoriaInput, CategoriaItem } from "../types/cadastros";
import { ApiResponse } from "../types/nfe";
import { responder } from "../utils/responder";

function texto(valor: unknown): string | undefined {
  return typeof valor === "string" ? valor : undefined;
}

export class ClassificacaoController {
  async listar(req: Request, res: Response<ApiResponse<CategoriaItem[]>>): Promise<void> {
    const filtros: CategoriaFiltros = {
      q: texto(req.query.q),
      tipo: (texto(req.query.tipo) ?? "") as CategoriaFiltros["tipo"],
      status: (texto(req.query.status) ?? "ATIVO") as CategoriaFiltros["status"],
    };
    await responder(res, () => listarCategorias(getDb(), filtros));
  }

  async obter(req: Request, res: Response<ApiResponse<CategoriaItem>>): Promise<void> {
    await responder(res, () => obterCategoria(getDb(), req.params.id));
  }

  async criar(req: Request, res: Response<ApiResponse<CategoriaItem>>): Promise<void> {
    await responder(
      res,
      () => criarCategoria(getDb(), req.body as CategoriaInput),
      "Classificação cadastrada com sucesso.",
      201
    );
  }

  async atualizar(req: Request, res: Response<ApiResponse<CategoriaItem>>): Promise<void> {
    await responder(
      res,
      () => atualizarCategoria(getDb(), req.params.id, req.body as CategoriaInput),
      "Classificação atualizada com sucesso."
    );
  }

  async alterarStatus(req: Request, res: Response<ApiResponse<CategoriaItem>>): Promise<void> {
    await responder(
      res,
      () => alterarStatusCategoria(getDb(), req.params.id, req.body?.ativo),
      "Status atualizado com sucesso."
    );
  }
}

export const classificacaoController = new ClassificacaoController();
