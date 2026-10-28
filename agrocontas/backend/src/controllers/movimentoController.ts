import { Request, Response } from "express";
import { getDb } from "../db/connection";
import {
  alterarStatusConta,
  atualizarConta,
  criarConta,
  listarContas,
  obterConta,
} from "../services/movimentoService";
import { ContaDetalhe, ContaFiltros, ContaInput, ContaResumo } from "../types/cadastros";
import { ApiResponse } from "../types/nfe";
import { responder } from "../utils/responder";

function texto(valor: unknown): string | undefined {
  return typeof valor === "string" ? valor : undefined;
}

export class MovimentoController {
  async listar(req: Request, res: Response<ApiResponse<ContaResumo[]>>): Promise<void> {
    const filtros: ContaFiltros = {
      q: texto(req.query.q),
      tipoOperacao: (texto(req.query.tipoOperacao) ?? "") as ContaFiltros["tipoOperacao"],
      status: (texto(req.query.status) ?? "ATIVAS") as ContaFiltros["status"],
      vencimentoDe: texto(req.query.vencimentoDe),
      vencimentoAte: texto(req.query.vencimentoAte),
    };
    await responder(res, () => listarContas(getDb(), filtros));
  }

  async obter(req: Request, res: Response<ApiResponse<ContaDetalhe>>): Promise<void> {
    await responder(res, () => obterConta(getDb(), req.params.id));
  }

  async criar(req: Request, res: Response<ApiResponse<ContaDetalhe>>): Promise<void> {
    await responder(res, () => criarConta(getDb(), req.body as ContaInput), "Conta cadastrada com sucesso.", 201);
  }

  async atualizar(req: Request, res: Response<ApiResponse<ContaDetalhe>>): Promise<void> {
    await responder(
      res,
      () => atualizarConta(getDb(), req.params.id, req.body as ContaInput),
      "Conta atualizada com sucesso."
    );
  }

  async alterarStatus(req: Request, res: Response<ApiResponse<ContaDetalhe>>): Promise<void> {
    await responder(
      res,
      () => alterarStatusConta(getDb(), req.params.id, req.body?.ativo),
      "Status atualizado com sucesso."
    );
  }
}

export const movimentoController = new MovimentoController();
