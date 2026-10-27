import { StatusCadastro } from "./conta";

export type Classificacao = "FORNECEDOR" | "CLIENTE" | "AMBOS";
export type TipoPessoa = "FISICA" | "JURIDICA";
export type TipoCategoria = "DESPESA" | "RECEITA";
export type TipoOperacao = "PAGAR" | "RECEBER";
export type StatusConta = "ABERTA" | "QUITADA" | "CANCELADA";
export type StatusParcela = "PENDENTE" | "PARCIAL" | "LIQUIDADA";

// Filtro de status das listagens: "TODOS" traz ATIVO e INATIVO.
export type FiltroStatus = StatusCadastro | "TODOS";

// ----- Pessoas (Fornecedor / Cliente / Faturado) -----
export interface Pessoa {
  id: number;
  razaoSocial: string;
  nomeFantasia: string | null;
  cpfCnpj: string;
  tipoPessoa: TipoPessoa;
  classificacao: Classificacao;
  telefone: string | null;
  email: string | null;
  status: StatusCadastro;
}

export interface PessoaInput {
  razaoSocial: string;
  nomeFantasia?: string | null;
  cpfCnpj: string;
  classificacao: Classificacao;
  telefone?: string | null;
  email?: string | null;
}

export interface PessoaFiltros {
  q?: string;
  classificacao?: Classificacao | "";
  status?: FiltroStatus;
}

// ----- Classificação (Tipo de Despesa / Tipo de Receita) -----
export interface CategoriaItem {
  id: number;
  descricao: string;
  tipo: TipoCategoria;
  grupoOperacional: string | null;
  centroCusto: string | null;
  status: StatusCadastro;
}

export interface CategoriaInput {
  descricao: string;
  tipo: TipoCategoria;
  grupoOperacional?: string | null;
  centroCusto?: string | null;
}

export interface CategoriaFiltros {
  q?: string;
  tipo?: TipoCategoria | "";
  status?: FiltroStatus;
}

// ----- Contas (a Pagar / a Receber) -----
export interface ContaResumo {
  id: number;
  tipoOperacao: TipoOperacao;
  numeroDocumento: string;
  fornecedorId: number;
  fornecedorNome: string;
  faturadoId: number;
  faturadoNome: string;
  categoriaId: number;
  categoriaDescricao: string;
  dataEmissao: string;
  dataVencimento: string;
  valorTotal: number;
  quantidadeParcelas: number;
  origemDocumento: "MANUAL" | "EXTRACAO_PDF";
  status: StatusConta;
}

export interface ParcelaConta {
  id: number;
  numero: number;
  dataVencimento: string;
  valor: number;
  saldo: number;
  status: StatusParcela;
}

export interface ContaDetalhe extends ContaResumo {
  descricao: string | null;
  parcelas: ParcelaConta[];
}

export interface ContaInput {
  tipoOperacao: TipoOperacao;
  fornecedorId: number;
  faturadoId: number;
  categoriaId: number;
  numeroDocumento: string;
  dataEmissao: string;
  descricao?: string | null;
  parcelas: { dataVencimento: string; valor: number }[];
}

export interface ContaFiltros {
  q?: string;
  tipoOperacao?: TipoOperacao | "";
  // "ATIVAS" traz tudo que não está CANCELADA (equivalente ao ATIVO dos demais cadastros);
  // "TODAS" (ou "") traz também as canceladas.
  status?: StatusConta | "ATIVAS" | "TODAS" | "";
  vencimentoDe?: string;
  vencimentoAte?: string;
}
