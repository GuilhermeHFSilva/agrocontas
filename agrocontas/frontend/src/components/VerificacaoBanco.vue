<script setup lang="ts">
import { computed } from "vue";
import { ConsultaCadastro, LancamentoNfe, VerificacaoNfe } from "../types/conta";

const props = defineProps<{
  verificacao: VerificacaoNfe;
  lancamento: LancamentoNfe | null;
  saving: boolean;
}>();

const emit = defineEmits<{
  (e: "lancar"): void;
}>();

const itens = computed(() => [
  { titulo: "Fornecedor", doc: "CNPJ", consulta: props.verificacao.fornecedor },
  { titulo: "Faturado", doc: "CPF/CNPJ", consulta: props.verificacao.faturado },
  { titulo: "Despesa", doc: "", consulta: props.verificacao.despesa },
]);

const pendentes = computed(() => itens.value.filter((i) => !i.consulta.existe).length);

function textoResultado(consulta: ConsultaCadastro): string {
  if (!consulta.existe) return "NÃO EXISTE";
  const inativo = consulta.status === "INATIVO" ? " (INATIVO - será reativado)" : "";
  return `EXISTE – ID: ${consulta.id}${inativo}`;
}

function textoCriacao(criado: boolean, reativado: boolean): string {
  if (criado) return "criado";
  return reativado ? "reativado" : "já existente";
}
</script>

<template>
  <section class="border-2 border-outline bg-surface-container-lowest p-5 shadow-[5px_5px_0px_#1a1a1a] mb-6">
    <div class="flex items-center gap-2 pb-3 border-b-2 border-outline">
      <span class="px-2 py-0.5 bg-primary-fixed border border-outline text-[10px] font-headline font-black uppercase text-on-primary-fixed">
        2ª Etapa
      </span>
      <h2 class="text-base sm:text-lg font-headline font-bold uppercase tracking-tight text-on-surface">
        Análise dos Dados no Banco
      </h2>
    </div>

    <div class="mt-4 border-2 border-outline p-4 font-mono text-sm space-y-4">
      <div v-for="item in itens" :key="item.titulo">
        <div class="font-bold uppercase">{{ item.titulo }}:</div>
        <div>{{ item.consulta.nome }}</div>
        <div v-if="item.consulta.cpfCnpj">{{ item.doc }}: {{ item.consulta.cpfCnpj }}</div>
        <div
          class="font-bold"
          :class="item.consulta.existe ? 'text-tertiary' : 'text-secondary'"
        >
          {{ textoResultado(item.consulta) }}
        </div>
      </div>
    </div>

    <div
      v-if="verificacao.contaExistente && !lancamento"
      class="mt-4 p-3 bg-secondary-container border-2 border-secondary text-xs font-mono flex items-center gap-2"
    >
      <span class="material-symbols-outlined text-base text-secondary">block</span>
      Esta nota já foi lançada para o fornecedor (conta ID {{ verificacao.contaExistente.id }}).
    </div>

    <div v-if="lancamento" class="mt-4 p-4 bg-surface-container-low border-2 border-outline font-mono text-xs space-y-1">
      <div class="flex items-center gap-2 font-headline font-black text-sm uppercase">
        <span class="material-symbols-outlined text-base">check_circle</span>
        Registro lançado com sucesso!
      </div>
      <div>Fornecedor ID {{ lancamento.fornecedor.id }} — {{ textoCriacao(lancamento.fornecedor.criado, lancamento.fornecedor.reativado) }}</div>
      <div>Faturado ID {{ lancamento.faturado.id }} — {{ textoCriacao(lancamento.faturado.criado, lancamento.faturado.reativado) }}</div>
      <div>Despesa ID {{ lancamento.despesa.id }} — {{ textoCriacao(lancamento.despesa.criado, lancamento.despesa.reativado) }}</div>
      <div>
        Conta a Pagar ID {{ lancamento.conta.id }} (NF {{ lancamento.conta.numeroDocumento }}) com
        {{ lancamento.parcelas.length }} {{ lancamento.parcelas.length === 1 ? "parcela" : "parcelas" }}
        (IDs {{ lancamento.parcelas.map((p) => p.id).join(", ") }})
      </div>
    </div>

    <div v-else class="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <p class="text-xs font-mono text-on-surface-variant">
        <template v-if="pendentes > 0">
          Ao lançar, {{ pendentes }} cadastro(s) ausente(s) serão criados, junto com o movimento e suas parcelas.
        </template>
        <template v-else>
          Todos os cadastros existem. Será criado apenas o movimento e suas parcelas.
        </template>
      </p>
      <button
        class="bg-primary text-on-primary border-2 border-outline px-4 py-2 text-xs font-headline font-bold uppercase shadow-[3px_3px_0px_#1a1a1a] hover:bg-surface hover:text-on-surface transition-none flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="saving || !!verificacao.contaExistente"
        @click="emit('lancar')"
      >
        <span v-if="saving" class="brutal-spinner"></span>
        <span v-else class="material-symbols-outlined text-sm">save</span>
        {{ saving ? "Lançando..." : "Confirmar e Lançar" }}
      </button>
    </div>
  </section>
</template>
