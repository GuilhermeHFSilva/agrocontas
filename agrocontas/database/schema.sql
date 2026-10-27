-- ==============================================================================
-- AGROCONTAS — MODELO DE BANCO DE DADOS RELACIONAL (DER OFICIAL COM 5 ENTIDADES)
-- Compatível com: Cloudflare D1 (SQLite na Borda) e SQLite Local
-- Disciplina: Desenvolvimento Orientado a Objetos (DOO) - UniRV
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. TABELA: FORNECEDOR_CLIENTE (RF01)
-- Representa parceiros comerciais (Fornecedores de insumos/serviços, Clientes e Faturados).
-- Regra de Negócio: Exclusão lógica obrigatória (status ATIVO/INATIVO).
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fornecedor_cliente (
  id_pessoa     INTEGER PRIMARY KEY AUTOINCREMENT,
  razao_social  TEXT NOT NULL,
  nome_fantasia TEXT,
  cpf_cnpj      TEXT NOT NULL UNIQUE,
  tipo_pessoa   TEXT NOT NULL CHECK (tipo_pessoa IN ('FISICA', 'JURIDICA')),
  classificacao TEXT NOT NULL CHECK (classificacao IN ('FORNECEDOR', 'CLIENTE', 'AMBOS')),
  telefone      TEXT,
  email         TEXT,
  status        TEXT NOT NULL DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'INATIVO'))
);

-- ------------------------------------------------------------------------------
-- 2. TABELA: DESPESAS_RECEITAS (RF02)
-- Catálogo do plano de contas rural (Tipos de Despesa e Tipos de Receita).
-- Regra de Negócio: Exclusão lógica obrigatória (status ATIVO/INATIVO).
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS despesas_receitas (
  id_categoria      INTEGER PRIMARY KEY AUTOINCREMENT,
  descricao         TEXT NOT NULL,
  tipo              TEXT NOT NULL CHECK (tipo IN ('DESPESA', 'RECEITA')),
  grupo_operacional TEXT,
  centro_custo      TEXT,
  status            TEXT NOT NULL DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'INATIVO')),
  UNIQUE (tipo, descricao)
);

-- ------------------------------------------------------------------------------
-- 3. TABELA: MOVIMENTO_CONTAS (RF03)
-- Registros mestre de Contas a Pagar e Contas a Receber.
-- Relacionamentos FK com fornecedor_cliente (fornecedor e faturado) e despesas_receitas.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS movimento_contas (
  id_conta           INTEGER PRIMARY KEY AUTOINCREMENT,
  id_despesa_receita INTEGER NOT NULL REFERENCES despesas_receitas (id_categoria),
  id_fornecedor      INTEGER NOT NULL REFERENCES fornecedor_cliente (id_pessoa),
  id_faturado        INTEGER NOT NULL REFERENCES fornecedor_cliente (id_pessoa),
  numero_documento   TEXT NOT NULL,
  data_emissao       TEXT NOT NULL,
  data_vencimento    TEXT NOT NULL,
  valor_total        NUMERIC NOT NULL,
  descricao          TEXT,
  tipo_operacao      TEXT NOT NULL CHECK (tipo_operacao IN ('PAGAR', 'RECEBER')),
  origem_documento   TEXT NOT NULL DEFAULT 'MANUAL' CHECK (origem_documento IN ('MANUAL', 'EXTRACAO_PDF')),
  status             TEXT NOT NULL DEFAULT 'ABERTA' CHECK (status IN ('ABERTA', 'QUITADA', 'CANCELADA'))
);

-- ------------------------------------------------------------------------------
-- 4. TABELA: MOVIMENTO_PARCELAS (RF04)
-- Desdobramento das contas em parcelas a prazo com vencimentos distintos e controle de saldo.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS movimento_parcelas (
  id_parcela         INTEGER PRIMARY KEY AUTOINCREMENT,
  id_movimento_conta INTEGER NOT NULL REFERENCES movimento_contas (id_conta),
  numero_parcela     INTEGER NOT NULL,
  data_vencimento    TEXT NOT NULL,
  valor_parcela      NUMERIC NOT NULL,
  valor_saldo        NUMERIC NOT NULL,
  status             TEXT NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'PARCIAL', 'LIQUIDADA')),
  UNIQUE (id_movimento_conta, numero_parcela)
);

