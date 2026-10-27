import { Db, SqlParam, SqlStatement } from "../db/types";
import { NfeExtracao } from "../../src/types/nfe";
import {
  CadastroLancado,
  ConsultaCadastro,
  LancamentoNfe,
  StatusCadastro,
  VerificacaoNfe,
} from "../../src/types/conta";

// Mantenha este arquivo idêntico a backend/src/services/contaService.ts.

export class ContaError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "ContaError";
    this.statusCode = statusCode;
  }
}

interface PessoaRow {
  id_pessoa: number;
  status: StatusCadastro;
}

interface CategoriaRow {
  id_categoria: number;
  status: StatusCadastro;
}

interface ParcelaRow {
  id_parcela: number;
  numero_parcela: number;
}

interface ParcelaLancamento {
  numero: number;
  dataVencimento: string;
  valor: number;
}

interface PessoaNormalizada {
  nome: string;
  nomeFantasia: string | null;
  cpfCnpj: string;
  tipoPessoa: "FISICA" | "JURIDICA";
}

const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;

function arredondar(valor: number): number {
  return Math.round(valor * 100) / 100;
}

// Padroniza CPF/CNPJ para a forma mascarada, garantindo que "11111111000100" e
// "11.111.111/0001-00" sejam reconhecidos como o mesmo cadastro (coluna cpf_cnpj é UNIQUE).
function normalizarPessoa(nome: string, cpfCnpj: string, nomeFantasia?: string | null): PessoaNormalizada {
  const razao = (nome ?? "").trim().replace(/\s+/g, " ").toUpperCase();
  if (!razao) {
    throw new ContaError("Nome/Razão Social não informado para um dos participantes da nota.");
  }

  const digitos = (cpfCnpj ?? "").replace(/\D/g, "");
  if (digitos.length === 11) {
    return {
      nome: razao,
      nomeFantasia: null,
      cpfCnpj: digitos.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4"),
      tipoPessoa: "FISICA",
    };
  }
  if (digitos.length === 14) {
    const fantasia = (nomeFantasia ?? "").trim().toUpperCase();
    return {
      nome: razao,
      nomeFantasia: fantasia || null,
      cpfCnpj: digitos.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5"),
      tipoPessoa: "JURIDICA",
    };
  }
  throw new ContaError(`CPF/CNPJ inválido para "${razao}": informe 11 (CPF) ou 14 (CNPJ) dígitos.`);
}

function normalizarDescricaoDespesa(descricao: string): string {
  const normalizada = (descricao ?? "").trim().replace(/\s+/g, " ").toUpperCase().slice(0, 80);
  if (!normalizada) {
    throw new ContaError("A classificação da despesa não foi informada.");
  }
  return normalizada;
}

function dataValida(valor: string): boolean {
  if (!DATA_ISO.test(valor ?? "")) return false;
  const data = new Date(`${valor}T00:00:00Z`);
  return !Number.isNaN(data.getTime()) && data.toISOString().startsWith(valor);
}

function montarParcelas(nfe: NfeExtracao): ParcelaLancamento[] {
  const informadas = Array.isArray(nfe.parcelas) ? nfe.parcelas : [];

  // Sem desdobramento informado, a conta possui uma única parcela (identificação "ÚNICA").
  const parcelas: ParcelaLancamento[] =
    informadas.length > 0
      ? [...informadas].sort((a, b) => a.numero - b.numero)
      : [{ numero: 1, dataVencimento: nfe.dataVencimento, valor: nfe.valorTotal }];

  const numeros = new Set<number>();
  for (const parcela of parcelas) {
    if (!Number.isInteger(parcela.numero) || parcela.numero < 1 || numeros.has(parcela.numero)) {
      throw new ContaError("Numeração de parcelas inválida ou repetida.");
    }
    numeros.add(parcela.numero);
    if (!dataValida(parcela.dataVencimento)) {
      throw new ContaError(`Data de vencimento inválida na parcela ${parcela.numero} (esperado AAAA-MM-DD).`);
    }
    if (!Number.isFinite(parcela.valor) || parcela.valor <= 0) {
      throw new ContaError(`Valor inválido na parcela ${parcela.numero}.`);
    }
  }
  return parcelas;
}

function validarNfe(nfe: NfeExtracao): void {
  if (!nfe || typeof nfe !== "object" || !nfe.fornecedor || !nfe.faturado) {
    throw new ContaError("Dados da nota fiscal ausentes ou incompletos.");
  }
}

