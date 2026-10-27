import { Request, Response } from "express";
import { getDb } from "../db/connection";
import { ContaError, lancarNfe, verificarNfe } from "../services/contaService";
import { ApiResponse, NfeExtracao } from "../types/nfe";
import { LancamentoNfe, VerificacaoNfe } from "../types/conta";
import { getErrorMessage } from "../utils/errorHandler";

function sendError(res: Response<ApiResponse<never>>, error: unknown, fallback: string): void {
  if (error instanceof ContaError) {
    res.status(error.statusCode).json({ success: false, error: error.message });
    return;
  }
  console.error(`${fallback}:`, getErrorMessage(error));
  res.status(500).json({ success: false, error: fallback });
}

export class ContaController {
  async verificar(req: Request, res: Response<ApiResponse<VerificacaoNfe>>): Promise<void> {
    try {
      const verificacao = await verificarNfe(getDb(), req.body as NfeExtracao);
      res.status(200).json({
        success: true,
        message: "Consulta ao banco de dados concluída.",
        data: verificacao,
      });
    } catch (error: unknown) {
      sendError(res, error, "Erro ao consultar o banco de dados.");
    }
  }

  async lancar(req: Request, res: Response<ApiResponse<LancamentoNfe>>): Promise<void> {
    try {
      const lancamento = await lancarNfe(getDb(), req.body as NfeExtracao);
      res.status(201).json({
        success: true,
        message: "Registro lançado com sucesso.",
        data: lancamento,
      });
    } catch (error: unknown) {
      sendError(res, error, "Erro ao lançar o registro no banco de dados.");
    }
  }
}

export const contaController = new ContaController();
