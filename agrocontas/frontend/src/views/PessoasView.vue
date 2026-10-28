<script setup lang="ts">
import { ref } from "vue";
import DataGrid, { GridColumn } from "../components/manter/DataGrid.vue";
import FeedbackBanner from "../components/manter/FeedbackBanner.vue";
import ModalDialog from "../components/manter/ModalDialog.vue";
import { pessoasApi } from "../services/cadastros";
import { Classificacao, FiltroStatus, Pessoa, PessoaInput } from "../types/cadastros";
import { maskCpfCnpj } from "../utils/format";

const CLASSIFICACAO_LABEL: Record<Classificacao, string> = {
  FORNECEDOR: "Fornecedor",
  CLIENTE: "Cliente / Faturado",
  AMBOS: "Fornecedor e Cliente",
};

const columns: GridColumn[] = [
  { key: "id", label: "ID", sortable: true },
  { key: "razaoSocial", label: "Razão Social / Nome", sortable: true },
  { key: "cpfCnpj", label: "CPF/CNPJ", sortable: true },
  { key: "classificacao", label: "Classificação", sortable: true },
  { key: "telefone", label: "Telefone", sortable: true },
  { key: "email", label: "E-mail", sortable: true },
  { key: "status", label: "Status", sortable: true },
];

const filtros = ref<{ q: string; classificacao: Classificacao | ""; status: FiltroStatus }>({
  q: "",
  classificacao: "",
  status: "ATIVO",
});
const rows = ref<Pessoa[]>([]);
const loading = ref(false);
const searched = ref(false);
const feedback = ref<{ type: "success" | "error"; message: string } | null>(null);

const modalOpen = ref(false);
const editingId = ref<number | null>(null);
const saving = ref(false);
const formError = ref("");
const form = ref<PessoaInput>(emptyForm());

function emptyForm(): PessoaInput {
  return { razaoSocial: "", nomeFantasia: "", cpfCnpj: "", classificacao: "FORNECEDOR", telefone: "", email: "" };
}

async function buscar() {
  loading.value = true;
  try {
    rows.value = await pessoasApi.listar(filtros.value);
    searched.value = true;
  } catch (err) {
    feedback.value = { type: "error", message: err instanceof Error ? err.message : "Falha ao consultar." };
  } finally {
    loading.value = false;
  }
}

function todos() {
  filtros.value = { q: "", classificacao: "", status: "ATIVO" };
  return buscar();
}

function incluir() {
  editingId.value = null;
  form.value = emptyForm();
  formError.value = "";
  modalOpen.value = true;
}

function editar(pessoa: Pessoa) {
  editingId.value = pessoa.id;
  form.value = {
    razaoSocial: pessoa.razaoSocial,
    nomeFantasia: pessoa.nomeFantasia ?? "",
    cpfCnpj: pessoa.cpfCnpj,
    classificacao: pessoa.classificacao,
    telefone: pessoa.telefone ?? "",
    email: pessoa.email ?? "",
  };
  formError.value = "";
  modalOpen.value = true;
}

async function salvar() {
  saving.value = true;
  formError.value = "";
  try {
    if (editingId.value === null) {
      await pessoasApi.criar(form.value);
    } else {
      await pessoasApi.atualizar(editingId.value, form.value);
    }
    modalOpen.value = false;
    feedback.value = { type: "success", message: "Cadastro salvo com sucesso." };
    await buscar();
  } catch (err) {
    formError.value = err instanceof Error ? err.message : "Falha ao salvar.";
  } finally {
    saving.value = false;
  }
}

async function alterarStatus(pessoa: Pessoa) {
  const ativar = pessoa.status === "INATIVO";
  if (!ativar && !window.confirm(`Excluir "${pessoa.razaoSocial}"? O cadastro ficará INATIVO (exclusão lógica).`)) return;
  try {
    await pessoasApi.alterarStatus(pessoa.id, ativar);
    feedback.value = { type: "success", message: ativar ? "Cadastro reativado." : "Cadastro inativado." };
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
        RF01 • Manter Pessoas
      </div>
      <h1 class="text-xl font-headline font-black uppercase tracking-tight">Fornecedores, Clientes e Faturados</h1>
    </div>

    <FeedbackBanner v-if="feedback" :type="feedback.type" :message="feedback.message" @dismiss="feedback = null" />

    <form
      class="border-2 border-outline bg-surface-container-lowest p-4 mb-4 shadow-[3px_3px_0px_#1a1a1a] grid grid-cols-1 md:grid-cols-4 gap-3 items-end"
      @submit.prevent="buscar"
    >
      <div class="md:col-span-2">
        <label class="ac-label" for="pessoa-q">Buscar por nome, CPF/CNPJ, e-mail ou telefone</label>
        <input id="pessoa-q" v-model="filtros.q" class="ac-input" type="text" placeholder="Digite para pesquisar" />
      </div>
      <div>
        <label class="ac-label" for="pessoa-class">Classificação</label>
        <select id="pessoa-class" v-model="filtros.classificacao" class="ac-input">
          <option value="">Todas</option>
          <option v-for="(label, valor) in CLASSIFICACAO_LABEL" :key="valor" :value="valor">{{ label }}</option>
        </select>
      </div>
      <div>
        <label class="ac-label" for="pessoa-status">Status</label>
        <select id="pessoa-status" v-model="filtros.status" class="ac-input">
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
      <template #cell-classificacao="{ row }">{{ CLASSIFICACAO_LABEL[row.classificacao] }}</template>
      <template #cell-telefone="{ row }">{{ row.telefone || "-" }}</template>
      <template #cell-email="{ row }">{{ row.email || "-" }}</template>
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
      :title="editingId === null ? 'Nova Pessoa' : `Editar Pessoa #${editingId}`"
      tag="RF01"
      @close="modalOpen = false"
    >
      <form class="grid grid-cols-1 sm:grid-cols-2 gap-3" @submit.prevent="salvar">
        <div class="sm:col-span-2">
          <label class="ac-label" for="p-razao">Razão Social / Nome *</label>
          <input id="p-razao" v-model="form.razaoSocial" class="ac-input" type="text" maxlength="120" required />
        </div>
        <div class="sm:col-span-2">
          <label class="ac-label" for="p-fantasia">Nome Fantasia</label>
          <input id="p-fantasia" v-model="form.nomeFantasia" class="ac-input" type="text" maxlength="120" />
        </div>
        <div>
          <label class="ac-label" for="p-doc">CPF / CNPJ *</label>
          <input
            id="p-doc"
            :value="form.cpfCnpj"
            class="ac-input"
            type="text"
            inputmode="numeric"
            placeholder="000.000.000-00"
            required
            @input="form.cpfCnpj = maskCpfCnpj(($event.target as HTMLInputElement).value)"
          />
        </div>
        <div>
          <label class="ac-label" for="p-class">Classificação *</label>
          <select id="p-class" v-model="form.classificacao" class="ac-input" required>
            <option v-for="(label, valor) in CLASSIFICACAO_LABEL" :key="valor" :value="valor">{{ label }}</option>
          </select>
        </div>
        <div>
          <label class="ac-label" for="p-tel">Telefone</label>
          <input id="p-tel" v-model="form.telefone" class="ac-input" type="tel" maxlength="20" />
        </div>
        <div>
          <label class="ac-label" for="p-email">E-mail</label>
          <input id="p-email" v-model="form.email" class="ac-input" type="email" maxlength="80" />
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
