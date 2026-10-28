export interface Fornecedor {
  razaoSocial: string;
  nomeFantasia?: string | null;
  cnpj: string;
}

export interface Faturado {
  nomeCompleto: string;
  cpf: string;
}

export interface Parcela {
  numero: number;
  dataVencimento: string;
  valor: number;
}

export interface ClassificacaoDespesaItem {
  categoria: string;
  subcategoria?: string | null;
  justificativa?: string | null;
}

export interface NfeExtracao {
  fornecedor: Fornecedor;
  faturado: Faturado;
  numeroNotaFiscal: string;
  dataEmissao: string;
  descricaoProdutos: string;
  quantidadeParcelas: number;
  dataVencimento: string;
  valorTotal: number;
  classificacaoDespesa: string;
  classificacoesDespesa: ClassificacaoDespesaItem[];
  parcelas: Parcela[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  model?: string;
  error?: string;
}

export interface AppSettings {
  geminiApiKey: string;
  geminiModel: string;
  apiUrl: string;
}
