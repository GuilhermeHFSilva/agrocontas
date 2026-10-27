import { Db, SqlParam, SqlStatement } from "./types";

interface D1QueryResponse<T = any> {
  result: Array<{
    results: T[];
    success: boolean;
    meta?: Record<string, unknown>;
  }>;
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  messages: Array<{ code: number; message: string }>;
}

export function createCloudflareD1Db(
  accountId: string,
  databaseId: string,
  apiToken: string
): Db {
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;

  async function execute<T = any>(sql: string, params: SqlParam[] = []): Promise<T[]> {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sql,
        params: params.length > 0 ? params : undefined,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Erro na API do Cloudflare D1 (${res.status}): ${errText}`);
    }

    const data = (await res.json()) as D1QueryResponse<T>;
    if (!data.success || (data.errors && data.errors.length > 0)) {
      const msg = data.errors?.map((e) => e.message).join("; ") || "Erro desconhecido ao executar query no D1";
      throw new Error(`Erro no Cloudflare D1: ${msg}`);
    }

    return data.result?.[0]?.results ?? [];
  }

  return {
    async first<T>(sql: string, params?: SqlParam[]): Promise<T | null> {
      const rows = await execute<T>(sql, params);
      return rows[0] ?? null;
    },
    async all<T>(sql: string, params?: SqlParam[]): Promise<T[]> {
      return execute<T>(sql, params);
    },
    async batch(statements: SqlStatement[]): Promise<void> {
      for (const { sql, params } of statements) {
        await execute(sql, params);
      }
    },
  };
}
