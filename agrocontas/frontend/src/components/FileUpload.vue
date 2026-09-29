<script setup lang="ts">
import { ref } from "vue";
import {
  ClickSpark,
  DecryptedText,
  FadeContent,
  Magnet,
  SpotlightCard,
} from "./bits";

const props = defineProps<{
  loading: boolean;
  selectedFile: File | null;
}>();

const emit = defineEmits<{
  (e: "select-file", file: File | null): void;
  (e: "extract"): void;
}>();

const fileInputRef = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);

function triggerFileInput() {
  fileInputRef.value?.click();
}

function handleFileInputChange(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    const file = target.files[0];
    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      emit("select-file", file);
    }
  }
}

function handleDragOver(event: DragEvent) {
  event.preventDefault();
  isDragging.value = true;
}

function handleDragLeave(event: DragEvent) {
  event.preventDefault();
  isDragging.value = false;
}

function handleDrop(event: DragEvent) {
  event.preventDefault();
  isDragging.value = false;
  if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
    const file = event.dataTransfer.files[0];
    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      emit("select-file", file);
    }
  }
}

function removeFile() {
  emit("select-file", null);
  if (fileInputRef.value) {
    fileInputRef.value.value = "";
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(2)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}
</script>

<template>
  <FadeContent :duration="450" direction="up">
    <SpotlightCard className="border-2 border-outline bg-surface-container-lowest p-5 shadow-[5px_5px_0px_#1a1a1a] mb-6">
      <!-- Block Head -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-outline">
        <div>
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 bg-primary-fixed border border-outline text-[10px] font-headline font-black uppercase text-on-primary-fixed">
              <DecryptedText text="RF06 • INGESTÃO" :speed="35" />
            </span>
            <h2 class="text-base sm:text-lg font-headline font-bold uppercase tracking-tight text-on-surface">
              Carregamento do Documento Fiscal (PDF)
            </h2>
          </div>
          <p class="text-xs font-mono text-on-surface-variant mt-0.5">
            Ingestão de DANFE, NF-e e comprovantes fiscais do produtor rural
          </p>
        </div>

        <div class="flex items-center gap-2">
          <span class="bg-surface-variant border border-outline px-2.5 py-1 text-[11px] font-mono font-bold uppercase text-on-surface">
            Formato: PDF
          </span>
        </div>
      </div>

      <!-- Drop Zone -->
      <div class="mt-5">
        <div
          class="border-2 border-dashed border-outline p-8 text-center cursor-pointer transition-all duration-200 shadow-[2px_2px_0px_#1a1a1a] hover:shadow-[3px_3px_0px_#1a1a1a]"
          :class="isDragging ? 'bg-primary-container border-outline scale-[1.01]' : 'bg-surface-container-low hover:bg-surface-container-high'"
          @click="triggerFileInput"
          @dragover="handleDragOver"
          @dragleave="handleDragLeave"
          @drop="handleDrop"
        >
          <input
            ref="fileInputRef"
            type="file"
            accept="application/pdf"
            class="hidden"
            @change="handleFileInputChange"
          />

          <Magnet :magnetStrength="3" :padding="25">
            <div class="w-12 h-12 mx-auto mb-3 bg-surface border-2 border-outline flex items-center justify-center shadow-[2px_2px_0px_#1a1a1a] transition-transform duration-200 hover:rotate-3">
              <span class="material-symbols-outlined text-2xl font-bold text-on-surface">
                upload_file
              </span>
            </div>
          </Magnet>

          <div class="font-headline font-bold text-sm uppercase tracking-wide text-on-surface mb-1">
            Arraste e solte o arquivo PDF aqui, ou clique para selecionar
          </div>
          <div class="text-xs font-mono text-on-surface-variant">
            Suporte completo a DANFE, Notas Fiscais Eletrônicas e Faturas Agrícolas
          </div>
        </div>

        <!-- Selected File Card -->
        <FadeContent v-if="selectedFile" :duration="350" direction="up">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-surface-bright border-2 border-outline shadow-[3px_3px_0px_#1a1a1a] mt-4">
            <div class="flex items-center gap-3 overflow-hidden">
              <div class="w-8 h-8 bg-secondary-container border border-outline flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-secondary text-lg font-bold">picture_as_pdf</span>
              </div>
              <div class="truncate">
                <div class="font-headline font-bold text-xs uppercase text-on-surface truncate">
                  {{ selectedFile.name }}
                </div>
                <div class="font-mono text-[11px] text-on-surface-variant">
                  Tamanho do arquivo: {{ formatFileSize(selectedFile.size) }}
                </div>
              </div>
            </div>

            <ClickSpark sparkColor="#e63b2e">
              <button
                type="button"
                class="bg-secondary text-on-secondary border-2 border-outline px-3 py-1.5 text-xs font-headline font-bold uppercase shadow-[2px_2px_0px_#1a1a1a] hover:bg-outline hover:text-surface transition-none flex items-center gap-1.5 self-end sm:self-auto cursor-pointer"
                title="Remover arquivo"
                @click.stop="removeFile"
              >
                <span class="material-symbols-outlined text-sm">delete</span>
                <span>Remover</span>
              </button>
            </ClickSpark>
          </div>
        </FadeContent>

        <!-- Action Button -->
        <div class="mt-5">
          <ClickSpark sparkColor="#1a1a1a" :sparkCount="10" :sparkRadius="24">
            <button
              class="w-full border-2 border-outline py-3 px-6 text-xs font-headline font-black uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
              :class="selectedFile && !loading
                ? 'bg-primary-container text-on-primary-container shadow-[4px_4px_0px_#1a1a1a] hover:bg-primary hover:text-on-primary active:translate-x-0.5 active:translate-y-0.5'
                : 'bg-surface-variant text-on-surface-variant opacity-60 cursor-not-allowed border-outline'"
              :disabled="!selectedFile || loading"
              @click="emit('extract')"
            >
              <span v-if="loading" class="brutal-spinner mr-1"></span>
              <span v-else class="material-symbols-outlined text-base">bolt</span>
              <span>{{ loading ? "PROCESSANDO NOTA FISCAL COM IA..." : "EXTRAIR DADOS DA NOTA (RF07)" }}</span>
            </button>
          </ClickSpark>
        </div>
      </div>
    </SpotlightCard>
  </FadeContent>
</template>
