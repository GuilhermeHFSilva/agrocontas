
export class ServiceError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "ServiceError";
    this.statusCode = statusCode;
  }
}
