<script setup lang="ts">
import { ref } from "vue";

const props = withDefaults(
  defineProps<{
    padding?: number;
    disabled?: boolean;
    magnetStrength?: number;
    activeTransition?: string;
    inactiveTransition?: string;
    wrapperClass?: string;
  }>(),
  {
    padding: 30,
    disabled: false,
    magnetStrength: 2,
    activeTransition: "transform 0.15s cubic-bezier(0.25, 1, 0.5, 1)",
    inactiveTransition: "transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)",
    wrapperClass: "inline-block",
  }
);

const magnetRef = ref<HTMLElement | null>(null);
const position = ref({ x: 0, y: 0 });
const isHovered = ref(false);

function handleMouseMove(e: MouseEvent) {
  if (props.disabled || !magnetRef.value) return;

  const rect = magnetRef.value.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const dist = Math.hypot(e.clientX - centerX, e.clientY - centerY);

  if (dist < Math.max(rect.width, rect.height) + props.padding) {
    isHovered.value = true;
    const offsetX = (e.clientX - centerX) / props.magnetStrength;
    const offsetY = (e.clientY - centerY) / props.magnetStrength;
    position.value = { x: offsetX, y: offsetY };
  } else {
    reset();
  }
}

function reset() {
  isHovered.value = false;
  position.value = { x: 0, y: 0 };
}
</script>

<template>
  <div
    ref="magnetRef"
    :class="wrapperClass"
    :style="{
      transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
      transition: isHovered ? activeTransition : inactiveTransition,
      willChange: 'transform',
    }"
    @mousemove="handleMouseMove"
    @mouseleave="reset"
  >
    <slot />
  </div>
</template>
