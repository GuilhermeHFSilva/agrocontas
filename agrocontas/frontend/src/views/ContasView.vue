<script setup lang="ts">
import { computed, ref, watch } from "vue";
import DataGrid, { GridColumn } from "../components/manter/DataGrid.vue";
import FeedbackBanner from "../components/manter/FeedbackBanner.vue";
import ModalDialog from "../components/manter/ModalDialog.vue";
import { classificacoesApi, contasApi, pessoasApi } from "../services/cadastros";
import {
  CategoriaItem,
  ContaFiltros,
  ContaInput,
  ContaResumo,
  Pessoa,
  StatusConta,
  TipoOperacao,
} from "../types/cadastros";
import { formatDate, formatMoney } from "../utils/format";

const OPERACAO_LABEL: Record<TipoOperacao, string> = { PAGAR: "A Pagar", RECEBER: "A Receber" };

const columns: GridColumn[] = [
  { key: "id", label: "ID", sortable: true },
  { key: "tipoOperacao", label: "Tipo", sortable: true },
  { key: "numeroDocumento", label: "Documento", sortable: true },
  { key: "fornecedorNome", label: "Fornecedor / Emitente", sortable: true },
  { key: "faturadoNome", label: "Faturado / Cliente", sortable: true },
  { key: "categoriaDescricao", label: "Classificação", sortable: true },
  { key: "dataVencimento", label: "1º Vencimento", sortable: true },
  { key: "valorTotal", label: "Valor Total", sortable: true, align: "right" },
  { key: "quantidadeParcelas", label: "Parcelas", sortable: true, align: "right" },
  { key: "status", label: "Status", sortable: true },
];

type Filtros = Required<Pick<ContaFiltros, "q" | "tipoOperacao" | "status" | "vencimentoDe" | "vencimentoAte">>;

const filtros = ref<Filtros>({ q: "", tipoOperacao: "", status: "ATIVAS", vencimentoDe: "", vencimentoAte: "" });
const rows = ref<ContaResumo[]>([]);
const loading = ref(false);
const searched = ref(false);
const feedback = ref<{ type: "success" | "error"; message: string } | null>(null);

interface ParcelaForm {
  dataVencimento: string;
  valor: number | null;
}

interface ContaForm {
  tipoOperacao: TipoOperacao;
  fornecedorId: number | null;
  faturadoId: number | null;
  categoriaId: number | null;
  numeroDocumento: string;
  dataEmissao: string;
  descricao: string;
  parcelas: ParcelaForm[];
}

const modalOpen = ref(false);
const editingId = ref<number | null>(null);
const editingStatus = ref<StatusConta | null>(null);
const saving = ref(false);
const loadingForm = ref(false);
const formError = ref("");
const form = ref<ContaForm>(emptyForm());
const pessoas = ref<Pessoa[]>([]);
const categorias = ref<CategoriaItem[]>([]);

function emptyForm(): ContaForm {
  return {
    tipoOperacao: "PAGAR",
    fornecedorId: null,
    faturadoId: null,
    categoriaId: null,
    numeroDocumento: "",
    dataEmissao: new Date().toISOString().slice(0, 10),
    descricao: "",
    parcelas: [{ dataVencimento: "", valor: null }],
  };
}

const somenteLeitura = computed(() => editingStatus.value !== null && editingStatus.value !== "ABERTA");

const rotuloFornecedor = computed(() => (form.value.tipoOperacao === "PAGAR" ? "Fornecedor" : "Emitente (titular)"));
const rotuloFaturado = computed(() => (form.value.tipoOperacao === "PAGAR" ? "Faturado" : "Cliente (pagador)"));
const tipoCategoria = computed(() => (form.value.tipoOperacao === "PAGAR" ? "DESPESA" : "RECEITA"));
const categoriasDoTipo = computed(() => categorias.value.filter((c) => c.tipo === tipoCategoria.value));
const totalParcelas = computed(() =>
  form.value.parcelas.reduce((soma, parcela) => soma + (typeof parcela.valor === "number" ? parcela.valor : 0), 0)
);

watch(
  () => form.value.tipoOperacao,
  () => {
    if (!categoriasDoTipo.value.some((c) => c.id === form.value.categoriaId)) form.value.categoriaId = null;
  }
);

function mensagemErro(err: unknown, padrao: string): string {
  return err instanceof Error ? err.message : padrao;
}

async function buscar() {
  loading.value = true;
  try {
    rows.value = await contasApi.listar(filtros.value);
    searched.value = true;
  } catch (err) {
    feedback.value = { type: "error", message: mensagemErro(err, "Falha ao consultar.") };
  } finally {
    loading.value = false;
  }
}

function todos() {
  filtros.value = { q: "", tipoOperacao: "", status: "ATIVAS", vencimentoDe: "", vencimentoAte: "" };
  return buscar();
}

