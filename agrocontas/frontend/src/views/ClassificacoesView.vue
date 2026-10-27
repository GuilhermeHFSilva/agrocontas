<script setup lang="ts">
import { ref } from "vue";
import DataGrid, { GridColumn } from "../components/manter/DataGrid.vue";
import FeedbackBanner from "../components/manter/FeedbackBanner.vue";
import ModalDialog from "../components/manter/ModalDialog.vue";
import { classificacoesApi } from "../services/cadastros";
import { CategoriaInput, CategoriaItem, FiltroStatus, TipoCategoria } from "../types/cadastros";

const TIPO_LABEL: Record<TipoCategoria, string> = {
  DESPESA: "Tipo de Despesa",
  RECEITA: "Tipo de Receita",
};

const columns: GridColumn[] = [
  { key: "id", label: "ID", sortable: true },
  { key: "descricao", label: "Descrição", sortable: true },
  { key: "tipo", label: "Tipo", sortable: true },
  { key: "grupoOperacional", label: "Grupo Operacional", sortable: true },
  { key: "centroCusto", label: "Centro de Custo", sortable: true },
  { key: "status", label: "Status", sortable: true },
];

const filtros = ref<{ q: string; tipo: TipoCategoria | ""; status: FiltroStatus }>({
  q: "",
  tipo: "",
  status: "ATIVO",
});
const rows = ref<CategoriaItem[]>([]);
const loading = ref(false);
const searched = ref(false);
const feedback = ref<{ type: "success" | "error"; message: string } | null>(null);

const modalOpen = ref(false);
const editingId = ref<number | null>(null);
const saving = ref(false);
const formError = ref("");
const form = ref<CategoriaInput>(emptyForm());

function emptyForm(): CategoriaInput {
  return { descricao: "", tipo: "DESPESA", grupoOperacional: "", centroCusto: "" };
}

async function buscar() {
  loading.value = true;
  try {
    rows.value = await classificacoesApi.listar(filtros.value);
    searched.value = true;
  } catch (err) {
    feedback.value = { type: "error", message: err instanceof Error ? err.message : "Falha ao consultar." };
  } finally {
    loading.value = false;
  }
}

// "Todos" carrega os registros com status ATIVO, sem outros filtros.
function todos() {
  filtros.value = { q: "", tipo: "", status: "ATIVO" };
  return buscar();
}

function incluir() {
  editingId.value = null;
  form.value = emptyForm();
  formError.value = "";
  modalOpen.value = true;
}

function editar(item: CategoriaItem) {
  editingId.value = item.id;
  form.value = {
    descricao: item.descricao,
    tipo: item.tipo,
    grupoOperacional: item.grupoOperacional ?? "",
    centroCusto: item.centroCusto ?? "",
  };
  formError.value = "";
  modalOpen.value = true;
}

async function salvar() {
  saving.value = true;
  formError.value = "";
  try {
    if (editingId.value === null) {
      await classificacoesApi.criar(form.value);
    } else {
      await classificacoesApi.atualizar(editingId.value, form.value);
    }
    modalOpen.value = false;
    feedback.value = { type: "success", message: "Classificação salva com sucesso." };
    await buscar();
  } catch (err) {
    formError.value = err instanceof Error ? err.message : "Falha ao salvar.";
  } finally {
    saving.value = false;
  }
}

// Exclusão lógica: o registro vira INATIVO e pode ser reativado depois.
async function alterarStatus(item: CategoriaItem) {
  const ativar = item.status === "INATIVO";
  if (!ativar && !window.confirm(`Excluir "${item.descricao}"? A classificação ficará INATIVA (exclusão lógica).`)) return;
  try {
    await classificacoesApi.alterarStatus(item.id, ativar);
    feedback.value = { type: "success", message: ativar ? "Classificação reativada." : "Classificação inativada." };
    await buscar();
  } catch (err) {
    feedback.value = { type: "error", message: err instanceof Error ? err.message : "Falha ao alterar o status." };
  }
}
</script>

