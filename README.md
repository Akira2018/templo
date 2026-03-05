<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/ca08508e-ebe9-43bf-b992-e4c35411e20e

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy no GitHub Pages

Para o repositorio `templo`, publique sempre o build do Vite (`dist`) e nao os arquivos de desenvolvimento.

Importante: o GitHub Pages hospeda apenas frontend estatico. O banco SQLite (`church.db`) continua no backend (`server.ts`) e precisa estar rodando em um servidor separado.

1. Instale dependencias:
   `npm install`
2. Gere e publique:
   `npm run deploy`

Configuracao esperada no GitHub:

- Em `Settings > Pages`, use `Deploy from a branch`.
- Branch: `gh-pages`.
- Pasta: `/ (root)`.

Se o Pages estiver apontando para `main`, o navegador tentara carregar `src/main.tsx` e vai aparecer erro de MIME/404.

## Backend para dados SQLite

Para ver dados no site publicado, suba o backend Node/Express em um host (Render, Railway, VPS, etc.) e configure no frontend:

1. Crie o arquivo `.env.production` na raiz do projeto:
   `VITE_API_BASE_URL=https://SEU_BACKEND_PUBLICO`
2. Gere novo build/deploy do frontend.
3. No backend, opcionalmente defina `CORS_ORIGIN=https://akira2018.github.io` para restringir acesso.

Exemplo de chamadas no frontend:

- `https://SEU_BACKEND_PUBLICO/api/members`
- `https://SEU_BACKEND_PUBLICO/api/stats`
