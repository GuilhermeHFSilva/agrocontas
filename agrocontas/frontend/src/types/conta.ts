export type StatusCadastro = "ATIVO" | "INATIVO";

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
