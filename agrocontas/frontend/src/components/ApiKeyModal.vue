<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import {
  ClickSpark,
  DecryptedText,
  FadeContent,
  Magnet,
  SpotlightCard,
} from "./bits";
import { getSettings, saveSettings, testConfig, getServerConfig } from "../services/api";

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "key-updated"): void;
}>();

const apiKeyInput = ref("");
const showKey = ref(false);
const testing = ref(false);
const saving = ref(false);

const statusMessage = ref("");
const statusType = ref<"success" | "danger" | "warning">("success");

const hasCustomKey = ref(false);
const hasServerKey = ref(false);
const isReady = ref(false);

onMounted(() => {
  if (props.isOpen) {
    checkStatus();
  }
});

watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      apiKeyInput.value = "";
      statusMessage.value = "";
      checkStatus();
    }
  }
);

async function checkStatus() {
  const settings = getSettings();
  hasCustomKey.value = Boolean(settings.geminiApiKey && settings.geminiApiKey.trim().length > 0);

  try {
    const srv = await getServerConfig();
    hasServerKey.value = srv.hasServerKey;
  } catch {
    hasServerKey.value = false;
  }

  isReady.value = hasCustomKey.value || hasServerKey.value;
}

async function handleSaveKey() {
  if (!apiKeyInput.value.trim()) {
    statusType.value = "danger";
    statusMessage.value = "Por favor, insira uma chave de API válida.";
    return;
  }

  saving.value = true;
  statusMessage.value = "";

  try {
    saveSettings({
      geminiApiKey: apiKeyInput.value.trim(),
    });
    apiKeyInput.value = "";
    statusType.value = "success";
    statusMessage.value = "Chave de API salva com sucesso no armazenamento local!";
    await checkStatus();
    emit("key-updated");
  } catch (err: any) {
    statusType.value = "danger";
    statusMessage.value = err?.message || "Erro ao salvar a chave de API.";
  } finally {
    saving.value = false;
  }
}

async function handleRemoveCustomKey() {
  saveSettings({ geminiApiKey: "" });
  apiKeyInput.value = "";
  statusType.value = "success";
  statusMessage.value = "Chave personalizada removida. Utilizando chave padrão do servidor (se disponível).";
  await checkStatus();
  emit("key-updated");
}

async function handleTestConnection() {
  testing.value = true;
  statusMessage.value = "";

  const keyToTest = apiKeyInput.value.trim() || undefined;

  try {
    const res = await testConfig(keyToTest);
    statusType.value = "success";
    statusMessage.value = `Conexão validada com sucesso! Resposta recebida do modelo ${res.model}.`;
    await checkStatus();
    emit("key-updated");
  } catch (err: any) {
    statusType.value = "danger";
    statusMessage.value = err?.message || "Falha ao validar a conexão com a API do Google Gemini.";
  } finally {
    testing.value = false;
  }
}

