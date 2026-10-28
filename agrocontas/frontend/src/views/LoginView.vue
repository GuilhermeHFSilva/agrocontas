<script setup lang="ts">
import { ref } from "vue";
import { BlurText, ClickSpark, DecryptedText, FadeContent, Magnet, SpotlightCard, Squares } from "../components/bits";

const emit = defineEmits<{ entrou: [] }>();
const usuario = ref("");
const senha = ref("");
const mostrarSenha = ref(false);
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
    const text = await res.text();
    let data: any = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      throw new Error(`Erro ${res.status}: O servidor não retornou resposta JSON válida.`);
    }
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
              <div class="relative flex items-center">
                <input
                  v-model="senha"
                  :type="mostrarSenha ? 'text' : 'password'"
                  autocomplete="current-password"
                  required
                  class="w-full border-2 border-outline bg-surface pl-3 pr-10 py-2 text-sm font-normal normal-case focus:outline-none focus:bg-primary-container/20 focus:shadow-[2px_2px_0px_#1a1a1a]"
                />
                <button
                  type="button"
                  @click="mostrarSenha = !mostrarSenha"
                  :aria-label="mostrarSenha ? 'Ocultar senha' : 'Exibir senha'"
                  :title="mostrarSenha ? 'Ocultar senha' : 'Exibir senha'"
                  class="absolute right-2.5 p-1 text-on-surface-variant hover:text-on-surface focus:outline-none transition-colors cursor-pointer"
                >
                  <svg
                    v-if="mostrarSenha"
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <svg
                    v-else
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                    <line x1="2" x2="22" y1="2" y2="22" />
                  </svg>
                </button>
              </div>
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
