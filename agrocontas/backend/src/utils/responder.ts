import { Response } from "express";
import { ApiResponse } from "../types/nfe";
import { ServiceError } from "./serviceError";

export async function responder<T>(
  res: Response<ApiResponse<T>>,
  operacao: () => Promise<T>,
  mensagem?: string,
  status = 200
): Promise<void> {
  try {
    const data = await operacao();
    res.status(status).json({ success: true, message: mensagem, data });
  } catch (error: unknown) {
    if (error instanceof ServiceError) {
      res.status(error.statusCode).json({ success: false, error: error.message });
      return;
    }
    console.error("Erro interno:", error);
    res.status(500).json({ success: false, error: "Ocorreu um erro interno no servidor." });
  }
}
