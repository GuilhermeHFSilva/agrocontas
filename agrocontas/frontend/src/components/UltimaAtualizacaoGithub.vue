<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

// Repositório e branch exibidos na tela principal (requisito: "Código Última Atualização no Github").
const REPO = "GuilhermeHFSilva/agrocontas";
const BRANCH = "main";
const API_URL = `https://api.github.com/repos/${REPO}/commits/${BRANCH}`;

// A API pública do GitHub limita a 60 requisições/hora por IP; o cache em sessionStorage evita estourar o limite.
const CACHE_KEY = "agrocontas:ultimo-commit";
const CACHE_TTL_MS = 5 * 60 * 1000;

interface UltimoCommit {
  sha: string;
  mensagem: string;
  data: string;
  url: string;
}

interface CacheEntry {
  salvoEm: number;
  commit: UltimoCommit;
}

interface GithubCommitResponse {
  sha: string;
  html_url: string;
  commit: { message: string; committer: { date: string } };
}

const commit = ref<UltimoCommit | null>(null);
const loading = ref(true);
const failed = ref(false);

const shaCurto = computed(() => commit.value?.sha.slice(0, 7) ?? "");

const dataFormatada = computed(() =>
  commit.value
    ? new Date(commit.value.data).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
    : "",
);

function lerCache(): CacheEntry | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as CacheEntry) : null;
  } catch {
    return null;
  }
}

function salvarCache(entry: CacheEntry) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // Armazenamento indisponível (modo privado, cota): segue sem cache.
  }
}

async function carregar() {
  const cache = lerCache();
  if (cache && Date.now() - cache.salvoEm < CACHE_TTL_MS) {
    commit.value = cache.commit;
    loading.value = false;
    return;
  }

  try {
    const res = await fetch(API_URL, { headers: { Accept: "application/vnd.github+json" } });
    if (!res.ok) throw new Error(`GitHub respondeu ${res.status}`);
    const json = (await res.json()) as GithubCommitResponse;
    commit.value = {
      sha: json.sha,
      mensagem: json.commit.message.split("\n")[0],
      data: json.commit.committer.date,
      url: json.html_url,
    };
    salvarCache({ salvoEm: Date.now(), commit: commit.value });
  } catch {
    // Em caso de falha (rede, limite de taxa), reaproveita o último valor conhecido, mesmo expirado.
    if (cache) commit.value = cache.commit;
    else failed.value = true;
  } finally {
    loading.value = false;
  }
}

onMounted(carregar);
</script>

<template>
  <div class="relative">
    <!-- Seta curvada decorativa apontando para o selo (só em telas largas, onde há espaço livre ao lado). -->
    <svg
      v-if="!failed"
      class="seta-github hidden lg:block absolute right-full top-1/2 mr-1.5 pointer-events-none"
      style="margin-top: -20px"
      width="48"
      height="36"
      viewBox="0 0 48 36"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 5 C 7 30, 28 34, 42 20"
        stroke="#1a1a1a"
        stroke-width="2"
        stroke-linecap="round"
        stroke-dasharray="1 5"
      />
      <path
        d="M33.3 22.3 L42 20 L39.7 28.7"
        stroke="#1a1a1a"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <circle cx="4" cy="5" r="2.5" fill="#ffcc00" stroke="#1a1a1a" stroke-width="1.5" />
    </svg>

    <a
      v-if="commit"
      :href="commit.url"
      target="_blank"
      rel="noopener noreferrer"
      class="flex items-center gap-2 px-2.5 py-1 bg-surface-container border border-outline shadow-[2px_2px_0px_#1a1a1a] text-[11px] font-mono text-on-surface hover:bg-surface-variant"
      :title="`${commit.mensagem} (${REPO}@${BRANCH})`"
    >
      <span class="material-symbols-outlined text-sm">commit</span>
      <span>Última atualização no GitHub:</span>
      <span class="font-bold">{{ dataFormatada }}</span>
      <span class="bg-primary-container border border-outline px-1 text-on-primary-container">{{ shaCurto }}</span>
    </a>

    <div
      v-else
      class="flex items-center gap-2 px-2.5 py-1 bg-surface-container border border-outline shadow-[2px_2px_0px_#1a1a1a] text-[11px] font-mono text-on-surface-variant"
    >
      <span class="material-symbols-outlined text-sm">commit</span>
      <span v-if="loading">Consultando GitHub...</span>
      <span v-else-if="failed">Última atualização no GitHub indisponível</span>
    </div>
  </div>
</template>

<style scoped>
/* Leve "empurrãozinho" da seta em direção ao selo; desligado para quem prefere menos movimento. */
@keyframes seta-empurra {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(3px); }
}

.seta-github {
  animation: seta-empurra 2.6s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .seta-github {
    animation: none;
  }
}
</style>
