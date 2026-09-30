<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

const props = withDefaults(
  defineProps<{
    blur?: boolean;
    duration?: number;
    delay?: number;
    threshold?: number;
    initialOpacity?: number;
    direction?: "up" | "down" | "left" | "right" | "none";
    distance?: number;
  }>(),
  {
    blur: true,
    duration: 500,
    delay: 0,
    threshold: 0.1,
    initialOpacity: 0,
    direction: "up",
    distance: 12,
  }
);

const isVisible = ref(false);
const targetRef = ref<HTMLElement | null>(null);

onMounted(() => {
  if (typeof IntersectionObserver === "undefined") {
    isVisible.value = true;
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          isVisible.value = true;
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: props.threshold }
  );

  if (targetRef.value) {
    observer.observe(targetRef.value);
  }
});

const transitionStyle = computed(() => {
  let transform = "none";
  if (!isVisible.value && props.direction !== "none") {
    switch (props.direction) {
      case "up":
        transform = `translate3d(0, ${props.distance}px, 0)`;
        break;
      case "down":
        transform = `translate3d(0, -${props.distance}px, 0)`;
        break;
      case "left":
        transform = `translate3d(${props.distance}px, 0, 0)`;
        break;
      case "right":
        transform = `translate3d(-${props.distance}px, 0, 0)`;
        break;
    }
  }

  return {
    opacity: isVisible.value ? 1 : props.initialOpacity,
    transform,
    filter: props.blur ? (isVisible.value ? "blur(0px)" : "blur(4px)") : "none",
    transition: `opacity ${props.duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${props.delay}ms, transform ${props.duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${props.delay}ms, filter ${props.duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${props.delay}ms`,
    willChange: "opacity, transform, filter",
  };
});
</script>

<template>
  <div ref="targetRef" :style="transitionStyle">
    <slot />
  </div>
</template>
