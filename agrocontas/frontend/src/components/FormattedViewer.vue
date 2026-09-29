<script setup lang="ts">
import { NfeExtracao } from "../types/nfe";

defineProps<{
  data: NfeExtracao;
}>();

function formatCurrency(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) {
    return "R$ 0,00";
  }
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return "-";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}
</script>

<template>
  <div class="space-y-6">
    <!-- Block 1: Classificação Operacional / Plano de Contas Rural (RF02) -->
    <div class="border-2 border-outline bg-surface-container-lowest p-5 shadow-[5px_5px_0px_#1a1a1a]">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-outline">
        <div>
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 bg-primary-fixed border border-outline text-[10px] font-headline font-black uppercase text-on-primary-fixed">
              RF02 • PLANO DE CONTAS
            </span>
            <h2 class="text-base sm:text-lg font-headline font-bold uppercase tracking-tight text-on-surface">
              Classificação Semântica da Despesa / Categoria Rural
            </h2>
          </div>
          <p class="text-xs font-mono text-on-surface-variant mt-0.5">
            Interpretação automática de rubricas operacionais via modelo Gemini
          </p>
        </div>

        <div class="flex items-center gap-1.5 px-2.5 py-1 bg-primary-container border border-outline text-xs font-headline font-bold uppercase text-on-primary-container">
          <span class="material-symbols-outlined text-sm">psychology</span>
          <span>Inferência por IA</span>
        </div>
      </div>

      <div class="mt-4">
        <div class="p-3 bg-surface border-2 border-outline shadow-[3px_3px_0px_#1a1a1a] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div class="flex items-center gap-3">
            <span class="w-6 h-6 bg-outline text-surface text-xs font-mono font-bold flex items-center justify-center">
              #
            </span>
            <div>
              <span class="text-[11px] font-mono uppercase text-on-surface-variant font-bold block">
                Rubrica Operacional Identificada:
              </span>
              <span class="text-base sm:text-lg font-headline font-black uppercase text-on-surface">
                {{ data.classificacaoDespesa || "Não classificada" }}
              </span>
            </div>
          </div>
          <span class="px-2 py-1 bg-surface-variant border border-outline text-[11px] font-mono font-bold uppercase self-start sm:self-auto">
            Status: Mapeado
          </span>
        </div>

        <div
          v-if="data.classificacoesDespesa && data.classificacoesDespesa.length > 0"
          class="mt-3 flex flex-col gap-2"
        >
          <div
            v-for="(item, idx) in data.classificacoesDespesa"
            :key="idx"
            class="p-2.5 bg-surface-container-low border border-outline font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
          >
            <div class="flex items-center gap-2">
              <span class="px-1.5 py-0.5 bg-tertiary-fixed border border-outline text-[10px] font-mono font-bold uppercase text-on-tertiary-fixed">
                Subcategoria
              </span>
              <strong class="font-headline uppercase text-on-surface">
                {{ item.subcategoria || "Geral" }}
              </strong>
            </div>
            <span v-if="item.justificativa" class="text-on-surface-variant text-[11px]">
              {{ item.justificativa }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Block 2: Parceiros Comerciais (RF01 - Fornecedor e Faturado) -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Fornecedor (Emitente) -->
      <div class="border-2 border-outline bg-surface-container-lowest p-5 shadow-[4px_4px_0px_#1a1a1a] flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between pb-3 border-b-2 border-outline mb-4">
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 bg-primary-fixed border border-outline text-[10px] font-headline font-black uppercase text-on-primary-fixed">
                RF01
              </span>
              <h3 class="text-sm font-headline font-bold uppercase tracking-tight text-on-surface flex items-center gap-1.5">
                <span class="material-symbols-outlined text-base">storefront</span>
                Fornecedor (Emitente)
              </h3>
            </div>
            <span class="text-[10px] font-mono uppercase bg-surface-variant px-1.5 py-0.5 border border-outline">
              Vendedor
            </span>
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between p-2 bg-surface-container-low border border-outline font-mono text-xs">
              <span class="text-on-surface-variant font-medium">Razão Social:</span>
              <span class="font-bold text-on-surface text-right truncate max-w-[200px]" :title="data.fornecedor.razaoSocial || undefined">
                {{ data.fornecedor.razaoSocial || "-" }}
              </span>
            </div>

            <div class="flex items-center justify-between p-2 bg-surface-container-low border border-outline font-mono text-xs">
              <span class="text-on-surface-variant font-medium">Nome Fantasia:</span>
              <span class="font-bold text-on-surface text-right truncate max-w-[200px]" :title="data.fornecedor.nomeFantasia || undefined">
                {{ data.fornecedor.nomeFantasia || "-" }}
              </span>
            </div>

            <div class="flex items-center justify-between p-2 bg-surface-container-low border border-outline font-mono text-xs">
              <span class="text-on-surface-variant font-medium">CNPJ:</span>
              <span class="font-bold text-on-surface">
                {{ data.fornecedor.cnpj || "-" }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Faturado (Destinatário / Titular) -->
      <div class="border-2 border-outline bg-surface-container-lowest p-5 shadow-[4px_4px_0px_#1a1a1a] flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between pb-3 border-b-2 border-outline mb-4">
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 bg-primary-fixed border border-outline text-[10px] font-headline font-black uppercase text-on-primary-fixed">
                RF01
              </span>
              <h3 class="text-sm font-headline font-bold uppercase tracking-tight text-on-surface flex items-center gap-1.5">
                <span class="material-symbols-outlined text-base">person</span>
                Faturado (Destinatário)
              </h3>
            </div>
            <span class="text-[10px] font-mono uppercase bg-surface-variant px-1.5 py-0.5 border border-outline">
              Titular Rural
            </span>
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between p-2 bg-surface-container-low border border-outline font-mono text-xs">
              <span class="text-on-surface-variant font-medium">Nome Completo:</span>
              <span class="font-bold text-on-surface text-right truncate max-w-[200px]" :title="data.faturado.nomeCompleto || undefined">
                {{ data.faturado.nomeCompleto || "-" }}
              </span>
            </div>

            <div class="flex items-center justify-between p-2 bg-surface-container-low border border-outline font-mono text-xs">
              <span class="text-on-surface-variant font-medium">CPF / CNPJ:</span>
              <span class="font-bold text-on-surface">
                {{ data.faturado.cpf || "-" }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Block 3: Metadados do Documento e Totais Financeiros (RF03) -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Metadados da NF-e -->
      <div class="border-2 border-outline bg-surface-container-lowest p-5 shadow-[4px_4px_0px_#1a1a1a]">
        <div class="flex items-center justify-between pb-3 border-b-2 border-outline mb-4">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 bg-primary-fixed border border-outline text-[10px] font-headline font-black uppercase text-on-primary-fixed">
              RF03
            </span>
            <h3 class="text-sm font-headline font-bold uppercase tracking-tight text-on-surface flex items-center gap-1.5">
              <span class="material-symbols-outlined text-base">tag</span>
              Dados do Documento Fiscal
            </h3>
          </div>
        </div>

        <div class="space-y-2">
          <div class="flex items-center justify-between p-2 bg-surface-container-low border border-outline font-mono text-xs">
            <span class="text-on-surface-variant">Número da NF-e:</span>
            <span class="font-bold text-on-surface">
              {{ data.numeroNotaFiscal || "-" }}
            </span>
          </div>

          <div class="flex items-center justify-between p-2 bg-surface-container-low border border-outline font-mono text-xs">
            <span class="text-on-surface-variant">Data de Emissão:</span>
            <span class="font-bold text-on-surface">
              {{ formatDate(data.dataEmissao) }}
            </span>
          </div>

          <div class="flex items-center justify-between p-2 bg-surface-container-low border border-outline font-mono text-xs">
            <span class="text-on-surface-variant">Vencimento Geral:</span>
            <span class="font-bold text-on-surface">
              {{ formatDate(data.dataVencimento) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Totais Financeiros -->
      <div class="border-2 border-outline bg-surface-container-lowest p-5 shadow-[4px_4px_0px_#1a1a1a] flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between pb-3 border-b-2 border-outline mb-4">
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 bg-primary-fixed border border-outline text-[10px] font-headline font-black uppercase text-on-primary-fixed">
                RF03
              </span>
              <h3 class="text-sm font-headline font-bold uppercase tracking-tight text-on-surface flex items-center gap-1.5">
                <span class="material-symbols-outlined text-base">payments</span>
                Totais e Condição
              </h3>
            </div>
            <span class="text-[10px] font-mono uppercase bg-primary-container px-2 py-0.5 border border-outline font-bold">
              BRL (R$)
            </span>
          </div>

          <div class="p-3 bg-surface border-2 border-outline mb-3 shadow-[2px_2px_0px_#1a1a1a] flex items-center justify-between">
            <span class="text-xs font-headline font-bold uppercase text-on-surface">Valor Total da Nota:</span>
            <span class="text-lg sm:text-xl font-headline font-black text-on-surface bg-primary-fixed px-2.5 py-0.5 border border-outline">
              {{ formatCurrency(data.valorTotal) }}
            </span>
          </div>

          <div class="flex items-center justify-between p-2 bg-surface-container-low border border-outline font-mono text-xs">
            <span class="text-on-surface-variant">Parcelamento Detectado:</span>
            <span class="font-bold text-on-surface">
              {{ data.quantidadeParcelas || data.parcelas?.length || 1 }}x
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Block 4: Detalhamento de Parcelas (RF04 - Manter MovimentoParcelas) -->
    <div v-if="data.parcelas && data.parcelas.length > 0" class="border-2 border-outline bg-surface-container-lowest p-5 shadow-[5px_5px_0px_#1a1a1a]">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-outline mb-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 bg-primary-fixed border border-outline text-[10px] font-headline font-black uppercase text-on-primary-fixed">
              RF04 • PARCELAMENTO
            </span>
            <h3 class="text-base font-headline font-bold uppercase tracking-tight text-on-surface">
              Desdobramento de Parcelas (Contas a Pagar / Receber)
            </h3>
          </div>
          <p class="text-xs font-mono text-on-surface-variant mt-0.5">
            Cronograma de liquidação financeira com vencimentos e valores amortizados
          </p>
        </div>

        <span class="bg-surface-variant border border-outline px-2 py-1 text-xs font-mono font-bold uppercase">
          Total: {{ data.parcelas.length }} parcela(s)
        </span>
      </div>

      <div class="border-2 border-outline overflow-x-auto shadow-[3px_3px_0px_#1a1a1a]">
        <table class="w-full text-left border-collapse font-mono text-xs">
          <thead>
            <tr class="bg-surface-container border-b-2 border-outline font-headline uppercase font-bold text-on-surface text-[11px] tracking-wider">
              <th class="p-3 w-24">Nº Parcela</th>
              <th class="p-3">Data de Vencimento</th>
              <th class="p-3 text-right">Valor da Parcela</th>
              <th class="p-3 text-center w-28">Status Inicial</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="parc in data.parcelas"
              :key="parc.numero"
              class="border-b border-outline hover:bg-surface-bright transition-none"
            >
              <td class="p-3 font-bold">
                <div class="flex items-center gap-2">
                  <span class="w-5 h-5 bg-outline text-surface text-[10px] font-mono font-bold flex items-center justify-center">
                    {{ parc.numero }}
                  </span>
                  <span>#{{ parc.numero }}</span>
                </div>
              </td>
              <td class="p-3 font-semibold text-on-surface">
                {{ formatDate(parc.dataVencimento) }}
              </td>
              <td class="p-3 text-right font-bold text-on-surface">
                <span class="bg-surface-variant px-2 py-0.5 border border-outline">
                  {{ formatCurrency(parc.valor) }}
                </span>
              </td>
              <td class="p-3 text-center">
                <span class="px-2 py-0.5 bg-surface border border-outline text-[10px] font-headline font-bold uppercase text-on-surface">
                  Pendente
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Block 5: Descrição dos Itens / Insumos Rurais -->
    <div class="border-2 border-outline bg-surface-container-lowest p-5 shadow-[4px_4px_0px_#1a1a1a]">
      <div class="flex items-center justify-between pb-3 border-b-2 border-outline mb-3">
        <div class="flex items-center gap-2">
          <span class="px-2 py-0.5 bg-primary-fixed border border-outline text-[10px] font-headline font-black uppercase text-on-primary-fixed">
            ITENS
          </span>
          <h3 class="text-sm font-headline font-bold uppercase tracking-tight text-on-surface flex items-center gap-1.5">
            <span class="material-symbols-outlined text-base">inventory_2</span>
            Descrição dos Produtos / Insumos / Serviços Fiscais
          </h3>
        </div>
      </div>

      <div class="p-3 bg-surface border border-outline font-mono text-xs text-on-surface leading-relaxed whitespace-pre-wrap">
        {{ data.descricaoProdutos || "Nenhuma descrição detalhada informada no documento fiscal." }}
      </div>
    </div>
  </div>
</template>
