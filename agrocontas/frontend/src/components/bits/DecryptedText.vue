<script setup lang="ts">
import { onMounted, ref, watch } from "vue";

const props = withDefaults(
  defineProps<{
    text: string;
    speed?: number;
    maxIterations?: number;
    sequential?: boolean;
    revealDirection?: "start" | "end" | "center";
    useOriginalCharsOnly?: boolean;
    characters?: string;
    className?: string;
    parentClassName?: string;
    animateOn?: "view" | "hover";
  }>(),
  {
    speed: 35,
    maxIterations: 8,
    sequential: true,
    revealDirection: "start",
    useOriginalCharsOnly: false,
    characters: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%*&",
    className: "",
    parentClassName: "",
    animateOn: "view",
  }
);

const displayText = ref(props.text);
const isHovering = ref(false);
const isScrambling = ref(false);
const containerRef = ref<HTMLElement | null>(null);

function getNextChar(original: string) {
  if (original === " ") return " ";
  if (props.useOriginalCharsOnly) {
    const chars = props.text.replace(/\s/g, "");
    return chars[Math.floor(Math.random() * chars.length)] || original;
  }
  return props.characters[Math.floor(Math.random() * props.characters.length)] || original;
}

function startAnimation() {
  if (isScrambling.value) return;
  isScrambling.value = true;

  const target = props.text;
  const length = target.length;
  let iteration = 0;
  const currentChars = target.split("").map((c) => (c === " " ? " " : getNextChar(c)));

  const interval = setInterval(() => {
    iteration++;

    for (let i = 0; i < length; i++) {
      if (target[i] === " ") {
        currentChars[i] = " ";
        continue;
      }

      const revealedThreshold = props.sequential ? Math.floor((iteration / props.maxIterations) * length) : props.maxIterations;

      if (i < revealedThreshold || iteration >= props.maxIterations) {
        currentChars[i] = target[i];
      } else {
        currentChars[i] = getNextChar(target[i]);
      }
    }

    displayText.value = currentChars.join("");

    if (iteration >= props.maxIterations) {
      clearInterval(interval);
      displayText.value = target;
      isScrambling.value = false;
    }
  }, props.speed);
}

onMounted(() => {
  if (props.animateOn === "view") {
    if (typeof IntersectionObserver === "undefined") {
      startAnimation();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            startAnimation();
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (containerRef.value) {
      observer.observe(containerRef.value);
    }
  }
});

watch(
  () => props.text,
  () => {
    startAnimation();
  }
);

function handleMouseEnter() {
  if (props.animateOn === "hover") {
    isHovering.value = true;
    startAnimation();
  }
}
</script>

<template>
  <span
    ref="containerRef"
    :class="['inline-block', parentClassName]"
    @mouseenter="handleMouseEnter"
  >
    <span :class="className">{{ displayText }}</span>
  </span>
</template>
