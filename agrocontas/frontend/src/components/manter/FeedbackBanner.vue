<script setup lang="ts">
defineProps<{
  type: "success" | "error";
  message: string;
}>();

const emit = defineEmits<{
  (e: "dismiss"): void;
}>();
</script>

<template>
  <div
    class="w-full border-2 p-3 mb-4 flex items-start gap-2.5 font-mono text-xs"
    :class="
      type === 'success'
        ? 'bg-primary-container border-outline shadow-[3px_3px_0px_#1a1a1a] font-bold'
        : 'bg-secondary-container border-secondary shadow-[3px_3px_0px_#e63b2e]'
    "
    role="alert"
  >
    <span class="material-symbols-outlined text-base shrink-0" :class="{ 'text-secondary': type === 'error' }">
      {{ type === "success" ? "check_circle" : "error" }}
    </span>
    <span class="flex-1">{{ message }}</span>
    <button type="button" class="cursor-pointer" title="Dispensar" @click="emit('dismiss')">
      <span class="material-symbols-outlined text-base">close</span>
    </button>
  </div>
</template>
