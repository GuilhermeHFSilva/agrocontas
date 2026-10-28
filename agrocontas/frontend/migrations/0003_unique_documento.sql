CREATE UNIQUE INDEX IF NOT EXISTS ux_contas_documento ON movimento_contas (id_fornecedor, numero_documento, tipo_operacao) WHERE status <> 'CANCELADA';
