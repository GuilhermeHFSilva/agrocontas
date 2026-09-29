<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";

const props = withDefaults(
  defineProps<{
    to: number;
    from?: number;
    duration?: number;
    currency?: boolean;
    prefix?: string;
    suffix?: string;
    decimals?: number;
  }>(),
  {
    from: 0,
    duration: 0.8,
    currency: false,
    prefix: "",
    suffix: "",
    decimals: 2,
  }
);

const current = ref(props.from);
const targetRef = ref<HTMLElement | null>(null);

function startCount() {
  const start = props.from;
  const end = props.to;
  const durationMs = props.duration * 1000;
  const startTime = performance.now();

  function update(now: number) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / durationMs, 1);
    // Easing out cubic: 1 - Math.pow(1 - progress, 3)
    const eased = 1 - Math.pow(1 - progress, 3);
    current.value = start + (end - start) * eased;

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      current.value = end;
    }
  }

  requestAnimationFrame(update);
}

onMounted(() => {
  if (typeof IntersectionObserver === "undefined") {
    startCount();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          startCount();
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  if (targetRef.value) {
    observer.observe(targetRef.value);
  }
});

watch(
  () => props.to,
  () => {
    startCount();
  }
);

const formatted = computed(() => {
  if (props.currency) {
    return current.value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: props.decimals,
      maximumFractionDigits: props.decimals,
    });
  }

  return (
    props.prefix +
    current.value.toLocaleString("pt-BR", {
      minimumFractionDigits: props.decimals,
      maximumFractionDigits: props.decimals,
    }) +
    props.suffix
  );
});
</script>

<template>
  <span ref="targetRef" class="inline-block font-mono">
    {{ formatted }}
  </span>
</template>
