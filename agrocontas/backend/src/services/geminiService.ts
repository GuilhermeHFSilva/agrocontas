import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env";
import { nfeResponseSchema } from "../schemas/nfeSchema";
import {
  NFE_EXTRACTION_SYSTEM_INSTRUCTION,
  NFE_EXTRACTION_USER_PROMPT,
} from "./promptTemplate";
import { NfeExtracao } from "../types/nfe";
import { uint8ArrayToBase64 } from "../utils/binaryConverter";
import { AppError, getErrorMessage } from "../utils/errorHandler";

export const DEFAULT_MODEL_ROTATION: string[] = [
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash-lite",
];

const DEFAULT_FALLBACK_MODEL = "gemini-3.5-flash-lite";
const OBSOLETE_MODELS = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-3.6-flash", "gemini-1.0-pro"];

function sanitizeJsonMarkdown(rawResponseText: string): string {
  return rawResponseText
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

function parseExtractionResponse(rawText: string): NfeExtracao {
  try {
    const cleanJson = sanitizeJsonMarkdown(rawText);
    const parsed = JSON.parse(cleanJson) as NfeExtracao;
    if (!parsed || typeof parsed !== "object") {
      throw new Error("O conteúdo retornado não é um objeto JSON válido.");
    }
    return parsed;
  } catch (error: unknown) {
    const detail = getErrorMessage(error);
    throw new AppError(
      `Falha ao processar o formato JSON retornado pela inteligência artificial: ${detail}`,
      502
    );
  }
}

export class GeminiService {
  private createClient(customApiKey?: string): GoogleGenerativeAI {
    const effectiveKey = customApiKey || env.GEMINI_API_KEY;
    if (!effectiveKey) {
      throw new AppError(
        "Chave da API do Gemini não configurada. Configure na aba de Configurações ou no arquivo .env.",
        400
      );
    }
    return new GoogleGenerativeAI(effectiveKey);
  }

  private resolveModelRotationSequence(customModel?: string): string[] {
    let baseModel = (customModel || env.GEMINI_MODEL || DEFAULT_FALLBACK_MODEL).trim();

    if (OBSOLETE_MODELS.includes(baseModel)) {
      baseModel = DEFAULT_FALLBACK_MODEL;
    }

    if (!DEFAULT_MODEL_ROTATION.includes(baseModel)) {
      return [baseModel, ...DEFAULT_MODEL_ROTATION];
    }

    const startIndex = DEFAULT_MODEL_ROTATION.indexOf(baseModel);
    return [
      ...DEFAULT_MODEL_ROTATION.slice(startIndex),
      ...DEFAULT_MODEL_ROTATION.slice(0, startIndex),
    ];
  }

  async testConnection(
    customApiKey?: string,
    customModel?: string
  ): Promise<{ success: boolean; model: string }> {
    const client = this.createClient(customApiKey);
    const modelsToTry = this.resolveModelRotationSequence(customModel);

    let modelIndex = 0;
    let attempt = 1;

    while (true) {
      const targetModel = modelsToTry[modelIndex];
      try {
        console.log(
          `[GeminiService.testConnection] Tentativa ${attempt}: testando conexão com modelo '${targetModel}'...`
        );
        const model = client.getGenerativeModel({ model: targetModel });
        await model.generateContent("ping");
        console.log(
          `[GeminiService.testConnection] Conexão realizada com sucesso usando o modelo '${targetModel}'.`
        );
        return { success: true, model: targetModel };
      } catch (error: unknown) {
        const errorMsg = getErrorMessage(error);
        console.warn(
          `[GeminiService.testConnection] Erro na tentativa ${attempt} com '${targetModel}': ${errorMsg}`
        );

        modelIndex = (modelIndex + 1) % modelsToTry.length;
        const nextModel = modelsToTry[modelIndex];

        console.log(
          `[GeminiService.testConnection] Alternando para '${nextModel}' e retestando em 10 segundos...`
        );
        attempt++;
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }
    }
  }

  async extrairDadosNfe(
    pdfData: Uint8Array | ArrayBuffer,
    customApiKey?: string,
    customModel?: string
  ): Promise<{ dados: NfeExtracao; modelUsed: string }> {
    const client = this.createClient(customApiKey);
    const modelsToTry = this.resolveModelRotationSequence(customModel);

    let modelIndex = 0;
    let attempt = 1;

    while (true) {
      const targetModel = modelsToTry[modelIndex];

      try {
        console.log(
          `[GeminiService.extrairDadosNfe] Tentativa ${attempt}: enviando PDF usando o modelo '${targetModel}'...`
        );

        const model = client.getGenerativeModel({
          model: targetModel,
          systemInstruction: NFE_EXTRACTION_SYSTEM_INSTRUCTION,
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: nfeResponseSchema,
            temperature: 0.1,
          },
        });

        const pdfPart = {
          inlineData: {
            data: uint8ArrayToBase64(pdfData),
            mimeType: "application/pdf",
          },
        };

        const result = await model.generateContent([
          pdfPart,
          NFE_EXTRACTION_USER_PROMPT,
        ]);

        const responseText = result.response.text();
        if (!responseText) {
          throw new AppError("A API do Gemini retornou uma resposta vazia.", 502);
        }

        const parsedData = parseExtractionResponse(responseText);

        console.log(
          `[GeminiService.extrairDadosNfe] Sucesso no processamento da Nota Fiscal com o modelo '${targetModel}' (tentativa ${attempt}).`
        );

        return { dados: parsedData, modelUsed: targetModel };
      } catch (error: unknown) {
        const errorMsg = getErrorMessage(error);
        console.warn(
          `[GeminiService.extrairDadosNfe] Erro na tentativa ${attempt} com o modelo '${targetModel}': ${errorMsg}`
        );

        modelIndex = (modelIndex + 1) % modelsToTry.length;
        const nextModel = modelsToTry[modelIndex];

        console.log(
          `[GeminiService.extrairDadosNfe] Alternando para o próximo modelo '${nextModel}'. Aguardando 10 segundos para nova tentativa...`
        );

        attempt++;
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }
    }
  }
}

export const geminiService = new GeminiService();

