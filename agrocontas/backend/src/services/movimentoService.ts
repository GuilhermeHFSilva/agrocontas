import { Db, SqlParam, SqlStatement } from "../db/types";
import { ServiceError } from "../utils/serviceError";
import {
  arredondar,
  dataObrigatoria,
  idValido,
  opcaoValida,
  padraoLike,
  textoObrigatorio,
  textoOpcional,
  valorPositivo,
} from "../utils/validacao";
import {
  ContaDetalhe,
  ContaFiltros,
  ContaInput,
  ContaResumo,
  ParcelaConta,
  StatusConta,
  StatusParcela,
  TipoCategoria,
  TipoOperacao,
} from "../types/cadastros";
import { StatusCadastro } from "../types/conta";

const OPERACOES = ["PAGAR", "RECEBER"] as const;
const STATUS_CONTA = ["ABERTA", "QUITADA", "CANCELADA"] as const;
const MAX_PARCELAS = 120;
const LIMITE_LISTAGEM = 500;

interface ContaRow {
  id_conta: number;
  tipo_operacao: TipoOperacao;
  numero_documento: string;
  id_fornecedor: number;
  fornecedor_nome: string;
  id_faturado: number;
  faturado_nome: string;
  id_despesa_receita: number;
  categoria_descricao: string;
  data_emissao: string;
  data_vencimento: string;
  valor_total: number;
  qtd_parcelas: number;
  origem_documento: "MANUAL" | "EXTRACAO_PDF";
  descricao: string | null;
  status: StatusConta;
}

interface ParcelaRow {
  id_parcela: number;
  numero_parcela: number;
  data_vencimento: string;
  valor_parcela: number;
  valor_saldo: number;
  status: StatusParcela;
}

const SELECT_CONTA = `
  SELECT c.id_conta, c.tipo_operacao, c.numero_documento,
         c.id_fornecedor, f.razao_social AS fornecedor_nome,
         c.id_faturado, t.razao_social AS faturado_nome,
         c.id_despesa_receita, d.descricao AS categoria_descricao,
         c.data_emissao, c.data_vencimento, c.valor_total, c.origem_documento, c.descricao, c.status,
         (SELECT COUNT(*) FROM movimento_parcelas p WHERE p.id_movimento_conta = c.id_conta) AS qtd_parcelas
    FROM movimento_contas c
    JOIN fornecedor_cliente f ON f.id_pessoa = c.id_fornecedor
    JOIN fornecedor_cliente t ON t.id_pessoa = c.id_faturado
    JOIN despesas_receitas d ON d.id_categoria = c.id_despesa_receita`;

function paraResumo(row: ContaRow): ContaResumo {
  return {
    id: row.id_conta,
    tipoOperacao: row.tipo_operacao,
    numeroDocumento: row.numero_documento,
    fornecedorId: row.id_fornecedor,
    fornecedorNome: row.fornecedor_nome,
    faturadoId: row.id_faturado,
    faturadoNome: row.faturado_nome,
    categoriaId: row.id_despesa_receita,
    categoriaDescricao: row.categoria_descricao,
    dataEmissao: row.data_emissao,
    dataVencimento: row.data_vencimento,
    valorTotal: row.valor_total,
    quantidadeParcelas: row.qtd_parcelas,
    origemDocumento: row.origem_documento,
    status: row.status,
  };
}

function paraParcela(row: ParcelaRow): ParcelaConta {
  return {
    id: row.id_parcela,
    numero: row.numero_parcela,
    dataVencimento: row.data_vencimento,
    valor: row.valor_parcela,
    saldo: row.valor_saldo,
    status: row.status,
  };
}

export async function obterConta(db: Db, idBruto: unknown): Promise<ContaDetalhe> {
  const id = idValido(idBruto);
  const row = await db.first<ContaRow>(`${SELECT_CONTA} WHERE c.id_conta = ?`, [id]);
  if (!row) throw new ServiceError("Conta não encontrada.", 404);

  const parcelas = await db.all<ParcelaRow>(
    `SELECT id_parcela, numero_parcela, data_vencimento, valor_parcela, valor_saldo, status
       FROM movimento_parcelas WHERE id_movimento_conta = ? ORDER BY numero_parcela`,
    [id]
  );
  return { ...paraResumo(row), descricao: row.descricao, parcelas: parcelas.map(paraParcela) };
}

