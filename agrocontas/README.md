# AgroContas - Extração e Classificação de Notas Fiscais (1ª Etapa)

Sistema de extração de dados cadastrais, financeiros e classificação inteligente de despesas do agronegócio a partir de Notas Fiscais em PDF (Contas a Pagar), utilizando o modelo `gemini-3.6-flash` do Google Gemini (Google AI Studio).

## Arquitetura do Projeto

```text
agrocontas/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── types/
│   │   ├── app.ts
│   │   └── server.ts
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── FileUpload.vue
    │   │   ├── FormattedViewer.vue
    │   │   ├── JsonViewer.vue
    │   │   └── SettingsTab.vue
    │   ├── services/
    │   ├── types/
    │   ├── App.vue
    │   ├── main.ts
    │   └── style.css
    ├── index.html
    ├── package.json
    ├── tsconfig.json
    └── vite.config.ts
```

## Como Executar

### 1. Backend
```bash
cd agrocontas/backend
npm install
npm run dev
```
Servidor disponível em: `http://localhost:3000`

### 2. Frontend
```bash
cd agrocontas/frontend
npm install
npm run dev
```
Interface web disponível em: `http://localhost:5173`

## Configuração da API do Gemini
A chave da API do Gemini pode ser informada de duas formas:
1. Diretamente na **Aba de Configurações** no Frontend (armazenada com segurança no seu navegador via `localStorage` e enviada nas requisições).
2. Ou no arquivo `agrocontas/backend/.env` na variável `GEMINI_API_KEY`.

O modelo padrão configurado em ambos os módulos é o `gemini-3.6-flash`.
