<script setup lang="ts">
import { computed, ref } from "vue";
import {
  ClickSpark,
  DecryptedText,
  FadeContent,
  Magnet,
  SpotlightCard,
} from "./bits";
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
  <FadeContent :duration="450" direction="up">
    <SpotlightCard className="border-2 border-outline bg-surface-container-lowest p-5 shadow-[5px_5px_0px_#1a1a1a] mb-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-outline mb-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 bg-primary-fixed border border-outline text-[10px] font-headline font-black uppercase text-on-primary-fixed">
              <DecryptedText text="SCHEMA JSON • RF07" :speed="35" />
            </span>
            <h3 class="text-sm font-headline font-bold uppercase tracking-tight text-on-surface flex items-center gap-1.5">
              <span class="material-symbols-outlined text-base">data_object</span>
              Dados Estruturados em JSON Bruto
            </h3>
          </div>
          <p class="text-xs font-mono text-on-surface-variant mt-0.5">
            Payload tipado retornado pelo modelo Gemini para integração contábil
          </p>
        </div>

        <ClickSpark sparkColor="#ffcc00" :sparkCount="8">
          <Magnet :magnetStrength="2">
            <button
              class="border-2 border-outline px-3 py-1.5 text-xs font-headline font-bold uppercase transition-all duration-150 flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_#1a1a1a]"
              :class="copied
                ? 'bg-primary-fixed text-on-primary-fixed'
                : 'bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container'"
              @click="copyToClipboard"
            >
              <span class="material-symbols-outlined text-sm">
                {{ copied ? 'check' : 'content_copy' }}
              </span>
              <span>{{ copied ? "Copiado para Área de Transferência!" : "Copiar Payload JSON" }}</span>
            </button>
          </Magnet>
        </ClickSpark>
      </div>

      <!-- Terminal Code Box -->
      <div class="border-2 border-outline bg-primary text-surface p-4 font-mono text-xs max-h-[520px] overflow-auto shadow-[4px_4px_0px_#1a1a1a] transition-all duration-200">
        <pre class="leading-relaxed"><code>{{ jsonFormatted }}</code></pre>
      </div>

      <!-- Footer Note -->
      <div class="mt-3 flex items-center justify-between text-[11px] font-mono text-on-surface-variant">
        <span>Codificação: UTF-8 • Formato Canônico DOO UniRV</span>
        <span class="font-bold">STATUS: VÁLIDO</span>
      </div>
    </SpotlightCard>
  </FadeContent>
</template>
