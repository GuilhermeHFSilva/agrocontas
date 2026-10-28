<script setup lang="ts" generic="T extends { id: number }">
import { computed, ref } from "vue";

export interface GridColumn {
  key: string;
  label: string;
  sortable?: boolean;
  align?: "left" | "right";
}

const props = defineProps<{
  columns: GridColumn[];
  rows: T[];
  loading: boolean;
  
  searched: boolean;
  isInactive?: (row: T) => boolean;
}>();

const sortKey = ref<string | null>(null);
const sortAsc = ref(true);

function valueOf(row: T, key: string): string | number {
  const value = (row as Record<string, unknown>)[key];
  return typeof value === "number" ? value : String(value ?? "");
}

const sortedRows = computed(() => {
  const key = sortKey.value;
  if (!key) return props.rows;
  const direction = sortAsc.value ? 1 : -1;
  return [...props.rows].sort((a, b) => {
    const left = valueOf(a, key);
    const right = valueOf(b, key);
    if (typeof left === "number" && typeof right === "number") return (left - right) * direction;
    return String(left).localeCompare(String(right), "pt-BR", { numeric: true }) * direction;
  });
});

function toggleSort(column: GridColumn) {
  if (!column.sortable) return;
  if (sortKey.value === column.key) {
    sortAsc.value = !sortAsc.value;
  } else {
    sortKey.value = column.key;
    sortAsc.value = true;
  }
}
</script>

<template>
  <div class="border-2 border-outline bg-surface-container-lowest shadow-[4px_4px_0px_#1a1a1a] overflow-x-auto">
    <table class="ac-table">
      <thead>
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            :class="{ 'ac-sortable': column.sortable }"
            :style="column.align === 'right' ? 'text-align: right' : undefined"
            @click="toggleSort(column)"
          >
            {{ column.label }}
            <span v-if="column.sortable" class="material-symbols-outlined text-xs align-middle">
              {{ sortKey === column.key ? (sortAsc ? "arrow_upward" : "arrow_downward") : "unfold_more" }}
            </span>
          </th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td :colspan="columns.length + 1" class="text-center py-6">
            <span class="brutal-spinner"></span>
          </td>
        </tr>
        <tr v-else-if="sortedRows.length === 0">
          <td :colspan="columns.length + 1" class="text-center py-6 text-on-surface-variant">
            {{
              searched
                ? "Nenhum registro encontrado."
                : "Nenhum registro carregado. Use Buscar ou Todos para consultar."
            }}
          </td>
        </tr>
        <template v-else>
          <tr v-for="row in sortedRows" :key="row.id" :class="{ 'ac-row-inativo': isInactive?.(row) }">
            <td
              v-for="column in columns"
              :key="column.key"
              :style="column.align === 'right' ? 'text-align: right' : undefined"
            >
              <slot :name="`cell-${column.key}`" :row="row">{{ (row as Record<string, unknown>)[column.key] ?? "-" }}</slot>
            </td>
            <td>
              <div class="flex items-center gap-1.5">
                <slot name="actions" :row="row" />
              </div>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>
