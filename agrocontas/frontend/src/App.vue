<script setup lang="ts">
import { onMounted, ref } from "vue";
import FileUpload from "./components/FileUpload.vue";
import FormattedViewer from "./components/FormattedViewer.vue";
import JsonViewer from "./components/JsonViewer.vue";
import SettingsTab from "./components/SettingsTab.vue";
import {
  BlurText,
  ClickSpark,
  DecryptedText,
  FadeContent,
  Magnet,
  SpotlightCard,
} from "./components/bits";
import { extractNfe, getSettings, getServerConfig } from "./services/api";
import { NfeExtracao } from "./types/nfe";

const activeNavTab = ref<"extract" | "settings">("extract");
const activeViewTab = ref<"formatted" | "json">("formatted");

const selectedFile = ref<File | null>(null);
const loading = ref(false);
const errorMessage = ref("");
const extractedData = ref<NfeExtracao | null>(null);
const hasApiKey = ref(true);
const activeModel = ref("gemini-3.6-flash");

onMounted(async () => {
  await checkKeyAvailability();
});

async function checkKeyAvailability() {
  const settings = getSettings();
  if (settings.geminiModel) {
    activeModel.value = settings.geminiModel;
  }
  if (settings.geminiApiKey) {
    hasApiKey.value = true;
    return;
  }
  try {
    const srv = await getServerConfig();
    hasApiKey.value = srv.hasServerKey;
    if (srv.defaultModel) {
      activeModel.value = srv.defaultModel;
    }
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
  <div class="min-h-screen bg-surface font-body text-on-surface">
    <!-- Top Context Strip / Architectural Header -->
    <header class="bg-surface-bright border-b-2 border-outline px-4 sm:px-8 py-3 sticky top-0 z-40">
      <div class="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <Magnet :magnetStrength="3" :padding="20">
            <div class="w-10 h-10 bg-primary-container border-2 border-outline flex items-center justify-center font-headline font-black text-lg text-on-primary-container shadow-[2px_2px_0px_#1a1a1a]">
              AC
            </div>
          </Magnet>
          <div>
            <div class="flex items-center gap-2">
              <span class="font-headline font-black text-base uppercase tracking-tight text-on-surface leading-none">
                <DecryptedText text="AgroContas" :speed="40" :maxIterations="7" />
              </span>
              <span class="inline-block w-2.5 h-2.5 bg-primary-fixed border border-outline"></span>
              <span class="bg-surface-container border border-outline px-1.5 py-0.2 text-[10px] font-mono font-bold">
                CORE v1.0
              </span>
            </div>
            <div class="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant font-bold mt-0.5">
              Gestão Financeira Rural • DOO UniRV
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2 sm:gap-4 flex-wrap">
          <FadeContent :delay="100" direction="down">
            <div class="flex items-center gap-1.5 px-2.5 py-1 bg-surface-container border border-outline text-[11px] font-headline font-bold uppercase text-on-surface">
              <span>Motor:</span>
              <span class="bg-primary-container px-1 font-mono text-[10px] text-on-primary-container">
                {{ activeModel }}
              </span>
            </div>
          </FadeContent>

          <FadeContent :delay="150" direction="down">
            <div class="flex items-center gap-2 px-2.5 py-1 bg-surface-container-lowest border-2 border-outline shadow-[2px_2px_0px_#1a1a1a]">
              <span
                class="inline-block w-2.5 h-2.5 border border-outline transition-colors duration-300"
                :class="hasApiKey ? 'bg-primary-fixed' : 'bg-secondary'"
              ></span>
              <span class="text-[10px] font-headline font-bold uppercase tracking-tight text-on-surface">
                {{ hasApiKey ? 'API Ativa' : 'Sem Chave' }}
              </span>
            </div>
          </FadeContent>

          <ClickSpark sparkColor="#ffcc00" :sparkCount="8">
            <Magnet :magnetStrength="3" :padding="20">
              <button
                class="px-2.5 py-1 text-[11px] font-headline font-bold uppercase border-2 border-outline bg-surface-variant hover:bg-outline hover:text-surface shadow-[2px_2px_0px_#1a1a1a] transition-none flex items-center gap-1 cursor-pointer"
                @click="activeNavTab = activeNavTab === 'settings' ? 'extract' : 'settings'"
              >
                <span class="material-symbols-outlined text-sm">
                  {{ activeNavTab === 'settings' ? 'arrow_back' : 'tune' }}
                </span>
                <span>{{ activeNavTab === 'settings' ? 'Voltar' : 'Configurações' }}</span>
              </button>
            </Magnet>
          </ClickSpark>
        </div>
      </div>
    </header>

    <!-- Main Content Canvas -->
    <main class="max-w-6xl mx-auto px-4 sm:px-8 py-6">
      <!-- Session Bar / Scope Strip -->
      <FadeContent :duration="450" direction="up">
        <SpotlightCard className="w-full bg-surface-container-high border-2 border-outline p-4 mb-6 shadow-[4px_4px_0px_#1a1a1a]">
          <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <Magnet :magnetStrength="2">
                <div class="w-12 h-12 bg-primary-container border-2 border-outline flex items-center justify-center shadow-[2px_2px_0px_#1a1a1a]">
                  <span class="material-symbols-outlined text-2xl font-bold">description</span>
                </div>
              </Magnet>
              <div>
                <div class="flex items-center gap-2">
                  <h1 class="text-lg sm:text-xl font-headline font-black uppercase tracking-tight text-on-surface">
                    <BlurText text="Ingestão e Extração de Documentos Fiscais" :delay="35" animateBy="words" />
                  </h1>
                </div>
                <p class="text-xs font-mono text-on-surface-variant uppercase mt-0.5">
                  Módulos Canônicos RF06 (Upload) e RF07 (Processamento Semântico com IA)
                </p>
              </div>
            </div>

            <div class="flex items-center gap-2 flex-wrap text-xs font-mono">
              <div class="px-3 py-1.5 bg-surface border-2 border-outline font-headline font-bold uppercase flex items-center gap-1.5 shadow-[2px_2px_0px_#1a1a1a]">
                <span class="text-on-surface-variant font-mono">Documento:</span>
                <span class="font-bold">{{ selectedFile ? selectedFile.name : 'Nenhum' }}</span>
              </div>
              <div
                v-if="extractedData"
                class="px-3 py-1.5 bg-primary-container border-2 border-outline font-headline font-bold uppercase flex items-center gap-1.5 shadow-[2px_2px_0px_#1a1a1a]"
              >
                <span>Status:</span>
                <span class="font-black text-on-primary-container">Extração Concluída</span>
              </div>
            </div>
          </div>
        </SpotlightCard>
      </FadeContent>

      <!-- Primary Tab Switcher (Architectural Header) -->
      <FadeContent :duration="400" :delay="100" direction="up">
        <div class="flex flex-wrap items-end gap-1 mb-0 border-b-2 border-outline">
          <Magnet :magnetStrength="2" :padding="15">
            <button
              class="border-2 border-outline border-b-0 px-6 py-3 font-headline text-xs uppercase tracking-wider transition-none flex items-center gap-2 cursor-pointer"
              :class="activeNavTab === 'extract'
                ? 'bg-[#FFE600] font-black text-on-surface shadow-[4px_0px_0px_#1a1a1a] -mb-[2px] z-10'
                : 'bg-surface-container font-bold text-on-surface-variant hover:bg-surface-container-highest'"
              @click="activeNavTab = 'extract'"
            >
              <span class="material-symbols-outlined text-base">document_scanner</span>
              <span>Extração de NF-e (PDF)</span>
              <span
                v-if="extractedData"
                class="bg-primary text-on-primary px-1.5 py-0.5 text-[10px] font-mono font-bold"
              >
                Pronto
              </span>
            </button>
          </Magnet>

          <Magnet :magnetStrength="2" :padding="15">
            <button
              class="border-2 border-outline border-b-0 px-6 py-3 font-headline text-xs uppercase tracking-wider transition-none flex items-center gap-2 cursor-pointer"
              :class="activeNavTab === 'settings'
                ? 'bg-[#FFE600] font-black text-on-surface shadow-[4px_0px_0px_#1a1a1a] -mb-[2px] z-10'
                : 'bg-surface-container font-bold text-on-surface-variant hover:bg-surface-container-highest'"
              @click="activeNavTab = 'settings'"
            >
              <span class="material-symbols-outlined text-base">settings</span>
              <span>Configurações da API</span>
              <span
                v-if="!hasApiKey"
                class="bg-secondary text-on-secondary px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase animate-pulse"
              >
                Pendente
              </span>
            </button>
          </Magnet>
        </div>
      </FadeContent>

      <!-- Tab Content Area -->
      <div class="pt-6">
        <!-- View: Extração -->
        <div v-if="activeNavTab === 'extract'">
          <!-- Warning Banner se chave ausente -->
          <FadeContent v-if="!hasApiKey" :duration="400" direction="up">
            <div class="w-full bg-primary-container border-2 border-outline p-4 mb-6 shadow-[4px_4px_0px_#1a1a1a] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div class="flex items-start sm:items-center gap-3">
                <span class="material-symbols-outlined text-2xl font-bold animate-bounce">warning</span>
                <div>
                  <div class="font-headline font-bold text-xs uppercase tracking-wider">
                    <DecryptedText text="Chave de API do Gemini não detectada" :speed="30" />
                  </div>
                  <div class="text-xs font-mono mt-0.5">
                    Configure sua chave de API para habilitar a extração semântica com o modelo Gemini.
                  </div>
                </div>
              </div>
              <ClickSpark sparkColor="#1a1a1a">
                <button
                  class="bg-primary text-on-primary border-2 border-outline px-4 py-2 text-xs font-headline font-bold uppercase shadow-[2px_2px_0px_#1a1a1a] hover:bg-surface hover:text-on-surface transition-none flex items-center gap-1.5 shrink-0 cursor-pointer"
                  @click="activeNavTab = 'settings'"
                >
                  <span class="material-symbols-outlined text-sm">key</span>
                  Configurar Agora
                </button>
              </ClickSpark>
            </div>
          </FadeContent>

          <!-- Error Alert -->
          <FadeContent v-if="errorMessage" :duration="400" direction="up">
            <div class="w-full bg-secondary-container border-2 border-secondary p-4 mb-6 shadow-[4px_4px_0px_#e63b2e] text-on-surface flex items-start gap-3">
              <span class="material-symbols-outlined text-xl text-secondary font-bold">error</span>
              <div class="flex-1">
                <div class="font-headline font-bold text-xs uppercase tracking-wider text-secondary">
                  Falha no Processamento do Documento
                </div>
                <div class="text-xs font-mono mt-1">
                  {{ errorMessage }}
                </div>
              </div>
            </div>
          </FadeContent>

          <!-- Upload Component (RF06) -->
          <FileUpload
            :loading="loading"
            :selected-file="selectedFile"
            @select-file="handleSelectFile"
            @extract="handleExtract"
          />

          <!-- Loading State (Bauhaus Telemetry Monitor) -->
          <FadeContent v-if="loading" :duration="400" direction="up">
            <div class="border-2 border-outline bg-surface-container-lowest p-8 shadow-[5px_5px_0px_#1a1a1a] mb-6 text-center">
              <div class="flex flex-col items-center justify-center gap-4">
                <span class="brutal-spinner brutal-spinner-lg"></span>
                <div>
                  <div class="font-headline font-bold text-sm uppercase tracking-wider text-on-surface">
                    <DecryptedText text="Processando Documento Fiscal com IA" :speed="25" />
                  </div>
                  <div class="text-xs font-mono text-on-surface-variant mt-1">
                    Enviando PDF • Executando inferência estruturada via {{ activeModel }}
                  </div>
                </div>
                <div class="w-full max-w-md bg-surface-variant border border-outline h-2.5 mt-2 overflow-hidden">
                  <div class="h-full bg-primary-fixed animate-pulse w-full"></div>
                </div>
              </div>
            </div>
          </FadeContent>

          <!-- Extracted Data Viewer (RF07) -->
          <div v-if="extractedData && !loading" class="mt-8">
            <!-- Sub-Bar de Visualização -->
            <FadeContent :duration="400" direction="up">
              <div class="bg-surface-container-lowest border-2 border-outline p-4 mb-6 shadow-[4px_4px_0px_#1a1a1a] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div class="flex items-center gap-3">
                  <span class="font-headline font-bold text-xs uppercase tracking-wider text-on-surface flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-sm">visibility</span>
                    Modo de Exibição:
                  </span>
                  <div class="inline-flex gap-1.5">
                    <ClickSpark sparkColor="#1a1a1a">
                      <button
                        class="px-3 py-1.5 text-xs font-headline font-bold uppercase border-2 border-outline transition-none cursor-pointer"
                        :class="activeViewTab === 'formatted'
                          ? 'bg-primary text-on-primary shadow-[2px_2px_0px_#1a1a1a]'
                          : 'bg-surface hover:bg-surface-variant text-on-surface'"
                        @click="activeViewTab = 'formatted'"
                      >
                        Visualização Formatada
                      </button>
                    </ClickSpark>

                    <ClickSpark sparkColor="#1a1a1a">
                      <button
                        class="px-3 py-1.5 text-xs font-headline font-bold uppercase border-2 border-outline transition-none cursor-pointer"
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
                  <span class="inline-block w-2 h-2 bg-primary"></span>
                  <span>Nota Fiscal #{{ extractedData.numeroNotaFiscal || 'N/A' }}</span>
                </div>
              </div>
            </FadeContent>

            <!-- Formatted Viewer Component -->
            <FormattedViewer
              v-if="activeViewTab === 'formatted'"
              :data="extractedData"
            />

            <!-- Json Viewer Component -->
            <JsonViewer
              v-if="activeViewTab === 'json'"
              :data="extractedData"
            />
          </div>
        </div>

        <!-- View: Configurações -->
        <div v-else-if="activeNavTab === 'settings'">
          <SettingsTab @key-updated="checkKeyAvailability" />
        </div>
      </div>

      <!-- Bottom Status Bar -->
      <FadeContent :duration="500" :delay="200" direction="up">
        <footer class="mt-12 bg-surface-container-high border-2 border-outline p-3 flex flex-col sm:flex-row items-center justify-between text-xs font-mono gap-2 shadow-[2px_2px_0px_#1a1a1a]">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 bg-primary-fixed border border-outline"></span>
            <span class="font-bold">AGROCONTAS TELEMETRY:</span>
            <span class="text-on-surface-variant">Extração estruturada de DANFE em conformidade com DOO UniRV</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-on-surface-variant">Modelo Ativo: <strong>{{ activeModel }}</strong></span>
            <span class="hidden md:inline text-outline-variant">|</span>
            <span class="text-on-surface-variant">Arquitetura: <strong>RESTful + IA Flash</strong></span>
          </div>
        </footer>
      </FadeContent>
    </main>
  </div>
</template>
