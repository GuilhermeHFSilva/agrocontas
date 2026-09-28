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
  <div>
    <div class="highlight-box">
      <div class="highlight-title">Classificação da Despesa (Interpretada por IA)</div>
      <div class="highlight-badge">
        {{ data.classificacaoDespesa || "Não classificada" }}
      </div>
      <div v-if="data.classificacoesDespesa && data.classificacoesDespesa.length > 0">
        <div
          v-for="(item, idx) in data.classificacoesDespesa"
          :key="idx"
          class="highlight-desc"
          style="margin-top: 0.35rem;"
        >
          <strong v-if="item.subcategoria">Subcategoria: {{ item.subcategoria }}</strong>
          <span v-if="item.justificativa"> — {{ item.justificativa }}</span>
        </div>
      </div>
    </div>

    <div class="grid-2">
      <div class="detail-card">
        <div class="detail-card-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          Fornecedor (Emitente)
        </div>
        <div class="detail-row">
          <span class="detail-label">Razão Social:</span>
          <span class="detail-value">{{ data.fornecedor.razaoSocial || "-" }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Nome Fantasia:</span>
          <span class="detail-value">{{ data.fornecedor.nomeFantasia || "-" }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">CNPJ:</span>
          <span class="detail-value">{{ data.fornecedor.cnpj || "-" }}</span>
        </div>
      </div>

      <div class="detail-card">
        <div class="detail-card-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          Faturado (Destinatário)
        </div>
        <div class="detail-row">
          <span class="detail-label">Nome Completo:</span>
          <span class="detail-value">{{ data.faturado.nomeCompleto || "-" }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">CPF / CNPJ:</span>
          <span class="detail-value">{{ data.faturado.cpf || "-" }}</span>
        </div>
      </div>
    </div>

    <div class="grid-2">
      <div class="detail-card">
        <div class="detail-card-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          Dados da Nota Fiscal
        </div>
        <div class="detail-row">
          <span class="detail-label">Número da NF-e:</span>
          <span class="detail-value">{{ data.numeroNotaFiscal || "-" }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Data de Emissão:</span>
          <span class="detail-value">{{ formatDate(data.dataEmissao) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Data de Vencimento:</span>
          <span class="detail-value">{{ formatDate(data.dataVencimento) }}</span>
        </div>
      </div>

      <div class="detail-card">
        <div class="detail-card-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
          Totais e Pagamento
        </div>
        <div class="detail-row">
          <span class="detail-label">Valor Total:</span>
          <span class="detail-value" style="color: var(--primary); font-size: 1.1rem;">
            {{ formatCurrency(data.valorTotal) }}
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Quantidade de Parcelas:</span>
          <span class="detail-value">{{ data.quantidadeParcelas || data.parcelas?.length || 1 }}</span>
        </div>
      </div>
    </div>

    <div v-if="data.parcelas && data.parcelas.length > 0" class="detail-card" style="margin-bottom: 1.25rem;">
      <div class="detail-card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2"></rect>
          <line x1="2" y1="10" x2="22" y2="10"></line>
        </svg>
        Detalhamento das Parcelas (Contas a Pagar)
      </div>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Parcela</th>
              <th>Vencimento</th>
              <th style="text-align: right;">Valor</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="parc in data.parcelas" :key="parc.numero">
              <td><strong>#{{ parc.numero }}</strong></td>
              <td>{{ formatDate(parc.dataVencimento) }}</td>
              <td style="text-align: right; font-weight: 600; color: var(--primary);">
                {{ formatCurrency(parc.valor) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="detail-card">
      <div class="detail-card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <path d="M16 10a4 4 0 0 1-8 0"></path>
        </svg>
        Descrição dos Produtos / Serviços
      </div>
      <div style="font-size: 0.9rem; line-height: 1.6; white-space: pre-wrap; color: var(--text-main);">
        {{ data.descricaoProdutos || "Nenhuma descrição informada." }}
      </div>
    </div>
  </div>
</template>
