import { Db, SqlStatement } from "./types";

export function createD1Db(d1: D1Database): Db {
  const prepare = ({ sql, params = [] }: SqlStatement) => d1.prepare(sql).bind(...params);

  return {
    async first<T>(sql: string, params: (string | number | null)[] = []) {
      return d1.prepare(sql).bind(...params).first<T>();
    },
    async all<T>(sql: string, params: (string | number | null)[] = []) {
      const result = await d1.prepare(sql).bind(...params).all<T>();
      return result.results;
    },
    async batch(statements: SqlStatement[]) {
      await d1.batch(statements.map(prepare));
    },
  };
}
