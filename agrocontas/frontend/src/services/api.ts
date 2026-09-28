import { ApiResponse, AppSettings, NfeExtracao } from "../types/nfe";

const STORAGE_KEY = "agrocontas_settings";

export function getSettings(): AppSettings {
  const defaultApiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return {
        geminiApiKey: parsed.geminiApiKey || "",
        geminiModel: parsed.geminiModel || "gemini-3.6-flash",
        apiUrl: parsed.apiUrl || defaultApiUrl,
      };
    } catch {
      return {
        geminiApiKey: "",
        geminiModel: "gemini-3.6-flash",
        apiUrl: defaultApiUrl,
      };
    }
  }
  return {
    geminiApiKey: "",
    geminiModel: "gemini-3.6-flash",
    apiUrl: defaultApiUrl,
  };
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

export async function extractNfe(file: File): Promise<NfeExtracao> {
  const settings = getSettings();
  const formData = new FormData();
  formData.append("file", file);

  const headers: Record<string, string> = {};
  if (settings.geminiApiKey) {
    headers["x-gemini-api-key"] = settings.geminiApiKey;
  }
  if (settings.geminiModel) {
    headers["x-gemini-model"] = settings.geminiModel;
  }

  const endpoint = `${settings.apiUrl.replace(/\/+$/, "")}/api/nfe/extract`;
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

  const headers: Record<string, string> = {};
  if (keyToTest) {
    headers["x-gemini-api-key"] = keyToTest;
  }
  if (modelToTest) {
    headers["x-gemini-model"] = modelToTest;
  }

  const endpoint = `${settings.apiUrl.replace(/\/+$/, "")}/api/nfe/test-config`;
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
  const endpoint = `${settings.apiUrl.replace(/\/+$/, "")}/api/nfe/config`;
  const response = await fetch(endpoint);
  const data: ApiResponse<{ hasServerKey: boolean; defaultModel: string }> = await response.json();
  if (!response.ok || !data.success || !data.data) {
    return { hasServerKey: false, defaultModel: "gemini-3.6-flash" };
  }
  return data.data;
}
