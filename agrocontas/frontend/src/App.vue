<script setup lang="ts">
import { onMounted, ref } from "vue";
import FileUpload from "./components/FileUpload.vue";
import FormattedViewer from "./components/FormattedViewer.vue";
import JsonViewer from "./components/JsonViewer.vue";
import SettingsTab from "./components/SettingsTab.vue";
import { extractNfe, getSettings, getServerConfig } from "./services/api";
import { NfeExtracao } from "./types/nfe";

const activeNavTab = ref<"extract" | "settings">("extract");
const activeViewTab = ref<"formatted" | "json">("formatted");

const selectedFile = ref<File | null>(null);
const loading = ref(false);
const errorMessage = ref("");
const extractedData = ref<NfeExtracao | null>(null);
const hasApiKey = ref(true);

onMounted(async () => {
  await checkKeyAvailability();
});

async function checkKeyAvailability() {
  const settings = getSettings();
  if (settings.geminiApiKey) {
    hasApiKey.value = true;
    return;
  }
  try {
    const srv = await getServerConfig();
    hasApiKey.value = srv.hasServerKey;
  } catch {
    hasApiKey.value = false;
  }
}

function handleSelectFile(file: File | null) {
  selectedFile.value = file;
  errorMessage.value = "";
}

async function handleExtract() {
  if (!selectedFile.value) return;

  loading.value = true;
  errorMessage.value = "";

  try {
    const data = await extractNfe(selectedFile.value);
    extractedData.value = data;
    activeViewTab.value = "formatted";
  } catch (err: any) {
    errorMessage.value = err?.message || "Ocorreu um erro ao extrair os dados da nota fiscal.";
    await checkKeyAvailability();
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="app-container">
    <header class="app-header">
      <div class="app-brand">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
        </svg>
        AgroContas
      </div>
      <h1 class="app-title">Extração de Dados de Nota Fiscal</h1>
      <p class="app-subtitle">
        Carregue um PDF de nota fiscal e extraia os dados automaticamente usando IA
      </p>
    </header>

    <nav class="nav-tabs">
      <button
        class="nav-tab-btn"
        :class="{ active: activeNavTab === 'extract' }"
        @click="activeNavTab = 'extract'"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
        </svg>
        Extração de NF-e
      </button>

      <button
        class="nav-tab-btn"
        :class="{ active: activeNavTab === 'settings' }"
        @click="activeNavTab = 'settings'"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
        Configurações
        <span
          v-if="!hasApiKey"
          style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #ef4444;"
          title="Chave API ausente"
        ></span>
      </button>
    </nav>

    <div v-if="activeNavTab === 'extract'">
      <div v-if="!hasApiKey" class="banner-alert banner-warning">
        <div>
          <strong>Atenção:</strong> Chave da API do Google Gemini não identificada. Configure na aba de Configurações para processar seus arquivos.
        </div>
        <button class="btn-secondary" style="padding: 0.4rem 0.85rem;" @click="activeNavTab = 'settings'">
          Ir para Configurações
        </button>
      </div>

      <div v-if="errorMessage" class="banner-alert banner-danger">
        <div>{{ errorMessage }}</div>
      </div>

      <FileUpload
        :loading="loading"
        :selected-file="selectedFile"
        @select-file="handleSelectFile"
        @extract="handleExtract"
      />

      <div v-if="loading" class="card loading-container">
        <span class="spinner spinner-green" style="width: 2.5rem; height: 2.5rem;"></span>
        <div class="loading-text">
          Enviando documento e analisando dados com o modelo Gemini...
        </div>
      </div>

      <div v-if="extractedData && !loading" class="card">
        <div class="card-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          Dados Extraídos
        </div>

        <div class="subtabs-container">
          <button
            class="subtab-btn"
            :class="{ active: activeViewTab === 'formatted' }"
            @click="activeViewTab = 'formatted'"
          >
            Visualização Formatada
          </button>
          <button
            class="subtab-btn"
            :class="{ active: activeViewTab === 'json' }"
            @click="activeViewTab = 'json'"
          >
            JSON
          </button>
        </div>

        <FormattedViewer
          v-if="activeViewTab === 'formatted'"
          :data="extractedData"
        />

        <JsonViewer
          v-if="activeViewTab === 'json'"
          :data="extractedData"
        />
      </div>
    </div>

    <div v-else-if="activeNavTab === 'settings'">
      <SettingsTab />
    </div>
  </div>
</template>
