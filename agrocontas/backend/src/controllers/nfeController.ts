import { Request, Response } from "express";
import { geminiService } from "../services/geminiService";
import { ApiResponse, NfeExtracao } from "../types/nfe";
import { env } from "../config/env";

export class NfeController {
  async extractNfe(
    req: Request,
    res: Response<ApiResponse<NfeExtracao>>
  ): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: "Nenhum arquivo PDF foi enviado. Certifique-se de enviar o arquivo no campo 'file'.",
        });
        return;
      }

      const customApiKey = (req.headers["x-gemini-api-key"] as string) || (req.body?.apiKey as string) || undefined;
      const customModel = (req.headers["x-gemini-model"] as string) || (req.body?.model as string) || undefined;

      const dadosExtraidos = await geminiService.extrairDadosNfe(
        req.file.buffer,
        customApiKey,
        customModel
      );

      res.status(200).json({
        success: true,
        message: "Dados extraídos e classificados com sucesso.",
        data: dadosExtraidos,
      });
    } catch (error: any) {
      const errorMessage =
        error?.message || "Ocorreu um erro interno ao processar a nota fiscal com o Gemini.";

      res.status(500).json({
        success: false,
        error: errorMessage,
      });
    }
  }

  async testConfig(req: Request, res: Response<ApiResponse<{ model: string }>>): Promise<void> {
    try {
      const customApiKey = (req.headers["x-gemini-api-key"] as string) || (req.body?.apiKey as string) || undefined;
      const customModel = (req.headers["x-gemini-model"] as string) || (req.body?.model as string) || undefined;

      const result = await geminiService.testConnection(customApiKey, customModel);

      res.status(200).json({
        success: true,
        message: "Conexão com o Gemini realizada com sucesso.",
        data: { model: result.model },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error?.message || "Falha ao validar a chave da API do Gemini.",
      });
    }
  }

  async getConfig(_req: Request, res: Response<ApiResponse<{ hasServerKey: boolean; defaultModel: string }>>): Promise<void> {
    res.status(200).json({
      success: true,
      data: {
        hasServerKey: Boolean(env.GEMINI_API_KEY),
        defaultModel: env.GEMINI_MODEL,
      },
    });
  }
}

export const nfeController = new NfeController();
