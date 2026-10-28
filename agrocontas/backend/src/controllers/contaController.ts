import { Request, Response } from "express";
import { getDb } from "../db/connection";
import { lancarNfe, verificarNfe } from "../services/contaService";
import { ApiResponse, NfeExtracao } from "../types/nfe";
import { LancamentoNfe, VerificacaoNfe } from "../types/conta";
import { responder } from "../utils/responder";

export class ContaController {
  async verificar(req: Request, res: Response<ApiResponse<VerificacaoNfe>>): Promise<void> {
    await responder(
      res,
      () => verificarNfe(getDb(), req.body as NfeExtracao),
      "Consulta ao banco de dados concluída."
    );
  }

  async lancar(req: Request, res: Response<ApiResponse<LancamentoNfe>>): Promise<void> {
    await responder(res, () => lancarNfe(getDb(), req.body as NfeExtracao), "Registro lançado com sucesso.", 201);
  }
}

export const contaController = new ContaController();
