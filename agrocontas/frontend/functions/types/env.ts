export interface Env {
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  APP_USER?: string;
  APP_PASSWORD?: string;
  SESSION_SECRET?: string;
  DB: D1Database;
}
