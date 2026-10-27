import { Request, Response } from "express";
import { getDb } from "../db/connection";
import {
  alterarStatusPessoa,
  atualizarPessoa,
  criarPessoa,
  listarPessoas,
  obterPessoa,
} from "../services/pessoaService";
import { Pessoa, PessoaFiltros, PessoaInput } from "../types/cadastros";
import { ApiResponse } from "../types/nfe";
import { responder } from "../utils/responder";

function texto(valor: unknown): string | undefined {
  return typeof valor === "string" ? valor : undefined;
}

export class PessoaController {
  async listar(req: Request, res: Response<ApiResponse<Pessoa[]>>): Promise<void> {
    const filtros: PessoaFiltros = {
      q: texto(req.query.q),
      classificacao: (texto(req.query.classificacao) ?? "") as PessoaFiltros["classificacao"],
      status: (texto(req.query.status) ?? "ATIVO") as PessoaFiltros["status"],
    };
    await responder(res, () => listarPessoas(getDb(), filtros));
  }

  async obter(req: Request, res: Response<ApiResponse<Pessoa>>): Promise<void> {
    await responder(res, () => obterPessoa(getDb(), req.params.id));
  }

  async criar(req: Request, res: Response<ApiResponse<Pessoa>>): Promise<void> {
    await responder(res, () => criarPessoa(getDb(), req.body as PessoaInput), "Pessoa cadastrada com sucesso.", 201);
  }

  async atualizar(req: Request, res: Response<ApiResponse<Pessoa>>): Promise<void> {
    await responder(
      res,
      () => atualizarPessoa(getDb(), req.params.id, req.body as PessoaInput),
      "Pessoa atualizada com sucesso."
    );
  }

  // Exclusão lógica / reativação: corpo { "ativo": false | true }.
  async alterarStatus(req: Request, res: Response<ApiResponse<Pessoa>>): Promise<void> {
    await responder(
      res,
      () => alterarStatusPessoa(getDb(), req.params.id, req.body?.ativo),
      "Status atualizado com sucesso."
    );
  }
}

export const pessoaController = new PessoaController();
