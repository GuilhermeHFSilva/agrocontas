<script setup lang="ts">
import { computed, ref } from "vue";
import { NfeExtracao } from "../types/nfe";

const props = defineProps<{
  data: NfeExtracao;
}>();

const copied = ref(false);

const jsonFormatted = computed(() => {
  return JSON.stringify(props.data, null, 2);
});

async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(jsonFormatted.value);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = jsonFormatted.value;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  }
}
</script>

<template>
  <div>
    <div class="json-header">
      <div class="json-header-title">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="16 18 22 12 16 6"></polyline>
          <polyline points="8 6 2 12 8 18"></polyline>
        </svg>
        Dados em JSON
      </div>
      <button class="btn-copy" @click="copyToClipboard">
        <svg v-if="!copied" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        {{ copied ? "Copiado!" : "Copiar JSON" }}
      </button>
    </div>

    <pre class="json-wrapper"><code>{{ jsonFormatted }}</code></pre>

    <div class="json-footer">
      Este JSON contém todos os dados extraídos da nota fiscal e pode ser usado para integração com outros sistemas.
    </div>
  </div>
</template>