<template>
  <section>
    <div class="mb-4 pb-3 border-b-2 border-outline/30">
      <div class="inline-block px-2 py-0.5 bg-primary-fixed border border-outline text-[10px] font-headline font-black uppercase text-on-primary-fixed mb-1.5">
        RF02 • Manter Classificação
      </div>
      <h1 class="text-xl font-headline font-black uppercase tracking-tight">Tipos de Despesa e de Receita</h1>
    </div>

    <FeedbackBanner v-if="feedback" :type="feedback.type" :message="feedback.message" @dismiss="feedback = null" />

    <form
      class="border-2 border-outline bg-surface-container-lowest p-4 mb-4 shadow-[3px_3px_0px_#1a1a1a] grid grid-cols-1 md:grid-cols-4 gap-3 items-end"
      @submit.prevent="buscar"
    >
      <div class="md:col-span-2">
        <label class="ac-label" for="cls-q">Buscar por descrição, grupo ou centro de custo</label>
        <input id="cls-q" v-model="filtros.q" class="ac-input" type="text" placeholder="Digite para pesquisar" />
      </div>
      <div>
        <label class="ac-label" for="cls-tipo">Tipo</label>
        <select id="cls-tipo" v-model="filtros.tipo" class="ac-input">
          <option value="">Todos</option>
          <option v-for="(label, valor) in TIPO_LABEL" :key="valor" :value="valor">{{ label }}</option>
        </select>
      </div>
      <div>
        <label class="ac-label" for="cls-status">Status</label>
        <select id="cls-status" v-model="filtros.status" class="ac-input">
          <option value="ATIVO">Ativos</option>
          <option value="INATIVO">Inativos</option>
          <option value="TODOS">Ativos e inativos</option>
        </select>
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

    <DataGrid :columns="columns" :rows="rows" :loading="loading" :searched="searched" :is-inactive="(r) => r.status === 'INATIVO'">
      <template #cell-tipo="{ row }">
        <span :class="row.tipo === 'RECEITA' ? 'text-tertiary font-bold' : 'text-secondary font-bold'">
          {{ TIPO_LABEL[row.tipo] }}
        </span>
      </template>
      <template #cell-grupoOperacional="{ row }">{{ row.grupoOperacional || "-" }}</template>
      <template #cell-centroCusto="{ row }">{{ row.centroCusto || "-" }}</template>
      <template #actions="{ row }">
        <button type="button" class="ac-btn ac-btn-sm" @click="editar(row)">Editar</button>
        <button
          type="button"
          class="ac-btn ac-btn-sm"
          :class="row.status === 'ATIVO' ? 'ac-btn-danger' : 'ac-btn-primary'"
          @click="alterarStatus(row)"
        >
          {{ row.status === "ATIVO" ? "Excluir" : "Reativar" }}
        </button>
      </template>
    </DataGrid>

    <ModalDialog
      :open="modalOpen"
      :title="editingId === null ? 'Nova Classificação' : `Editar Classificação #${editingId}`"
      tag="RF02"
      @close="modalOpen = false"
    >
      <form class="grid grid-cols-1 sm:grid-cols-2 gap-3" @submit.prevent="salvar">
        <div class="sm:col-span-2">
          <label class="ac-label" for="c-desc">Descrição *</label>
          <input id="c-desc" v-model="form.descricao" class="ac-input" type="text" maxlength="80" required />
        </div>
        <div class="sm:col-span-2">
          <label class="ac-label" for="c-tipo">Tipo *</label>
          <select id="c-tipo" v-model="form.tipo" class="ac-input" required>
            <option v-for="(label, valor) in TIPO_LABEL" :key="valor" :value="valor">{{ label }}</option>
          </select>
        </div>
        <div>
          <label class="ac-label" for="c-grupo">Grupo Operacional</label>
          <input id="c-grupo" v-model="form.grupoOperacional" class="ac-input" type="text" maxlength="60" />
        </div>
        <div>
          <label class="ac-label" for="c-centro">Centro de Custo</label>
          <input id="c-centro" v-model="form.centroCusto" class="ac-input" type="text" maxlength="60" />
        </div>

        <FeedbackBanner v-if="formError" class="sm:col-span-2 !mb-0" type="error" :message="formError" @dismiss="formError = ''" />

        <div class="sm:col-span-2 flex justify-end gap-2 pt-3 border-t-2 border-outline">
          <button type="button" class="ac-btn" @click="modalOpen = false">Cancelar</button>
          <button type="submit" class="ac-btn ac-btn-primary" :disabled="saving">
            <span v-if="saving" class="brutal-spinner"></span>
            <span v-else class="material-symbols-outlined text-sm">save</span>
            Salvar
          </button>
        </div>
      </form>
    </ModalDialog>
  </section>
</template>
