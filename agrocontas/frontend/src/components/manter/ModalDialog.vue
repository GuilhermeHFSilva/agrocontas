<script setup lang="ts">
defineProps<{
  open: boolean;
  title: string;
  tag?: string;
  wide?: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
    @click.self="emit('close')"
  >
    <div
      class="w-full bg-surface-container-lowest border-2 border-outline p-5 shadow-[8px_8px_0px_#1a1a1a]"
      :class="wide ? 'max-w-3xl' : 'max-w-xl'"
      role="dialog"
      aria-modal="true"
      :aria-label="title"
    >
      <div class="flex items-start justify-between gap-3 pb-3 border-b-2 border-outline mb-4">
        <div>
          <div
            v-if="tag"
            class="inline-block px-2 py-0.5 bg-primary-fixed border border-outline text-[10px] font-headline font-black uppercase text-on-primary-fixed mb-1"
          >
            {{ tag }}
          </div>
          <h2 class="text-base font-headline font-bold uppercase tracking-tight text-on-surface">{{ title }}</h2>
        </div>
        <button
          type="button"
          class="w-8 h-8 shrink-0 bg-surface-variant border-2 border-outline flex items-center justify-center hover:bg-secondary hover:text-on-secondary cursor-pointer shadow-[2px_2px_0px_#1a1a1a]"
          title="Fechar"
          @click="emit('close')"
        >
          <span class="material-symbols-outlined text-base font-bold">close</span>
        </button>
      </div>

      <slot />
    </div>
  </div>
</template>
