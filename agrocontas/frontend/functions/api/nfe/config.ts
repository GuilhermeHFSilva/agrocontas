import { Env } from "../../types/env";
import { jsonSuccess } from "../../utils/httpResponse";

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;

  return jsonSuccess({
    hasServerKey: Boolean(env.GEMINI_API_KEY),
    defaultModel: env.GEMINI_MODEL || "gemini-3.6-flash",
  });
};
