<script setup lang="ts">
import { ref } from "vue";

const props = withDefaults(
  defineProps<{
    spotlightColor?: string;
    className?: string;
  }>(),
  {
    spotlightColor: "rgba(255, 204, 0, 0.14)",
    className: "",
  }
);

const cardRef = ref<HTMLElement | null>(null);
const position = ref({ x: 0, y: 0 });
const opacity = ref(0);

function handleMouseMove(e: MouseEvent) {
  if (!cardRef.value) return;
  const rect = cardRef.value.getBoundingClientRect();
  position.value = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };
}

function handleMouseEnter() {
  opacity.value = 1;
}

function handleMouseLeave() {
  opacity.value = 0;
}
</script>

<template>
  <div
    ref="cardRef"
    :class="['relative overflow-hidden', className]"
    @mousemove="handleMouseMove"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- Spotlight highlight layer -->
    <div
      class="pointer-events-none absolute -inset-px transition-opacity duration-300 z-10"
      :style="{
        opacity: opacity,
        background: `radial-gradient(400px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 65%)`,
      }"
    />
    <div class="relative z-20">
      <slot />
    </div>
  </div>
</template>