function validarConta(nfe: NfeExtracao): string {
  const numeroDocumento = (nfe.numeroNotaFiscal ?? "").trim();
  if (!numeroDocumento || numeroDocumento.length > 44) {
    throw new ContaError("Número do documento ausente ou maior que 44 caracteres.");
  }
  if (!dataValida(nfe.dataEmissao)) {
    throw new ContaError("Data de emissão inválida (esperado AAAA-MM-DD).");
  }
  if (!dataValida(nfe.dataVencimento)) {
    throw new ContaError("Data de vencimento inválida (esperado AAAA-MM-DD).");
  }
  if (!Number.isFinite(nfe.valorTotal) || nfe.valorTotal <= 0) {
    throw new ContaError("Valor total inválido.");
  }
  return numeroDocumento;
}

async function buscarPessoa(db: Db, cpfCnpj: string): Promise<PessoaRow | null> {
  return db.first<PessoaRow>("SELECT id_pessoa, status FROM fornecedor_cliente WHERE cpf_cnpj = ?", [cpfCnpj]);
}

async function buscarDespesa(db: Db, descricao: string): Promise<CategoriaRow | null> {
  return db.first<CategoriaRow>(
    "SELECT id_categoria, status FROM despesas_receitas WHERE tipo = 'DESPESA' AND descricao = ?",
    [descricao]
  );
}

function consultaPessoa(pessoa: PessoaNormalizada, row: PessoaRow | null): ConsultaCadastro {
  return row
    ? { nome: pessoa.nome, cpfCnpj: pessoa.cpfCnpj, existe: true, id: row.id_pessoa, status: row.status }
    : { nome: pessoa.nome, cpfCnpj: pessoa.cpfCnpj, existe: false };
}

function normalizarParticipantes(nfe: NfeExtracao) {
  return {
    fornecedor: normalizarPessoa(nfe.fornecedor.razaoSocial, nfe.fornecedor.cnpj, nfe.fornecedor.nomeFantasia),
    faturado: normalizarPessoa(nfe.faturado.nomeCompleto, nfe.faturado.cpf),
    despesa: normalizarDescricaoDespesa(nfe.classificacaoDespesa),
  };
}

async function buscarContaExistente(db: Db, idFornecedor: number, numeroDocumento: string) {
  const row = await db.first<{ id_conta: number }>(
    `SELECT id_conta FROM movimento_contas
      WHERE id_fornecedor = ? AND numero_documento = ? AND tipo_operacao = 'PAGAR' AND status <> 'CANCELADA'`,
    [idFornecedor, numeroDocumento]
  );
  return row ? { id: row.id_conta } : null;
}

// Consulta o banco e informa se Fornecedor, Faturado e Despesa já existem (sem alterar nada).
export async function verificarNfe(db: Db, nfe: NfeExtracao): Promise<VerificacaoNfe> {
  validarNfe(nfe);
  const { fornecedor, faturado, despesa } = normalizarParticipantes(nfe);

  const [fornecedorRow, faturadoRow, despesaRow] = await Promise.all([
    buscarPessoa(db, fornecedor.cpfCnpj),
    buscarPessoa(db, faturado.cpfCnpj),
    buscarDespesa(db, despesa),
  ]);

  const numeroDocumento = (nfe.numeroNotaFiscal ?? "").trim();
  const contaExistente =
    fornecedorRow && numeroDocumento
      ? await buscarContaExistente(db, fornecedorRow.id_pessoa, numeroDocumento)
      : null;

  return {
    fornecedor: consultaPessoa(fornecedor, fornecedorRow),
    faturado: consultaPessoa(faturado, faturadoRow),
    despesa: despesaRow
      ? { nome: despesa, existe: true, id: despesaRow.id_categoria, status: despesaRow.status }
      : { nome: despesa, existe: false },
    contaExistente,
  };
}

function comandosPessoa(pessoa: PessoaNormalizada, classificacao: "FORNECEDOR" | "CLIENTE"): SqlStatement[] {
  const outra = classificacao === "FORNECEDOR" ? "CLIENTE" : "FORNECEDOR";
  return [
    {
      sql: `INSERT OR IGNORE INTO fornecedor_cliente (razao_social, nome_fantasia, cpf_cnpj, tipo_pessoa, classificacao, status)
            VALUES (?, ?, ?, ?, ?, 'ATIVO')`,
      params: [pessoa.nome, pessoa.nomeFantasia, pessoa.cpfCnpj, pessoa.tipoPessoa, classificacao],
    },
    // Quem já era cadastrado com o outro papel passa a ser AMBOS; cadastros inativos são reativados.
    {
      sql: `UPDATE fornecedor_cliente
               SET status = 'ATIVO',
                   classificacao = CASE WHEN classificacao = ? THEN 'AMBOS' ELSE classificacao END
             WHERE cpf_cnpj = ?`,
      params: [outra, pessoa.cpfCnpj],
    },
  ];
}

