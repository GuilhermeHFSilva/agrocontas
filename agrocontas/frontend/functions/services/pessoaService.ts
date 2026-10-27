import { Db, SqlParam } from "../db/types";
import { ServiceError } from "../utils/serviceError";
import {
  formatarCpfCnpj,
  idValido,
  opcaoValida,
  padraoLike,
  textoObrigatorio,
  textoOpcional,
} from "../utils/validacao";
import { Classificacao, Pessoa, PessoaFiltros, PessoaInput, TipoPessoa } from "../../src/types/cadastros";
import { StatusCadastro } from "../../src/types/conta";

// Mantenha este arquivo idêntico a backend/src/services/pessoaService.ts.

const CLASSIFICACOES = ["FORNECEDOR", "CLIENTE", "AMBOS"] as const;
const LIMITE_LISTAGEM = 500;

interface PessoaRow {
  id_pessoa: number;
  razao_social: string;
  nome_fantasia: string | null;
  cpf_cnpj: string;
  tipo_pessoa: TipoPessoa;
  classificacao: Classificacao;
  telefone: string | null;
  email: string | null;
  status: StatusCadastro;
}

const COLUNAS =
  "id_pessoa, razao_social, nome_fantasia, cpf_cnpj, tipo_pessoa, classificacao, telefone, email, status";

function paraPessoa(row: PessoaRow): Pessoa {
  return {
    id: row.id_pessoa,
    razaoSocial: row.razao_social,
    nomeFantasia: row.nome_fantasia,
    cpfCnpj: row.cpf_cnpj,
    tipoPessoa: row.tipo_pessoa,
    classificacao: row.classificacao,
    telefone: row.telefone,
    email: row.email,
    status: row.status,
  };
}

function normalizarEntrada(input: PessoaInput) {
  if (!input || typeof input !== "object") throw new ServiceError("Dados da pessoa ausentes.");

  const { cpfCnpj, tipoPessoa } = formatarCpfCnpj(input.cpfCnpj);
  const email = textoOpcional(input.email, "E-mail", 80)?.toLowerCase() ?? null;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ServiceError('O campo "E-mail" é inválido.');
  }

  return {
    razaoSocial: textoObrigatorio(input.razaoSocial, "Razão Social / Nome", 120).toUpperCase(),
    nomeFantasia: textoOpcional(input.nomeFantasia, "Nome Fantasia", 120)?.toUpperCase() ?? null,
    cpfCnpj,
    tipoPessoa,
    classificacao: opcaoValida(input.classificacao, CLASSIFICACOES, "Classificação"),
    telefone: textoOpcional(input.telefone, "Telefone", 20),
    email,
  };
}

async function garantirCpfCnpjLivre(db: Db, cpfCnpj: string, ignorarId?: number): Promise<void> {
  const existente = await db.first<{ id_pessoa: number }>(
    "SELECT id_pessoa FROM fornecedor_cliente WHERE cpf_cnpj = ?",
    [cpfCnpj]
  );
  if (existente && existente.id_pessoa !== ignorarId) {
    throw new ServiceError(`O CPF/CNPJ ${cpfCnpj} já está cadastrado (ID ${existente.id_pessoa}).`, 409);
  }
}

export async function obterPessoa(db: Db, idBruto: unknown): Promise<Pessoa> {
  const id = idValido(idBruto);
  const row = await db.first<PessoaRow>(`SELECT ${COLUNAS} FROM fornecedor_cliente WHERE id_pessoa = ?`, [id]);
  if (!row) throw new ServiceError("Pessoa não encontrada.", 404);
  return paraPessoa(row);
}