async function carregarOpcoes() {
  const [listaPessoas, listaCategorias] = await Promise.all([
    pessoasApi.listar({ status: "ATIVO" }),
    classificacoesApi.listar({ status: "ATIVO" }),
  ]);
  pessoas.value = listaPessoas;
  categorias.value = listaCategorias;
}

async function abrirModal(carregar: () => Promise<void>) {
  formError.value = "";
  loadingForm.value = true;
  modalOpen.value = true;
  try {
    await carregarOpcoes();
    await carregar();
  } catch (err) {
    modalOpen.value = false;
    feedback.value = { type: "error", message: mensagemErro(err, "Falha ao abrir o formulário.") };
  } finally {
    loadingForm.value = false;
  }
}

function incluir() {
  editingId.value = null;
  editingStatus.value = null;
  form.value = emptyForm();
  return abrirModal(async () => {});
}

function editar(conta: ContaResumo) {
  editingId.value = conta.id;
  editingStatus.value = conta.status;
  return abrirModal(async () => {
    const detalhe = await contasApi.obter(conta.id);
    
    for (const [id, nome] of [
      [detalhe.fornecedorId, detalhe.fornecedorNome],
      [detalhe.faturadoId, detalhe.faturadoNome],
    ] as const) {
      if (!pessoas.value.some((p) => p.id === id)) {
        pessoas.value.push({ id, razaoSocial: `${nome} (inativo)` } as Pessoa);
      }
    }
    if (!categorias.value.some((c) => c.id === detalhe.categoriaId)) {
      categorias.value.push({
        id: detalhe.categoriaId,
        descricao: `${detalhe.categoriaDescricao} (inativa)`,
        tipo: detalhe.tipoOperacao === "PAGAR" ? "DESPESA" : "RECEITA",
      } as CategoriaItem);
    }
    form.value = {
      tipoOperacao: detalhe.tipoOperacao,
      fornecedorId: detalhe.fornecedorId,
      faturadoId: detalhe.faturadoId,
      categoriaId: detalhe.categoriaId,
      numeroDocumento: detalhe.numeroDocumento,
      dataEmissao: detalhe.dataEmissao,
      descricao: detalhe.descricao ?? "",
      parcelas: detalhe.parcelas.map((p) => ({ dataVencimento: p.dataVencimento, valor: p.valor })),
    };
  });
}

function adicionarParcela() {
  form.value.parcelas.push({ dataVencimento: "", valor: null });
}

function removerParcela(indice: number) {
  if (form.value.parcelas.length > 1) form.value.parcelas.splice(indice, 1);
}

function montarInput(): ContaInput | null {
  const { fornecedorId, faturadoId, categoriaId } = form.value;
  if (fornecedorId === null || faturadoId === null || categoriaId === null) {
    formError.value = "Selecione o fornecedor, o faturado e a classificação.";
    return null;
  }
  const parcelas: ContaInput["parcelas"] = [];
  for (const [indice, parcela] of form.value.parcelas.entries()) {
    if (!parcela.dataVencimento || typeof parcela.valor !== "number" || parcela.valor <= 0) {
      formError.value = `Informe vencimento e valor (maior que zero) da parcela ${indice + 1}.`;
      return null;
    }
    parcelas.push({ dataVencimento: parcela.dataVencimento, valor: parcela.valor });
  }
  return {
    tipoOperacao: form.value.tipoOperacao,
    fornecedorId,
    faturadoId,
    categoriaId,
    numeroDocumento: form.value.numeroDocumento,
    dataEmissao: form.value.dataEmissao,
    descricao: form.value.descricao,
    parcelas,
  };
}

async function salvar() {
  formError.value = "";
  const input = montarInput();
  if (!input) return;

  saving.value = true;
  try {
    if (editingId.value === null) {
      await contasApi.criar(input);
    } else {
      await contasApi.atualizar(editingId.value, input);
    }
    modalOpen.value = false;
    feedback.value = { type: "success", message: "Conta salva com sucesso." };
    await buscar();
  } catch (err) {
    formError.value = mensagemErro(err, "Falha ao salvar.");
  } finally {
    saving.value = false;
  }
}

async function alterarStatus(conta: ContaResumo) {
  const ativar = conta.status === "CANCELADA";
  if (!ativar && !window.confirm(`Excluir a conta ${conta.numeroDocumento}? Ela ficará CANCELADA (exclusão lógica).`)) return;
  try {
    await contasApi.alterarStatus(conta.id, ativar);
    feedback.value = { type: "success", message: ativar ? "Conta reativada." : "Conta cancelada." };
    await buscar();
  } catch (err) {
    feedback.value = { type: "error", message: mensagemErro(err, "Falha ao alterar o status.") };
  }
}
</script>

