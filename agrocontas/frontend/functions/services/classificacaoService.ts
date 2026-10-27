import { Db, SqlParam } from "../db/types";
import { ServiceError } from "../utils/serviceError";
import { idValido, opcaoValida, padraoLike, textoObrigatorio, textoOpcional } from "../utils/validacao";
import { CategoriaFiltros, CategoriaInput, CategoriaItem, TipoCategoria } from "../../src/types/cadastros";
import { StatusCadastro } from "../../src/types/conta";

// Mantenha este arquivo idêntico a backend/src/services/classificacaoService.ts.

const TIPOS = ["DESPESA", "RECEITA"] as const;
const LIMITE_LISTAGEM = 500;

interface CategoriaRow {
  id_categoria: number;
  descricao: string;
  tipo: TipoCategoria;
  grupo_operacional: string | null;
  centro_custo: string | null;
  status: StatusCadastro;
}

const COLUNAS = "id_categoria, descricao, tipo, grupo_operacional, centro_custo, status";

function paraCategoria(row: CategoriaRow): CategoriaItem {
  return {
    id: row.id_categoria,
    descricao: row.descricao,
    tipo: row.tipo,
    grupoOperacional: row.grupo_operacional,
    centroCusto: row.centro_custo,
    status: row.status,
  };
}

// A descrição é gravada em maiúsculas, o mesmo padrão usado pela extração de PDF, para que
// "Manutenção e Operação" digitado aqui seja reconhecido como a classificação já existente.
function normalizarEntrada(input: CategoriaInput) {
  if (!input || typeof input !== "object") throw new ServiceError("Dados da classificação ausentes.");
  return {
    descricao: textoObrigatorio(input.descricao, "Descrição", 80).toUpperCase(),
    tipo: opcaoValida(input.tipo, TIPOS, "Tipo"),
    grupoOperacional: textoOpcional(input.grupoOperacional, "Grupo Operacional", 60)?.toUpperCase() ?? null,
    centroCusto: textoOpcional(input.centroCusto, "Centro de Custo", 60)?.toUpperCase() ?? null,
  };
}

async function garantirDescricaoLivre(db: Db, tipo: string, descricao: string, ignorarId?: number) {
  const existente = await db.first<{ id_categoria: number }>(
    "SELECT id_categoria FROM despesas_receitas WHERE tipo = ? AND descricao = ?",
    [tipo, descricao]
  );
  if (existente && existente.id_categoria !== ignorarId) {
    throw new ServiceError(
      `Já existe ${tipo === "DESPESA" ? "uma despesa" : "uma receita"} "${descricao}" (ID ${existente.id_categoria}).`,
      409
    );
  }
}

export async function obterCategoria(db: Db, idBruto: unknown): Promise<CategoriaItem> {
  const id = idValido(idBruto);
  const row = await db.first<CategoriaRow>(`SELECT ${COLUNAS} FROM despesas_receitas WHERE id_categoria = ?`, [id]);
  if (!row) throw new ServiceError("Classificação não encontrada.", 404);
  return paraCategoria(row);
}

export async function listarCategorias(db: Db, filtros: CategoriaFiltros = {}): Promise<CategoriaItem[]> {
  const condicoes: string[] = [];
  const params: SqlParam[] = [];

  const texto = (filtros.q ?? "").trim();
  if (texto) {
    const padrao = padraoLike(texto.toUpperCase());
    condicoes.push(
      "(descricao LIKE ? ESCAPE '\\' OR grupo_operacional LIKE ? ESCAPE '\\' OR centro_custo LIKE ? ESCAPE '\\')"
    );
    params.push(padrao, padrao, padrao);
  }

  if (filtros.tipo) {
    condicoes.push("tipo = ?");
    params.push(opcaoValida(filtros.tipo, TIPOS, "Tipo"));
  }

  if (filtros.status && filtros.status !== "TODOS") {
    condicoes.push("status = ?");
    params.push(opcaoValida(filtros.status, ["ATIVO", "INATIVO"] as const, "Status"));
  }

  const where = condicoes.length ? `WHERE ${condicoes.join(" AND ")}` : "";
  const rows = await db.all<CategoriaRow>(
    `SELECT ${COLUNAS} FROM despesas_receitas ${where} ORDER BY tipo, descricao LIMIT ${LIMITE_LISTAGEM}`,
    params
  );
  return rows.map(paraCategoria);
}

export async function criarCategoria(db: Db, input: CategoriaInput): Promise<CategoriaItem> {
  const dados = normalizarEntrada(input);
  await garantirDescricaoLivre(db, dados.tipo, dados.descricao);

  await db.batch([
    {
      sql: `INSERT INTO despesas_receitas (descricao, tipo, grupo_operacional, centro_custo, status)
            VALUES (?, ?, ?, ?, 'ATIVO')`,
      params: [dados.descricao, dados.tipo, dados.grupoOperacional, dados.centroCusto],
    },
  ]);

  const row = await db.first<CategoriaRow>(
    `SELECT ${COLUNAS} FROM despesas_receitas WHERE tipo = ? AND descricao = ?`,
    [dados.tipo, dados.descricao]
  );
  if (!row) throw new ServiceError("Classificação gravada, mas não foi possível relê-la.", 500);
  return paraCategoria(row);
}

export async function atualizarCategoria(db: Db, idBruto: unknown, input: CategoriaInput): Promise<CategoriaItem> {
  const atual = await obterCategoria(db, idBruto);
  const dados = normalizarEntrada(input);
  await garantirDescricaoLivre(db, dados.tipo, dados.descricao, atual.id);

  // Trocar Despesa por Receita (ou vice-versa) quebraria contas que já usam esta classificação.
  if (dados.tipo !== atual.tipo) {
    const emUso = await db.first<{ id_conta: number }>(
      "SELECT id_conta FROM movimento_contas WHERE id_despesa_receita = ? LIMIT 1",
      [atual.id]
    );
    if (emUso) {
      throw new ServiceError("O tipo não pode ser alterado: a classificação já é usada em contas lançadas.", 409);
    }
  }

  await db.batch([
    {
      sql: `UPDATE despesas_receitas
               SET descricao = ?, tipo = ?, grupo_operacional = ?, centro_custo = ?
             WHERE id_categoria = ?`,
      params: [dados.descricao, dados.tipo, dados.grupoOperacional, dados.centroCusto, atual.id],
    },
  ]);
  return obterCategoria(db, atual.id);
}

export async function alterarStatusCategoria(db: Db, idBruto: unknown, ativo: unknown): Promise<CategoriaItem> {
  if (typeof ativo !== "boolean") throw new ServiceError('Informe "ativo" como verdadeiro ou falso.');
  const atual = await obterCategoria(db, idBruto);

  await db.batch([
    {
      sql: "UPDATE despesas_receitas SET status = ? WHERE id_categoria = ?",
      params: [ativo ? "ATIVO" : "INATIVO", atual.id],
    },
  ]);
  return obterCategoria(db, atual.id);
}
