// Contrato mínimo de acesso a dados. Implementado por D1 (edge) e por node:sqlite (backend Express),
// de modo que o serviço de contas tenha o mesmo código nos dois ambientes.
export type SqlParam = string | number | null;

export interface SqlStatement {
  sql: string;
  params?: SqlParam[];
}

export interface Db {
  first<T>(sql: string, params?: SqlParam[]): Promise<T | null>;
  all<T>(sql: string, params?: SqlParam[]): Promise<T[]>;
  // Executa todos os comandos de forma atômica (tudo ou nada).
  batch(statements: SqlStatement[]): Promise<void>;
}
