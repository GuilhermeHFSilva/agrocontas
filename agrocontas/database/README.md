# Banco de Dados — AgroContas

Diretório isolado para o banco de dados do sistema **AgroContas** (separado de `backend/` e `frontend/`).

## Estrutura de Arquivos

* `schema.sql`: Script DDL oficial com a criação das 5 entidades do modelo relacional (DER), índices e carga inicial de categorias do agronegócio.
* `agrocontas.db`: Arquivo físico SQLite gerado quando executado localmente (ignorado no Git).

## 5 Tabelas Normativas (DER) e Tabelas de Suporte

1. `fornecedor_cliente`: Parceiros comerciais (Fornecedores, Clientes e Faturados).
2. `despesas_receitas`: Plano de contas operacional da fazenda (Categorias e Tipos).
3. `movimento_contas`: Títulos mestre de Contas a Pagar e a Receber.
4. `movimento_parcelas`: Desdobramento em parcelas com vencimentos distintos e controle de saldo.
5. `movimento_financeiro`: Quitações, pagamentos e liquidações de parcelas.
6. `usuario`: Controle de acesso, autenticação e operadores do sistema (Admin/Operador).

## Sincronização e Migrações (D1 / SQLite)

A sincronização entre o repositório Git e o banco de dados é feita via **scripts de migração** em `frontend/migrations/`:
* `0001_init.sql`: 5 tabelas canônicas e carga inicial de categorias.
* `0002_usuarios.sql`: Tabela de usuários e carga com usuário de teste pré-definido (`admin` / `admin123`).

Comandos de aplicação (executados em `agrocontas/frontend`):
* Banco local: `npm run db:migrate:local`
* Banco em produção (Cloudflare D1): `npm run db:migrate:remote`

