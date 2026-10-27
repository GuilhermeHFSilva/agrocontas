// Schema SQLite (espelho de frontend/migrations/0001_init.sql). Aplicado na inicialização da conexão.
export const SCHEMA_SQL = `
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

CREATE TABLE IF NOT EXISTS despesas_receitas (
  id_categoria      INTEGER PRIMARY KEY AUTOINCREMENT,
  descricao         TEXT NOT NULL,
  tipo              TEXT NOT NULL CHECK (tipo IN ('DESPESA', 'RECEITA')),
  grupo_operacional TEXT,
  centro_custo      TEXT,
  status            TEXT NOT NULL DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'INATIVO')),
  UNIQUE (tipo, descricao)
);

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

CREATE INDEX IF NOT EXISTS idx_contas_fornecedor_documento ON movimento_contas (id_fornecedor, numero_documento);
`;
