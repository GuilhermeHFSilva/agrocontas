<script setup lang="ts">
import { onMounted, ref } from "vue";
import { getSettings, saveSettings, testConfig, getServerConfig } from "../services/api";

const emit = defineEmits<{
  (e: "key-updated"): void;
}>();

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
    statusMessage.value = "Configurações salvas com sucesso no armazenamento local!";
    emit("key-updated");
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
    statusMessage.value = `Conexão validada com sucesso! Resposta recebida do modelo ${res.model}.`;
    emit("key-updated");
  } catch (err: any) {
    statusType.value = "danger";
    statusMessage.value = err?.message || "Falha ao validar a conexão com a API do Google Gemini.";
  } finally {
    testing.value = false;
  }
}
</script>

<template>
  <div class="border-2 border-outline bg-surface-container-lowest p-5 shadow-[5px_5px_0px_#1a1a1a] mb-6">
    <!-- Block Head -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-outline mb-5">
      <div>
        <div class="flex items-center gap-2">
          <span class="px-2 py-0.5 bg-primary-fixed border border-outline text-[10px] font-headline font-black uppercase text-on-primary-fixed">
            PAINEL DE CONTROLE
          </span>
          <h2 class="text-base sm:text-lg font-headline font-bold uppercase tracking-tight text-on-surface">
            Configurações da API & Parâmetros do Gemini
          </h2>
        </div>
        <p class="text-xs font-mono text-on-surface-variant mt-0.5">
          Credenciais do Google AI Studio e endereçamento de rede do backend
        </p>
      </div>

      <div class="flex items-center gap-1.5 px-2.5 py-1 bg-surface-container border border-outline text-xs font-headline font-bold uppercase">
        <span class="material-symbols-outlined text-sm">tune</span>
        <span>Configurações Locais</span>
      </div>
    </div>

    <!-- Server Key Banner -->
    <div
      v-if="serverHasKey && !apiKey"
      class="p-3.5 bg-surface-container-high border-2 border-outline mb-4 shadow-[3px_3px_0px_#1a1a1a] flex items-center gap-3 font-mono text-xs"
    >
      <span class="w-3 h-3 bg-primary-fixed border border-outline shrink-0"></span>
      <div>
        <strong class="font-headline uppercase text-on-surface">Chave detectada no Backend (.env):</strong>
        <span class="text-on-surface-variant ml-1">O servidor possui uma chave ativa configurada no ambiente. Você pode utilizá-la ou sobrescrever com sua própria chave abaixo.</span>
      </div>
    </div>

    <!-- Status Message Banner -->
    <div
      v-if="statusMessage"
      class="p-3.5 border-2 mb-4 flex items-center gap-3 font-mono text-xs"
      :class="statusType === 'success'
        ? 'bg-primary-container border-outline shadow-[3px_3px_0px_#1a1a1a] text-on-primary-container font-bold'
        : 'bg-secondary-container border-secondary shadow-[3px_3px_0px_#e63b2e] text-on-surface'"
    >
      <span class="material-symbols-outlined text-base">
        {{ statusType === 'success' ? 'check_circle' : 'error' }}
      </span>
      <span>{{ statusMessage }}</span>
    </div>

    <!-- Form Fields -->
    <div class="space-y-4">
      <!-- API Key Field -->
      <div>
        <label for="apiKeyInput" class="block font-headline font-bold text-xs uppercase tracking-wider text-on-surface mb-1.5">
          Chave de API do Gemini (Google AI Studio)
        </label>
        <div class="flex gap-2">
          <input
            id="apiKeyInput"
            v-model="apiKey"
            :type="showKey ? 'text' : 'password'"
            class="flex-1 bg-surface-bright border-2 border-outline p-2.5 font-mono text-xs text-on-surface focus:outline-none focus:bg-white focus:shadow-[3px_3px_0px_#1a1a1a]"
            placeholder="Cole sua API Key do Google AI Studio (ex: AIzaSy...)"
          />
          <button
            type="button"
            class="bg-surface-variant border-2 border-outline px-3 py-2 text-[11px] font-headline font-bold uppercase hover:bg-outline hover:text-surface shadow-[2px_2px_0px_#1a1a1a] transition-none cursor-pointer"
            @click="showKey = !showKey"
          >
            {{ showKey ? "Ocultar" : "Mostrar" }}
          </button>
        </div>
        <div class="text-[11px] font-mono text-on-surface-variant mt-1.5">
          Obtenha gratuitamente sua chave no Google AI Studio:
          <a
            href="https://aistudio.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            class="font-bold underline decoration-2 hover:bg-primary-fixed px-1"
          >
            https://aistudio.google.com/
          </a>
        </div>
      </div>

      <!-- Model Field -->
      <div>
        <label for="modelInput" class="block font-headline font-bold text-xs uppercase tracking-wider text-on-surface mb-1.5">
          Identificador do Modelo de IA
        </label>
        <input
          id="modelInput"
          v-model="model"
          type="text"
          class="w-full bg-surface-bright border-2 border-outline p-2.5 font-mono text-xs text-on-surface focus:outline-none focus:bg-white focus:shadow-[3px_3px_0px_#1a1a1a]"
          placeholder="gemini-3.6-flash"
        />
        <div class="text-[11px] font-mono text-on-surface-variant mt-1.5">
          Padrão do projeto AgroContas: <strong>gemini-3.6-flash</strong> (alta velocidade com structured JSON outputs).
        </div>
      </div>

      <!-- API URL Field -->
      <div>
        <label for="apiUrlInput" class="block font-headline font-bold text-xs uppercase tracking-wider text-on-surface mb-1.5">
          URL da API Backend
        </label>
        <input
          id="apiUrlInput"
          v-model="apiUrl"
          type="text"
          class="w-full bg-surface-bright border-2 border-outline p-2.5 font-mono text-xs text-on-surface focus:outline-none focus:bg-white focus:shadow-[3px_3px_0px_#1a1a1a]"
          placeholder="http://localhost:3000"
        />
        <div class="text-[11px] font-mono text-on-surface-variant mt-1.5">
          Endereço do serviço backend Express / Cloudflare Pages Functions.
        </div>
      </div>
    </div>

    <!-- Actions Toolbar -->
    <div class="mt-6 pt-4 border-t-2 border-outline flex flex-wrap items-center gap-3">
      <button
        class="bg-primary-container text-on-primary-container border-2 border-outline px-5 py-2.5 text-xs font-headline font-black uppercase tracking-wider shadow-[3px_3px_0px_#1a1a1a] hover:bg-primary hover:text-on-primary active:translate-x-0.5 active:translate-y-0.5 transition-none flex items-center gap-2 cursor-pointer"
        :disabled="saving"
        @click="handleSave"
      >
        <span class="material-symbols-outlined text-sm">save</span>
        <span>{{ saving ? "Salvando..." : "Salvar Configurações" }}</span>
      </button>

      <button
        class="bg-surface-variant border-2 border-outline text-on-surface px-4 py-2.5 text-xs font-headline font-bold uppercase shadow-[2px_2px_0px_#1a1a1a] hover:bg-outline hover:text-surface transition-none flex items-center gap-2 cursor-pointer"
        :disabled="testing"
        @click="handleTest"
      >
        <span v-if="testing" class="brutal-spinner mr-1"></span>
        <span v-else class="material-symbols-outlined text-sm">sync</span>
        <span>{{ testing ? "Testando Conexão..." : "Testar Conexão com Gemini" }}</span>
      </button>
    </div>
  </div>
</template>
