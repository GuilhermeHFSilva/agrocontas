import { Env } from "../../types/env";
import { geminiService } from "../../services/geminiService";
import { jsonError, jsonSuccess } from "../../utils/httpResponse";

const MAX_PDF_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

function isPdfFile(file: File): boolean {
  return (
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf")
  );
}

function resolveApiKey(request: Request, env: Env): string {
  const headerKey = request.headers.get("x-gemini-api-key");
  if (headerKey && headerKey.trim().length > 0) {
    return headerKey.trim();
  }
  return env.GEMINI_API_KEY || "";
}

function resolveModelName(request: Request, env: Env): string {
  const headerModel = request.headers.get("x-gemini-model");
  if (headerModel && headerModel.trim().length > 0) {
    return headerModel.trim();
  }
  return env.GEMINI_MODEL || "gemini-3.6-flash";
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const formData = await request.formData();
    const uploadedFile = formData.get("file");

    if (!uploadedFile || !(uploadedFile instanceof File)) {
      return jsonError("Nenhum arquivo PDF foi enviado. Certifique-se de enviar o arquivo no campo 'file'.", 400);
    }

    if (!isPdfFile(uploadedFile)) {
      return jsonError("Formato inválido. Apenas arquivos PDF são permitidos.", 400);
    }

    if (uploadedFile.size > MAX_PDF_SIZE_BYTES) {
      return jsonError("O arquivo PDF excede o tamanho máximo permitido de 15MB.", 400);
    }

    const apiKey = resolveApiKey(request, env);
    if (!apiKey) {
      return jsonError(
        "Chave da API do Gemini não configurada. Configure na aba de Configurações ou nas variáveis de ambiente.",
        400
      );
    }

    const modelName = resolveModelName(request, env);
    const fileArrayBuffer = await uploadedFile.arrayBuffer();

    const dadosExtraidos = await geminiService.extrairDadosNfe(
      fileArrayBuffer,
      apiKey,
      modelName
    );

    return jsonSuccess(dadosExtraidos, "Dados extraídos e classificados com sucesso.");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Ocorreu um erro interno ao processar a nota fiscal.";
    return jsonError(message, 500);
  }
};
