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
