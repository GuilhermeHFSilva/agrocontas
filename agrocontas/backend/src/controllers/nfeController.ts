import { Request, Response } from "express";
import { geminiService } from "../services/geminiService";
import { ApiResponse, NfeExtracao } from "../types/nfe";
import { env } from "../config/env";
import { AppError, getErrorMessage } from "../utils/errorHandler";

function extractCustomApiKey(req: Request): string | undefined {
  const headerKey = req.headers["x-gemini-api-key"];
  if (typeof headerKey === "string" && headerKey.trim().length > 0) {
    return headerKey.trim();
  }
  const bodyKey = req.body?.apiKey;
  if (typeof bodyKey === "string" && bodyKey.trim().length > 0) {
    return bodyKey.trim();
  }
  return undefined;
}

function extractCustomModel(req: Request): string | undefined {
  const headerModel = req.headers["x-gemini-model"];
  if (typeof headerModel === "string" && headerModel.trim().length > 0) {
    return headerModel.trim();
  }
  const bodyModel = req.body?.model;
  if (typeof bodyModel === "string" && bodyModel.trim().length > 0) {
    return bodyModel.trim();
  }
  return undefined;
}

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

      const customApiKey = extractCustomApiKey(req);
      const customModel = extractCustomModel(req);

      const { dados, modelUsed } = await geminiService.extrairDadosNfe(
        req.file.buffer,
        customApiKey,
        customModel
      );

      res.status(200).json({
        success: true,
        message: "Dados extraídos e classificados com sucesso.",
        data: dados,
        model: modelUsed,
      });
    } catch (error: unknown) {
      const statusCode = error instanceof AppError ? error.statusCode : 500;
      const errorMessage = getErrorMessage(error);

      res.status(statusCode).json({
        success: false,
        error: errorMessage,
      });
    }
  }

  async testConfig(
    req: Request,
    res: Response<ApiResponse<{ model: string }>>
  ): Promise<void> {
    try {
      const customApiKey = extractCustomApiKey(req);
      const customModel = extractCustomModel(req);

      const result = await geminiService.testConnection(customApiKey, customModel);

      res.status(200).json({
        success: true,
        message: "Conexão com o Gemini realizada com sucesso.",
        data: { model: result.model },
      });
    } catch (error: unknown) {
      const statusCode = error instanceof AppError ? error.statusCode : 400;
      res.status(statusCode).json({
        success: false,
        error: getErrorMessage(error),
      });
    }
  }

  async getConfig(
    _req: Request,
    res: Response<ApiResponse<{ hasServerKey: boolean; defaultModel: string }>>
  ): Promise<void> {
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
