// Erro de regra de negócio/validação com o status HTTP correspondente.
// Mantenha este arquivo idêntico a backend/src/utils/serviceError.ts.
export class ServiceError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "ServiceError";
    this.statusCode = statusCode;
  }
}
