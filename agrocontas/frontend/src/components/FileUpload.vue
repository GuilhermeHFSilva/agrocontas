<script setup lang="ts">
import { ref } from "vue";

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
  <div class="card">
    <div class="card-title">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="17 8 12 3 7 8"></polyline>
        <line x1="12" y1="3" x2="12" y2="15"></line>
      </svg>
      Upload do PDF
    </div>

    <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0.75rem;">
      Selecione o arquivo PDF da nota fiscal
    </p>

    <div
      class="drop-area"
      :class="{ 'drag-over': isDragging }"
      @click="triggerFileInput"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <input
        ref="fileInputRef"
        type="file"
        accept="application/pdf"
        class="file-input-hidden"
        @change="handleFileInputChange"
      />

      <svg class="drop-area-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>

      <div style="font-weight: 600; font-size: 0.95rem; margin-bottom: 0.35rem;">
        Arraste e solte o PDF aqui, ou clique para navegar
      </div>
      <div style="font-size: 0.8rem; color: var(--text-muted);">
        Suporta documentos fiscais DANFE, NF-e e NFS-e em formato PDF
      </div>
    </div>

    <div v-if="selectedFile" class="file-selected-card">
      <div class="file-info">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
        </svg>
        <span class="file-name">{{ selectedFile.name }}</span>
        <span class="file-size">{{ formatFileSize(selectedFile.size) }}</span>
      </div>
      <button class="btn-remove" title="Remover arquivo" @click.stop="removeFile">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>

    <button
      class="btn-primary"
      :class="{ 'btn-active-green': selectedFile && !loading }"
      :disabled="!selectedFile || loading"
      @click="emit('extract')"
    >
      <span v-if="loading" class="spinner"></span>
      <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
      </svg>
      {{ loading ? "PROCESSANDO NOTA FISCAL..." : "EXTRAIR DADOS" }}
    </button>
  </div>
</template>