export async function listarContas(db: Db, filtros: ContaFiltros = {}): Promise<ContaResumo[]> {
  const condicoes: string[] = [];
  const params: SqlParam[] = [];

  const texto = (filtros.q ?? "").trim();
  if (texto) {
    const maiusculo = padraoLike(texto.toUpperCase());
    condicoes.push(
      `(c.numero_documento LIKE ? ESCAPE '\\' OR c.descricao LIKE ? ESCAPE '\\'
        OR f.razao_social LIKE ? ESCAPE '\\' OR t.razao_social LIKE ? ESCAPE '\\'
        OR d.descricao LIKE ? ESCAPE '\\')`
    );
    params.push(padraoLike(texto), padraoLike(texto), maiusculo, maiusculo, maiusculo);
  }

  if (filtros.tipoOperacao) {
    condicoes.push("c.tipo_operacao = ?");
    params.push(opcaoValida(filtros.tipoOperacao, OPERACOES, "Tipo de operação"));
  }

  if (filtros.status === "ATIVAS") {
    condicoes.push("c.status <> 'CANCELADA'");
  } else if (filtros.status && filtros.status !== "TODAS") {
    condicoes.push("c.status = ?");
    params.push(opcaoValida(filtros.status, STATUS_CONTA, "Status"));
  }

  if (filtros.vencimentoDe) {
    condicoes.push("c.data_vencimento >= ?");
    params.push(dataObrigatoria(filtros.vencimentoDe, "Vencimento (de)"));
  }
  if (filtros.vencimentoAte) {
    condicoes.push("c.data_vencimento <= ?");
    params.push(dataObrigatoria(filtros.vencimentoAte, "Vencimento (até)"));
  }

  const where = condicoes.length ? `WHERE ${condicoes.join(" AND ")}` : "";
  const rows = await db.all<ContaRow>(
    `${SELECT_CONTA} ${where} ORDER BY c.data_vencimento DESC, c.id_conta DESC LIMIT ${LIMITE_LISTAGEM}`,
    params
  );
  return rows.map(paraResumo);
}

interface ContaPreparada {
  tipoOperacao: TipoOperacao;
  fornecedorId: number;
  faturadoId: number;
  categoriaId: number;
  numeroDocumento: string;
  dataEmissao: string;
  dataVencimento: string;
  valorTotal: number;
  descricao: string | null;
  parcelas: { numero: number; dataVencimento: string; valor: number }[];
}

async function exigirPessoaAtiva(db: Db, id: number, rotulo: string): Promise<void> {
  const pessoa = await db.first<{ status: StatusCadastro }>(
    "SELECT status FROM fornecedor_cliente WHERE id_pessoa = ?",
    [id]
  );
  if (!pessoa) throw new ServiceError(`${rotulo} não encontrado(a).`, 404);
  if (pessoa.status !== "ATIVO") throw new ServiceError(`${rotulo} está INATIVO(A). Reative o cadastro antes de usá-lo.`, 409);
}

async function exigirCategoriaCompativel(db: Db, id: number, tipoOperacao: TipoOperacao): Promise<void> {
  const categoria = await db.first<{ tipo: TipoCategoria; status: StatusCadastro }>(
    "SELECT tipo, status FROM despesas_receitas WHERE id_categoria = ?",
    [id]
  );
  if (!categoria) throw new ServiceError("Classificação não encontrada.", 404);
  if (categoria.status !== "ATIVO") {
    throw new ServiceError("A classificação está INATIVA. Reative o cadastro antes de usá-la.", 409);
  }
  const esperado: TipoCategoria = tipoOperacao === "PAGAR" ? "DESPESA" : "RECEITA";
  if (categoria.tipo !== esperado) {
    throw new ServiceError(
      `Conta a ${tipoOperacao === "PAGAR" ? "pagar" : "receber"} exige classificação do tipo ${esperado}.`
    );
  }
}

