<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

const props = withDefaults(
  defineProps<{
    text: string;
    delay?: number;
    className?: string;
    animateBy?: "words" | "letters";
    direction?: "top" | "bottom";
    threshold?: number;
  }>(),
  {
    delay: 40,
    className: "",
    animateBy: "words",
    direction: "top",
    threshold: 0.1,
  }
);

const inView = ref(false);
const containerRef = ref<HTMLElement | null>(null);

const elements = computed(() => {
  if (props.animateBy === "words") {
    return props.text.split(" ");
  }
  return props.text.split("");
});

onMounted(() => {
  if (typeof IntersectionObserver === "undefined") {
    inView.value = true;
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          inView.value = true;
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: props.threshold }
  );

  if (containerRef.value) {
    observer.observe(containerRef.value);
  }
});

function getSpanStyle(index: number) {
  const yOffset = props.direction === "top" ? -8 : 8;
  const isAnimated = inView.value;

  return {
    display: "inline-block",
    filter: isAnimated ? "blur(0px)" : "blur(5px)",
    opacity: isAnimated ? 1 : 0,
    transform: isAnimated ? "translate3d(0, 0, 0)" : `translate3d(0, ${yOffset}px, 0)`,
    transition: `all 450ms cubic-bezier(0.16, 1, 0.3, 1) ${index * props.delay}ms`,
    willChange: "transform, filter, opacity",
  };
}
</script>

<template>
  <span ref="containerRef" :class="['inline-block', className]">
    <template v-for="(item, index) in elements" :key="index">
      <span :style="getSpanStyle(index)">
        {{ item }}
      </span>
      <span v-if="animateBy === 'words' && index < elements.length - 1">&nbsp;</span>
    </template>
  </span>
</template>