-- ------------------------------------------------------------------------------
-- 5. TABELA: MOVIMENTO_FINANCEIRO (RF05)
-- Quitações, pagamentos e liquidações das parcelas.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS movimento_financeiro (
  id_movimento         INTEGER PRIMARY KEY AUTOINCREMENT,
  id_movimento_parcela INTEGER NOT NULL REFERENCES movimento_parcelas (id_parcela),
  data_movimento       TEXT NOT NULL,
  valor_pago           NUMERIC NOT NULL,
  juros_multa          NUMERIC NOT NULL DEFAULT 0,
  desconto             NUMERIC NOT NULL DEFAULT 0,
  forma_pagamento      TEXT NOT NULL,
  comprovante          TEXT,
  status               TEXT NOT NULL DEFAULT 'CONFIRMADO' CHECK (status IN ('CONFIRMADO', 'ESTORNADO'))
);

-- ------------------------------------------------------------------------------
-- ÍNDICES DE PERFORMANCE
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_contas_fornecedor_doc ON movimento_contas (id_fornecedor, numero_documento);
CREATE INDEX IF NOT EXISTS idx_parcelas_conta ON movimento_parcelas (id_movimento_conta);
CREATE INDEX IF NOT EXISTS idx_mov_parcela ON movimento_financeiro (id_movimento_parcela);

-- ------------------------------------------------------------------------------
-- CARGA INICIAL: 9 CATEGORIAS OFICIAIS DE DESPESA DO AGRONEGÓCIO (UniRV)
-- E PRINCIPAIS CATEGORIAS DE RECEITA
-- ------------------------------------------------------------------------------
INSERT OR IGNORE INTO despesas_receitas (descricao, tipo, grupo_operacional, centro_custo, status) VALUES
  ('INSUMOS AGRÍCOLAS', 'DESPESA', 'Lavouras e Culturas', 'Produção Rural', 'ATIVO'),
  ('MANUTENÇÃO E OPERAÇÃO', 'DESPESA', 'Máquinas e Equipamentos', 'Oficina e Campo', 'ATIVO'),
  ('RECURSOS HUMANOS', 'DESPESA', 'Pessoal e Folha', 'Mão de Obra', 'ATIVO'),
  ('SERVIÇOS OPERACIONAIS', 'DESPESA', 'Logística e Fretes', 'Operação Agrícola', 'ATIVO'),
  ('INFRAESTRUTURA E UTILIDADES', 'DESPESA', 'Instalações e Terra', 'Propriedade Rural', 'ATIVO'),
  ('ADMINISTRATIVAS', 'DESPESA', 'Gestão e Honorários', 'Administração', 'ATIVO'),
  ('SEGUROS E PROTEÇÃO', 'DESPESA', 'Gestão de Riscos', 'Seguridade', 'ATIVO'),
  ('IMPOSTOS E TAXAS', 'DESPESA', 'Tributos Rurais', 'Fiscal', 'ATIVO'),
  ('INVESTIMENTOS', 'DESPESA', 'Bens de Capital', 'Patrimônio', 'ATIVO'),
  ('VENDA DA SAFRA', 'RECEITA', 'Comercialização de Grãos', 'Receitas Agrícolas', 'ATIVO'),
  ('PRESTAÇÃO DE SERVIÇOS AGRÍCOLAS', 'RECEITA', 'Locação de Máquinas e Serviços', 'Receitas Operacionais', 'ATIVO'),
  ('ARRENDAMENTO RECEBIDO', 'RECEITA', 'Rendas Imobiliárias', 'Receitas Patrimoniais', 'ATIVO');
