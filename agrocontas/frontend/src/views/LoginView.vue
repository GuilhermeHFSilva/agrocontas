<script setup lang="ts">
import { ref } from "vue";
import { BlurText, ClickSpark, DecryptedText, FadeContent, Magnet, SpotlightCard, Squares } from "../components/bits";

const emit = defineEmits<{ entrou: [] }>();
const usuario = ref("");
const senha = ref("");
const erro = ref("");
const loading = ref(false);

async function entrar() {
  loading.value = true;
  erro.value = "";
  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario: usuario.value, senha: senha.value }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Falha ao entrar.");
    emit("entrou");
  } catch (e) {
    erro.value = e instanceof Error ? e.message : "Falha ao entrar.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="relative min-h-screen bg-surface font-body text-on-surface flex items-center justify-center px-4 overflow-hidden">
    <Squares direction="diagonal" :speed="0.6" :squareSize="48" borderColor="rgba(26, 26, 26, 0.09)" hoverFillColor="rgba(255, 204, 0, 0.25)" />

    <!-- Blocos flutuantes no estilo brutalista do tema -->
    <div class="login-bloco w-16 h-16 bg-primary-container top-[12%] left-[10%]" aria-hidden="true"></div>
    <div class="login-bloco w-10 h-10 bg-secondary top-[70%] left-[16%] [animation-delay:-3s]" aria-hidden="true"></div>
    <div class="login-bloco w-20 h-20 bg-tertiary-container top-[18%] right-[12%] [animation-delay:-5s]" aria-hidden="true"></div>
    <div class="login-bloco w-12 h-12 bg-[#2e9e4f] top-[75%] right-[10%] [animation-delay:-8s]" aria-hidden="true"></div>

    <FadeContent :duration="600" direction="up" class="relative z-10 w-full max-w-sm">
      <SpotlightCard className="bg-surface-bright border-2 border-outline shadow-[6px_6px_0px_#1a1a1a]">
        <ClickSpark sparkColor="#1a1a1a" class="!block w-full">
          <form class="relative z-20 p-6 flex flex-col gap-4 w-full" @submit.prevent="entrar">
            <div class="flex items-center gap-3">
              <Magnet :magnetStrength="3" :padding="20">
                <div class="w-12 h-12 bg-primary-container border-2 border-outline flex items-center justify-center font-headline font-black text-xl text-on-primary-container shadow-[2px_2px_0px_#1a1a1a]">
                  AC
                </div>
              </Magnet>
              <div>
                <BlurText text="AgroContas" className="font-headline font-black text-xl uppercase tracking-tight leading-none" />
                <p class="text-[11px] font-mono text-on-surface-variant mt-1">
                  <DecryptedText text="Gestão Financeira Rural" :speed="40" :maxIterations="12" animateOn="view" />
                </p>
              </div>
            </div>

            <label class="flex flex-col gap-1 text-xs font-mono font-bold uppercase">
              Usuário
              <input
                v-model="usuario"
                type="text"
                autocomplete="username"
                autofocus
                required
                class="border-2 border-outline bg-surface px-3 py-2 text-sm font-normal normal-case focus:outline-none focus:bg-primary-container/20 focus:shadow-[2px_2px_0px_#1a1a1a]"
              />
            </label>
            <label class="flex flex-col gap-1 text-xs font-mono font-bold uppercase">
              Senha
              <input
                v-model="senha"
                type="password"
                autocomplete="current-password"
                required
                class="border-2 border-outline bg-surface px-3 py-2 text-sm font-normal normal-case focus:outline-none focus:bg-primary-container/20 focus:shadow-[2px_2px_0px_#1a1a1a]"
              />
            </label>

            <p v-if="erro" role="alert" class="text-xs font-mono text-secondary">{{ erro }}</p>

            <button
              type="submit"
              :disabled="loading"
              class="px-3.5 py-2 text-xs font-headline font-bold uppercase border-2 border-outline bg-primary-container text-on-primary-container shadow-[2px_2px_0px_#1a1a1a] cursor-pointer transition-all duration-150 hover:translate-x-px hover:translate-y-px hover:shadow-none disabled:opacity-60"
            >
              {{ loading ? "Entrando..." : "Entrar" }}
            </button>
          </form>
        </ClickSpark>
      </SpotlightCard>
    </FadeContent>
  </div>
</template>

<style scoped>
.login-bloco {
  position: absolute;
  border: 2px solid var(--outline);
  box-shadow: 3px 3px 0 var(--outline);
  animation: login-flutuar 14s ease-in-out infinite;
  pointer-events: none;
}
@keyframes login-flutuar {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-28px) rotate(18deg); }
}
@media (prefers-reduced-motion: reduce) {
  .login-bloco { animation: none; }
}
</style>