<template>
  <section>
    <div class="mb-4 pb-3 border-b-2 border-outline/30">
      <div class="inline-block px-2 py-0.5 bg-primary-fixed border border-outline text-[10px] font-headline font-black uppercase text-on-primary-fixed mb-1.5">
        RF03 / RF04 • Registrar Contas
      </div>
      <h1 class="text-xl font-headline font-black uppercase tracking-tight">Contas a Pagar e a Receber</h1>
    </div>

    <FeedbackBanner v-if="feedback" :type="feedback.type" :message="feedback.message" @dismiss="feedback = null" />

    <form
      class="border-2 border-outline bg-surface-container-lowest p-4 mb-4 shadow-[3px_3px_0px_#1a1a1a] grid grid-cols-1 md:grid-cols-4 gap-3 items-end"
      @submit.prevent="buscar"
    >
      <div class="md:col-span-2">
        <label class="ac-label" for="conta-q">Buscar por documento, pessoa, classificação ou descrição</label>
        <input id="conta-q" v-model="filtros.q" class="ac-input" type="text" placeholder="Digite para pesquisar" />
      </div>
      <div>
        <label class="ac-label" for="conta-tipo">Tipo</label>
        <select id="conta-tipo" v-model="filtros.tipoOperacao" class="ac-input">
          <option value="">Pagar e receber</option>
          <option v-for="(label, valor) in OPERACAO_LABEL" :key="valor" :value="valor">{{ label }}</option>
        </select>
      </div>
      <div>
        <label class="ac-label" for="conta-status">Status</label>
        <select id="conta-status" v-model="filtros.status" class="ac-input">
          <option value="ATIVAS">Ativas (não canceladas)</option>
          <option value="ABERTA">Abertas</option>
          <option value="QUITADA">Quitadas</option>
          <option value="CANCELADA">Canceladas</option>
          <option value="TODAS">Todas</option>
        </select>
      </div>
      <div>
        <label class="ac-label" for="conta-de">Vencimento de</label>
        <input id="conta-de" v-model="filtros.vencimentoDe" class="ac-input" type="date" />
      </div>
      <div>
        <label class="ac-label" for="conta-ate">Vencimento até</label>
        <input id="conta-ate" v-model="filtros.vencimentoAte" class="ac-input" type="date" />
      </div>
      <div class="md:col-span-4 flex flex-wrap gap-2">
        <button type="submit" class="ac-btn ac-btn-dark" :disabled="loading">
          <span class="material-symbols-outlined text-sm">search</span> Buscar
        </button>
        <button type="button" class="ac-btn" :disabled="loading" @click="todos">
          <span class="material-symbols-outlined text-sm">list</span> Todos
        </button>
        <button type="button" class="ac-btn ac-btn-primary sm:ml-auto" @click="incluir">
          <span class="material-symbols-outlined text-sm">add</span> Inserir Novo
        </button>
      </div>
    </form>

    <DataGrid :columns="columns" :rows="rows" :loading="loading" :searched="searched" :is-inactive="(r) => r.status === 'CANCELADA'">
      <template #cell-tipoOperacao="{ row }">
        <span :class="row.tipoOperacao === 'RECEBER' ? 'text-tertiary font-bold' : 'text-secondary font-bold'">
          {{ OPERACAO_LABEL[row.tipoOperacao] }}
        </span>
      </template>
      <template #cell-dataVencimento="{ row }">{{ formatDate(row.dataVencimento) }}</template>
      <template #cell-valorTotal="{ row }">{{ formatMoney(row.valorTotal) }}</template>
      <template #actions="{ row }">
        <button type="button" class="ac-btn ac-btn-sm" @click="editar(row)">
          {{ row.status === "ABERTA" ? "Editar" : "Consultar" }}
        </button>
        <button v-if="row.status === 'ABERTA'" type="button" class="ac-btn ac-btn-sm ac-btn-danger" @click="alterarStatus(row)">
          Excluir
        </button>
        <button v-else-if="row.status === 'CANCELADA'" type="button" class="ac-btn ac-btn-sm ac-btn-primary" @click="alterarStatus(row)">
          Reativar
        </button>
      </template>
    </DataGrid>

    <ModalDialog
      :open="modalOpen"
      :title="editingId === null ? 'Nova Conta' : `${somenteLeitura ? 'Consultar' : 'Editar'} Conta #${editingId}`"
      tag="RF03 / RF04"
      wide
      @close="modalOpen = false"
    >
      <div v-if="loadingForm" class="text-center py-8"><span class="brutal-spinner brutal-spinner-lg"></span></div>

      <form v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3" @submit.prevent="salvar">
        <div v-if="somenteLeitura" class="sm:col-span-2 p-2 bg-surface-container border border-outline font-mono text-xs">
          Conta {{ editingStatus }}: somente consulta. Apenas contas ABERTAS podem ser alteradas.
        </div>

        <fieldset class="contents" :disabled="somenteLeitura">
          <div>
            <label class="ac-label" for="f-tipo">Tipo da conta *</label>
            <select id="f-tipo" v-model="form.tipoOperacao" class="ac-input" required>
              <option v-for="(label, valor) in OPERACAO_LABEL" :key="valor" :value="valor">{{ label }}</option>
            </select>
          </div>
          <div>
            <label class="ac-label" for="f-cat">
              Classificação ({{ tipoCategoria === "DESPESA" ? "Tipo de Despesa" : "Tipo de Receita" }}) *
            </label>
            <select id="f-cat" v-model="form.categoriaId" class="ac-input" required>
              <option :value="null" disabled>Selecione</option>
              <option v-for="c in categoriasDoTipo" :key="c.id" :value="c.id">{{ c.descricao }}</option>
            </select>
          </div>
          <div>
            <label class="ac-label" for="f-forn">{{ rotuloFornecedor }} *</label>
            <select id="f-forn" v-model="form.fornecedorId" class="ac-input" required>
              <option :value="null" disabled>Selecione</option>
              <option v-for="p in pessoas" :key="p.id" :value="p.id">
                {{ p.razaoSocial }}{{ p.cpfCnpj ? ` — ${p.cpfCnpj}` : "" }}
              </option>
            </select>
          </div>
          <div>
            <label class="ac-label" for="f-fat">{{ rotuloFaturado }} *</label>
            <select id="f-fat" v-model="form.faturadoId" class="ac-input" required>
              <option :value="null" disabled>Selecione</option>
              <option v-for="p in pessoas" :key="p.id" :value="p.id">
                {{ p.razaoSocial }}{{ p.cpfCnpj ? ` — ${p.cpfCnpj}` : "" }}
              </option>
            </select>
          </div>
          <div>
            <label class="ac-label" for="f-doc">Número do documento *</label>
            <input id="f-doc" v-model="form.numeroDocumento" class="ac-input" type="text" maxlength="44" required />
          </div>
          <div>
            <label class="ac-label" for="f-emissao">Data de emissão *</label>
            <input id="f-emissao" v-model="form.dataEmissao" class="ac-input" type="date" required />
          </div>
          <div class="sm:col-span-2">
            <label class="ac-label" for="f-desc">Descrição</label>
            <input id="f-desc" v-model="form.descricao" class="ac-input" type="text" maxlength="255" />
          </div>

          <div class="sm:col-span-2 border-2 border-outline p-3">
            <div class="flex items-center justify-between mb-2">
              <span class="ac-label !mb-0">Parcelas (vencimentos distintos)</span>
              <button v-if="!somenteLeitura" type="button" class="ac-btn ac-btn-sm" @click="adicionarParcela">
                <span class="material-symbols-outlined text-sm">add</span> Parcela
              </button>
            </div>
            <div class="space-y-2">
              <div v-for="(parcela, indice) in form.parcelas" :key="indice" class="flex items-center gap-2">
                <span class="w-6 text-center font-mono text-xs font-bold">{{ indice + 1 }}</span>
                <input
                  v-model="parcela.dataVencimento"
                  class="ac-input"
                  type="date"
                  required
                  :aria-label="`Vencimento da parcela ${indice + 1}`"
                />
                <input
                  v-model.number="parcela.valor"
                  class="ac-input"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="Valor (R$)"
                  required
                  :aria-label="`Valor da parcela ${indice + 1}`"
                />
                <button
                  v-if="!somenteLeitura"
                  type="button"
                  class="ac-btn ac-btn-sm ac-btn-danger"
                  :disabled="form.parcelas.length === 1"
                  title="Remover parcela"
                  @click="removerParcela(indice)"
                >
                  <span class="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            </div>
            <div class="mt-2 text-right font-mono text-xs">
              Valor total: <strong>{{ formatMoney(totalParcelas) }}</strong>
            </div>
          </div>
        </fieldset>

        <FeedbackBanner v-if="formError" class="sm:col-span-2 !mb-0" type="error" :message="formError" @dismiss="formError = ''" />

        <div class="sm:col-span-2 flex justify-end gap-2 pt-3 border-t-2 border-outline">
          <button type="button" class="ac-btn" @click="modalOpen = false">{{ somenteLeitura ? "Fechar" : "Cancelar" }}</button>
          <button v-if="!somenteLeitura" type="submit" class="ac-btn ac-btn-primary" :disabled="saving">
            <span v-if="saving" class="brutal-spinner"></span>
            <span v-else class="material-symbols-outlined text-sm">save</span>
            Salvar
          </button>
        </div>
      </form>
    </ModalDialog>
  </section>
</template>
