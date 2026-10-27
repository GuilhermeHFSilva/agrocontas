export type StatusCadastro = "ATIVO" | "INATIVO";

// Resultado da consulta de um cadastro (fornecedor, faturado ou despesa) no banco de dados.
export interface ConsultaCadastro {
  nome: string;
  cpfCnpj?: string;
  existe: boolean;
  id?: number;
  status?: StatusCadastro;
}

export interface VerificacaoNfe {
  fornecedor: ConsultaCadastro;
  faturado: ConsultaCadastro;
  despesa: ConsultaCadastro;
  // Preenchido quando a mesma nota já foi lançada para o fornecedor.
  contaExistente: { id: number } | null;
}

export interface CadastroLancado {
  id: number;
  criado: boolean;
  reativado: boolean;
}

export interface LancamentoNfe {
  fornecedor: CadastroLancado;
  faturado: CadastroLancado;
  despesa: CadastroLancado;
  conta: { id: number; numeroDocumento: string; valorTotal: number };
  parcelas: { id: number; numero: number }[];
}
