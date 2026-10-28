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

CREATE INDEX IF NOT EXISTS idx_contas_fornecedor_doc ON movimento_contas (id_fornecedor, numero_documento);
CREATE UNIQUE INDEX IF NOT EXISTS ux_contas_documento ON movimento_contas (id_fornecedor, numero_documento, tipo_operacao) WHERE status <> 'CANCELADA';
CREATE INDEX IF NOT EXISTS idx_parcelas_conta ON movimento_parcelas (id_movimento_conta);
CREATE INDEX IF NOT EXISTS idx_mov_parcela ON movimento_financeiro (id_movimento_parcela);

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

CREATE TABLE IF NOT EXISTS usuario (
  id_usuario    INTEGER PRIMARY KEY AUTOINCREMENT,
  nome          TEXT NOT NULL,
  usuario       TEXT NOT NULL UNIQUE,
  email         TEXT NOT NULL UNIQUE,
  senha         TEXT NOT NULL,
  nivel_acesso  TEXT NOT NULL DEFAULT 'OPERADOR' CHECK (nivel_acesso IN ('ADMIN', 'OPERADOR')),
  status        TEXT NOT NULL DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'INATIVO')),
  criado_em     TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  atualizado_em TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE INDEX IF NOT EXISTS idx_usuario_login ON usuario (usuario);
CREATE INDEX IF NOT EXISTS idx_usuario_email ON usuario (email);

INSERT OR IGNORE INTO usuario (nome, usuario, email, senha, nivel_acesso, status) VALUES
  ('ADM', 'admin', 'admin@agrocontas.com.br', 'admin123', 'ADMIN', 'ATIVO'),
  ('PRODUTOR', 'produtor', 'produtor@agrocontas.com.br', 'agro123', 'OPERADOR', 'ATIVO');
