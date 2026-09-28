# AgroContas - Backend de Extração de NF-e com Gemini

Backend desenvolvido em Node.js, TypeScript e Express para processamento de Notas Fiscais em PDF (Contas a Pagar) e classificação automática de despesas do agronegócio utilizando o Google Gemini (`gemini-3.6-flash`).

## Estrutura

- `src/config/env.ts`: Variáveis de ambiente
- `src/config/multer.ts`: Upload em memória do PDF
- `src/controllers/nfeController.ts`: Endpoints da API
- `src/routes/nfeRoutes.ts`: Rotas `/api/nfe`
- `src/services/geminiService.ts`: Integração com a API do Gemini
- `src/services/promptTemplate.ts`: Regras de extração e árvore de despesas
- `src/schemas/nfeSchema.ts`: Schema JSON estruturado
- `src/types/nfe.ts`: Tipagens TypeScript
- `src/app.ts`: Configuração Express e CORS
- `src/server.ts`: Inicialização do servidor

## Como Executar

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar variáveis (.env)
```env
PORT=3000
CORS_ORIGIN=*
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.6-flash
```

### 3. Iniciar em desenvolvimento
```bash
npm run dev
```

Servidor ativo em `http://localhost:3000`.