async function exigirDocumentoLivre(
  db: Db,
  fornecedorId: number,
  numeroDocumento: string,
  tipoOperacao: TipoOperacao,
  ignorarId?: number
): Promise<void> {
  const existente = await db.first<{ id_conta: number }>(
    `SELECT id_conta FROM movimento_contas
      WHERE id_fornecedor = ? AND numero_documento = ? AND tipo_operacao = ? AND status <> 'CANCELADA'`,
    [fornecedorId, numeroDocumento, tipoOperacao]
  );
  if (existente && existente.id_conta !== ignorarId) {
    throw new ServiceError(
      `O documento ${numeroDocumento} já foi lançado para este fornecedor (conta ID ${existente.id_conta}).`,
      409
    );
  }
}

async function possuiMovimentoFinanceiro(db: Db, idConta: number): Promise<boolean> {
  const row = await db.first<{ id_movimento: number }>(
    `SELECT mf.id_movimento FROM movimento_financeiro mf
       JOIN movimento_parcelas p ON p.id_parcela = mf.id_movimento_parcela
      WHERE p.id_movimento_conta = ? LIMIT 1`,
    [idConta]
  );
  return row !== null;
}

async function prepararConta(db: Db, input: ContaInput, ignorarId?: number): Promise<ContaPreparada> {
  if (!input || typeof input !== "object") throw new ServiceError("Dados da conta ausentes.");

  const tipoOperacao = opcaoValida(input.tipoOperacao, OPERACOES, "Tipo de operação");
  const fornecedorId = idValido(input.fornecedorId, "Fornecedor");
  const faturadoId = idValido(input.faturadoId, "Faturado");
  const categoriaId = idValido(input.categoriaId, "Classificação");
  const numeroDocumento = textoObrigatorio(input.numeroDocumento, "Número do documento", 44);
  const dataEmissao = dataObrigatoria(input.dataEmissao, "Data de emissão");
  const descricao = textoOpcional(input.descricao, "Descrição", 255);

  if (!Array.isArray(input.parcelas) || input.parcelas.length < 1) {
    throw new ServiceError("Informe ao menos uma parcela.");
  }
  if (input.parcelas.length > MAX_PARCELAS) {
    throw new ServiceError(`Uma conta aceita no máximo ${MAX_PARCELAS} parcelas.`);
  }

  const parcelas = input.parcelas
    .map((parcela, indice) => ({
      dataVencimento: dataObrigatoria(parcela?.dataVencimento, `Vencimento da parcela ${indice + 1}`),
      valor: valorPositivo(parcela?.valor, `Valor da parcela ${indice + 1}`),
    }))
    .sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento))
    .map((parcela, indice) => ({ numero: indice + 1, ...parcela }));

  await exigirPessoaAtiva(db, fornecedorId, tipoOperacao === "PAGAR" ? "Fornecedor" : "Emitente");
  await exigirPessoaAtiva(db, faturadoId, tipoOperacao === "PAGAR" ? "Faturado" : "Cliente");
  await exigirCategoriaCompativel(db, categoriaId, tipoOperacao);
  await exigirDocumentoLivre(db, fornecedorId, numeroDocumento, tipoOperacao, ignorarId);

  return {
    tipoOperacao,
    fornecedorId,
    faturadoId,
    categoriaId,
    numeroDocumento,
    dataEmissao,
    dataVencimento: parcelas[0].dataVencimento,
    valorTotal: arredondar(parcelas.reduce((soma, parcela) => soma + parcela.valor, 0)),
    descricao,
    parcelas,
  };
}

function comandosParcelas(
  referenciaConta: string,
  paramsReferencia: SqlParam[],
  parcelas: ContaPreparada["parcelas"]
): SqlStatement[] {
  return parcelas.map((parcela) => ({
    sql: `INSERT INTO movimento_parcelas
            (id_movimento_conta, numero_parcela, data_vencimento, valor_parcela, valor_saldo, status)
          VALUES (${referenciaConta}, ?, ?, ?, ?, 'PENDENTE')`,
    params: [...paramsReferencia, parcela.numero, parcela.dataVencimento, parcela.valor, parcela.valor],
  }));
}

