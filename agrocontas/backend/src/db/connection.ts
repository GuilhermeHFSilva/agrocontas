import fs from "fs";
import path from "path";
import { DatabaseSync, SQLInputValue } from "node:sqlite";
import { env } from "../config/env";
import { Db, SqlParam, SqlStatement } from "./types";
import { SCHEMA_SQL } from "./schema";
import { createCloudflareD1Db } from "./d1HttpAdapter";

let instance: Db | null = null;

function createSqliteDb(database: DatabaseSync): Db {
  const toInput = (params: SqlParam[] = []) => params as SQLInputValue[];

  return {
    async first<T>(sql: string, params?: SqlParam[]) {
      const row = database.prepare(sql).get(...toInput(params));
      return (row as T | undefined) ?? null;
    },
    async all<T>(sql: string, params?: SqlParam[]) {
      return database.prepare(sql).all(...toInput(params)) as T[];
    },
    async batch(statements: SqlStatement[]) {
      database.exec("BEGIN");
      try {
        for (const { sql, params } of statements) {
          database.prepare(sql).run(...toInput(params));
        }
        database.exec("COMMIT");
      } catch (error) {
        database.exec("ROLLBACK");
        throw error;
      }
    },
  };
}

export function getDb(): Db {
  if (instance) return instance;

  if (env.CF_ACCOUNT_ID && env.CF_DATABASE_ID && env.CF_API_TOKEN) {
    console.log(`[DB] Conectando ao Cloudflare D1 (${env.CF_DATABASE_ID})...`);
    instance = createCloudflareD1Db(env.CF_ACCOUNT_ID, env.CF_DATABASE_ID, env.CF_API_TOKEN);
    return instance;
  }

  console.log(`[DB] Conectando ao SQLite local em ${env.DATABASE_PATH}...`);
  const filePath = path.resolve(env.DATABASE_PATH);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  const database = new DatabaseSync(filePath);
  database.exec("PRAGMA foreign_keys = ON");
  database.exec(SCHEMA_SQL);

  instance = createSqliteDb(database);
  return instance;
}
