import { ServiceError } from "./serviceError";
import { jsonError, jsonSuccess } from "./httpResponse";

// Executa uma operação de serviço e a converte em resposta HTTP padronizada ({ success, data, error }).
export async function responder<T>(
  operacao: () => Promise<T>,
  mensagem?: string,
  status = 200
): Promise<Response> {
  try {
    return jsonSuccess(await operacao(), mensagem, status);
  } catch (error: unknown) {
    if (error instanceof ServiceError) return jsonError(error.message, error.statusCode);
    if (error instanceof SyntaxError) return jsonError("Corpo da requisição inválido (JSON esperado).", 400);
    console.error("Erro interno:", error);
    return jsonError("Ocorreu um erro interno no servidor.", 500);
  }
}
