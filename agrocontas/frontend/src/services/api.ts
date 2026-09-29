import { ApiResponse, AppSettings, NfeExtracao } from "../types/nfe";

const STORAGE_KEY = "agrocontas_settings";
const DEFAULT_MODEL = "gemini-3.6-flash";

function getFallbackApiUrl(): string {
  return import.meta.env.VITE_API_URL || "";
}

function buildEndpoint(baseUrl: string, endpointPath: string): string {
  const normalizedBase = baseUrl.trim().replace(/\/+$/, "");
  const normalizedPath = endpointPath.startsWith("/") ? endpointPath : `/${endpointPath}`;
  return `${normalizedBase}${normalizedPath}`;
}

export function getSettings(): AppSettings {
  const defaultApiUrl = getFallbackApiUrl();
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return {
      geminiApiKey: "",
      geminiModel: DEFAULT_MODEL,
      apiUrl: defaultApiUrl,
    };
  }

  try {
    const parsed = JSON.parse(saved);
    return {
      geminiApiKey: parsed.geminiApiKey || "",
      geminiModel: parsed.geminiModel || DEFAULT_MODEL,
      apiUrl: parsed.apiUrl !== undefined ? parsed.apiUrl : defaultApiUrl,
    };
  } catch {
    return {
      geminiApiKey: "",
      geminiModel: DEFAULT_MODEL,
      apiUrl: defaultApiUrl,
    };
  }
}

export function saveSettings(settings: Partial<AppSettings>): AppSettings {
  const current = getSettings();
  const updated: AppSettings = {
    ...current,
    ...settings,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

function createGeminiHeaders(apiKey?: string, model?: string): Record<string, string> {
  const headers: Record<string, string> = {};
  if (apiKey && apiKey.trim().length > 0) {
    headers["x-gemini-api-key"] = apiKey.trim();
  }
  if (model && model.trim().length > 0) {
    headers["x-gemini-model"] = model.trim();
  }
  return headers;
}

export async function extractNfe(file: File): Promise<NfeExtracao> {
  const settings = getSettings();
  const formData = new FormData();
  formData.append("file", file);

  const headers = createGeminiHeaders(settings.geminiApiKey, settings.geminiModel);
  const endpoint = buildEndpoint(settings.apiUrl, "/api/nfe/extract");

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: formData,
  });

  const data: ApiResponse<NfeExtracao> = await response.json();
  if (!response.ok || !data.success || !data.data) {
    throw new Error(data.error || "Falha ao extrair os dados da nota fiscal.");
  }

  return data.data;
}

export async function testConfig(
  apiKey?: string,
  model?: string
): Promise<{ success: boolean; model: string }> {
  const settings = getSettings();
  const keyToTest = apiKey !== undefined ? apiKey : settings.geminiApiKey;
  const modelToTest = model !== undefined ? model : settings.geminiModel;

  const headers = createGeminiHeaders(keyToTest, modelToTest);
  const endpoint = buildEndpoint(settings.apiUrl, "/api/nfe/test-config");

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
  });

  const data: ApiResponse<{ model: string }> = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || "Falha na validação da chave da API.");
  }

  return { success: true, model: data.data?.model || modelToTest };
}

export async function getServerConfig(): Promise<{ hasServerKey: boolean; defaultModel: string }> {
  const settings = getSettings();
  const endpoint = buildEndpoint(settings.apiUrl, "/api/nfe/config");

  try {
    const response = await fetch(endpoint);
    const data: ApiResponse<{ hasServerKey: boolean; defaultModel: string }> = await response.json();
    if (!response.ok || !data.success || !data.data) {
      return { hasServerKey: false, defaultModel: DEFAULT_MODEL };
    }
    return data.data;
  } catch {
    return { hasServerKey: false, defaultModel: DEFAULT_MODEL };
  }
}
