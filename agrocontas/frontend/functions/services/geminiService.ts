import { GoogleGenerativeAI } from "@google/generative-ai";
import { nfeResponseSchema } from "../schemas/nfeSchema";
import {
  NFE_EXTRACTION_SYSTEM_INSTRUCTION,
  NFE_EXTRACTION_USER_PROMPT,
} from "./promptTemplate";
import { NfeExtracao } from "../../src/types/nfe";
import { arrayBufferToBase64 } from "../utils/binaryConverter";

const DEFAULT_MODEL = "gemini-3.6-flash";

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
    return JSON.parse(cleanJson) as NfeExtracao;
  } catch {
    throw new Error("Falha ao processar o formato JSON retornado pela inteligência artificial.");
  }
}

export class GeminiService {
  private createClient(apiKey: string): GoogleGenerativeAI {
    if (!apiKey) {
      throw new Error(
        "Chave da API do Gemini não configurada. Informe a chave no cabeçalho ou nas variáveis de ambiente."
      );
    }
    return new GoogleGenerativeAI(apiKey);
  }

  async testConnection(
    apiKey: string,
    modelName: string = DEFAULT_MODEL
  ): Promise<{ success: boolean; model: string }> {
    const client = this.createClient(apiKey);
    const targetModel = modelName || DEFAULT_MODEL;
    const model = client.getGenerativeModel({ model: targetModel });

    await model.generateContent("ping");
    return { success: true, model: targetModel };
  }

  async extrairDadosNfe(
    fileBuffer: ArrayBuffer | Uint8Array,
    apiKey: string,
    modelName: string = DEFAULT_MODEL
  ): Promise<NfeExtracao> {
    const client = this.createClient(apiKey);
    const targetModel = modelName || DEFAULT_MODEL;

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
        data: arrayBufferToBase64(fileBuffer),
        mimeType: "application/pdf",
      },
    };

    const result = await model.generateContent([
      pdfPart,
      NFE_EXTRACTION_USER_PROMPT,
    ]);

    const responseText = result.response.text();
    if (!responseText) {
      throw new Error("A API do Gemini retornou uma resposta vazia.");
    }

    return parseExtractionResponse(responseText);
  }
}

export const geminiService = new GeminiService();
