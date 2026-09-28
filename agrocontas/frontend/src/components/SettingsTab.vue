<script setup lang="ts">
import { onMounted, ref } from "vue";
import { getSettings, saveSettings, testConfig, getServerConfig } from "../services/api";

const apiKey = ref("");
const model = ref("gemini-3.6-flash");
const apiUrl = ref("http://localhost:3000");
const showKey = ref(false);

const testing = ref(false);
const saving = ref(false);
const statusMessage = ref("");
const statusType = ref<"success" | "danger" | "warning">("success");
const serverHasKey = ref(false);

onMounted(async () => {
  const current = getSettings();
  apiKey.value = current.geminiApiKey;
  model.value = current.geminiModel || "gemini-3.6-flash";
  apiUrl.value = current.apiUrl || "http://localhost:3000";

  try {
    const srv = await getServerConfig();
    serverHasKey.value = srv.hasServerKey;
  } catch {
    serverHasKey.value = false;
  }
});

async function handleSave() {
  saving.value = true;
  statusMessage.value = "";
  try {
    saveSettings({
      geminiApiKey: apiKey.value.trim(),
      geminiModel: model.value.trim() || "gemini-3.6-flash",
      apiUrl: apiUrl.value.trim() || "http://localhost:3000",
    });
    statusType.value = "success";
    statusMessage.value = "Configurações salvas com sucesso!";
  } catch (err: any) {
    statusType.value = "danger";
    statusMessage.value = err?.message || "Erro ao salvar configurações.";
  } finally {
    saving.value = false;
  }
}

async function handleTest() {
  testing.value = true;
  statusMessage.value = "";
  try {
    const res = await testConfig(apiKey.value.trim(), model.value.trim());
    statusType.value = "success";
    statusMessage.value = `Conexão bem-sucedida com o Gemini usando o modelo ${res.model}!`;
  } catch (err: any) {
    statusType.value = "danger";
    statusMessage.value = err?.message || "Falha na conexão com a API do Gemini.";
  } finally {
    testing.value = false;
  }
}
</script>

<template>
  <div class="card">
    <div class="card-title">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
      </svg>
      Configurações da API do Google Gemini
    </div>

    <div v-if="serverHasKey && !apiKey" class="banner-alert banner-success" style="margin-bottom: 1.25rem;">
      <div>
        <strong>Chave detectada no Servidor (.env):</strong> O backend possui uma GEMINI_API_KEY configurada. Você pode usá-la ou inserir uma chave personalizada abaixo.
      </div>
    </div>

    <div v-if="statusMessage" class="banner-alert" :class="'banner-' + statusType" style="margin-bottom: 1.25rem;">
      <div>{{ statusMessage }}</div>
    </div>

    <div class="form-group">
      <label class="form-label" for="apiKeyInput">
        Chave de API do Gemini (Google AI Studio)
      </label>
      <div style="position: relative;">
        <input
          id="apiKeyInput"
          v-model="apiKey"
          :type="showKey ? 'text' : 'password'"
          class="form-input"
          placeholder="Cole aqui sua API Key do Google AI Studio (ex: AIzaSy...)"
        />
        <button
          type="button"
          class="btn-secondary"
          style="position: absolute; right: 4px; top: 4px; bottom: 4px; padding: 0 0.75rem; border: none;"
          @click="showKey = !showKey"
        >
          {{ showKey ? "Ocultar" : "Mostrar" }}
        </button>
      </div>
      <div class="form-hint">
        Obtenha gratuitamente sua chave de API no Google AI Studio:
        <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" style="color: var(--primary); text-decoration: underline; font-weight: 600;">
          https://aistudio.google.com/
        </a>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label" for="modelInput">
        Modelo de IA do Gemini
      </label>
      <input
        id="modelInput"
        v-model="model"
        type="text"
        class="form-input"
        placeholder="gemini-3.6-flash"
      />
      <div class="form-hint">
        Modelo configurado para este projeto: <strong>gemini-3.6-flash</strong>.
      </div>
    </div>

    <div class="form-group">
      <label class="form-label" for="apiUrlInput">
        URL do Backend
      </label>
      <input
        id="apiUrlInput"
        v-model="apiUrl"
        type="text"
        class="form-input"
        placeholder="http://localhost:3000"
      />
      <div class="form-hint">
        Endereço onde o servidor Express está em execução.
      </div>
    </div>

    <div class="actions-row">
      <button
        class="btn-primary btn-active-green"
        style="margin-top: 0; width: auto;"
        :disabled="saving"
        @click="handleSave"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
          <polyline points="17 21 17 13 7 13 7 21"></polyline>
          <polyline points="7 3 7 8 15 8"></polyline>
        </svg>
        Salvar Configurações
      </button>

      <button
        class="btn-secondary"
        :disabled="testing"
        @click="handleTest"
      >
        <span v-if="testing" class="spinner spinner-green"></span>
        <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
        </svg>
        Testar Conexão
      </button>
    </div>
  </div>
</template>
