import { ApiResponse } from "../types/nfe";
import {
  CategoriaFiltros,
  CategoriaInput,
  CategoriaItem,
  ContaDetalhe,
  ContaFiltros,
  ContaInput,
  ContaResumo,
  Pessoa,
  PessoaFiltros,
  PessoaInput,
} from "../types/cadastros";
import { getSettings } from "./api";

function buildUrl(path: string, query?: Record<string, string | undefined>): string {
  const base = getSettings().apiUrl.trim().replace(/\/+$/, "");
  const params = new URLSearchParams();
  Object.entries(query ?? {}).forEach(([chave, valor]) => {
    if (valor !== undefined && valor !== "") params.set(chave, valor);
  });
  const queryString = params.toString();
  return `${base}${path}${queryString ? `?${queryString}` : ""}`;
}

async function request<T>(
  method: "GET" | "POST" | "PUT" | "PATCH",
  path: string,
  options: { query?: Record<string, string | undefined>; body?: unknown } = {}
): Promise<T> {
  const response = await fetch(buildUrl(path, options.query), {
    method,
    headers: options.body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  let payload: ApiResponse<T>;
  try {
    payload = await response.json();
  } catch {
    throw new Error("Resposta inválida do servidor.");
  }

  if (!response.ok || !payload.success || payload.data === undefined) {
    throw new Error(payload.error || "Falha na comunicação com o servidor.");
  }
  return payload.data;
}

// O status é sempre enviado: a listagem padrão ("Todos") traz apenas os registros ATIVO / ATIVAS.
export const pessoasApi = {
  listar: (filtros: PessoaFiltros) =>
    request<Pessoa[]>("GET", "/api/pessoas", {
      query: { q: filtros.q, classificacao: filtros.classificacao, status: filtros.status },
    }),
  criar: (input: PessoaInput) => request<Pessoa>("POST", "/api/pessoas", { body: input }),
  atualizar: (id: number, input: PessoaInput) => request<Pessoa>("PUT", `/api/pessoas/${id}`, { body: input }),
  alterarStatus: (id: number, ativo: boolean) =>
    request<Pessoa>("PATCH", `/api/pessoas/${id}/status`, { body: { ativo } }),
};

export const classificacoesApi = {
  listar: (filtros: CategoriaFiltros) =>
    request<CategoriaItem[]>("GET", "/api/classificacoes", {
      query: { q: filtros.q, tipo: filtros.tipo, status: filtros.status },
    }),
  criar: (input: CategoriaInput) => request<CategoriaItem>("POST", "/api/classificacoes", { body: input }),
  atualizar: (id: number, input: CategoriaInput) =>
    request<CategoriaItem>("PUT", `/api/classificacoes/${id}`, { body: input }),
  alterarStatus: (id: number, ativo: boolean) =>
    request<CategoriaItem>("PATCH", `/api/classificacoes/${id}/status`, { body: { ativo } }),
};

export const contasApi = {
  listar: (filtros: ContaFiltros) =>
    request<ContaResumo[]>("GET", "/api/contas", {
      // status "" (todas, inclusive canceladas) precisa ir explícito: sem o parâmetro o servidor assume ATIVAS.
      query: {
        q: filtros.q,
        tipoOperacao: filtros.tipoOperacao,
        status: filtros.status || "TODAS",
        vencimentoDe: filtros.vencimentoDe,
        vencimentoAte: filtros.vencimentoAte,
      },
    }),
  obter: (id: number) => request<ContaDetalhe>("GET", `/api/contas/${id}`),
  criar: (input: ContaInput) => request<ContaDetalhe>("POST", "/api/contas", { body: input }),
  atualizar: (id: number, input: ContaInput) => request<ContaDetalhe>("PUT", `/api/contas/${id}`, { body: input }),
  alterarStatus: (id: number, ativo: boolean) =>
    request<ContaDetalhe>("PATCH", `/api/contas/${id}/status`, { body: { ativo } }),
};
