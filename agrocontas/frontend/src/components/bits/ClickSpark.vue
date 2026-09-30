<script setup lang="ts">
import { ref } from "vue";

const props = withDefaults(
  defineProps<{
    sparkColor?: string;
    sparkSize?: number;
    sparkRadius?: number;
    sparkCount?: number;
    duration?: number;
  }>(),
  {
    sparkColor: "#1a1a1a",
    sparkSize: 8,
    sparkRadius: 18,
    sparkCount: 6,
    duration: 350,
  }
);

interface Spark {
  id: number;
  x: number;
  y: number;
  angle: number;
}

const sparks = ref<Spark[]>([]);
let sparkId = 0;

function handleClick(e: MouseEvent) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const currentSparks: Spark[] = [];
  for (let i = 0; i < props.sparkCount; i++) {
    const angle = (2 * Math.PI * i) / props.sparkCount;
    currentSparks.push({
      id: sparkId++,
      x,
      y,
      angle,
    });
  }

  sparks.value.push(...currentSparks);

  setTimeout(() => {
    sparks.value = sparks.value.filter(
      (s) => !currentSparks.some((cs) => cs.id === s.id)
    );
  }, props.duration);
}
</script>

<template>
  <div class="relative overflow-hidden inline-block" @click="handleClick">
    <slot />
    <!-- Sparks container -->
    <svg
      v-if="sparks.length > 0"
      class="pointer-events-none absolute inset-0 w-full h-full z-30"
    >
      <circle
        v-for="spark in sparks"
        :key="spark.id"
        :cx="spark.x + Math.cos(spark.angle) * sparkRadius"
        :cy="spark.y + Math.sin(spark.angle) * sparkRadius"
        :r="sparkSize / 2"
        :fill="sparkColor"
        class="spark-anim"
        :style="{ animationDuration: `${duration}ms` }"
      />
    </svg>
  </div>
</template>

<style scoped>
.spark-anim {
  animation: sparkFade cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes sparkFade {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(0.3);
  }
}
</style>