// Busca por mais de um elemento: o texto é procurado em nome, fantasia, CPF/CNPJ (com ou sem máscara),
// e-mail e telefone; os demais filtros se combinam (E) com o texto.
export async function listarPessoas(db: Db, filtros: PessoaFiltros = {}): Promise<Pessoa[]> {
  const condicoes: string[] = [];
  const params: SqlParam[] = [];

  const texto = (filtros.q ?? "").trim();
  if (texto) {
    const maiusculo = padraoLike(texto.toUpperCase());
    const minusculo = padraoLike(texto.toLowerCase());
    const digitos = texto.replace(/\D/g, "");
    const partes = [
      "razao_social LIKE ? ESCAPE '\\'",
      "nome_fantasia LIKE ? ESCAPE '\\'",
      "cpf_cnpj LIKE ? ESCAPE '\\'",
      "email LIKE ? ESCAPE '\\'",
      "telefone LIKE ? ESCAPE '\\'",
    ];
    params.push(maiusculo, maiusculo, padraoLike(texto), minusculo, padraoLike(texto));
    if (digitos) {
      partes.push("replace(replace(replace(cpf_cnpj, '.', ''), '-', ''), '/', '') LIKE ?");
      params.push(`%${digitos}%`);
    }
    condicoes.push(`(${partes.join(" OR ")})`);
  }

  if (filtros.classificacao) {
    condicoes.push("classificacao = ?");
    params.push(opcaoValida(filtros.classificacao, CLASSIFICACOES, "Classificação"));
  }

  if (filtros.status && filtros.status !== "TODOS") {
    condicoes.push("status = ?");
    params.push(opcaoValida(filtros.status, ["ATIVO", "INATIVO"] as const, "Status"));
  }

  const where = condicoes.length ? `WHERE ${condicoes.join(" AND ")}` : "";
  const rows = await db.all<PessoaRow>(
    `SELECT ${COLUNAS} FROM fornecedor_cliente ${where} ORDER BY razao_social LIMIT ${LIMITE_LISTAGEM}`,
    params
  );
  return rows.map(paraPessoa);
}

// O status não é informado pelo usuário: todo cadastro novo nasce ATIVO.
export async function criarPessoa(db: Db, input: PessoaInput): Promise<Pessoa> {
  const dados = normalizarEntrada(input);
  await garantirCpfCnpjLivre(db, dados.cpfCnpj);

  await db.batch([
    {
      sql: `INSERT INTO fornecedor_cliente
              (razao_social, nome_fantasia, cpf_cnpj, tipo_pessoa, classificacao, telefone, email, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'ATIVO')`,
      params: [
        dados.razaoSocial,
        dados.nomeFantasia,
        dados.cpfCnpj,
        dados.tipoPessoa,
        dados.classificacao,
        dados.telefone,
        dados.email,
      ],
    },
  ]);

  const row = await db.first<PessoaRow>(`SELECT ${COLUNAS} FROM fornecedor_cliente WHERE cpf_cnpj = ?`, [
    dados.cpfCnpj,
  ]);
  if (!row) throw new ServiceError("Pessoa gravada, mas não foi possível relê-la.", 500);
  return paraPessoa(row);
}

// A alteração não mexe no status (campo oculto no formulário).
export async function atualizarPessoa(db: Db, idBruto: unknown, input: PessoaInput): Promise<Pessoa> {
  const atual = await obterPessoa(db, idBruto);
  const dados = normalizarEntrada(input);
  await garantirCpfCnpjLivre(db, dados.cpfCnpj, atual.id);

  await db.batch([
    {
      sql: `UPDATE fornecedor_cliente
               SET razao_social = ?, nome_fantasia = ?, cpf_cnpj = ?, tipo_pessoa = ?,
                   classificacao = ?, telefone = ?, email = ?
             WHERE id_pessoa = ?`,
      params: [
        dados.razaoSocial,
        dados.nomeFantasia,
        dados.cpfCnpj,
        dados.tipoPessoa,
        dados.classificacao,
        dados.telefone,
        dados.email,
        atual.id,
      ],
    },
  ]);
  return obterPessoa(db, atual.id);
}

// Exclusão lógica (ativo = false -> INATIVO) e reativação (ativo = true -> ATIVO). Nada é excluído fisicamente.
export async function alterarStatusPessoa(db: Db, idBruto: unknown, ativo: unknown): Promise<Pessoa> {
  if (typeof ativo !== "boolean") throw new ServiceError('Informe "ativo" como verdadeiro ou falso.');
  const atual = await obterPessoa(db, idBruto);

  await db.batch([
    {
      sql: "UPDATE fornecedor_cliente SET status = ? WHERE id_pessoa = ?",
      params: [ativo ? "ATIVO" : "INATIVO", atual.id],
    },
  ]);
  return obterPessoa(db, atual.id);
}