function handleClose() {
  emit("close");
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
    @click.self="handleClose"
  >
    <FadeContent :duration="300" direction="up" class="w-full max-w-lg">
      <SpotlightCard className="border-2 border-outline bg-surface-container-lowest p-6 shadow-[8px_8px_0px_#1a1a1a] relative">
        <!-- Header -->
        <div class="flex items-center justify-between pb-4 border-b-2 border-outline mb-5">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 bg-primary-container border-2 border-outline flex items-center justify-center shadow-[2px_2px_0px_#1a1a1a]">
              <span class="material-symbols-outlined text-lg font-bold text-on-primary-container">key</span>
            </div>
            <div>
              <div class="px-2 py-0.5 bg-primary-fixed border border-outline text-[10px] font-headline font-black uppercase text-on-primary-fixed inline-block">
                <DecryptedText text="CONFIGURAÇÃO DE ACESSO" :speed="35" />
              </div>
              <h2 class="text-base font-headline font-bold uppercase tracking-tight text-on-surface">
                Chave de API do AI Studio
              </h2>
            </div>
          </div>

          <button
            class="w-8 h-8 bg-surface-variant border-2 border-outline flex items-center justify-center hover:bg-secondary hover:text-on-secondary transition-none cursor-pointer shadow-[2px_2px_0px_#1a1a1a]"
            title="Fechar"
            @click="handleClose"
          >
            <span class="material-symbols-outlined text-base font-bold">close</span>
          </button>
        </div>

        <!-- Status Notification Box -->
        <div class="space-y-3 mb-5">
          <!-- Status Badge -->
          <div
            class="p-3.5 border-2 shadow-[3px_3px_0px_#1a1a1a] flex items-start gap-3 font-mono text-xs"
            :class="hasCustomKey
              ? 'bg-primary-container border-outline text-on-primary-container font-bold'
              : hasServerKey
                ? 'bg-surface-container-high border-outline text-on-surface'
                : 'bg-secondary-container border-secondary text-on-surface'"
          >
            <span class="material-symbols-outlined text-base shrink-0">
              {{ isReady ? 'verified' : 'error' }}
            </span>
            <div>
              <div class="font-headline font-bold uppercase tracking-wider text-[11px]">
                <template v-if="hasCustomKey">
                  API Pronta para uso (Chave Personalizada)
                </template>
                <template v-else-if="hasServerKey">
                  API Pronta para uso (Chave Padrão do Servidor)
                </template>
                <template v-else>
                  Nenhuma Chave de API Configurada
                </template>
              </div>
              <div class="text-[11px] mt-1 text-on-surface-variant font-normal">
                <template v-if="hasCustomKey">
                  Você possui uma chave personalizada ativa salva no seu navegador.
                </template>
                <template v-else-if="hasServerKey">
                  O sistema está utilizando a chave de API padrão configurada no servidor (.env). A chave padrão não é exibida por motivos de segurança.
                </template>
                <template v-else>
                  Insira uma chave do Google AI Studio abaixo para habilitar o processamento de Notas Fiscais.
                </template>
              </div>
            </div>
          </div>

          <!-- Operation Feedback Message -->
          <FadeContent v-if="statusMessage" :duration="250" direction="down">
            <div
              class="p-3 border-2 flex items-center gap-2.5 font-mono text-xs"
              :class="statusType === 'success'
                ? 'bg-primary-container border-outline shadow-[2px_2px_0px_#1a1a1a] text-on-primary-container font-bold'
                : 'bg-secondary-container border-secondary shadow-[2px_2px_0px_#e63b2e] text-on-surface'"
            >
              <span class="material-symbols-outlined text-base shrink-0">
                {{ statusType === 'success' ? 'check_circle' : 'error' }}
              </span>
              <span>{{ statusMessage }}</span>
            </div>
          </FadeContent>
        </div>

        <!-- Form Body -->
        <div class="space-y-4 mb-6">
          <div>
            <label for="modalApiKeyInput" class="block font-headline font-bold text-xs uppercase tracking-wider text-on-surface mb-1.5">
              Inserir Nova Chave de API (AI Studio)
            </label>
            <div class="flex gap-2">
              <input
                id="modalApiKeyInput"
                v-model="apiKeyInput"
                :type="showKey ? 'text' : 'password'"
                class="flex-1 bg-surface-bright border-2 border-outline p-2.5 font-mono text-xs text-on-surface focus:outline-none focus:bg-white focus:shadow-[3px_3px_0px_#1a1a1a] transition-all duration-150"
                placeholder="Cole sua nova API Key (ex: AIzaSy...)"
              />
              <ClickSpark sparkColor="#1a1a1a">
                <button
                  type="button"
                  class="bg-surface-variant border-2 border-outline px-3 py-2 text-[11px] font-headline font-bold uppercase hover:bg-outline hover:text-surface shadow-[2px_2px_0px_#1a1a1a] transition-none cursor-pointer"
                  @click="showKey = !showKey"
                >
                  {{ showKey ? "Ocultar" : "Mostrar" }}
                </button>
              </ClickSpark>
            </div>
            <div class="text-[11px] font-mono text-on-surface-variant mt-2">
              Obtenha gratuitamente sua chave no Google AI Studio:
              <a
                href="https://aistudio.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                class="font-bold underline decoration-2 hover:bg-primary-fixed px-1 transition-colors duration-150"
              >
                https://aistudio.google.com/
              </a>
            </div>
          </div>
        </div>

        <!-- Actions Toolbar -->
        <div class="pt-4 border-t-2 border-outline flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <ClickSpark sparkColor="#1a1a1a" :sparkCount="6">
              <Magnet :magnetStrength="2">
                <button
                  class="bg-primary-container text-on-primary-container border-2 border-outline px-4 py-2 text-xs font-headline font-black uppercase tracking-wider shadow-[3px_3px_0px_#1a1a1a] hover:bg-primary hover:text-on-primary active:translate-x-0.5 active:translate-y-0.5 transition-all duration-150 flex items-center gap-1.5 cursor-pointer"
                  :disabled="saving || !apiKeyInput.trim()"
                  @click="handleSaveKey"
                >
                  <span class="material-symbols-outlined text-sm">save</span>
                  <span>{{ saving ? "Salvando..." : "Salvar Chave" }}</span>
                </button>
              </Magnet>
            </ClickSpark>

            <ClickSpark sparkColor="#ffcc00" :sparkCount="6">
              <Magnet :magnetStrength="2">
                <button
                  class="bg-surface-variant border-2 border-outline text-on-surface px-3.5 py-2 text-xs font-headline font-bold uppercase shadow-[2px_2px_0px_#1a1a1a] hover:bg-outline hover:text-surface transition-all duration-150 flex items-center gap-1.5 cursor-pointer"
                  :disabled="testing"
                  @click="handleTestConnection"
                >
                  <span v-if="testing" class="brutal-spinner mr-1"></span>
                  <span v-else class="material-symbols-outlined text-sm">sync</span>
                  <span>{{ testing ? "Testando..." : "Testar" }}</span>
                </button>
              </Magnet>
            </ClickSpark>
          </div>

          <div class="flex items-center gap-2">
            <button
              v-if="hasCustomKey"
              class="bg-secondary-container text-on-surface border-2 border-secondary px-3 py-2 text-xs font-headline font-bold uppercase shadow-[2px_2px_0px_#e63b2e] hover:bg-secondary hover:text-on-secondary transition-all duration-150 cursor-pointer"
              title="Remover chave personalizada e voltar para a chave padrão"
              @click="handleRemoveCustomKey"
            >
              Usar Padrão
            </button>

            <button
              class="bg-surface border-2 border-outline text-on-surface px-3.5 py-2 text-xs font-headline font-bold uppercase shadow-[2px_2px_0px_#1a1a1a] hover:bg-surface-variant transition-all duration-150 cursor-pointer"
              @click="handleClose"
            >
              Fechar
            </button>
          </div>
        </div>
      </SpotlightCard>
    </FadeContent>
  </div>
</template>
