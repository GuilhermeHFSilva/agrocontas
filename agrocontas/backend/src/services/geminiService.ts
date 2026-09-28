import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env";
import { nfeResponseSchema } from "../schemas/nfeSchema";
import {
  NFE_EXTRACTION_SYSTEM_INSTRUCTION,
  NFE_EXTRACTION_USER_PROMPT,
} from "./promptTemplate";
import { NfeExtracao } from "../types/nfe";

export class GeminiService {
  private getClient(customApiKey?: string): GoogleGenerativeAI {
    const key = customApiKey || env.GEMINI_API_KEY;
    if (!key) {
      throw new Error(
        "Chave da API do Gemini não configurada. Configure na aba de Configurações ou no arquivo .env."
      );
    }
    return new GoogleGenerativeAI(key);
  }

  async testConnection(customApiKey?: string, customModel?: string): Promise<{ success: boolean; model: string }> {
    const client = this.getClient(customApiKey);
    const modelTarget = customModel || env.GEMINI_MODEL || "gemini-3.6-flash";
    const model = client.getGenerativeModel({ model: modelTarget });
    await model.generateContent("ping");
    return { success: true, model: modelTarget };
  }

  async extrairDadosNfe(
    pdfBuffer: Buffer,
    customApiKey?: string,
    customModel?: string
  ): Promise<NfeExtracao> {
    const client = this.getClient(customApiKey);
    const modelTarget = customModel || env.GEMINI_MODEL || "gemini-3.6-flash";

    const model = client.getGenerativeModel({
      model: modelTarget,
      systemInstruction: NFE_EXTRACTION_SYSTEM_INSTRUCTION,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: nfeResponseSchema,
        temperature: 0.1,
      },
    });

    const pdfPart = {
      inlineData: {
        data: pdfBuffer.toString("base64"),
        mimeType: "application/pdf",
      },
    };

    const response = await model.generateContent([
      pdfPart,
      NFE_EXTRACTION_USER_PROMPT,
    ]);

    const responseText = response.response.text();
    if (!responseText) {
      throw new Error("A API do Gemini retornou uma resposta vazia.");
    }

    try {
      const cleanedText = responseText.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
      const data: NfeExtracao = JSON.parse(cleanedText);
      return data;
    } catch {
      throw new Error("Falha ao processar o formato JSON retornado pela inteligência artificial.");
    }
  }
}

export const geminiService = new GeminiService();
