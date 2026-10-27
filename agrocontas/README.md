# AgroContas - Extração, Análise e Lançamento de Notas Fiscais (1ª e 2ª Etapas)

Sistema de extração de dados cadastrais, financeiros e classificação inteligente de despesas do agronegócio a partir de Notas Fiscais em PDF (Contas a Pagar), utilizando o modelo `gemini-3.6-flash` do Google Gemini (Google AI Studio).

Suporta execução híbrida:
- **Local / Tradicional**: Servidor Node.js (Express) + Frontend Vite.
- **Serverless / Edge (Cloudflare Pages)**: Executável como Service Worker / Pages Functions nativas com zero custos de infraestrutura.

## 2ª Etapa: Análise no Banco e Lançamento

Após a extração, o sistema consulta o banco de dados e informa na tela se o **Fornecedor** (CNPJ), o **Faturado** (CPF/CNPJ) e a **Despesa** (classificação) existem (`EXISTE – ID: n` / `NÃO EXISTE`). Ao clicar em **Confirmar e Lançar**, em uma única transação, o sistema cria o que não existe, registra o movimento (`movimento_contas`, tipo `PAGAR`) e suas parcelas (`movimento_parcelas`) e informa o sucesso.

- `POST /api/contas/verificar`: consulta (não altera dados).
- `POST /api/contas/lancar`: grava o lançamento. Retorna `409` se a mesma nota já foi lançada para o fornecedor.
- Cadastros nunca são excluídos: encontrados como `INATIVO` são reativados no lançamento.
- Fornecedor é gravado como `FORNECEDOR` e o Faturado como `CLIENTE` (quem já tem o outro papel vira `AMBOS`).

### Banco de dados

- **Cloudflare Pages**: banco **D1**. Crie com `npx wrangler d1 create agrocontas`, copie o `database_id` para `frontend/wrangler.toml` e aplique o schema com `npm run db:migrate:remote` (local: `npm run db:migrate:local`, antes do `pages:dev`).
- **Node.js (Express)**: SQLite via `node:sqlite` (Node 22.5+), arquivo definido por `DATABASE_PATH` (padrão `backend/data/agrocontas.db`), com schema criado automaticamente.

O schema segue o DER oficial (5 tabelas) em `frontend/migrations/0001_init.sql` (espelhado em `backend/src/db/schema.ts`).

## Telas "Manter" (Pessoas, Classificação e Contas)

Navegação por abas no topo: **Extração de NF-e**, **Contas**, **Pessoas** e **Classificação**. Todas as telas "Manter" seguem a recomendação de layout do enunciado:

- A tabela abre **vazia**; os dados carregam por **Buscar** (filtros) ou **Todos** (somente status ATIVO).
- Ordenação por coluna (clique no cabeçalho) e busca por mais de um campo.
- Ações por linha: **Editar** e **Excluir** (lógico). Registros inativos mostram **Reativar**.
- O campo STATUS é oculto no formulário: cadastro novo nasce ATIVO, alteração não muda o status e excluir apenas inativa.

| Tela | Endpoints | Exclusão lógica |
| :--- | :--- | :--- |
| Pessoas (Fornecedor / Cliente / Faturado) | `GET/POST /api/pessoas`, `GET/PUT /api/pessoas/:id` | `PATCH /api/pessoas/:id/status` -> `INATIVO` |
| Classificação (Tipo de Despesa / Receita) | `GET/POST /api/classificacoes`, `GET/PUT /api/classificacoes/:id` | `PATCH /api/classificacoes/:id/status` -> `INATIVO` |
| Contas a Pagar / a Receber (com parcelas) | `GET/POST /api/contas`, `GET/PUT /api/contas/:id` | `PATCH /api/contas/:id/status` -> `CANCELADA` |

O `PATCH .../status` recebe `{ "ativo": false }` (excluir) ou `{ "ativo": true }` (reativar). Regras de Contas: conta a pagar usa classificação do tipo DESPESA e conta a receber, do tipo RECEITA; pessoas e classificações inativas não podem ser usadas; o valor total é a soma das parcelas (vencimentos distintos); só contas ABERTAS e sem baixas podem ser alteradas ou excluídas; o mesmo documento não pode ser lançado duas vezes para o mesmo fornecedor.

## Arquitetura do Projeto

```text
agrocontas/
├── backend/                  # API Node.js tradicional (Express + TypeScript)
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── app.ts
│   │   └── server.ts
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
└── frontend/                 # SPA Vue 3 + Cloudflare Pages Functions
    ├── functions/            # Edge API (Cloudflare Pages Functions / Service Worker)
    │   ├── api/
    │   │   ├── health.ts
    │   │   ├── _middleware.ts
    │   │   └── nfe/
    │   │       ├── config.ts
    │   │       ├── extract.ts
    │   │       └── test-config.ts
    │   ├── schemas/
    │   ├── services/
    │   ├── types/
    │   └── utils/
    ├── src/
    │   ├── components/
    │   ├── services/
    │   ├── types/
    │   ├── App.vue
    │   ├── main.ts
    │   └── style.css
    ├── wrangler.toml         # Configuração Cloudflare Pages (com nodejs_compat)
    ├── package.json
    └── vite.config.ts
```

## Como Executar

### Opção A: Execução no Cloudflare Pages (Localmente com Wrangler)
Permite rodar a SPA e a Edge API (Pages Functions) juntas emulando o ambiente de produção do Cloudflare:
```bash
cd agrocontas/frontend
npm install
npm run build
npm run pages:dev
```

### Opção B: Execução Tradicional (Node.js + Vite)

#### 1. Backend
```bash
cd agrocontas/backend
npm install
npm run dev
```
Servidor disponível em: `http://localhost:3000`

#### 2. Frontend
```bash
cd agrocontas/frontend
npm install
npm run dev
```
Interface web disponível em: `http://localhost:5173` (as requisições para `/api` são automaticamente redirecionadas para o backend local via proxy).

## Deploy no Cloudflare Pages

1. No dashboard da Cloudflare, acesse **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
2. Configure o build com as seguintes opções:
   - **Root directory**: `agrocontas/frontend`
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
3. Em **Environment variables**, adicione (opcionalmente para uso no servidor):
   - `GEMINI_API_KEY`: sua chave de API do Google Gemini.
   - `GEMINI_MODEL`: `gemini-3.6-flash`.
4. As funções na pasta `functions/` serão automaticamente compiladas e implantadas na rede global da Cloudflare.

## Configuração da API do Gemini
A chave da API do Gemini pode ser informada de duas formas:
1. Diretamente na **Aba de Configurações** no Frontend (armazenada com segurança no seu navegador via `localStorage` e enviada nas requisições).
2. Como variável de ambiente do Cloudflare Pages (`GEMINI_API_KEY`) ou no arquivo `.env` do backend tradicional.
