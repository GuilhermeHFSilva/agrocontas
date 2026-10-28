
export type SqlParam = string | number | null;

export interface SqlStatement {
  sql: string;
  params?: SqlParam[];
}

export interface Db {
  first<T>(sql: string, params?: SqlParam[]): Promise<T | null>;
  all<T>(sql: string, params?: SqlParam[]): Promise<T[]>;
  
  batch(statements: SqlStatement[]): Promise<void>;
}
