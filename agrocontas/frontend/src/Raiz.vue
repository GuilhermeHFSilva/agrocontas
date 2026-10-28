<script setup lang="ts">
import { onMounted, ref } from "vue";
import App from "./App.vue";
import LoginView from "./views/LoginView.vue";

// null = verificando a sessão
const autenticado = ref<boolean | null>(null);

onMounted(async () => {
  try {
    autenticado.value = (await fetch("/api/sessao")).ok;
  } catch {
    autenticado.value = false;
  }
});

async function sair() {
  await fetch("/api/login", { method: "DELETE" });
  autenticado.value = false;
}
</script>

<template>
  <App v-if="autenticado" @sair="sair" />
  <LoginView v-else-if="autenticado === false" @entrou="autenticado = true" />
</template>