export async function criarConta(db: Db, input: ContaInput): Promise<ContaDetalhe> {
  const conta = await prepararConta(db, input);

  await db.batch([
    {
      sql: `INSERT INTO movimento_contas
              (id_despesa_receita, id_fornecedor, id_faturado, numero_documento, data_emissao, data_vencimento,
               valor_total, descricao, tipo_operacao, origem_documento, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'MANUAL', 'ABERTA')`,
      params: [
        conta.categoriaId,
        conta.fornecedorId,
        conta.faturadoId,
        conta.numeroDocumento,
        conta.dataEmissao,
        conta.dataVencimento,
        conta.valorTotal,
        conta.descricao,
        conta.tipoOperacao,
      ],
    },
    ...comandosParcelas(
      `(SELECT id_conta FROM movimento_contas
         WHERE id_fornecedor = ? AND numero_documento = ? AND tipo_operacao = ? AND status <> 'CANCELADA')`,
      [conta.fornecedorId, conta.numeroDocumento, conta.tipoOperacao],
      conta.parcelas
    ),
  ]);

  const criada = await db.first<{ id_conta: number }>(
    `SELECT id_conta FROM movimento_contas
      WHERE id_fornecedor = ? AND numero_documento = ? AND tipo_operacao = ? AND status <> 'CANCELADA'`,
    [conta.fornecedorId, conta.numeroDocumento, conta.tipoOperacao]
  );
  if (!criada) throw new ServiceError("Conta gravada, mas não foi possível relê-la.", 500);
  return obterConta(db, criada.id_conta);
}

export async function atualizarConta(db: Db, idBruto: unknown, input: ContaInput): Promise<ContaDetalhe> {
  const atual = await obterConta(db, idBruto);
  if (atual.status !== "ABERTA") {
    throw new ServiceError(`Somente contas ABERTAS podem ser alteradas (esta conta está ${atual.status}).`, 409);
  }
  if (await possuiMovimentoFinanceiro(db, atual.id)) {
    throw new ServiceError("A conta possui baixas registradas e não pode mais ser alterada.", 409);
  }

  const conta = await prepararConta(db, input, atual.id);

  await db.batch([
    {
      sql: `UPDATE movimento_contas
               SET id_despesa_receita = ?, id_fornecedor = ?, id_faturado = ?, numero_documento = ?,
                   data_emissao = ?, data_vencimento = ?, valor_total = ?, descricao = ?, tipo_operacao = ?
             WHERE id_conta = ?`,
      params: [
        conta.categoriaId,
        conta.fornecedorId,
        conta.faturadoId,
        conta.numeroDocumento,
        conta.dataEmissao,
        conta.dataVencimento,
        conta.valorTotal,
        conta.descricao,
        conta.tipoOperacao,
        atual.id,
      ],
    },
    { sql: "DELETE FROM movimento_parcelas WHERE id_movimento_conta = ?", params: [atual.id] },
    ...comandosParcelas("?", [atual.id], conta.parcelas),
  ]);
  return obterConta(db, atual.id);
}

export async function alterarStatusConta(db: Db, idBruto: unknown, ativo: unknown): Promise<ContaDetalhe> {
  if (typeof ativo !== "boolean") throw new ServiceError('Informe "ativo" como verdadeiro ou falso.');
  const atual = await obterConta(db, idBruto);

  if (!ativo) {
    if (atual.status === "CANCELADA") return atual;
    if (atual.status === "QUITADA" || (await possuiMovimentoFinanceiro(db, atual.id))) {
      throw new ServiceError("A conta possui baixas registradas e não pode ser excluída.", 409);
    }
    await db.batch([{ sql: "UPDATE movimento_contas SET status = 'CANCELADA' WHERE id_conta = ?", params: [atual.id] }]);
  } else {
    if (atual.status !== "CANCELADA") return atual;
    
    await exigirDocumentoLivre(db, atual.fornecedorId, atual.numeroDocumento, atual.tipoOperacao, atual.id);
    await db.batch([{ sql: "UPDATE movimento_contas SET status = 'ABERTA' WHERE id_conta = ?", params: [atual.id] }]);
  }
  return obterConta(db, atual.id);
}