// Cria o que não existe (Fornecedor, Faturado, Despesa), o registro do movimento (MOVIMENTO_CONTAS) e suas
// parcelas. Tudo em uma única transação: se algo falhar, nada é gravado.
export async function lancarNfe(db: Db, nfe: NfeExtracao): Promise<LancamentoNfe> {
  validarNfe(nfe);
  const numeroDocumento = validarConta(nfe);
  const parcelas = montarParcelas(nfe);
  const { fornecedor, faturado, despesa } = normalizarParticipantes(nfe);

  const antes = await verificarNfe(db, nfe);
  if (antes.contaExistente) {
    throw new ContaError(
      `A nota ${numeroDocumento} deste fornecedor já foi lançada (conta ID ${antes.contaExistente.id}).`,
      409
    );
  }

  const idFornecedor: SqlParam[] = [fornecedor.cpfCnpj];
  const idFaturado: SqlParam[] = [faturado.cpfCnpj];
  const subFornecedor = "(SELECT id_pessoa FROM fornecedor_cliente WHERE cpf_cnpj = ?)";
  const valorTotal = arredondar(nfe.valorTotal);

  const comandos: SqlStatement[] = [
    ...comandosPessoa(fornecedor, "FORNECEDOR"),
    ...comandosPessoa(faturado, "CLIENTE"),
    {
      sql: `INSERT OR IGNORE INTO despesas_receitas (descricao, tipo, status) VALUES (?, 'DESPESA', 'ATIVO')`,
      params: [despesa],
    },
    {
      sql: `UPDATE despesas_receitas SET status = 'ATIVO' WHERE tipo = 'DESPESA' AND descricao = ?`,
      params: [despesa],
    },
    {
      sql: `INSERT INTO movimento_contas
              (id_despesa_receita, id_fornecedor, id_faturado, numero_documento, data_emissao, data_vencimento,
               valor_total, descricao, tipo_operacao, origem_documento, status)
            VALUES (
              (SELECT id_categoria FROM despesas_receitas WHERE tipo = 'DESPESA' AND descricao = ?),
              ${subFornecedor},
              (SELECT id_pessoa FROM fornecedor_cliente WHERE cpf_cnpj = ?),
              ?, ?, ?, ?, ?, 'PAGAR', 'EXTRACAO_PDF', 'ABERTA')`,
      params: [
        despesa,
        ...idFornecedor,
        ...idFaturado,
        numeroDocumento,
        nfe.dataEmissao,
        nfe.dataVencimento,
        valorTotal,
        (nfe.descricaoProdutos ?? "").trim().slice(0, 255) || null,
      ],
    },
    ...parcelas.map(
      (parcela): SqlStatement => ({
        sql: `INSERT INTO movimento_parcelas
                (id_movimento_conta, numero_parcela, data_vencimento, valor_parcela, valor_saldo, status)
              VALUES (
                (SELECT id_conta FROM movimento_contas
                  WHERE id_fornecedor = ${subFornecedor} AND numero_documento = ?
                    AND tipo_operacao = 'PAGAR' AND status <> 'CANCELADA'),
                ?, ?, ?, ?, 'PENDENTE')`,
        params: [
          ...idFornecedor,
          numeroDocumento,
          parcela.numero,
          parcela.dataVencimento,
          arredondar(parcela.valor),
          arredondar(parcela.valor),
        ],
      })
    ),
  ];

  try {
    await db.batch(comandos);
  } catch (error) {
    const detalhe = error instanceof Error ? error.message : String(error);
    throw new ContaError(`Não foi possível gravar o lançamento: ${detalhe}`, 500);
  }

  const [fornecedorRow, faturadoRow, despesaRow] = await Promise.all([
    buscarPessoa(db, fornecedor.cpfCnpj),
    buscarPessoa(db, faturado.cpfCnpj),
    buscarDespesa(db, despesa),
  ]);
  const conta = fornecedorRow ? await buscarContaExistente(db, fornecedorRow.id_pessoa, numeroDocumento) : null;

  if (!fornecedorRow || !faturadoRow || !despesaRow || !conta) {
    throw new ContaError("Lançamento gravado, mas não foi possível reler os registros criados.", 500);
  }

  const parcelasGravadas = await db.all<ParcelaRow>(
    "SELECT id_parcela, numero_parcela FROM movimento_parcelas WHERE id_movimento_conta = ? ORDER BY numero_parcela",
    [conta.id]
  );

  const resumo = (
    id: number,
    consulta: ConsultaCadastro
  ): CadastroLancado => ({
    id,
    criado: !consulta.existe,
    reativado: consulta.existe && consulta.status === "INATIVO",
  });

  return {
    fornecedor: resumo(fornecedorRow.id_pessoa, antes.fornecedor),
    faturado: resumo(faturadoRow.id_pessoa, antes.faturado),
    despesa: resumo(despesaRow.id_categoria, antes.despesa),
    conta: { id: conta.id, numeroDocumento, valorTotal },
    parcelas: parcelasGravadas.map((p) => ({ id: p.id_parcela, numero: p.numero_parcela })),
  };
}
