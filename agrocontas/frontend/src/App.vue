<script setup lang="ts">
import { onMounted, ref } from "vue";
import ApiKeyModal from "./components/ApiKeyModal.vue";
import FileUpload from "./components/FileUpload.vue";
import FormattedViewer from "./components/FormattedViewer.vue";
import JsonViewer from "./components/JsonViewer.vue";
import {
  BlurText,
  ClickSpark,
  DecryptedText,
  FadeContent,
  Magnet,
  Squares,
} from "./components/bits";
import { extractNfe, getSettings, getServerConfig } from "./services/api";
import { NfeExtracao } from "./types/nfe";

const activeViewTab = ref<"formatted" | "json">("formatted");
const isApiKeyModalOpen = ref(false);

const selectedFile = ref<File | null>(null);
const loading = ref(false);
const errorMessage = ref("");
const extractedData = ref<NfeExtracao | null>(null);
const hasApiKey = ref(true);
const activeModel = ref("gemini-3.5-flash-lite");

onMounted(async () => {
  await checkKeyAvailability();
});

async function checkKeyAvailability() {
  try {
    const srv = await getServerConfig();
    hasApiKey.value = srv.hasServerKey;
    if (srv.defaultModel) {
      activeModel.value = srv.defaultModel;
    }
  } catch {
    hasApiKey.value = false;
  }
  const settings = getSettings();
  if (settings.geminiModel && settings.geminiModel !== "gemini-3.5-flash-lite") {
    activeModel.value = settings.geminiModel;
  }
  if (settings.geminiApiKey) {
    hasApiKey.value = true;
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
    const result = await extractNfe(selectedFile.value);
    extractedData.value = result.data;
    if (result.model) {
      activeModel.value = result.model;
    }
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
  <div class="relative min-h-screen bg-surface font-body text-on-surface overflow-x-hidden">
    <!-- Animated Subtle Background (Vue Bits Squares) -->
    <Squares
      :speed="0.25"
      :squareSize="48"
      borderColor="rgba(26, 26, 26, 0.05)"
      hoverFillColor="rgba(255, 204, 0, 0.09)"
    />

    <!-- Main Wrapper (Above Background) -->
    <div class="relative z-10">
      <!-- Top Navigation & Brand -->
      <header class="border-b-2 border-outline bg-surface-bright/90 backdrop-blur-sm px-4 sm:px-8 py-3.5">
        <div class="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <!-- Logo & Platform Info -->
          <div class="flex items-center gap-3">
            <Magnet :magnetStrength="3" :padding="20">
              <div class="w-10 h-10 bg-primary-container border-2 border-outline flex items-center justify-center font-headline font-black text-lg text-on-primary-container shadow-[2px_2px_0px_#1a1a1a]">
                AC
              </div>
            </Magnet>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-headline font-black text-base uppercase tracking-tight text-on-surface leading-none">
                  AgroContas
                </span>
                <span class="inline-block w-2 h-2 bg-primary-fixed border border-outline"></span>
                <span class="bg-surface-container border border-outline px-1.5 py-0.5 text-[10px] font-mono font-bold">
                  DOO UniRV
                </span>
              </div>
              <p class="text-[11px] font-mono text-on-surface-variant mt-0.5">
                Gestão Financeira Rural & Extração Fiscal
              </p>
            </div>
          </div>

          <!-- Status & API Key Action -->
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2 px-2.5 py-1 bg-surface-container border border-outline text-[11px] font-mono text-on-surface">
              <span>IA:</span>
              <span class="font-bold">{{ activeModel }}</span>
              <span
                class="inline-block w-2 h-2 rounded-full"
                :class="hasApiKey ? 'bg-agro-green' : 'bg-secondary'"
                :title="hasApiKey ? 'Chave configurada' : 'Chave não configurada'"
              ></span>
            </div>

            <!-- Botão de Chave API (Abre Modal Pop-up) -->
            <ClickSpark sparkColor="#1a1a1a">
              <button
                class="px-3.5 py-1.5 text-xs font-headline font-bold uppercase border-2 border-outline bg-surface hover:bg-surface-variant text-on-surface transition-all duration-150 flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_#1a1a1a]"
                @click="isApiKeyModalOpen = true"
              >
                <span class="material-symbols-outlined text-sm">key</span>
                <span>Chave API</span>
                <span
                  v-if="!hasApiKey"
                  class="w-1.5 h-1.5 rounded-full bg-secondary"
                  title="Configuração de chave pendente"
                ></span>
              </button>
            </ClickSpark>
          </div>
        </div>
      </header>

      <!-- Main Content Container -->
      <main class="max-w-5xl mx-auto px-4 sm:px-8 py-8">
        <!-- Clean Hero Section -->
        <FadeContent :duration="400" direction="up">
          <div class="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b-2 border-outline/30">
            <div>
              <div class="inline-block px-2 py-0.5 bg-primary-fixed border border-outline text-[10px] font-headline font-black uppercase text-on-primary-fixed mb-1.5 shadow-[1px_1px_0px_#1a1a1a]">
                <DecryptedText text="INGESTÃO FISCAL INTELIGENTE" :speed="35" />
              </div>
              <h1 class="text-xl sm:text-2xl font-headline font-black uppercase tracking-tight text-on-surface">
                <BlurText
                  text="Extração Automatizada de DANFE e NF-e"
                  :delay="25"
                />
              </h1>
              <p class="text-xs font-mono text-on-surface-variant mt-1">
                Envie o arquivo PDF para processamento semântico instantâneo e desdobramento financeiro.
              </p>
            </div>

            <div v-if="selectedFile" class="font-mono text-xs flex items-center gap-2 bg-surface-container px-3 py-1.5 border border-outline shadow-[2px_2px_0px_#1a1a1a] self-start sm:self-auto">
              <span class="text-on-surface-variant">Arquivo:</span>
              <strong class="text-on-surface truncate max-w-[200px]">{{ selectedFile.name }}</strong>
            </div>
          </div>
        </FadeContent>

        <!-- View: Extração de NF-e -->
        <div>
          <!-- Warning Banner (se chave ausente) -->
          <FadeContent v-if="!hasApiKey" :duration="350" direction="up">
            <div class="w-full bg-primary-container border-2 border-outline p-4 mb-6 shadow-[3px_3px_0px_#1a1a1a] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-2xl font-bold">warning</span>
                <div>
                  <div class="font-headline font-bold text-xs uppercase tracking-wider">
                    Chave de API do Gemini não detectada
                  </div>
                  <div class="text-xs font-mono mt-0.5">
                    Configure sua chave de API para processar documentos com a inteligência artificial.
                  </div>
                </div>
              </div>
              <ClickSpark sparkColor="#1a1a1a">
                <button
                  class="bg-primary text-on-primary border-2 border-outline px-3.5 py-1.5 text-xs font-headline font-bold uppercase shadow-[2px_2px_0px_#1a1a1a] hover:bg-surface hover:text-on-surface transition-none flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                  @click="isApiKeyModalOpen = true"
                >
                  <span class="material-symbols-outlined text-sm">key</span>
                  Configurar Chave API
                </button>
              </ClickSpark>
            </div>
          </FadeContent>

          <!-- Error Alert -->
          <FadeContent v-if="errorMessage" :duration="350" direction="up">
            <div class="w-full bg-secondary-container border-2 border-secondary p-4 mb-6 shadow-[3px_3px_0px_#e63b2e] text-on-surface flex items-start gap-3">
              <span class="material-symbols-outlined text-xl text-secondary font-bold">error</span>
              <div class="flex-1">
                <div class="font-headline font-bold text-xs uppercase tracking-wider text-secondary">
                  Falha no Processamento
                </div>
                <div class="text-xs font-mono mt-0.5">
                  {{ errorMessage }}
                </div>
              </div>
            </div>
          </FadeContent>

          <!-- Componente de Upload -->
          <FileUpload
            :loading="loading"
            :selected-file="selectedFile"
            @select-file="handleSelectFile"
            @extract="handleExtract"
          />

          <!-- Loading Indicator -->
          <FadeContent v-if="loading" :duration="350" direction="up">
            <div class="border-2 border-outline bg-surface-container-lowest p-8 shadow-[4px_4px_0px_#1a1a1a] mb-6 text-center">
              <div class="flex flex-col items-center justify-center gap-3">
                <span class="brutal-spinner brutal-spinner-lg"></span>
                <div class="font-headline font-bold text-sm uppercase tracking-wider text-on-surface mt-1">
                  <DecryptedText text="Processando Documento Fiscal com IA" :speed="25" />
                </div>
                <div class="text-xs font-mono text-on-surface-variant">
                  Enviando PDF • Inferência estruturada via {{ activeModel }}
                </div>
                <div class="w-full max-w-sm bg-surface-variant border border-outline h-2 mt-2 overflow-hidden">
                  <div class="h-full bg-primary-fixed animate-pulse w-full"></div>
                </div>
              </div>
            </div>
          </FadeContent>

          <!-- Extracted Data Section -->
          <div v-if="extractedData && !loading" class="mt-8">
            <!-- Mode Switcher Sub-Bar -->
            <FadeContent :duration="350" direction="up">
              <div class="border-2 border-outline bg-surface-container-lowest p-3.5 mb-6 shadow-[3px_3px_0px_#1a1a1a] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div class="flex items-center gap-2">
                  <span class="font-headline font-bold text-xs uppercase tracking-wider text-on-surface">
                    Visualização:
                  </span>
                  <div class="inline-flex gap-1.5">
                    <ClickSpark sparkColor="#1a1a1a">
                      <button
                        class="px-3 py-1 text-xs font-headline font-bold uppercase border-2 border-outline transition-none cursor-pointer"
                        :class="activeViewTab === 'formatted'
                          ? 'bg-primary text-on-primary shadow-[2px_2px_0px_#1a1a1a]'
                          : 'bg-surface hover:bg-surface-variant text-on-surface'"
                        @click="activeViewTab = 'formatted'"
                      >
                        Formatada
                      </button>
                    </ClickSpark>

                    <ClickSpark sparkColor="#1a1a1a">
                      <button
                        class="px-3 py-1 text-xs font-headline font-bold uppercase border-2 border-outline transition-none cursor-pointer"
                        :class="activeViewTab === 'json'
                          ? 'bg-primary text-on-primary shadow-[2px_2px_0px_#1a1a1a]'
                          : 'bg-surface hover:bg-surface-variant text-on-surface'"
                        @click="activeViewTab = 'json'"
                      >
                        JSON Bruto
                      </button>
                    </ClickSpark>
                  </div>
                </div>

                <div class="flex items-center gap-2 font-mono text-xs text-on-surface-variant">
                  <span class="w-2 h-2 bg-primary"></span>
                  <span>Nota Fiscal #<strong>{{ extractedData.numeroNotaFiscal || 'N/A' }}</strong></span>
                </div>
              </div>
            </FadeContent>

            <!-- Viewers -->
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

        <!-- Clean Footer -->
        <FadeContent :duration="400" :delay="150" direction="up">
          <footer class="mt-12 pt-4 border-t-2 border-outline/30 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-on-surface-variant gap-2">
            <div>
              AgroContas • Gestão Financeira Rural • UniRV
            </div>
            <div class="flex items-center gap-3">
              <span>IA: <strong>{{ activeModel }}</strong></span>
            </div>
          </footer>
        </FadeContent>
      </main>
    </div>

    <!-- Modal Pop-up para Configuração da Chave de API do AI Studio -->
    <ApiKeyModal
      :is-open="isApiKeyModalOpen"
      @close="isApiKeyModalOpen = false"
      @key-updated="checkKeyAvailability"
    />
  </div>
</template>
