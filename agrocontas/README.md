# AgroContas - Extração e Classificação de Notas Fiscais (1ª Etapa)

Sistema de extração de dados cadastrais, financeiros e classificação inteligente de despesas do agronegócio a partir de Notas Fiscais em PDF (Contas a Pagar), utilizando o modelo `gemini-3.6-flash` do Google Gemini (Google AI Studio).

Suporta execução híbrida:
- **Local / Tradicional**: Servidor Node.js (Express) + Frontend Vite.
- **Serverless / Edge (Cloudflare Pages)**: Executável como Service Worker / Pages Functions nativas com zero custos de infraestrutura.

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
