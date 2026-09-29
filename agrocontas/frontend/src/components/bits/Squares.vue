<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

const props = withDefaults(
  defineProps<{
    direction?: "diagonal" | "up" | "right" | "down" | "left";
    speed?: number;
    borderColor?: string;
    squareSize?: number;
    hoverFillColor?: string;
  }>(),
  {
    direction: "diagonal",
    speed: 0.35,
    borderColor: "rgba(26, 26, 26, 0.05)",
    squareSize: 45,
    hoverFillColor: "rgba(255, 204, 0, 0.14)",
  }
);

const canvasRef = ref<HTMLCanvasElement | null>(null);
let animationFrameId: number | null = null;
let gridOffset = { x: 0, y: 0 };
let currentMousePos: { x: number; y: number } | null = null;

function updateAnimation() {
  const effectiveSpeed = Math.max(props.speed, 0.1);
  const size = props.squareSize;

  switch (props.direction) {
    case "right":
      gridOffset.x = (gridOffset.x - effectiveSpeed + size) % size;
      break;
    case "left":
      gridOffset.x = (gridOffset.x + effectiveSpeed + size) % size;
      break;
    case "up":
      gridOffset.y = (gridOffset.y + effectiveSpeed + size) % size;
      break;
    case "down":
      gridOffset.y = (gridOffset.y - effectiveSpeed + size) % size;
      break;
    case "diagonal":
      gridOffset.x = (gridOffset.x - effectiveSpeed + size) % size;
      gridOffset.y = (gridOffset.y - effectiveSpeed + size) % size;
      break;
  }

  drawGrid();
  animationFrameId = requestAnimationFrame(updateAnimation);
}

function drawGrid() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const size = props.squareSize;
  const offsetX = ((gridOffset.x % size) + size) % size;
  const offsetY = ((gridOffset.y % size) + size) % size;

  ctx.lineWidth = 1;
  ctx.strokeStyle = props.borderColor;

  // Itera cobrindo do topo-esquerda além dos limites da tela até a borda inferior-direita
  for (let x = -offsetX; x < canvas.width + size; x += size) {
    for (let y = -offsetY; y < canvas.height + size; y += size) {
      // Verifica com exatidão se o mouse atual está dentro deste quadrado renderizado
      if (
        currentMousePos &&
        currentMousePos.x >= x &&
        currentMousePos.x < x + size &&
        currentMousePos.y >= y &&
        currentMousePos.y < y + size
      ) {
        ctx.fillStyle = props.hoverFillColor;
        ctx.fillRect(x, y, size, size);
      }

      ctx.strokeRect(x, y, size, size);
    }
  }
}

function handleResize() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  drawGrid();
}

function handleMouseMove(event: MouseEvent) {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  currentMousePos = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function handleMouseLeave() {
  currentMousePos = null;
}

onMounted(() => {
  handleResize();
  window.addEventListener("resize", handleResize);
  window.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseleave", handleMouseLeave);
  animationFrameId = requestAnimationFrame(updateAnimation);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
  window.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mouseleave", handleMouseLeave);
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
  }
});
</script>

<template>
  <canvas
    ref="canvasRef"
    class="fixed inset-0 pointer-events-none w-full h-full z-0 opacity-80"
  />
</template>
