import { Env } from "../../types/env";
import { geminiService } from "../../services/geminiService";
import { jsonError, jsonSuccess } from "../../utils/httpResponse";

interface TestConfigRequest {
  apiKey?: string;
  model?: string;
}

async function parseJsonBody(request: Request): Promise<TestConfigRequest> {
  try {
    return (await request.json()) as TestConfigRequest;
  } catch {
    return {};
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const body = await parseJsonBody(request);
    const headerKey = request.headers.get("x-gemini-api-key");
    const headerModel = request.headers.get("x-gemini-model");

    const effectiveApiKey = headerKey || body.apiKey || env.GEMINI_API_KEY || "";
    const effectiveModel = headerModel || body.model || env.GEMINI_MODEL || "gemini-3.6-flash";

    if (!effectiveApiKey) {
      return jsonError("Chave da API do Gemini não fornecida.", 400);
    }

    const result = await geminiService.testConnection(effectiveApiKey, effectiveModel);

    return jsonSuccess({ model: result.model }, "Conexão com o Gemini realizada com sucesso.");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Falha ao validar a chave da API.";
    return jsonError(message, 400);
  }
};
